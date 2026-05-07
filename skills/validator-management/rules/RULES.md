# Validator Management Rules

## Must-Follow
- Always use ACP-77 ValidatorManager contracts for L1 validator management
- Always use `PoAManager` for permissioned validators, `NativeTokenStakingManager` for permissionless PoS
- Always fund validator P-Chain balance with enough AVAX for 1.33 AVAX/month minimum
- Always test validator registration and removal on Fuji before mainnet

## Never Do
- Never use `avalanche validator` CLI commands — Avalanche CLI is deprecated
- Never register validators without confirmed P-Chain balance for slot fees
- Never use ewoq key to register mainnet validators
- Never remove all validators from an L1 without having a replacement validator set ready

## Always Check
- Verify `platform node info --ip <address>` returns correct node ID before registering
- Confirm validator has set BLS proof-of-possession during registration
- Monitor validator P-Chain balance — falling below threshold causes automatic deregistration
