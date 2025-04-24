import { networkId, generateAddress } from '@neardefi/shade-agent-js';
import { evm } from '../../utils/evm';
import { sleep } from '../../utils/utils';
import {
    getClient,
    addOneSecond,
    replyToTweet,
    getLatestConversationTweet,
    getReplyToTweet,
} from '../../utils/twitter-utils';

const NO_SEARCH = true;
const NO_REPLY = true;
const USE_START_TIME = true;

// queues
const PENDING_BANKR_ADDRESSES_DELAY = 15000;
const pendingBankrReply = [];

let lastTweetTimestamp = '2025-04-22T23:07:47.000Z';

const sleepThen = async (dur, fn) => {
    await sleep(dur);
    fn();
};

// main endpoint for cron job

/*

TODO
[x] - get original tweet, text, media, etc...
[x] - get usernames
[x] - set up reply to User B tweet with @bankrbot what are the addresses of @UserA and @UserB
[x] - listen for replies to get @bankrbot addresses
[] - upload media to pinata
[] - mint zoracoin
[] - reply in thread and mention UserA and UserB again

*/

// this queue is for processing replies from @bankrbot after we asked it for 2 evm addresses

async function processBankrReply() {
    const data = pendingBankrReply.shift();
    if (!data) {
        return sleepThen(PENDING_BANKR_ADDRESSES_DELAY, processBankrReply);
    }

    console.log(
        'getLatestConversationTweet for conversation_id:',
        data.creatorTweet.conversation_id,
    );

    const tweet = await getReplyToTweet(await getClient(), data.bankrReply.id);

    if (!tweet) {
        pendingBankrReply.push(data);
        return sleepThen(PENDING_BANKR_ADDRESSES_DELAY, processBankrReply);
    }

    // parse bankr reply to get addresses
    const addresses = tweet.text.match(/0x[a-fA-F0-9]{40}/gim);

    if (addresses.length !== 2) {
        console.log('missing addresses');
        return;
    }

    data.creatorTweet.address = addresses[0];
    data.minterTweet.address = addresses[1];

    // TODO deployZora

    // keep processing queue
    return sleepThen(PENDING_BANKR_ADDRESSES_DELAY, processBankrReply);
}
processBankrReply();

async function getBankrAddresses(data) {
    if (NO_REPLY) {
        return console.log({ NO_REPLY });
    }

    const minterTweetId = data.minterTweet.id;
    const bankrReply = await replyToTweet(
        `@bankrbot what are the evm addresses for @${data.creatorTweet.username} and @${data.minterTweet.username}?`,
        minterTweetId,
    );
    // store created_at here so we can have a start_time for the bankrbot reply search
    bankrReply.created_at = addOneSecond(new Date().toISOString());
    console.log('bankrReply', bankrReply);

    // start looking for bankrReplies
    pendingBankrReply.push({
        ...data,
        bankrReply,
    });
}

export default async function zoracoin(req, res) {
    if (NO_SEARCH) {
        return res.status(200).json({ NO_SEARCH });
    }

    const client = await getClient();

    const start_time = addOneSecond(lastTweetTimestamp);

    const minterTweets = await client.v2.search('@proximityagent mint', {
        start_time: USE_START_TIME ? start_time : undefined,
        'tweet.fields':
            'author_id,created_at,referenced_tweets,conversation_id',
    });

    let seen = 0;
    const limit = 1;
    let latestValidTimestamp;
    for await (const minterTweet of minterTweets) {
        if (++seen > limit) break;

        console.log('minterTweet.id:', minterTweet.id);

        try {
            // did they reply to a tweet?
            const replied_to = minterTweet.referenced_tweets.filter(
                (t) => t.type === 'replied_to',
            )?.[0]?.id;
            // we only deal with tweets that are replies to another tweet that we want to mint
            if (replied_to === undefined) {
                console.log('not a reply');
                continue;
            }
            console.log('tweet.replied_to', replied_to);

            // get the creator's tweet and mint data
            let creatorTweet = await client.v2.singleTweet(replied_to, {
                expansions: 'attachments.media_keys',
                'media.fields': 'type,url',
                'tweet.fields':
                    'author_id,created_at,referenced_tweets,conversation_id,entities',
            });
            const firstMedia = creatorTweet.includes?.media[0];
            creatorTweet = creatorTweet.data;
            let mintData = creatorTweet.text;
            if (firstMedia === undefined) {
                console.log('no media for tweet, using tweet text');
            } else {
                mintData = await fetch(firstMedia.url).then((r) =>
                    r.arrayBuffer(),
                );
                console.log(
                    'found media in tweet with bytelength',
                    mintData.byteLength,
                );
            }
            creatorTweet.mintData = mintData;

            // get handles for the creator and the minter
            const users = await client.v2.users(
                [creatorTweet.author_id, minterTweet.author_id],
                {
                    'user.fields': 'username',
                },
            );
            const [creatorUsername, minterUsername] = users.data.map(
                (u) => u.username,
            );
            minterTweet.username = minterUsername;
            creatorTweet.username = creatorUsername;

            console.log(
                'valid tweets for conversation_id:',
                creatorTweet.conversation_id,
            );

            console.log(minterTweet);

            // have all data, ready to get bankr addresses, don't wait for this method, continue looping
            getBankrAddresses({
                creatorTweet,
                minterTweet,
            });
        } catch (e) {
            console.log('problem getting data from tweet');
            // TODO reply to minterTweet
        }

        if (!latestValidTimestamp) {
            latestValidTimestamp = minterTweet.created_at;
        }
    }

    lastTweetTimestamp = latestValidTimestamp;

    res.status(200).json({ success: true });
}

async function deployZora() {
    const path = 'foo',
        name = 'bar' + Date.now(),
        symbol = 'TST',
        funder = '0x525521d79134822a342d330bd91DA67976569aF1',
        uri =
            'https://ipfs.io/ipfs/QmafHj1eVJgMzSVRYTXHevifoNnqit9hvapEaX41tpVcP1';

    // generate deposit address
    const { address } = await generateAddress({
        publicKey:
            networkId === 'testnet'
                ? process.env.MPC_PUBLIC_KEY_TESTNET
                : process.env.MPC_PUBLIC_KEY_MAINNET,
        accountId: 'shadeagent.near',
        path,
        chain: 'evm',
    });
    evm.deployZora({ path, name, symbol, funder, address, uri });
}
