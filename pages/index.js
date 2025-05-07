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
                <section className={styles.heroSection}>
                    <h1 className={styles.title}>
                        🤖🔥 ShitposterBot
                    </h1>
                    <p className={styles.description}>
                        <span className={styles.gradientText}>The Autonomous, On-Chain Social Media Genius</span><br/>
                        <span style={{fontWeight: 'bold', color: '#ff4d4f'}}>AI-powered. Non-custodial. TEE-secured. Fun.</span>
                    </p>
                    <div className={styles.heroActions}>
                        <a href="https://x.com/shitposteragent" target="_blank" rel="noopener noreferrer" className={styles.ctaButton}>
                            🚀 Try on X
                        </a>
                        <button className={styles.ctaButton} onClick={() => window.scrollTo({top: 800, behavior: 'smooth'})}>
                            🛠️ Agent Dashboard
                        </button>
                    </div>
                </section>
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
                            <li>Post a command on X (e.g., "Hey @shitposteragent, roast me!" or "Send 1 NEAR to @friend!")</li>
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
                        <p>Tag <b>@shitposteragent</b> on X and see the magic happen!</p>
                        <a href="https://x.com/shitposteragent" target="_blank" rel="noopener noreferrer" className={styles.button}>
                            Follow on X
                        </a>
                    </div>
                </div>
                {/* --- Modern dashboard below --- */}
                <section className={styles.dashboard}>
                    <h2 className={styles.subtitle}>🛠️ Agent Dashboard</h2>
                    <div className={styles.dashboardGrid}>
                        <div className={styles.dashboardCard}>
                            <h3>Worker Agent Account</h3>
                            <div className={styles.accountRow}>
                                <span className={styles.accountId}>{accountId?.length >= 24 ? accountId?.substring(0, 24) + '...' : accountId}</span>
                                <button className={styles.copyBtn} onClick={() => { navigator.clipboard.writeText(accountId); setMessageHide('copied', 500); }}>Copy</button>
                            </div>
                            <div className={styles.balanceRow}>
                                <span className={styles.balanceLabel}>Balance:</span>
                                <span className={styles.balanceValue}>{balance ? formatNearAmount(balance.available, 4) : 0}</span>
                            </div>
                        </div>
                        {balance.available !== '0' && (
                            <>
                                <div className={styles.dashboardCard}>
                                    <h3>Register Worker Agent</h3>
                                    <button className={styles.actionBtn} onClick={async () => { setMessage('Registering Worker'); let res; try { res = await fetch('/api/register').then((r) => r.json()); } catch (e) { console.log(e); setMessageHide('register_worker error: ' + JSON.stringify(e, 4)); } setMessageHide(<><p>register_worker response:</p>
                                    
                                    <p className={styles.code}>
                                        {/* registered: {JSON.stringify(res.registered)} */}
                                        registered: {res && res.registered !== undefined ? JSON.stringify(res.registered) : 'No response or invalid response'}

                                     </p>

                                </>); }}>
                                        Register
                                    </button>
                                    <p className={styles.contractId}>Contract: {process.env.NEXT_PUBLIC_contractId}</p>
                                </div>
                                <div className={styles.dashboardCard}>
                                    <h3>Get Worker Info</h3>
                                    <button className={styles.actionBtn} onClick={async () => { setMessage('Calling get_worker', accountId); let res; try { res = await contractView({ accountId: accountId, methodName: 'get_worker', args: { account_id: accountId, }, }); console.log(res); } catch (e) { console.log(e); setMessageHide('get_worker error: ' + JSON.stringify(e, 4)); } setMessageHide(<><p>get_worker response:</p><p className={styles.code}>checksum: {res.checksum}</p><p className={styles.code}>codehash: {res.codehash}</p></>); }}>
                                        Get Info
                                    </button>
                                    <p>(registered only)</p>
                                </div>
                                <div className={styles.dashboardCard}>
                                    <h3>Call Protected Method</h3>
                                    <button className={styles.actionBtn} onClick={async () => { setMessage('Calling is_verified_by_codehash'); const res = await fetch('/api/isVerified').then((r) => r.json()); setMessageHide(<><p>is_verified_by_codehash response:</p><p className={styles.code}>verified: {JSON.stringify(res.verified)}</p></>); }}>
                                        Call
                                    </button>
                                    <p>(registered only)</p>
                                </div>
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
