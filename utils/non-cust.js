import * as dotenv from 'dotenv';
dotenv.config({ path: './.env.development.local' });
import { parseSeedPhrase } from 'near-seed-phrase';
import * as nearAPI from 'near-api-js';
const { Near, Account, KeyPair, keyStores } = nearAPI;

const networkId = 'mainnet';
const contractId = process.env.NEAR_CONTRACT_ID;

const { secretKey } = parseSeedPhrase(process.env.NEAR_SEED_PHRASE);
const keyStore = new keyStores.InMemoryKeyStore();
const keyPair = KeyPair.fromString(secretKey);
keyStore.setKey(networkId, contractId, keyPair);

const config = {
    networkId,
    keyStore,
    nodeUrl: 'https://rpc.near.org',
    walletUrl: 'https://mynearwallet.com/',
    explorerUrl: 'https://nearblocks.io',
};
const near = new Near(config);
const { connection } = near;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
export const getAccount = (id) => new Account(connection, id);

const removeKey = async () => {
    try {
        const account = getAccount(contractId);
        if (contractId !== 'v1.shadeagent.near') {
            return;
        }

        const keys = await account.getAccessKeys();

        console.log(keys);

        await account.deleteKey(keyPair.getPublicKey());

        await sleep(1000);

        const keys2 = await account.getAccessKeys();

        console.log(keys2);
    } catch (e) {
        console.log('error deleteKey', e);
    }
};

removeKey();

// Simulated Bankr transfer function