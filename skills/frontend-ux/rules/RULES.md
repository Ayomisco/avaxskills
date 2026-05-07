# Frontend UX Rules

## Must-Follow
- Always show transaction status (pending, confirmed, failed) with block explorer links
- Always display Avalanche network name and chain ID to help users confirm they're on the right network
- Always handle loading states — Avalanche is fast (2s blocks) but network latency adds up
- Always use human-readable amounts — convert from wei using `formatEther` / `formatUnits`

## Never Do
- Never show raw hex addresses without shortening (e.g., `0x1234...abcd`)
- Never block the UI while waiting for transactions — use optimistic updates
- Never skip error states — wallet rejections, network errors, and contract reverts must be shown clearly
- Never display gas estimates without a buffer — add 10-20% to avoid out-of-gas errors

## Always Check
- Test on mobile wallets — Core Wallet mobile + WalletConnect is a common flow
- Verify your app works when wallet is disconnected mid-session
- Confirm AVAX amounts are displayed with correct decimals (18 decimals)
