import { generateAddress, networkId } from '@neardefi/shade-agent-js';
import { evm } from '../../utils/evm';
import { fetchJson, sleep } from '../../utils/utils';
import { TwitterApi } from 'twitter-api-v2';
import {
    getConversationId,
    getLatestConversationTweet,
} from '../../utils/twitter-client';

const DEPOSIT_PROCESSING_DELAY = 5000;
const REPLY_PROCESSING_DELAY = 15000;
const REFUND_PROCESSING_DELAY = 60000;
const MAX_DEPOSIT_ATTEMPTS = 12 * 60; // 12 per minute * 60 mins
const pendingReply = [];
const pendingDeposit = [];
let lastTweetTimestamp = parseInt(process.env.TWITTER_LAST_TIMESTAMP);
let waitingForReset = 0;
const pendingRefund = [];
const refunded = [];

let accessToken = process.env.TWITTER_ACCESS_TOKEN;
let refreshToken = process.env.TWITTER_REFRESH_TOKEN;

// both false for production
const FAKE_REPLY = false;
const SEARCH_ONLY = true;

// client must be initialized by first calling search http route
let client = null;

const sleepThen = async (dur, fn) => {
    await sleep(dur);
    fn();
};

const getTransactionsForAddress = async (address, action = 'txlist') => {
    let tx;
    try {
        const res = await fetchJson(
            `https://api${
                networkId === 'testnet' ? '-sepolia' : ''
            }.basescan.org/api?module=account&action=${action}&address=${address}&startblock=0&endblock=latest&page=1&offset=10&sort=asc&apikey=${
                process.env.BASE_API_KEY
            }`,
        );
        if (!res.result || !res.result.length > 0) {
            return;
        }
        tx = res.result[0];
        if (tx?.isError === '1' || !tx?.from) {
            return;
        }
    } catch (e) {
        console.log(e);
    }
    return tx;
};

const refreshAccessToken = async () => {
    console.log('refreshAccessToken');
    const client = new TwitterApi({
        clientId: process.env.TWITTER_CLIENT_KEY,
        clientSecret: process.env.TWITTER_CLIENT_SECRET,
    });
    try {
        const { accessToken: newAccessToken, refreshToken: newRefreshToken } =
            await client.refreshOAuth2Token(refreshToken);
        accessToken = newAccessToken;
        refreshToken = newRefreshToken;
        console.log('success refreshAccessToken', accessToken);
    } catch (e) {
        console.log('error refreshAccessToken');
        console.log(e);
    }
};

const replyToTweet = async (text, id, secondAttempt = false) => {
    console.log('replyToTweet');
    const client = new TwitterApi(accessToken);
    let res;
    try {
        console.log('client.v2.reply', id);
        res = FAKE_REPLY ? { data: true } : await client.v2.reply(text, id);
    } catch (e) {
        console.log('error', e);
        if (!secondAttempt && /401/gi.test(JSON.stringify(e))) {
            await refreshAccessToken();
            res = await replyToTweet(text, id, true);
        }
    }
    console.log(res);
    return res;
};

export const getRefunded = () => refunded;

const processRefunds = async () => {
    const tweet = pendingRefund.shift();
    if (!tweet) {
        await sleepThen(REFUND_PROCESSING_DELAY, processRefunds);
        return;
    }
    console.log('refund tweet.id', tweet.id);

    // whether successful or not, store this tweet in case we need to resolve manually
    // need tweet.path to force another manual refund attempt
    refunded.push(tweet);

    let internal = false;
    let tx = await getTransactionsForAddress(tweet.address);
    // check transactions for smart contract wallets
    if (!tx) {
        tx = await getTransactionsForAddress(tweet.address, 'txlistinternal');
        internal = true;
    }

    if (tx) {
        try {
            const balance = await evm.getBalance({
                address: tweet.address,
            });
            const feeData = await evm.getGasPrice();
            const gasPrice =
                BigInt(feeData.maxFeePerGas) +
                BigInt(feeData.maxPriorityFeePerGas);
            const gasLimit = internal ? 500000n : 21000n;
            const gasFee = gasPrice * gasLimit;
            // make sure we don't overshoot the total available
            const adjust = 5000000000000n;
            const amount = evm.formatBalance(balance - gasFee - adjust);

            await evm.send({
                path: tweet.path,
                from: tweet.address,
                to: tx.from,
                amount,
                gasLimit,
            });
        } catch (e) {
            console.log(e);
        }
    }

    // check again
    await sleepThen(REFUND_PROCESSING_DELAY, processRefunds);
};
processRefunds();

// processing deposits and registering basenames

