# EVM Hardhat Rules

## Must-Follow
- Always load private keys from environment variables — never hardcode in `hardhat.config.ts`
- Always run `npx hardhat test` before deploying to any network
- Always use `--network fuji` before `--network avalanche` — test on testnet first
- Add `hardhat-gas-reporter` to every project — track gas usage from day one

## Never Do
- Never commit `.env` files — add to `.gitignore` before first commit
- Never use `accounts: ["0xHARDCODED_KEY"]` in config
- Never deploy to mainnet without a passing test suite
- Never skip `npx hardhat verify` — unverified mainnet contracts are a trust problem

## Always Check
- Confirm `hardhat.config.ts` includes Avalanche network entries (chainId 43114 / 43113)
- Verify Snowtrace API key is set for contract verification
- Test deployment script with `--network localhost` before fuji/mainnet
