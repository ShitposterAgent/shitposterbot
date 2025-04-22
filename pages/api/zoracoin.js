import { TwitterApi } from 'twitter-api-v2';
import { networkId, generateAddress } from '@neardefi/shade-agent-js';
import { evm } from '../../utils/evm';

let accessToken = process.env.TWITTER_ACCESS_TOKEN;
let refreshToken = process.env.TWITTER_REFRESH_TOKEN;

// client must be initialized by first calling search http route
let client = null;

export default async function zoracoin(req, res) {
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

    // if (!client) {
    //     const consumerClient = new TwitterApi({
    //         appKey: process.env.TWITTER_API_KEY,
    //         appSecret: process.env.TWITTER_API_SECRET,
    //     });
    //     // client is global to this module, app-only client, used for search
    //     client = await consumerClient.appLogin();
    // }

    // const tweetGenerator = await client.v2.search('@elonmusk', {
    //     // start_time,
    //     'tweet.fields': 'author_id,created_at,referenced_tweets',
    // });

    // let seen = 0;
    // const limit = 1;
    // for await (const tweet of tweetGenerator) {
    //     if (++seen > limit) break;

    //     console.log(tweet);
    // }

    res.status(200).json({ success: true });
}
