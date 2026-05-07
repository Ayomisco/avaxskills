# Contract Verification Rules

## Must-Follow
- Always verify contracts on `https://subnets.avax.network/c-chain` (mainnet) and `https://subnets-test.avax.network/c-chain` (Fuji)
- Always use Routescan API endpoint for Hardhat verify: `https://api.snowtrace.io/api`
- Always match exact Solidity version and optimization settings used during deployment
- Get free API key from `https://snowtrace.io/myapikey` — login with wallet

## Never Do
- Never use Etherscan URLs for Avalanche — they will not work
- Never verify with different compiler settings than the deployed bytecode — verification will fail
- Never skip verification for contracts users will interact with — unverified contracts are a red flag

## Always Check
- Confirm constructor arguments match exactly what was passed at deployment
- Verify all imported libraries are also verified (or use flattened source)
- Test verification on Fuji before mainnet
