---
name: "avalanche-sdk"
version: "1.0.0"
spec: "agentskills@1.0"
license: "Apache-2.0"
tier: 1
description: "Use the new Avalanche TypeScript SDK (@avalabs/avalanche-sdk) for cross-chain operations, P-Chain interactions, and data queries."
trigger: |
  Use when: using @avalabs/avalanche-sdk, querying P-Chain balances, Avalanche TypeScript SDK, staking via SDK, cross-chain transfer C-to-P or P-to-C, Data API queries in TypeScript, Avalanche SDK npm package, new Avalanche JS SDK
  Do NOT use for: avalanche-js (old SDK), ethers.js or viem for EVM-only tasks on C-Chain, Subnet-EVM smart contract interactions (use viem/ethers directly)
last_updated: "2026-05-07"
avalanche_networks: [fuji, mainnet]
related_skills:
  - avalanche-js
  - avalanche-rpc
  - validator-management
  - avacloud-indexing
---

## Overview

`@avalabs/avalanche-sdk` is the modern Avalanche TypeScript SDK — the recommended replacement for the older `avalanche` (avalanche-js) package. It provides full type safety, a clean API, and covers P-Chain staking, Subnet management, cross-chain transfers, and Data API access. Use this for all new TypeScript/JavaScript projects that interact with Avalanche's primary network chains.

npm: `@avalabs/avalanche-sdk`  
GitHub: https://github.com/ava-labs/avalanche-sdk-js  
Docs: https://build.avax.network/docs/tooling/avalanche-sdk

## When to fetch

Fetch this skill when:
- A user installs or imports `@avalabs/avalanche-sdk`
- A user wants P-Chain staking, balance queries, or cross-chain (C↔P) transfers in TypeScript
- A user asks about the "new Avalanche SDK" or "Avalanche TypeScript SDK"
- A user wants to query Avalanche Data API from TypeScript

## Core Workflow

### 1. Install

```bash
npm install @avalabs/avalanche-sdk
# or
yarn add @avalabs/avalanche-sdk
# or
pnpm add @avalabs/avalanche-sdk
```

### 2. Initialize client

```typescript
import { Avalanche } from "@avalabs/avalanche-sdk";

// Fuji testnet
const fujiClient = new Avalanche({
  network: "fuji",
});

// Mainnet
const mainnetClient = new Avalanche({
  network: "mainnet",
});

// Custom node (e.g. your own validator)
const customClient = new Avalanche({
  baseUrl: "https://api.avax.network",
  network: "mainnet",
});
```

### 3. Query C-Chain account balance

```typescript
import { Avalanche } from "@avalabs/avalanche-sdk";

const client = new Avalanche({ network: "fuji" });

// C-Chain balance (returns balance in nAVAX — divide by 1e9 for AVAX)
const balance = await client.data.getChainAddressTransactions({
  chainId: "C",
  address: "0xYOUR_C_CHAIN_ADDRESS",
});

// Or use the EVM endpoint directly for ETH balance:
const ethBalance = await client.evm.getNativeBalance({
  chainId: "C",
  address: "0xYOUR_C_CHAIN_ADDRESS",
});
console.log(`Balance: ${ethBalance.balance} nAVAX`);
```

### 4. Query P-Chain balance

P-Chain uses Bech32 addresses (`P-avax1...` on mainnet, `P-fuji1...` on Fuji).

```typescript
const pChainBalance = await client.platformvm.getBalance({
  addresses: ["P-fuji1YOUR_PCHAIN_ADDRESS"],
});

console.log(`Unlocked balance: ${pChainBalance.balance} nAVAX`);
console.log(`Locked staking: ${pChainBalance.lockedStakeable} nAVAX`);
```

### 5. P-Chain staking operations

```typescript
import { Avalanche, privateKeyToAccount } from "@avalabs/avalanche-sdk";
import { secp256k1 } from "@avalabs/avalanche-sdk/crypto";

const client = new Avalanche({ network: "fuji" });

// Load account from private key (use env var — never hardcode)
const privateKey = process.env.PRIVATE_KEY!;
const account = privateKeyToAccount(privateKey);

// Add a validator (delegate to an existing validator)
const addDelegatorTx = await client.platformvm.buildAddDelegatorTx({
  rewardAddresses: [account.pChainAddress],
  from: [account.pChainAddress],
  nodeId: "NodeID-5ZUdznHE5QiNVFkGKMEfNxAYvF6HVbCTA",
  startTime: BigInt(Math.floor(Date.now() / 1000) + 300),   // 5 min from now
  endTime: BigInt(Math.floor(Date.now() / 1000) + 1209600), // 14 days
  weight: BigInt(1_000_000_000), // 1 AVAX in nAVAX
  changeAddresses: [account.pChainAddress],
});

const signedTx = await account.signTx(addDelegatorTx);
const txId = await client.platformvm.issueTx({ signedTx });
console.log(`Delegator tx: ${txId}`);
```

