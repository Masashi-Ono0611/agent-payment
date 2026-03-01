# PayAgent 💸

AI-powered payment assistant on Base Sepolia testnet. Chat naturally to create wallets, check balances, request testnet ETH, and send payments.

## Features

- 🤖 **AI Chat Interface** - Natural language commands for wallet operations
- 👛 **Wallet Management** - Create and manage multiple wallets
- 💰 **Balance Checking** - View ETH and USDC balances
- 🚰 **Testnet Faucet** - Request free testnet ETH
- 💸 **Transfers** - Send ETH and USDC via chat or UI
- 🔗 **Browser Wallet** - Connect MetaMask and other wallets via WalletConnect

## Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/) with App Router
- **AI**: [Vercel AI SDK v6](https://sdk.vercel.ai/)
- **Blockchain**: [Coinbase CDP SDK](https://docs.cdp.coinbase.com/) + [viem](https://viem.sh/)
- **Wallet Connect**: [RainbowKit](https://www.rainbowkit.com/) + [wagmi](https://wagmi.sh/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Testing**: [Playwright](https://playwright.dev/)

## Prerequisites

- Node.js 20+
- pnpm (recommended) or npm
- API Keys:
  - [Coinbase CDP API](https://portal.cdp.coinbase.com/projects/api-keys) - for wallet operations
  - [Anthropic API](https://console.anthropic.com/) - for AI chat
  - [WalletConnect](https://cloud.walletconnect.com/) - for browser wallet connection

## Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/Masashi-Ono0611/agent-payment.git
   cd agent-payment
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.local.example .env.local
   ```
   
   Edit `.env.local` with your API keys:
   ```env
   # Coinbase CDP API Keys
   CDP_API_KEY_ID=your_api_key_id_here
   CDP_API_KEY_SECRET=your_api_key_secret_here
   CDP_WALLET_SECRET=your_wallet_secret_here

   # Anthropic API (for PayAgent chat)
   ANTHROPIC_BASE_URL=https://api.anthropic.com
   ANTHROPIC_AUTH_TOKEN=your_anthropic_api_key_here

   # WalletConnect (for browser wallet connection)
   NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id_here
   ```

4. **Run the development server**
   ```bash
   pnpm dev
   ```

5. **Open the app**
   
   Visit [http://localhost:3000](http://localhost:3000)

## Usage

### Chat Commands

Talk to PayAgent naturally:

- "Create a new wallet called 'savings'"
- "What's my balance?"
- "Send 0.01 ETH to 0x..."
- "Request testnet ETH"

### Wallet Operations

1. **Create Wallet**: Type a wallet name in the chat or use the UI
2. **Check Balance**: Ask for balance or view in the wallet panel
3. **Get Testnet ETH**: Click the faucet button or ask in chat
4. **Send Payments**: Specify amount, token, and recipient address

## Running Tests

### E2E Tests with Playwright

```bash
# Install Playwright browsers
pnpm exec playwright install --with-deps

# Run all E2E tests
pnpm test:e2e

# Run tests with UI
pnpm test:e2e:ui
```

### Linting

```bash
pnpm lint
```

### Type Checking

```bash
pnpm tsc --noEmit
```

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── chat/          # AI chat endpoint
│   │   ├── balance/       # Balance checking API
│   │   └── transfer/      # Transfer API
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home page
├── components/
│   └── WalletView.tsx     # Wallet UI component
└── lib/                   # Shared utilities
```

## Network

This app runs on **Base Sepolia** testnet. All ETH and tokens are for testing purposes only and have no real value.

## License

MIT
