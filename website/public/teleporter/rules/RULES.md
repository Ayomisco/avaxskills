# Teleporter (ICM) Rules

## Must-Follow
- Always implement `ITeleporterReceiver` on receiving contracts — the `receiveTeleporterMessage` function must be implemented
- Always verify `msg.sender == TELEPORTER_MESSENGER_ADDRESS` in `receiveTeleporterMessage`
- Always verify the sending chain ID and sender address in the message handler
- Always add buffer to `requiredGasLimit` — use 20-30% more than estimated execution gas

## Never Do
- Never deploy TeleporterMessenger yourself — use the canonical singleton at `0x253b2784c75e510dD0fF1da844684a1aC0aa5fcf`
- Never assume cross-chain messages arrive in order — implement sequence numbers if order matters
- Never skip idempotency — the same message can theoretically be relayed more than once
- Never trust the message payload without validating the expected format

## Always Check
- Verify TeleporterMessenger is deployed on both source and destination chains
- Test cross-chain flow end-to-end on Fuji with `requiredGasLimit` before mainnet
- Confirm relayer infrastructure covers your chain pair
