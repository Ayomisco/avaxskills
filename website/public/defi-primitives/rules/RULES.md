# DeFi Primitives Rules

## Must-Follow
- Always use ReentrancyGuard on functions that transfer tokens or ETH/AVAX
- Always follow CEI pattern (Checks-Effects-Interactions) — validate, update state, then external call
- Always use SafeERC20 (`safeTransfer`, `safeTransferFrom`) — some tokens don't return bool
- Always implement slippage protection on swaps — no uncapped slippage allowed

## Never Do
- Never use spot price for oracle-dependent logic — use TWAP to prevent flash loan manipulation
- Never trust token balances that could be flash-loaned — validate amounts within same tx
- Never implement AMM math manually — use battle-tested libraries (Uniswap v2/v3, Balancer)
- Never skip deadline checks on swap transactions — MEV bots will exploit open-ended transactions

## Always Check
- Verify all token approvals are handled correctly (approve before transferFrom)
- Test all DeFi interactions with realistic token amounts including extreme values
- Audit for sandwich attack vectors on all AMM interactions
