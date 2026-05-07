# Avalanche.js Rules

## Must-Follow
- Always use `@avalabs/avalanchejs` (v4+) for X-Chain and P-Chain operations
- Always handle async transactions with proper await — Avalanche.js is fully async
- Use `utils.hexToBuffer` and `utils.bufferToHex` for address conversions — don't DIY
- Always validate addresses before sending — malformed addresses cause unrecoverable transactions

## Never Do
- Never commit private keys or mnemonics to source control
- Never use `@avalabs/avalanche` (v3) — it is deprecated
- Never skip error handling on `issueSignedTx` — network errors are common

## Always Check
- Verify network context (mainnet vs fuji) before signing and broadcasting
- Confirm UTXO set is fetched fresh before building transactions (stale UTXOs fail)
- Test on Fuji before mainnet for all X/P-Chain operations
