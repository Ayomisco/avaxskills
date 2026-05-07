# Platform CLI Rules

## Must-Follow
- Always use Platform CLI for all Subnet/L1 operations — Avalanche CLI is DEPRECATED
- Install command: `curl -sSfL build.avax.network/install/platform-cli | sh`
- Always back up P-Chain key files before any mainnet L1 operations
- Always test on Fuji (`--network fuji`) before mainnet

## Never Do
- Never use `avalanche subnet`, `avalanche network`, or `avalanche key` commands — they are deprecated and may fail
- Never use ewoq key on Fuji or mainnet — local AvalancheGo only
- Never share private keys used with Platform CLI — they control P-Chain assets

## Always Check
- Verify Platform CLI version: `platform version`
- Confirm wallet balance before operations: `platform wallet balance --key-name mykey --network fuji`
- Check key import/export uses `--private-key` flag (hex format) not mnemonic
