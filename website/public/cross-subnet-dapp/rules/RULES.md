# Cross-Subnet dApp Rules

## Must-Follow
- Always use Teleporter (ICM) for cross-chain messaging — never build custom bridge logic
- Always implement `ITeleporterReceiver` on the receiving contract
- Always add sufficient buffer to `requiredGasLimit` — underestimating causes message failure
- Always emit events on message send and receive for monitoring and debugging

## Never Do
- Never assume message ordering — cross-chain messages can arrive out of order
- Never process a cross-chain message more than once — check `messageID` idempotency
- Never trust `msg.sender` across chains for auth — verify the sending chain and contract address
- Never send sensitive data in cross-chain messages without encryption

## Always Check
- Verify TeleporterMessenger is deployed on both source and destination chains
- Test cross-chain flow end-to-end on Fuji before mainnet
- Confirm relayer infrastructure is operational for your chains
