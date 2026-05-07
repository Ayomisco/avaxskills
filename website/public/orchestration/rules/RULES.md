# Orchestration Rules

## Must-Follow
- Always implement idempotency keys for multi-step blockchain operations — retries must be safe
- Always handle partial failures — if step 3 of 5 fails, the system must recover gracefully
- Always use a job queue (BullMQ, SQS) for async blockchain operations — never block HTTP requests
- Always emit status events so monitoring systems can track orchestration progress

## Never Do
- Never run long-running blockchain operations synchronously in a web server request
- Never assume a transaction confirmed — always poll for receipt with timeout
- Never skip dead-letter queue for failed jobs — silent failures cause data inconsistency

## Always Check
- Verify all steps in an orchestration flow are idempotent before production
- Test failure recovery at each step — simulate RPC errors, timeouts, and contract reverts
- Confirm nonce management handles concurrent transactions correctly
