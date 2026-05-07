# Get Testnet AVAX Rules

## Must-Follow
- Always use the official Avalanche faucet: `https://faucet.avax.network`
- Always use Fuji testnet (chain ID 43113) for testing — never spend mainnet AVAX for development
- Always verify your wallet is connected to Fuji before requesting faucet funds

## Never Do
- Never transfer real mainnet AVAX to a test wallet you don't control securely
- Never assume testnet AVAX has real monetary value — it is worthless by design
- Never use the ewoq private key (`56289e99c...`) on Fuji or mainnet — local only

## Always Check
- Confirm wallet address is the correct Fuji address before requesting faucet
- Fuji faucet limit: 2 AVAX per address per day — plan accordingly
- Verify AVAX arrived on Fuji before starting development: `platform wallet balance --key-name testkey --network fuji`
