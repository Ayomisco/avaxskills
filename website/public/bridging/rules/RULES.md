# Bridging Rules

## Must-Follow
- Always use official Avalanche Bridge for AVAX/ETH bridging: `https://bridge.avax.network`
- Always wait for bridge confirmation before assuming funds arrived on destination chain
- Always verify bridge contract addresses from official Avalanche documentation
- Communicate expected bridge time to users (Avalanche Bridge: ~15 min for ERC-20)

## Never Do
- Never build a custom bridge without a thorough security audit — bridges are high-value attack targets
- Never display user funds as "received" before confirming on destination chain
- Never skip slippage validation on bridge swaps
- Never use unofficial bridge UI — phishing sites mimic official bridge UIs

## Always Check
- Verify token is supported by the bridge before instructing users
- Confirm destination chain has sufficient liquidity for the bridged asset
- Test bridge flow on testnet before directing users to mainnet bridge
