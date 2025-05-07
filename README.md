# 🤖💥 ShitposterBot: The Ultimate On-Chain Social Media AI Agent 🚀🔥

Welcome to **ShitposterBot**, the next-level, hackathon-ready, TEE-powered, on-chain social media agent! Built for the NEAR Shade Agents hackathon, ShitposterBot is not just a bot—it's a revolution in how you interact with X (Twitter) and the blockchain. Get ready for a wild ride! 🎢

---

## 🌟 What is ShitposterBot?

ShitposterBot is a **non-custodial, verifiable, and autonomous AI agent** that:
- Listens to your commands on X (Twitter) 🐦
- Automates posts, replies, and actions with AI-powered wit 🤖
- Executes on-chain actions (send funds, call contracts, more!) via the NEAR Shade Agent stack 💸
- Runs inside a TEE for maximum security and trust 🔒
- Is fully open source and hackathon-compliant! 🏆

---

## 🏁 How It Works (Step by Step)

1. **User Command:** Post a command on X (e.g., "Hey @shitposterbot, roast me!" or "Send 1 NEAR to @friend!")
2. **Bot Magic:** ShitposterBot (running in a TEE) reads your command, interprets it with AI, and determines the required action.
3. **On-Chain Power:** If needed, the bot triggers a smart contract call (e.g., send funds, verify action) using NEAR chain signatures. All actions are verifiable and non-custodial!
4. **Autonomous Execution:** No ongoing user input needed. The bot handles everything, from social media to blockchain, seamlessly.
5. **Transparent & Trustless:** All actions are logged, verifiable, and open source. You keep control of your assets at all times.

---

## 🛠️ Tech Stack & Hackathon Compliance

- **NEAR Shade Agent Stack:**
  - Smart contract for agent verification & access control
  - TEE worker agent (Next.js) for secure, verifiable execution
  - Chain signatures for all on-chain actions
- **X (Twitter) Integration:**
  - Listens and responds to user commands
  - Handles token transfers via Bankr directly on X
- **Open Source:**
  - MIT License, public repo, all code original and attributed
- **Security:**
  - Runs in a TEE, codehash-verified, non-custodial

---

## 🚀 Getting Started

### Prerequisites
- Node.js
- NEAR CLI & Rust (for contract)
- Twitter API keys or cookie-based auth
- Docker (for TEE deployment)

### Installation
```bash
# Clone the repo
 git clone https://github.com/shitposteragent/shitposterbot.git
 cd shitposterbot
# Install dependencies
yarn install
```

### Configuration
Set up your `.env` file:
```bash
TWITTER_API_KEY=your_api_key
TWITTER_API_SECRET=your_api_secret
TWITTER_ACCESS_TOKEN=your_access_token
TWITTER_REFRESH_TOKEN=your_refresh_token
NEXT_PUBLIC_contractId=your_contract_id
```

### Running the Bot
```bash
# Start the Next.js worker agent
yarn start
# Deploy the contract (see /utils/deploy.js)
node utils/deploy.js
```

---

## 🧠 Unique Features
- **AI-Powered Shitposting:** Generates witty, savage, or helpful replies on X
- **On-Chain Actions:** Send funds, call contracts, or trigger any blockchain action—directly from X
- **TEE Security:** All actions are verifiable, non-custodial, and run in a secure enclave
- **Bankr Integration:** Users can transfer tokens from Bankr directly on X
- **Open Source & Hackathon-Ready:** Meets all requirements for the NEAR Shade Agents hackathon

---

## 🎉 Why ShitposterBot?
- **Unstoppable:** Runs 24/7, no user babysitting needed
- **Trustless:** All actions are on-chain, transparent, and verifiable
- **Fun & Engaging:** Spice up your social media with AI-powered automation
- **Next-Gen Security:** TEE + codehash validation = maximum trust

---

## 📚 Resources
- [Shade Agent Stack Docs](https://github.com/NearDeFi/shade-agent-js/)
- [NEAR Chain Signatures](https://docs.near.org/concepts/abstraction/chain-signatures)
- [Phala Cloud (TEE)](https://phala.network/)
- [Twitter API](https://developer.twitter.com/en/docs/twitter-api)

---

## 🛡️ Disclaimer
ShitposterBot is for ethical, responsible, and fun use only. Please comply with all platform and legal guidelines. 🚨

---

## 🤝 Contributing
PRs and issues welcome! Join the revolution and help make social media and blockchain more fun, secure, and autonomous! 💪

---

## 💬 Support & Community
- [Twitter](https://x.com/shitposteragent)

---

Let’s make social media and blockchain fun, secure, and unstoppable—together! 🎉🔥
