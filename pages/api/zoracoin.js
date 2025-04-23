import { networkId, generateAddress } from '@neardefi/shade-agent-js';
import { evm } from '../../utils/evm';
import { getClient } from '../../utils/twitter-utils';

let lastTweetTimestamp = '2025-04-22T23:07:47.000Z';
// main endpoint for cron job

/*

TODO
[] - get original tweet, text, media, etc...
[] - set up reply to User B tweet with @bankrbot what are the addresses of @UserA and @UserB
[] - listen for replies to get @bankrbot addresses
[] - mint zoracoin
[] - reply in thread and mention UserA and UserB again

*/

export default async function zoracoin(req, res) {
    const client = await getClient();

    const start_time = lastTweetTimestamp
        ? new Date(
              new Date(lastTweetTimestamp).getTime() + 1000, // add 1 second
          ).toISOString()
        : undefined;
    const tweetGenerator = await client.v2.search('@proximityagent mint', {
        start_time,
        'tweet.fields': 'author_id,created_at,referenced_tweets',
    });

    let seen = 0;
    const limit = 1;
    for await (const tweet of tweetGenerator) {
        if (++seen > limit) break;

        console.log('reading tweet id:', tweet.id);

        if (tweet?.referenced_tweets.length < 1) {
            console.log('not a reply');
        }

        lastTweetTimestamp = tweet.createdAt;
    }

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