### 6. Cross-chain transfer (C-Chain to P-Chain)

Moving AVAX from C-Chain to P-Chain is a two-step process: export from C-Chain, then import to P-Chain.

```typescript
import { Avalanche, privateKeyToAccount } from "@avalabs/avalanche-sdk";

const client = new Avalanche({ network: "fuji" });
const privateKey = process.env.PRIVATE_KEY!;
const account = privateKeyToAccount(privateKey);

const amountNAvax = BigInt(2_000_000_000); // 2 AVAX

// Step 1: Export from C-Chain
const exportTx = await client.evm.buildExportTx({
  from: account.cChainAddress,
  to: account.pChainAddress,
  amount: amountNAvax,
  destinationChain: "P",
});
const signedExport = await account.signTx(exportTx);
const exportTxId = await client.evm.issueTx({ signedTx: signedExport });
console.log(`Export tx: ${exportTxId}`);

// Wait for C-Chain confirmation (~2s on Fuji)
await client.data.waitForTx({ txId: exportTxId });

// Step 2: Import to P-Chain
const importTx = await client.platformvm.buildImportTx({
  to: [account.pChainAddress],
  sourceChain: "C",
  changeAddresses: [account.pChainAddress],
});
const signedImport = await account.signTx(importTx);
const importTxId = await client.platformvm.issueTx({ signedTx: signedImport });
console.log(`Import tx: ${importTxId}`);
```

### 7. Data API queries

```typescript
const client = new Avalanche({ network: "mainnet" });

// Recent blocks on C-Chain
const blocks = await client.data.listLatestPrimaryNetworkBlocks({
  chainId: "C",
  pageSize: 10,
});

// Transaction details
const tx = await client.data.getPrimaryNetworkTransaction({
  txHash: "0xYOUR_TX_HASH",
  chainId: "C",
});

// Network validators
const validators = await client.data.listPrimaryNetworkValidators({
  nodeIds: ["NodeID-5ZUdznHE5QiNVFkGKMEfNxAYvF6HVbCTA"],
});
```

## Network config

| Network | Data API Base URL | P-Chain RPC | C-Chain RPC |
|---------|-------------------|-------------|-------------|
| Mainnet | `https://glacier-api.avax.network` | `https://api.avax.network/ext/bc/P` | `https://api.avax.network/ext/bc/C/rpc` |
| Fuji | `https://glacier-api.avax-test.network` | `https://api.avax-test.network/ext/bc/P` | `https://api.avax-test.network/ext/bc/C/rpc` |

The SDK handles these URLs internally when you set `network: "mainnet"` or `network: "fuji"`.

## Key concepts

- **Address formats**: C-Chain uses `0x...` hex addresses; P-Chain and X-Chain use Bech32 `P-avax1...` / `P-fuji1...`. Do not mix formats between chains.
- **nAVAX vs AVAX**: The SDK returns balances in nAVAX (nano-AVAX). 1 AVAX = 1,000,000,000 nAVAX (1e9). Always divide by 1e9 for display.
- **Private key handling**: Always load keys from environment variables. Never hardcode keys in source code.
- **Two-step cross-chain**: C↔P and C↔X transfers always require an export tx then an import tx. There is a waiting period between them for chain confirmation.
- **@avalabs/avalanche-sdk vs avalanche-js**: The new SDK (`@avalabs/avalanche-sdk`) is the recommended choice. The old SDK (`avalanche`) is in maintenance mode.

## Common errors

| Error | Cause | Fix |
|-------|-------|-----|
| `Invalid address format` | Mixing C-Chain hex address with P-Chain API | Use `account.pChainAddress` for P-Chain calls |
| `Insufficient balance` | nAVAX vs AVAX confusion | Verify amounts are in nAVAX (multiply AVAX by 1e9) |
| `Transaction not found` | Import called before export confirmed | Use `client.data.waitForTx()` between export and import |
| `Network not supported` | Wrong network string | Use `"fuji"` or `"mainnet"` exactly |
| `PRIVATE_KEY not set` | Missing env var | Set `PRIVATE_KEY` environment variable |

## Next skills

- **avalanche-js** — if maintaining older code using the `avalanche` npm package
- **avalanche-rpc** — direct JSON-RPC calls without SDK
- **validator-management** — validator operations via CLI and API
- **avacloud-indexing** — indexing Avalanche data via AvaCloud APIs
