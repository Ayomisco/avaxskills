# Avalanche RPC Rules

## Must-Follow
- Always use official Avalanche RPC endpoints for mainnet: `https://api.avax.network/ext/bc/C/rpc`
- Always use Fuji testnet endpoint for testing: `https://api.avax-test.network/ext/bc/C/rpc`
- Implement retry logic with exponential backoff — public RPC nodes can be rate limited
- For production dApps, use a private RPC provider (Infura, Ankr, QuickNode, AvaCloud)

## Never Do
- Never hardcode a single public RPC in production — always support fallback providers
- Never use localhost RPC in production builds
- Never skip RPC error handling — network errors are expected and must be caught

## Always Check
- Verify chainId matches your expected network before sending transactions
- Test RPC endpoint latency — 2s block time means fast RPC matters
- Confirm WebSocket URL for real-time subscriptions: `wss://api.avax.network/ext/bc/C/ws`