const processDeposits = async () => {
    const tweet = pendingDeposit.shift();
    if (!tweet || tweet.depositAttempt >= MAX_DEPOSIT_ATTEMPTS) {
        if (tweet) {
            pendingRefund.push(tweet);
        }
        await sleepThen(DEPOSIT_PROCESSING_DELAY, processDeposits);
        return;
    }
    console.log('processing deposit', tweet.depositAttempt, tweet.address);

    let balance;
    try {
        balance = await evm.getBalance({ address: tweet.address });
        console.log('balance', evm.formatBalance(balance));
    } catch (e) {
        console.log(e);
    }

    // correct deposit amount, stop checking
    if (balance && balance >= tweet.price) {
        const tx = await getTransactionsForAddress(tweet.address);

        if (tx) {
            try {
                const nameRes = await evm.getBasenameTx(
                    tweet.path,
                    tweet.basename,
                    tweet.address,
                    tx.from,
                );

                if (nameRes?.success && nameRes?.explorerLink) {
                    // try to get the latest tweet in the conversation
                    const conversationId = await getConversationId(
                        client,
                        tweet.id,
                    );
                    let latestTweet;
                    if (conversationId !== null) {
                        lastestTweet = await getLatestConversationTweet(
                            client,
                            conversationId,
                        );
                    }
                    // if there's any issues, fallback to using the original tweet id
                    let replyId = tweet.id;
                    if (latestTweet && latestTweet !== null) {
                        replyId = latestTweet.id;
                    }
                    // reply to tweet regardless
                    await replyToTweet(
                        `Done! 😎\n\nRegistered ${tweet.basename}.base.eth to ${tx.from}\n\ntx: ${nameRes.explorerLink}`,
                        replyId,
                    );
                }
            } catch (e) {
                console.log(e);
            }

            try {
                // leftovers? whether successful or not
                const balance = await evm.getBalance({
                    address: tweet.address,
                });
                if (balance > 0n) {
                    pendingRefund.push(tweet);
                }
            } catch (e) {
                console.log(e);
            }

            await sleepThen(DEPOSIT_PROCESSING_DELAY, processDeposits);
            return;
        }

        // check internal transactions
        const txInternal = await getTransactionsForAddress(
            tweet.address,
            'txlistinternal',
        );
        if (txInternal) {
            pendingRefund.push(tweet);

            await sleepThen(DEPOSIT_PROCESSING_DELAY, processDeposits);
            return;
        }
    }

    tweet.depositAttempt++;
    pendingDeposit.push(tweet);
    await sleepThen(DEPOSIT_PROCESSING_DELAY, processDeposits);
};
processDeposits();

// processing the tweet reply

const processReplies = async () => {
    const tweet = pendingReply.shift();
    if (!tweet || tweet.replyAttempt >= 3) {
        await sleepThen(REPLY_PROCESSING_DELAY, processReplies);
        return;
    }
    console.log('processing reply', tweet.id);

    tweet.path = `${tweet.author_id}-${tweet.basename}`;
    // generate deposit address
    const { address } = await generateAddress({
        publicKey:
            networkId === 'testnet'
                ? process.env.MPC_PUBLIC_KEY_TESTNET
                : process.env.MPC_PUBLIC_KEY_MAINNET,
        accountId: process.env.NEXT_PUBLIC_contractId,
        path: tweet.path,
        chain: 'evm',
    });
    tweet.address = address;

    const basenameInfo = await evm.checkBasename(tweet.basename);

    // bail on this name if it's not valid or available
    if (!basenameInfo.isValid || tweet.basename.length < 3) {
        await replyToTweet(
            `Sorry! 😬\n\n${tweet.basename} is not a valid basename!`,
            tweet.id,
        );
        await sleepThen(REPLY_PROCESSING_DELAY, processReplies);
        return;
    }

    if (!basenameInfo.isAvailable) {
        await replyToTweet(
            `Sorry! 😬\n\n${tweet.basename} is not available!`,
            tweet.id,
        );
        await sleepThen(REPLY_PROCESSING_DELAY, processReplies);
        return;
    }

    // prices (any extra is refunded)
    // 1100000000000000n 5+ char
    // 11000000000000000n 4 char
    // 110000000000000000n 3 char
    tweet.price = 1100000000000000n;
    if (tweet.basename.length === 4) {
        tweet.price = 11000000000000000n;
    }
    if (tweet.basename.length === 3) {
        tweet.price = 110000000000000000n;
    }
    const formatedPrice = evm.formatBalance(tweet.price).substring(0, 7);
    console.log('formatedPrice', formatedPrice);

    const res = await replyToTweet(
        `On it! 😎\n\nSend ${formatedPrice} ETH on Base to ${tweet.address} in next 10 mins to secure ${tweet.basename}\n\nLate? You might miss out & risk losing funds\n\nTerms in Bio.`,
        tweet.id,
    );

    // move to pendingDeposit
    if (res?.data) {
        // this is the id of the tweet we've replied with, store this for later in case we want to modify our flow and reply to our own tweet
        tweet.onItReplyId = res.data.id;
        console.log('reply sent', tweet.id);
        // move to pendingDeposit
        tweet.depositAttempt = 0;
        pendingDeposit.push(tweet);
    } else {
        // retry reply
        tweet.replyAttempt++;
        pendingReply.push(tweet);
    }

    await sleepThen(REPLY_PROCESSING_DELAY, processReplies);
};
processReplies();

