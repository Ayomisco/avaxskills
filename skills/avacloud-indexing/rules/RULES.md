# AvaCloud Indexing Rules

## Must-Follow
- Always use Glacier API for historical event queries — never paginate raw getLogs for production
- Always handle pagination with `pageToken` — Glacier results are paginated
- Always specify `chainId` in requests — Glacier serves multiple chains
- Store your AvaCloud API key in environment variables, never in code

## Never Do
- Never hammer Glacier API without rate limit handling — implement exponential backoff
- Never skip error handling for 429 (rate limit) and 503 responses
- Never use Glacier as a real-time event stream — use WebSocket subscriptions for live data

## Always Check
- Verify chainId matches your target network (43114 mainnet, 43113 Fuji)
- Test pagination logic with large result sets before production
- Confirm API key has sufficient quota for your expected query volume
