import Head from 'next/head';
import styles from '../styles/Home.module.css';
import { useState, useEffect } from 'react';
import {
    contractView,
    getBalance,
    formatNearAmount,
} from '@neardefi/shade-agent-js';
import Overlay from '../components/Overlay';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export default function Home() {
    const [message, setMessage] = useState('');
    const [accountId, setAccountId] = useState();
    const [balance, setBalance] = useState({ available: '0' });

    const setMessageHide = async (message, dur = 3000) => {
        setMessage(message);
        await sleep(dur);
        setMessage('');
    };

    const getBalanceSleep = async (accountId) => {
        await sleep(1000);
        const balance = await getBalance(accountId);

        if (balance.available === '0') {
            getBalanceSleep(accountId);
            return;
        }
        setBalance(balance);
    };

    const deriveAccount = async () => {
        const res = await fetch('/api/derive').then((r) => r.json());
        setAccountId(res.accountId);
        getBalanceSleep(res.accountId);
    };

    useEffect(() => {
        deriveAccount();
    }, []);

    return (
        <div className={styles.container}>
            <Head>
                <title>ShitposterBot – Autonomous On-Chain Social Media Genius</title>
                <meta name="description" content="ShitposterBot: The most advanced, AI-powered, on-chain social media agent. Built on the shitposteragent ecosystem." />
                <link rel="icon" href="/favicon.ico" />
            </Head>
            <Overlay message={message} />

            <main className={styles.main}>
                <h1 className={styles.title}>
                    🤖🔥 ShitposterBot
                </h1>
                <p className={styles.description}>
                    The Autonomous, On-Chain Social Media Genius<br/>
                    <span style={{fontWeight: 'bold', color: '#ff4d4f'}}>AI-powered. Non-custodial. TEE-secured. Fun.</span>
                </p>
                <div className={styles.grid}>
                    <div className={styles.card}>
                        <h2>🌐 What is ShitposterBot?</h2>
                        <p>
                            ShitposterBot is an AI-powered, fully autonomous social media agent that interacts, posts, and executes on-chain actions directly from X (Twitter).<br/>
                            <b>Built on the robust shitposteragent ecosystem.</b>
                        </p>
                    </div>
                    <div className={styles.card}>
                        <h2>🚀 How It Works</h2>
                        <ol>
                            <li>Post a command on X (e.g., "Hey @shitposterbot, roast me!" or "Send 1 NEAR to @friend!")</li>
                            <li>ShitposterBot interprets, replies, and triggers on-chain actions if needed.</li>
                            <li>All actions are transparent, verifiable, and non-custodial.</li>
                        </ol>
                    </div>
                    <div className={styles.card}>
                        <h2>🧠 Features</h2>
                        <ul>
                            <li>AI-powered witty replies</li>
                            <li>On-chain actions (send funds, call contracts, more)</li>
                            <li>TEE security & codehash validation</li>
                            <li>Bankr integration for seamless token transfers</li>
                            <li>Open source & hackathon-ready</li>
                        </ul>
                    </div>
                    <div className={styles.card}>
                        <h2>💬 Try It!</h2>
                        <p>Tag <b>@shitposterbot</b> on X and see the magic happen!</p>
                        <a href="https://x.com/shitposteragent" target="_blank" rel="noopener noreferrer" className={styles.button}>
                            Follow on X
                        </a>
                    </div>
                </div>
                {/* --- Existing functionality below, styled as an advanced dashboard --- */}
                <section className={styles.dashboard}>
                    <h2 className={styles.subtitle}>🛠️ Agent Dashboard</h2>
                    <div className={styles.grid}>
                        <div className={styles.card}>
                            <h3>Worker Agent Account</h3>
                            <p>
                                <b>Account:</b> {accountId?.length >= 24 ? accountId?.substring(0, 24) + '...' : accountId}
                                <br />
                                <button className={styles.btn} onClick={() => { navigator.clipboard.writeText(accountId); setMessageHide('copied', 500); }}>copy</button>
                                <br />
                                <b>Balance:</b> {balance ? formatNearAmount(balance.available, 4) : 0}
                            </p>
                        </div>
                        {balance.available !== '0' && (
                            <>
                                <a href="#" className={styles.card} onClick={async () => { setMessage('Registering Worker'); let res; try { res = await fetch('/api/register').then((r) => r.json()); } catch (e) { console.log(e); setMessageHide('register_worker error: ' + JSON.stringify(e, 4)); } setMessageHide(<><p>register_worker response:</p><p className={styles.code}>registered: {JSON.stringify(res.registered)}</p></>); }}>
                                    <h3>Register Worker Agent</h3>
                                    <p>Register the Worker Agent in the smart contract:<br /><br />{process.env.NEXT_PUBLIC_contractId}</p>
                                </a>
                                <a href="#" className={styles.card} onClick={async () => { setMessage('Calling get_worker', accountId); let res; try { res = await contractView({ accountId: accountId, methodName: 'get_worker', args: { account_id: accountId, }, }); console.log(res); } catch (e) { console.log(e); setMessageHide('get_worker error: ' + JSON.stringify(e, 4)); } setMessageHide(<><p>get_worker response:</p><p className={styles.code}>checksum: {res.checksum}</p><p className={styles.code}>codehash: {res.codehash}</p></>); }}>
                                    <h3>Get Worker Info</h3>
                                    <p>(registered only)</p>
                                </a>
                                <a href="#" className={styles.card} onClick={async () => { setMessage('Calling is_verified_by_codehash'); const res = await fetch('/api/isVerified').then((r) => r.json()); setMessageHide(<><p>is_verified_by_codehash response:</p><p className={styles.code}>verified: {JSON.stringify(res.verified)}</p></>); }}>
                                    <h3>Call Protected Method</h3>
                                    <p>(registered only)</p>
                                </a>
                            </>
                        )}
                    </div>
                </section>
            </main>
            <footer className={styles.footer}>
                <span>Made with ❤️ by the ShitposterAgent team & contributors</span>
            </footer>
        </div>
    );
}