export default async function search(req, res) {
    // owner only
    // jump start the queues that process everything
    // manually add a refund attempt for an address
    try {
        const url = new URL('https://example.com' + req?.url);
        const restart = url.searchParams.get('restart');
        const refund = url.searchParams.get('refund');
        const pass = url.searchParams.get('pass');
        if (pass === process.env.RESTART_PASS) {
            if (restart === 'replies') {
                processReplies();
            }
            if (restart === 'deposits') {
                processDeposits();
            }
            if (restart === 'refunds') {
                processRefunds();
            }
            if (refund) {
                const args = refund.split(',');

                pendingRefund.push({
                    id: 'FORCED REFUND TRY',
                    address: args[0],
                    path: args[1],
                });
            }
        }
    } catch (e) {
        console.log(e);
    }

    // rate limited?
    if (waitingForReset !== 0 && Date.now() / 1000 < waitingForReset) {
        return;
    }
    waitingForReset = 0;

    // app key and app secret are used for app auth client
    const consumerClient = new TwitterApi({
        appKey: process.env.TWITTER_API_KEY,
        appSecret: process.env.TWITTER_API_SECRET,
    });
    // client is global to this module, app-only client, used for search
    client = await consumerClient.appLogin();

    // search
    const start_time =
        lastTweetTimestamp > 0
            ? new Date(lastTweetTimestamp * 1000 + 1000).toISOString()
            : undefined;
    console.log('search start_time', start_time);
    const tweetGenerator = await client.v2.search('@basednames ".base.eth"', {
        start_time,
        'tweet.fields': 'author_id,created_at,referenced_tweets',
    });

    // check rate limits
    console.log('REMAINING API CALLS', tweetGenerator._rateLimit.remaining);
    console.log(
        'RESET',
        Number(
            (tweetGenerator._rateLimit.reset - Date.now() / 1000) / 60,
        ).toPrecision(4) + ' minutes',
    );
    if (tweetGenerator._rateLimit.remaining <= 0) {
        waitingForReset = tweetGenerator._rateLimit.reset;
    }

    let seen = 0;
    const limit = 99;
    let latestValidTimestamp = 0;
    for await (const tweet of tweetGenerator) {
        if (++seen > limit) break;

        // get unix timestamp in seconds
        console.log('reading tweet', tweet.id);
        tweet.timestamp = new Date(tweet.created_at).getTime() / 1000;

        // tweet not already in a pending state
        if (
            pendingReply.findIndex((t) => t.id === tweet.id) > -1 ||
            pendingDeposit.findIndex((t) => t.id === tweet.id) > -1
        ) {
            continue;
        }
        // validate basename
        tweet.basename = tweet.text.match(/[a-zA-Z0-9]{3,}.base.eth/gim)?.[0];
        if (!tweet.basename) {
            continue;
        }
        tweet.basename = tweet.basename.toLowerCase().split('.base.eth')[0];
        // make sure we haven't seen it before
        if (tweet.timestamp <= lastTweetTimestamp) {
            continue;
        }

        if (latestValidTimestamp === 0) {
            latestValidTimestamp = tweet.timestamp;
        }

        // tweet is reply, quote, or RT
        if (tweet.referenced_tweets?.length > 0) {
            // make sure we haven't seen this basename request before and don't get confused or misled by user replies or QTs
            if (
                pendingReply.findIndex((t) => t.basename === tweet.basename) >
                    -1 ||
                pendingDeposit.findIndex((t) => t.basename === tweet.basename) >
                    -1
            ) {
                continue;
            }
        }

        //qualifies
        console.log('tweet qualified', tweet.id);
        tweet.replyAttempt = 0;
        if (!SEARCH_ONLY) {
            pendingReply.push(tweet);
        } else {
            console.log(tweet);
        }
    }

    // we won't see these valid tweets in the next API call
    if (latestValidTimestamp > 0) {
        lastTweetTimestamp = latestValidTimestamp;
    }

    console.log('lastTweetTimestamp', lastTweetTimestamp);
    console.log('pendingReply.length', pendingReply.length);

    res.status(200).json({ pendingReply: pendingReply.length });
}
