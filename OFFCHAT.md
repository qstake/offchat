# OFFCHAT

### The Future of Secure Communication

---

## What is Offchat?

Offchat is a next-generation Web3 messaging platform that combines military-grade encrypted communication with multi-chain cryptocurrency integration. Unlike traditional messaging apps controlled by corporations, Offchat puts power back into the hands of users — enabling secure messaging, instant crypto transfers, NFT management, and decentralized token swapping, all in one seamless experience.

**Website:** [offchat.app](https://offchat.app)

---

## The Internet-Free Messaging Revolution

### Communicate Without Boundaries

Offchat is pioneering a revolution in digital communication: **messaging without the internet.**

Traditional messaging apps are completely dependent on centralized servers and internet connectivity. When the network goes down, communication stops. Offchat changes this paradigm entirely with its **Bluetooth Low Energy (BLE) mesh networking** technology.

### How It Works

Offchat devices communicate directly with each other using Bluetooth, creating a peer-to-peer mesh network that operates independently of any internet connection, cell tower, or centralized server.

- **Bluetooth LE Mesh Networking** — Devices discover nearby Offchat users automatically and establish direct encrypted connections
- **Peer-to-Peer Message Relay** — Messages hop from device to device across the mesh, extending range far beyond a single Bluetooth connection
- **Offline Message Queue** — Messages are stored locally using IndexedDB and automatically delivered when peers come within range
- **Automatic Sync** — When internet connectivity is restored, offline messages seamlessly sync with the main network
- **Device Discovery** — Users broadcast their presence to nearby Offchat devices, enabling spontaneous connections without any infrastructure

### Why This Matters

| Scenario | Traditional Apps | Offchat |
|---|---|---|
| Natural disasters (earthquake, flood) | No communication | Mesh network active |
| Remote areas without cell coverage | No signal, no messages | Bluetooth P2P works |
| Government internet shutdowns | Complete blackout | Unstoppable mesh communication |
| Underground / indoor dead zones | No connection | Device-to-device messaging |
| Privacy-critical environments | Data routed through corporate servers | Direct encrypted P2P, no servers involved |
| Music festivals / crowded events | Network congestion | Local mesh handles traffic |

### Technical Architecture

```
┌─────────────┐     Bluetooth LE      ┌─────────────┐
│  Offchat     │◄──────────────────────►│  Offchat     │
│  Device A    │                        │  Device B    │
└──────┬───────┘                        └──────┬───────┘
       │                                        │
       │ Bluetooth LE                 Bluetooth LE
       │                                        │
       ▼                                        ▼
┌─────────────┐     Bluetooth LE      ┌─────────────┐
│  Offchat     │◄──────────────────────►│  Offchat     │
│  Device C    │                        │  Device D    │
└─────────────┘                        └─────────────┘

Each device acts as both a sender and relay node.
Messages propagate across the mesh until they reach the recipient.
No internet. No servers. No single point of failure.
```

### Offline Storage

All messages, contacts, and chat metadata are persisted locally using IndexedDB:

- **Message Queue** — Pending messages are stored with retry logic and delivery status tracking
- **Contact Discovery** — Nearby Bluetooth peers are remembered with timestamps for smart reconnection
- **Automatic Cleanup** — Old delivered messages (7+ days) and stale contacts (24+ hours) are purged automatically
- **Storage Statistics** — Real-time monitoring of offline storage usage

---

## Core Features

### Encrypted Messaging
- End-to-end encrypted real-time messaging via WebSocket
- Telegram-style direct messaging — no friend requests needed, just start chatting
- Group chat with admin controls and member management
- Typing indicators and online status tracking
- Sub-100ms message delivery latency

### Multi-Chain Crypto Wallet
Offchat creates an embedded HD wallet for each user — no external wallet apps needed. Your wallet lives securely inside Offchat.

**Supported Networks:**
- Ethereum (ETH)
- Binance Smart Chain (BSC)
- Arbitrum (ARB)
- Polygon (MATIC)
- Base
- Optimism (OP)

**Wallet Features:**
- Embedded HD wallet creation (BIP-39 mnemonic)
- Real-time balance tracking across all chains
- Token discovery with ~40 popular tokens per network
- Send and receive crypto directly within chat conversations

### Integrated DEX Token Swap
Swap tokens instantly without leaving the app. Offchat's integrated decentralized exchange interface connects to major liquidity pools for best-rate trading across all supported networks.

### $OFFC Token Economy
The native $OFFC token powers the Offchat ecosystem:
- 95% initial liquidity pool allocation
- 3% transaction tax funding global expansion
- DAO governance voting rights (upcoming)
- Staking rewards for active community members (upcoming)

### NFT Collection Management
- Upload, view, and manage your NFT collection
- Gallery display with metadata
- Cross-platform NFT visibility on user profiles

### Crypto Market Tracking
- Live cryptocurrency prices via CoinGecko API
- Market cap, 24h change, and volume data
- Individual token detail views with price history

---

## Platform Architecture

### Technology Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + TypeScript + Vite |
| UI System | Radix UI + shadcn/ui + Tailwind CSS |
| Backend | Node.js + Express.js |
| Real-time | WebSocket (ws) |
| Database | PostgreSQL (Neon Serverless) |
| ORM | Drizzle ORM |
| Blockchain | ethers.js (multi-chain) |
| Offline P2P | Web Bluetooth API + IndexedDB |
| State Management | TanStack Query v5 |
| PWA | Service Worker + Web App Manifest |

### Security

- AES-256 message encryption with HMAC authentication
- Wallet-based authentication (no passwords)
- PostgreSQL-backed secure sessions
- Zod schema validation on all inputs
- Content Security Policy headers
- Strict referrer policy

---

## Design Philosophy

Offchat uses a **Matrix-inspired cyberpunk aesthetic** — green-on-black with Japanese katakana and Chinese kanji character rain animations. The design reflects the platform's core values:

- **Privacy** — Dark theme symbolizing hidden, encrypted communication
- **Decentralization** — Matrix rain representing the distributed network
- **Web3 Native** — Cyber aesthetic matching the blockchain ecosystem

---

## Roadmap 2026

### Q1 — Launch & Foundation *(Current)*
- $OFFC token launch with 95% liquidity pool
- Core messaging platform with WebSocket communication
- Multi-chain wallet integration (Ethereum, BSC)
- Community building and global marketing

### Q2 — Growth & Security
- CEX exchange listings
- Signal Protocol end-to-end encryption upgrade
- React Native mobile app development (iOS & Android)
- Professional security audit

### Q3 — Global Expansion
- iOS App Store & Google Play launch
- Multi-region deployment (US, EU, Asia-Pacific)
- Multi-chain expansion (Polygon, Arbitrum, Optimism)
- Bluetooth LE mesh networking for offline chat
- IPFS decentralized storage

### Q4 — Ecosystem Maturity
- DAO governance with $OFFC voting
- Cross-chain bridge for seamless transfers
- Decentralized identity (DID) integration
- Zero-knowledge proof messaging
- Target: 1M+ registered users

---

## Target Metrics

| Metric | Target |
|---|---|
| Registered Users | 1,000,000+ |
| Daily Active Users | 100,000+ |
| Mobile Platforms | iOS + Android |
| Offline Capability | 100% |
| Blockchain Networks | 10+ |
| Crypto Transaction Volume | $10M+ |
| Message Latency | <50ms |
| Uptime | 99.99% |

---

## Who Uses Offchat?

- **Crypto Traders** — Share market insights and execute trades within secure chat groups
- **DeFi Communities** — Coordinate strategies and share yield farming opportunities in real-time
- **Privacy Advocates** — Communicate without surveillance using decentralized infrastructure
- **Web3 Developers** — Collaborate on blockchain projects with integrated smart contract tools
- **Users in Censored Regions** — Bypass internet shutdowns with mesh networking
- **Emergency Responders** — Maintain communication during natural disasters when infrastructure fails

---

## Links

- **Website:** [offchat.app](https://offchat.app)
- **Whitepaper:** [offchat.app/whitepaper](https://offchat.app/whitepaper)
- **Roadmap:** [offchat.app/roadmap](https://offchat.app/roadmap)
- **Twitter/X:** [@OFFCHATApp](https://x.com/OFFCHAT_app)
- **Telegram:** [@OFFCHATapp](https://t.me/OFFCHAT_app)

---

*Offchat — Your voice, your data, your freedom.*
