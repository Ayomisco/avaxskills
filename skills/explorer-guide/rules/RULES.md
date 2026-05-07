# Explorer Guide Rules

## Must-Follow
- Use `https://subnets.avax.network/c-chain` for C-Chain mainnet (not Snowtrace, not Etherscan)
- Use `https://subnets-test.avax.network/c-chain` for Fuji testnet
- For custom L1s: use `https://subnets.avax.network/{CHAIN_ID}` pattern

## Never Do
- Never direct users to `etherscan.io` for Avalanche transactions — wrong chain
- Never link `snowtrace.io` as the primary explorer — use subnets.avax.network instead
- Never assume block explorer URL without checking the chain's documentation

## Always Check
- Verify the correct explorer URL for the network you're on before sharing transaction links
- For API verification calls, Snowtrace API is still valid: `api.snowtrace.io/api` (mainnet), `api-testnet.snowtrace.io/api` (Fuji)
