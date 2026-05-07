# Warp Messaging Rules

## Must-Follow
- Always use Teleporter (ICM) as the developer interface to Warp — never call Warp precompile directly
- Always verify the sending chain ID and sender address in cross-chain message handlers
- Always implement `ITeleporterReceiver.receiveTeleporterMessage` on destination contracts
- Always add 20-30% gas buffer to `requiredGasLimit` for cross-chain execution

## Never Do
- Never assume Warp messages arrive instantaneously — delivery depends on relayer infrastructure
- Never process the same Warp message ID twice — store processed IDs
- Never trust arbitrary cross-chain callers — validate source chain + contract address explicitly
- Never use Warp for time-sensitive operations without understanding relayer latency

## Always Check
- Verify WarpMessenger precompile is enabled on both chains (`0x0200000000000000000000000000000000000005`)
- Test end-to-end message flow on Fuji before mainnet
- Confirm relayer is configured for your specific chain pair
