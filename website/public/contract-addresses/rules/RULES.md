# Contract Addresses Rules

## Must-Follow
- Always verify contract addresses from official sources before use in production
- Always distinguish mainnet from Fuji testnet addresses — they are different
- Use checksummed addresses (EIP-55) in all code — lowercase addresses are error-prone

## Never Do
- Never hardcode contract addresses without comments identifying the network and source
- Never use addresses from unofficial sources or forums — they may be malicious forks
- Never assume addresses are the same across chains — every chain has separate deployments

## Verified Mainnet Addresses (C-Chain)
- WAVAX: `0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7`
- TeleporterMessenger: `0x253b2784c75e510dD0fF1da844684a1aC0aa5fcf`
- TeleporterRegistry Mainnet: `0x7C43605E14F391720e1b37E49C78C4b03A488d98`
- TeleporterRegistry Fuji: `0xF86Cb19Ad8405AEFa7d09C778215D2Cb6eBfB228`

## Always Check
- Cross-reference addresses with `https://github.com/ava-labs/teleporter` and official Avalanche docs
- Verify bytecode at address on explorer before trusting any address
