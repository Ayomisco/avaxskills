# Data Feeds & Oracles Rules

## Must-Follow
- Always use Chainlink's AggregatorV3Interface for price feeds — never call contract addresses directly without interface
- Always check `updatedAt` timestamp — reject stale prices older than your acceptable staleness threshold (usually 1 hour for Chainlink)
- Always check `answeredInRound >= roundId` to detect stale Chainlink rounds
- For Pyth: always update price before reading — call `updatePriceFeeds` with the off-chain price update

## Never Do
- Never use a single oracle as the sole price source for large financial operations
- Never skip price validation — negative prices and zero prices can be returned and must be handled
- Never assume oracle precision — Chainlink feeds return int256 with 8 decimals for USD pairs
- Never hardcode price feed addresses without documenting the network they belong to

## Always Check
- Verify oracle feed address is the correct pair and network (mainnet vs Fuji addresses differ)
- Confirm acceptable price age for your use case — DeFi apps need <1 hour; some games can tolerate more
- Test oracle behavior under extreme conditions (price = 0, stale data, negative prices)
