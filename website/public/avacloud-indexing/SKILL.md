---
name: "avacloud-indexing"
version: "1.0.0"
spec: "agentskills@1.0"
license: "Apache-2.0"
tier: 2
description: "Use AvaCloud Data API for on-chain indexing, webhooks, event streaming, and managed node access."
trigger: |
  Use when: user needs indexed blockchain data, event streaming, webhooks for on-chain events, or managed RPC endpoints for Avalanche. Also triggers on 'Glacier API', 'AvaCloud', 'Avalanche indexing'.
  Do NOT use for: raw RPC calls (use avalanche-rpc), local development (use Hardhat node).
last_updated: "2026-05-01"
avalanche_networks: [fuji, mainnet]
related_skills:
  - avalanche-rpc
  - bridging
---

## Overview

AvaCloud provides managed infrastructure for Avalanche: the Glacier Data API (indexed blockchain data), managed RPC endpoints, and webhooks. The Glacier API lets you query blocks, transactions, token transfers, and balances without running your own indexer. This is essential for production dApps that need fast queries across historical data.

## When to fetch

Fetch when a user needs historical data queries, webhook-based event notifications, or reliable managed RPC endpoints for a production application.

## Core Workflow

### Step 1 — Get Access

1. Sign up at https://avacloud.io
2. Create an API key in the AvaCloud dashboard
3. Base URL for Glacier API: `https://glacier-api.avax.network`

Free tier: limited requests/month. Paid tiers for production.

### Step 2 — Glacier Data API (REST)

**Base URL:** `https://glacier-api.avax.network`

**Get latest blocks:**
```bash
curl "https://glacier-api.avax.network/v1/chains/43114/blocks?pageSize=10" \
  -H "x-glacier-api-key: YOUR_API_KEY"
```

**Get block by number:**
```bash
curl "https://glacier-api.avax.network/v1/chains/43114/blocks/50000000" \
  -H "x-glacier-api-key: YOUR_API_KEY"
```

**Get transactions for an address:**
```bash
curl "https://glacier-api.avax.network/v1/chains/43114/addresses/0xYOUR_ADDRESS/transactions?pageSize=25" \
  -H "x-glacier-api-key: YOUR_API_KEY"
```

Response includes: hash, from, to, value, gasUsed, blockNumber, timestamp, status.

**Get ERC-20 token balances:**
```bash
curl "https://glacier-api.avax.network/v1/chains/43114/addresses/0xYOUR_ADDRESS/balances:listErc20" \
  -H "x-glacier-api-key: YOUR_API_KEY"
```

**Get ERC-721 (NFT) holdings:**
```bash
curl "https://glacier-api.avax.network/v1/chains/43114/addresses/0xYOUR_ADDRESS/balances:listErc721" \
  -H "x-glacier-api-key: YOUR_API_KEY"
```

**Get token transfers:**
```bash
curl "https://glacier-api.avax.network/v1/chains/43114/addresses/0xYOUR_ADDRESS/transactions:listErc20Transfers?pageSize=50" \
  -H "x-glacier-api-key: YOUR_API_KEY"
```

**Get logs for a contract:**
```bash
curl "https://glacier-api.avax.network/v1/chains/43114/addresses/0xCONTRACT_ADDRESS/logs?pageSize=100&eventSignature=Transfer(address,address,uint256)" \
  -H "x-glacier-api-key: YOUR_API_KEY"
```

**Pagination:**
```bash
# Use pageToken from response for next page
curl "https://glacier-api.avax.network/v1/chains/43114/addresses/0x.../transactions?pageToken=NEXT_PAGE_TOKEN" \
  -H "x-glacier-api-key: YOUR_API_KEY"
```

### Step 3 — TypeScript SDK

```bash
npm install @avalabs/avacloud-sdk
```

```typescript
import { AvaCloudSDK } from "@avalabs/avacloud-sdk";

const avacloud = new AvaCloudSDK({
  apiKey: process.env.AVACLOUD_API_KEY!,
  chainId: "43114",   // Avalanche mainnet
  network: "mainnet",
});

// Get transactions
async function getAddressTransactions(address: string) {
  const result = await avacloud.data.evm.transactions.listTransactions({
    chainId: "43114",
    address,
    pageSize: 25,
  });
  
  for await (const tx of result) {
    console.log({
      hash: tx.txHash,
      block: tx.blockNumber,
      from: tx.from?.address,
      to: tx.to?.address,
      value: tx.value,
      timestamp: tx.blockTimestamp,
    });
  }
}

// Get ERC-20 balances
async function getTokenBalances(address: string) {
  const balances = await avacloud.data.evm.balances.listErc20Balances({
    chainId: "43114",
    address,
  });
  
  for await (const token of balances) {
    console.log({
      name: token.name,
      symbol: token.symbol,
      balance: token.balance,
      address: token.address,
    });
  }
}

// Get recent blocks
async function getLatestBlocks(count: number = 10) {
  const blocks = await avacloud.data.evm.blocks.listLatestBlocks({
    chainId: "43114",
    pageSize: count,
  });
  
  for await (const block of blocks) {
    console.log({
      number: block.blockNumber,
      hash: block.blockHash,
      txCount: block.txCount,
      timestamp: block.blockTimestamp,
    });
  }
}
```

