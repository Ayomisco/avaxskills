# Local Dev Environment Rules

## Must-Follow
- Use ewoq key ONLY on local AvalancheGo networks — never Fuji, never mainnet
- Always use `chainId: 43114` in Hardhat config when simulating C-Chain locally for accurate testing
- Always gitignore `.checkpoint` files and local state directories

## Never Do
- Never commit ewoq private key (`56289e99c94b6912bfc12adc093c9b51124f0dc54ac7a766b2bc5ccf558d8027`) as anything other than a known-public test key note
- Never run `avalanche network start` — Avalanche CLI is deprecated; use AvalancheGo directly
- Never use Anvil fork for Subnet/L1 testing — it does not support Warp messaging or P-Chain operations

## Always Check
- Verify AvalancheGo is bootstrapped before making C-Chain RPC calls (`info.isBootstrapped`)
- Confirm local node chain ID matches your Hardhat/Foundry network config
- Stop local AvalancheGo node cleanly — abrupt kills can corrupt state
