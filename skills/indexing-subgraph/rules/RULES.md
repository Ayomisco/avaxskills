# Indexing Subgraph Rules

## Must-Follow
- Always define entity IDs as deterministic strings based on on-chain data (e.g., `${txHash}-${logIndex}`)
- Always handle schema migrations carefully — changes to indexed entity types require reindexing from scratch
- Always emit rich events from your contracts — don't index what isn't in the event data
- Use `BigInt` for all uint256 values in subgraph schema — JavaScript numbers lose precision

## Never Do
- Never use `event.transaction.hash.toHex()` as a standalone entity ID — log index makes it unique
- Never skip error handling in subgraph mappings — an unhandled assertion aborts the entire subgraph
- Never index on the Graph without testing locally with `graph-node` first

## Always Check
- Verify `startBlock` is set to the contract deployment block — not 0
- Test subgraph queries in the Graph playground before production use
- Confirm Avalanche is supported as a network in the Graph hosted service or your deployment