### Step 4 — Webhooks for Event Streaming

Register a webhook to get notified when on-chain events happen:

```typescript
// Create a webhook
const webhook = await avacloud.webhooks.createWebhook({
  url: "https://your-api.example.com/webhook",
  chainId: "43114",
  eventType: "address_activity",
  metadata: {
    addresses: ["0xYOUR_CONTRACT_ADDRESS"],
    eventSignatures: ["Transfer(address,address,uint256)"],
  },
});

console.log("Webhook ID:", webhook.id);
```

**Webhook payload** (sent to your URL on activity):
```json
{
  "webhookId": "uuid",
  "eventType": "address_activity",
  "chainId": "43114",
  "event": {
    "transaction": {
      "txHash": "0x...",
      "blockNumber": "50000000",
      "from": "0x...",
      "to": "0xYOUR_CONTRACT",
      "logs": [
        {
          "address": "0xYOUR_CONTRACT",
          "topics": ["0xddf252ad...", "0x...from", "0x...to"],
          "data": "0x...value"
        }
      ]
    }
  }
}
```

**Express.js webhook handler:**
```typescript
import express from "express";
import crypto from "crypto";

const app = express();
app.use(express.raw({ type: "application/json" }));

app.post("/webhook", (req, res) => {
  // Verify signature
  const signature = req.headers["x-avacloud-signature"] as string;
  const expectedSig = crypto
    .createHmac("sha256", process.env.WEBHOOK_SECRET!)
    .update(req.body)
    .digest("hex");

  if (signature !== `sha256=${expectedSig}`) {
    return res.status(401).json({ error: "Invalid signature" });
  }

  const payload = JSON.parse(req.body.toString());
  console.log("Received event:", payload.eventType);
  
  // Process the event
  if (payload.eventType === "address_activity") {
    const tx = payload.event.transaction;
    console.log("Transaction:", tx.txHash);
  }

  res.status(200).json({ received: true });
});
```

### Step 5 — Managed RPC Endpoints

AvaCloud provides dedicated RPC endpoints with higher rate limits:

From dashboard → Infrastructure → Managed RPCs:
```
Mainnet: https://api.avax.network/ext/bc/C/rpc?api_key=YOUR_KEY
Fuji:    https://api.avax-test.network/ext/bc/C/rpc?api_key=YOUR_KEY
```

Use in Hardhat:
```typescript
fuji: {
  url: `https://api.avax-test.network/ext/bc/C/rpc?api_key=${process.env.AVACLOUD_API_KEY}`,
  chainId: 43113,
}
```

### Step 6 — Supported Chain IDs for API

| Network | Chain ID (API) |
|---|---|
| Avalanche C-Chain Mainnet | 43114 |
| Avalanche Fuji Testnet | 43113 |
| Subnets | Their EVM chain ID |

## Key concepts

**Glacier API** — AvaCloud's indexed data layer. Queries historical blocks/txs without running an archive node.

**Webhook vs polling** — Webhooks push events to your server when they happen (no RPC polling). Better for production event handling.

**pageToken pagination** — Glacier API uses cursor-based pagination. Always handle `pageToken` in responses for complete data retrieval.

**AvaCloud SDK** — Official TypeScript SDK with async iterators for paginated results. Use `for await...of` to iterate all pages.

## Common errors

| Error | Cause | Fix |
|---|---|---|
| `401 Unauthorized` | Invalid or missing API key | Check x-glacier-api-key header matches dashboard key |
| `404 Not Found` for chain | Wrong chainId in URL | Use numeric chain IDs (43114 for mainnet) |
| Webhook not triggering | Wrong address or event filter | Verify address is checksummed; event signature exact |
| Rate limit exceeded | Too many requests on free tier | Upgrade plan or add delays between requests |

## Next skills

- `avalanche-rpc` — raw RPC for real-time data (vs. Glacier's indexed historical)
- `bridging` — cross-chain data that AvaCloud can index
