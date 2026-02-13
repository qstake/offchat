# Overview

Offchat is a Web3 messaging platform with $OFFC token economy, combining real-time encrypted messaging with multi-chain cryptocurrency features. The platform uses a Matrix-inspired green-on-black aesthetic with Japanese/Chinese character rain animations. Built as a full-stack TypeScript application with Telegram-style direct messaging (no friend requests needed), embedded HD wallet creation, integrated DEX token swapping, NFT collection management, and crypto market tracking. Target domain: offchat.app. All UI text is in English.

# User Preferences

- Preferred communication style: Simple, everyday language
- Matrix rain animations use Japanese katakana + Chinese kanji characters
- Matrix rain appears on: splash screen (index.html), chat welcome page, swap page background (slower speed, behind UI)
- Matrix rain does NOT appear on: auth loading screens
- Logo system: `/logo.png` (main logo), `/icon.png` (favicon), both in client/public/
- Brand name: "Offchat" (previously "ChatRix" - all references migrated)

# System Architecture

## Frontend Architecture
- **Framework**: React 18 with TypeScript using Vite as the build tool
- **UI Library**: Radix UI components with shadcn/ui styling system
- **Styling**: Tailwind CSS with custom Matrix-themed color palette (green-on-black)
- **State Management**: TanStack Query v5 for server state, React hooks for local state
- **Routing**: Wouter for lightweight client-side routing
- **Real-time Communication**: WebSocket client with custom hooks for chat functionality
- **PWA**: Service worker (client/public/sw.js) with offline support and push notifications

## Backend Architecture
- **Runtime**: Node.js with Express.js server
- **Language**: TypeScript with ES modules
- **API Design**: RESTful endpoints with WebSocket server for real-time features
- **Session Management**: PostgreSQL-backed sessions via connect-pg-simple
- **Object Storage**: Replit Object Storage for NFT images and user uploads
- **Development Setup**: Vite integration for hot module replacement in development

## Data Storage Solutions
- **Primary Database**: PostgreSQL with Neon serverless driver
- **ORM**: Drizzle ORM for type-safe database operations
- **Schema Management**: Drizzle Kit for migrations
- **Object Storage**: Replit Object Storage for file uploads (NFTs, profile images)
- **Local Storage**: Token discovery cache under 'offchat_custom_tokens'

## Database Schema Design
The application uses four main entities:
- **Users**: Store user profiles with wallet addresses, online status, profile images
- **Chats**: Support both direct messages and group conversations
- **Messages**: Handle text messages and cryptocurrency transactions
- **Chat Participants**: Manage many-to-many relationships between users and chats

## Pages & Routes
- `/` - Splash/landing page with Matrix rain animation
- `/auth` - Authentication (wallet-based login)
- `/profile-setup` - New user profile setup
- `/chat` - Main messaging interface with sidebar
- `/chat-conversations` - Mobile conversation list
- `/swap` - DEX token swapping with Matrix rain background
- `/crypto-market` - Live cryptocurrency prices and market data
- `/crypto-detail` - Individual token detail view
- `/nft-collection` - NFT gallery management
- `/offc-transfers` - $OFFC token transfer history
- `/about` - About page
- `/roadmap` - Development roadmap
- `/whitepaper` - Technical whitepaper
- `/terms` - Terms of Service
- `/privacy` - Privacy Policy
- `/user-profile/:address` - Public user profile
- `/group-profile/:id` - Group profile view

## Key Components
- `chat-area.tsx` - Main chat message area with real-time messaging
- `chat-sidebar.tsx` - Conversation list sidebar
- `message-bubble.tsx` - Individual message rendering (text + crypto transactions)
- `enhanced-wallet-section.tsx` - Multi-chain wallet management
- `wallet-section.tsx` - Basic wallet display
- `matrix-background.tsx` - Reusable Matrix rain animation component
- `mobile-bottom-nav.tsx` - Mobile navigation bar
- `NFTGallery.tsx` / `NFTUploader.tsx` - NFT management components
- `offchat-footer.tsx` - Site-wide footer
- `crypto-prices-grid.tsx` - Market data grid display

