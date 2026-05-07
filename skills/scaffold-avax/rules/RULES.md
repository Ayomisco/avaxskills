# Scaffold Avax Rules

## Must-Follow
- Always run `yarn chain` in one terminal and `yarn deploy` in another — they are separate processes
- Always use `yarn deploy --network avalancheFuji` for testnet deployments
- Always update `scaffold.config.ts` with correct target network before deploying

## Never Do
- Never modify generated contract hooks manually — they are regenerated on deploy
- Never commit `.env.local` with private keys
- Never skip `yarn deploy` after contract changes — frontend types won't update

## Always Check
- Verify `hardhat.config.ts` has Avalanche network entries before targeting fuji/mainnet
- Confirm `NEXT_PUBLIC_` env vars are set for any backend integration
- Test the scaffold UI with Core Wallet and MetaMask — wallet behavior differs
