# AI Agent Patterns Rules

## Must-Follow
- Always validate payment amounts on-chain before executing sensitive operations
- Always implement idempotency — agents retry; your contract must handle duplicate calls safely
- Always set spending limits / circuit breakers on agent wallets
- Use x402 or similar payment standards for agent-to-agent payments — don't roll your own protocol

## Never Do
- Never store agent private keys in environment variables committed to source control
- Never give agents unrestricted contract execution — always scope permissions
- Never skip nonce management for agent transactions — concurrent agents will collide
- Never trust off-chain AI output for on-chain financial decisions without validation

## Always Check
- Verify agent wallet balance before sending transactions
- Confirm payment receipt before delivering services
- Test agent behavior under network congestion (stuck transactions, dropped events)