## Key Libraries
- `client/src/lib/walletconnect.ts` - Multi-chain wallet connection logic
- `client/src/lib/web3.ts` - Web3 utilities and contract interactions
- `client/src/lib/crypto-service.ts` - Cryptocurrency price data service
- `client/src/lib/bluetooth-messaging.ts` - Bluetooth messaging (experimental)
- `client/src/lib/offline-storage.ts` - Offline data persistence
- `client/src/lib/error-handler.ts` - Global error handling

## Real-time Features
- **WebSocket Implementation**: Custom WebSocket server handling connection management
- **Message Broadcasting**: Real-time message delivery to chat participants
- **Typing Indicators**: Live typing status updates
- **Online Status**: Real-time user presence tracking
- **Connection Management**: Automatic reconnection and connection state handling

## Cryptocurrency Integration
- **Wallet Support**: Embedded HD wallet creation (stored in-app, not external wallets)
- **Multi-chain**: Ethereum, BSC, Arbitrum, Polygon, Base, Optimism
- **Token Discovery**: SCANNABLE_TOKENS list (~40 popular tokens per network), localStorage persistence
- **DEX Swapping**: Integrated token swap interface on /swap page
- **Transaction Types**: Support for ETH and token transfers within chat messages
- **Balance Tracking**: Real-time wallet balance updates
- **Crypto Market**: Live price tracking via CoinGecko API
- **NFT Management**: Collection viewing, uploading, and display

## Authentication & Security
- **Wallet-based Auth**: Users authenticate using cryptocurrency wallet addresses
- **Replit Auth**: Login with Replit integration available
- **Session Security**: Secure session management with PostgreSQL-backed sessions
- **Input Validation**: Zod schema validation for all user inputs

## SEO Configuration
- **Structured Data**: JSON-LD schemas for WebApplication, Organization, WebSite in index.html
- **Meta Tags**: Dynamic document.title and meta description per page via useEffect hooks
- **Open Graph**: OG title, description tags set per page
- **Sitemap**: client/public/sitemap.xml with all public pages
- **Robots**: client/public/robots.txt allowing public pages, blocking /chat/ and /api/
- **Domain**: offchat.app

## Static Assets (client/public/)
- `logo.png` - Main Offchat logo
- `icon.png` - Favicon/app icon
- `meta.png` - OG/social media preview image
- `manifest.json` - PWA manifest
- `sw.js` - Service worker
- `robots.txt` - Search engine directives
- `sitemap.xml` - XML sitemap
- `offline.html` - Offline fallback page

# External Dependencies

## Core Framework
- **@vitejs/plugin-react**: React support for Vite
- **express**: Node.js web server
- **wouter**: Lightweight React router

## Database & ORM
- **@neondatabase/serverless**: PostgreSQL serverless driver for Neon
- **drizzle-orm**: Type-safe PostgreSQL ORM
- **drizzle-kit**: Database migrations
- **connect-pg-simple**: PostgreSQL session store

## Real-time Communication
- **ws**: WebSocket library for Node.js
- **@tanstack/react-query**: Server state management (v5)

## UI & Styling
- **@radix-ui/react-***: Headless UI component primitives
- **tailwindcss**: Utility-first CSS framework
- **class-variance-authority**: Type-safe component variants
- **lucide-react**: Icon library

## Form & Validation
- **react-hook-form**: Form library with validation
- **@hookform/resolvers**: Zod resolver for forms
- **zod**: TypeScript-first schema validation
- **drizzle-zod**: Zod integration for Drizzle schemas

## Development Tools
- **tsx**: TypeScript execution for Node.js
- **esbuild**: Fast JavaScript bundler
- **@replit/vite-plugin-runtime-error-modal**: Development error overlay

## Additional Libraries
- **date-fns**: Date formatting
- **nanoid**: Unique ID generation
- **ethers**: Ethereum library for wallet/blockchain interactions

# Recent Changes

- 2026-02-13: Added SEO meta tags (title, description, OG) to all 8 public pages
- 2026-02-13: Updated structured data (JSON-LD) with multi-chain features and corrected URLs
- 2026-02-13: Fixed whitepaper PDF cover (removed missing image import, replaced with styled logo div)
- 2026-02-13: Updated service worker branding from ChatRix to Offchat
- 2026-02-13: Cleaned up unused files (old branding assets, backup files)
- 2026-02-13: Updated robots.txt and sitemap.xml with all current pages
- 2026-02-13: Matrix rain animations using katakana + kanji characters on splash, chat welcome, swap pages
