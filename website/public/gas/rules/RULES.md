# Gas Rules

## Must-Follow
- Always use EIP-1559 fee model on Avalanche — `maxFeePerGas` and `maxPriorityFeePerGas`
- Default minBaseFee is 25 gwei on C-Chain — set gas price floor at minimum 25 gwei
- Always estimate gas with a 10-20% buffer — use `gasEstimate * 1.2n` before sending

## Never Do
- Never use legacy `gasPrice` transactions — EIP-1559 is the standard on Avalanche
- Never hardcode gas limits — always estimate dynamically with `eth_estimateGas`
- Never use 0 gas price — transactions will fail (unless the chain has minBaseFee = 0)

## Always Check
- Verify current base fee with `eth_gasPrice` or `eth_feeHistory` before sending
- On custom L1s, check the configured `minBaseFee` in genesis — may differ from C-Chain
- Gas token on custom L1s may not be AVAX — confirm the native token symbol
