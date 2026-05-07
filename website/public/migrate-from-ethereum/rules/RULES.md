# Migrate from Ethereum Rules

## Must-Follow
- Update chain IDs: 43114 (mainnet), 43113 (Fuji) — Ethereum chain IDs will not work
- Replace all WETH addresses with WAVAX: `0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7`
- Update verification config to use Snowtrace API: `https://api.snowtrace.io/api`
- Update explorer links to `https://subnets.avax.network/c-chain`

## Never Do
- Never change Solidity contract code just because you're on Avalanche — EVM is identical
- Never use Goerli/Sepolia faucets for Avalanche — use `https://faucet.avax.network`
- Never link Etherscan for Avalanche transactions

## Always Check
- Confirm all network configs have been updated (Hardhat, Foundry, Viem, Wagmi, env vars)
- Deploy and test on Fuji before mainnet — don't skip testnet for migrations
- Verify all external contract integrations have Avalanche deployments at the correct addresses
