# RULES — avalanche-sdk

These rules apply whenever the `avalanche-sdk` skill is active. The SDK interacts with real funds — violations can result in key exposure or fund loss.

## Mandatory rules

### R1 — Prefer @avalabs/avalanche-sdk over avalanche-js
For all new TypeScript/JavaScript projects, use `@avalabs/avalanche-sdk`. Do not start new projects with the older `avalanche` (avalanche-js) package. Only use avalanche-js when maintaining legacy code.

### R2 — Never hardcode private keys
Always load private keys from environment variables (`process.env.PRIVATE_KEY`) or hardware wallet signers. Never hardcode keys in source files, config files, or commit them to version control.

```typescript
// CORRECT
const privateKey = process.env.PRIVATE_KEY;
if (!privateKey) throw new Error("PRIVATE_KEY env var not set");

// WRONG — never do this
const privateKey = "0x1234abcd...";
```

### R3 — Do not mix C-Chain and P-Chain address formats
C-Chain addresses use hex format (`0x...`). P-Chain and X-Chain addresses use Bech32 (`P-avax1...` / `P-fuji1...`). Passing a hex address to a P-Chain API call or vice versa will cause errors or silent failures. Always use the address from `account.cChainAddress` or `account.pChainAddress` as appropriate.

### R4 — Use nAVAX for all SDK amounts
The SDK works in nAVAX (nano-AVAX). 1 AVAX = 1,000,000,000 nAVAX. Always multiply user-facing AVAX amounts by 1e9 before passing to SDK calls, and divide by 1e9 before displaying balances to users.

### R5 — Wait for export confirmation before importing
In cross-chain transfers (C↔P, C↔X), always wait for the export transaction to be confirmed before calling the import. Use `client.data.waitForTx({ txId: exportTxId })`. Calling import before export is confirmed will result in a failed import with no clear error.

### R6 — Use the correct network string
Use `"mainnet"` or `"fuji"` exactly. Misspelled network strings may silently fall back to a default or throw an opaque error.

## Anti-patterns

- Do NOT use the SDK in a browser context with a user's private key — use a wallet adapter (MetaMask, Core Wallet) instead.
- Do NOT ignore TypeScript errors from the SDK — they encode invariants about address formats and amounts.
- Do NOT share a single client instance across multiple concurrent cross-chain operations without understanding nonce management.
- Do NOT use the old `avalanche` npm package for new projects.
