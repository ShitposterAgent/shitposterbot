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

// Enhanced Bankr transfer function with error handling, user feedback, and retry logic
async function sendBankrTransfer(amount, toUser, maxRetries = 3) {
    let attempt = 0;
    while (attempt < maxRetries) {
        try {
            if (!amount || isNaN(amount) || Number(amount) <= 0) {
                throw new Error('Invalid amount');
            }
            if (!toUser) {
                throw new Error('Invalid recipient');
            }
            // Simulate success (replace with real Bankr API/contract call)
            console.log(`Bankr transfer: Sending ${amount} NEAR to @${toUser}`);
            return { success: true };
        } catch (error) {
            attempt++;
            console.error(`Bankr transfer failed (attempt ${attempt}):`, error.message);
            if (attempt >= maxRetries) {
                return { success: false, error: error.message };
            }
            // Wait before retrying
            await sleep(1000 * attempt);
        }
    }
}

// Robust smart contract interaction with error handling and retry logic
export async function logInteractionWithRetry(contract, user, command, timestamp, maxRetries = 3) {
    let attempt = 0;
    while (attempt < maxRetries) {
        try {
            await contract.log_interaction({ user, command, timestamp });
            return { success: true };
        } catch (error) {
            attempt++;
            console.error(`log_interaction failed (attempt ${attempt}):`, error.message);
            if (attempt >= maxRetries) {
                return { success: false, error: error.message };
            }
            await sleep(1000 * attempt);
        }
    }
}

module.exports = {
    removeKey,
    sendBankrTransfer,
    logInteractionWithRetry,
};
