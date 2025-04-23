import { TwitterApi } from 'twitter-api-v2';

let client;

export async function getClient() {
    if (!client) {
        const consumerClient = new TwitterApi({
            appKey: process.env.TWITTER_API_KEY,
            appSecret: process.env.TWITTER_API_SECRET,
        });
        // client is global to this module, app-only client, used for search
        client = await consumerClient.appLogin();
    }
    return client;
}

// polling for a search result (not a cron job, e.g. looking for a reply from @bankrbot for addresses)

export async function pollSearch(fn, attempts = 0, limit = 10, dur = 10000) {
    fn();
    attempts++;
    if (attempts >= limit) {
        console.log('pollSearch ended. Reached attempt limit:', limit);
    }
    await sleepThen(dur, () => pollSearch(fn, attempts, limit, dur));
}

// dealing with access tokens (user auth for agent)

let accessToken = process.env.TWITTER_ACCESS_TOKEN;
let refreshToken = process.env.TWITTER_REFRESH_TOKEN;

async function refreshAccessToken() {
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
}

// reply to a tweet with the text and tweet id to reply to

export async function replyToTweet(text, id, secondAttempt = false) {
    const client = new TwitterApi(accessToken);
    let res;
    try {
        res = await client.v2.reply(text, id);
    } catch (e) {
        console.log('error', e);
        if (!secondAttempt && /401/gi.test(JSON.stringify(e))) {
            await refreshAccessToken();
            res = await replyToTweet(text, id, true);
        }
    }
    console.log(res);
    return res;
}

// getting the conversation id, in order to get the last tweet of a thread

export async function getConversationId(client, tweetId) {
    try {
        const tweet = await client.v2.singleTweet(tweetId, {
            'tweet.fields': 'conversation_id',
        });
        return tweet.data.conversation_id;
    } catch (e) {
        console.log('ERROR getConversationId', e);
    }
    return null;
}

export async function getLatestConversationTweet(client, conversationId) {
    try {
        const searchResult = await client.v2.search(
            `conversation_id:${conversationId}`,
            {
                'tweet.fields': 'created_at',
                max_results: 100, // Adjust based on needs
            },
        );
        if (searchResult?.data?.meta?.result_count === 0) {
            return null;
        }

        return searchResult.data.data[0]; // Most recent tweet is first
    } catch (e) {
        console.log('ERROR getLatestConversationTweet', e);
    }
    return null;
}
