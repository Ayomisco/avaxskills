# Event-Driven Backend Rules

## Must-Follow
- Always save a checkpoint (last processed block) — restart must resume, not re-index from genesis
- Always handle WebSocket disconnections with reconnection logic and exponential backoff
- Always use `ON CONFLICT DO NOTHING` or equivalent when inserting events to database — events may be received twice
- Always confirm at least 1 block finality before acting on events — Avalanche has near-instant finality

## Never Do
- Never process the same event twice — use (txHash, logIndex) as unique key
- Never rely on a single WebSocket connection without reconnection handling — connections drop
- Never paginate raw `eth_getLogs` across large block ranges in production — use Glacier API or The Graph
- Never ignore event errors — silently dropped events cause data inconsistency

## Always Check
- Verify event signature matches exactly (including indexed vs non-indexed parameters)
- Test event listener restart behavior — simulate crash and verify it resumes correctly
- Confirm database connection pooling is configured for concurrent event processing
