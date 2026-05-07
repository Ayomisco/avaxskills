# Token Launch Rules

## Must-Follow
- Always deploy with fixed total supply or explicit max supply — unbounded inflation destroys trust
- Always add liquidity within the same transaction as token creation — front-runners will exploit the gap
- Always set reasonable slippage tolerance for initial liquidity (0.5-1% for major pairs)
- Always lock LP tokens for at least 12 months — rug-pull protection is non-negotiable for trust

## Never Do
- Never keep 100% of the token supply in deployer wallet after launch — distribute or burn
- Never launch without any locking — even team tokens must have vesting
- Never use a fee-on-transfer token with DEX routers unless you've tested compatibility explicitly
- Never launch without verifying the contract on the explorer

## Always Check
- Verify Trader Joe router address for your network: mainnet `0x18556DA13313f3532c54711497A8FedAC273220E`
- Test `addLiquidity` on Fuji with small amounts before mainnet
- Confirm token has been audited or at minimum reviewed for common issues (honeypot, mint backdoor)
