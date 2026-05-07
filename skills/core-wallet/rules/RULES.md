# Core Wallet Rules

## Must-Follow
- Always import `avalanche` and `avalancheFuji` chains from `viem/chains` when integrating Core Wallet
- Always handle wallet disconnection — Core can be disconnected via the browser extension popup
- Always show human-readable token names and amounts — never show raw hex values to users
- Request only necessary permissions — don't request asset access you don't need

## Never Do
- Never store wallet connection state in server-side sessions — wallets are client-side only
- Never assume Core Wallet is installed — always provide fallback wallet options (MetaMask, WalletConnect)
- Never skip network switching prompts — always guide users to the correct Avalanche network

## Always Check
- Verify connected chain ID matches your expected network before signing transactions
- Handle `user rejected` error gracefully — don't show error messages as crashes
- Test Core Wallet flow on both C-Chain and custom L1 if applicable
