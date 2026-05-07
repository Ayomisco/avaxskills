# Subnet Deployment Rules

## Must-Follow
- Always use Platform CLI — `avalanche subnet` and `avalanche network` are DEPRECATED
- Install: `curl -sSfL build.avax.network/install/platform-cli | sh`
- Always test full flow on Fuji (`--network fuji`) before mainnet
- Always back up P-Chain key files before mainnet L1 conversion
- Always check chainlist.org to verify your chain ID is not already in use

## Never Do
- Never use `avalanche subnet create`, `avalanche network start`, or any `avalanche` CLI command — deprecated
- Never use ewoq key on Fuji or mainnet — it is a publicly known key for local networks only
- Never skip `platform subnet convert-l1` step — your Subnet cannot become an independent L1 without it
- Never deploy to mainnet without a ValidatorManager contract that is audited

## Always Check
- Confirm AVAX is on P-Chain (C→P transfer) before creating subnet
- Verify all validators are online and reachable before registering
- Budget 1.33 AVAX/month per validator slot for ongoing P-Chain fees
