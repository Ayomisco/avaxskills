# x402 Integration Rules

## Must-Follow
- Always validate payment amount on-chain before executing sensitive operations
- Always implement payment expiry — don't accept stale payment authorizations
- Always use HTTPS for all payment endpoints — payment data must not traverse plain HTTP
- Store agent private keys in environment variables with strict access controls — HSM for production

## Never Do
- Never store private keys in source code or committed config files
- Never process payment for free after a failed validation — fail closed
- Never trust off-chain payment claims without on-chain verification
- Never skip idempotency — double-delivery of services due to retried payments is a business logic bug

## Always Check
- Verify payment token and amount match what your service expects
- Test payment flow with insufficient amount, expired payment, and wrong token
- Confirm your service handles concurrent payment requests safely (no race conditions on balance checks)
