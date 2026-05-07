---
name: "event-driven-backend"
version: "1.0.0"
spec: "agentskills@1.0"
license: "Apache-2.0"
tier: 3
description: "Build off-chain backends that react to Avalanche on-chain events — WebSocket subscriptions, event indexing, webhooks, real-time notifications, and event-driven architecture patterns."
trigger: |
  Use when: user wants to listen to contract events, build a backend that reacts to on-chain activity, set up WebSocket subscriptions, index events from Avalanche, send webhooks on-chain events, or build real-time notification systems.
last_updated: "2026-05-07"
avalanche_networks: [c-chain, fuji, custom-l1]
related_skills:
  - avalanche-rpc
  - avacloud-indexing
  - indexing-subgraph
  - evm-hardhat
---

## Overview

On-chain events are the backbone of reactive backends. Avalanche C-Chain's 2s block time means you get near-real-time event delivery. Build backends that:
- Listen via WebSocket for instant notification
- Index past events for analytics
- Trigger webhooks for downstream systems
- Send notifications to users

## When to fetch

Fetch when someone wants to react to on-chain events, build an event listener, index contract events, send webhooks, or build notification systems on Avalanche.

## Pattern 1 — WebSocket Subscription (Real-Time)

```typescript
// src/listener.ts
import { createPublicClient, webSocket, parseAbiItem } from "viem";
import { avalanche } from "viem/chains";

const client = createPublicClient({
  chain: avalanche,
  transport: webSocket("wss://api.avax.network/ext/bc/C/ws")
});

const CONTRACT_ADDRESS = "0xYOUR_CONTRACT_ADDRESS";

// Subscribe to Transfer events
const unwatch = client.watchContractEvent({
  address: CONTRACT_ADDRESS,
  abi: [{
    type: "event",
    name: "Transfer",
    inputs: [
      { name: "from", type: "address", indexed: true },
      { name: "to", type: "address", indexed: true },
      { name: "value", type: "uint256", indexed: false }
    ]
  }],
  eventName: "Transfer",
  onLogs: async (logs) => {
    for (const log of logs) {
      console.log("Transfer:", {
        from: log.args.from,
        to: log.args.to,
        value: log.args.value?.toString()
      });
      await handleTransfer(log);
    }
  },
  onError: (error) => {
    console.error("Event error:", error);
    // Reconnect logic here
  }
});

async function handleTransfer(log: any) {
  // Your business logic: update DB, send notification, trigger webhook
}

// Cleanup
process.on("SIGINT", () => {
  unwatch();
  process.exit(0);
});
```

**WebSocket endpoints:**
- Mainnet: `wss://api.avax.network/ext/bc/C/ws`
- Fuji: `wss://api.avax-test.network/ext/bc/C/ws`
- Custom L1: `wss://api.avax.network/ext/bc/{CHAIN_ID}/ws`

## Pattern 2 — Polling (HTTP, No WebSocket)

Use polling when WebSocket connections are unreliable (serverless, edge functions):

```typescript
import { createPublicClient, http, parseAbiItem } from "viem";
import { avalanche } from "viem/chains";

const client = createPublicClient({
  chain: avalanche,
  transport: http("https://api.avax.network/ext/bc/C/rpc")
});

let lastBlock = await client.getBlockNumber() - 1n;

async function pollEvents() {
  const currentBlock = await client.getBlockNumber();
  if (currentBlock <= lastBlock) return;

  const logs = await client.getLogs({
    address: "0xYOUR_CONTRACT",
    event: parseAbiItem("event Transfer(address indexed from, address indexed to, uint256 value)"),
    fromBlock: lastBlock + 1n,
    toBlock: currentBlock
  });

  for (const log of logs) {
    await processLog(log);
  }

  lastBlock = currentBlock;
}

// Poll every 3 seconds (Avalanche 2s block time)
setInterval(pollEvents, 3000);
```

## Pattern 3 — Ethers.js Provider (Backend)

```typescript
import { ethers } from "ethers";

const WS_URL = "wss://api.avax.network/ext/bc/C/ws";
const provider = new ethers.WebSocketProvider(WS_URL);

const ABI = [
  "event Transfer(address indexed from, address indexed to, uint256 value)",
  "event Approval(address indexed owner, address indexed spender, uint256 value)"
];

const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, provider);

// Listen to Transfer events
contract.on("Transfer", (from, to, value, event) => {
  console.log(`Transfer: ${from} → ${to}, ${ethers.formatEther(value)} tokens`);
  console.log("Block:", event.log.blockNumber);
});

// Listen to all events from the contract
provider.on({ address: CONTRACT_ADDRESS }, (log) => {
  const parsed = contract.interface.parseLog(log);
  console.log("Event:", parsed?.name, parsed?.args);
});

// Reconnection handling (WebSocket can drop)
provider.websocket.on("close", () => {
  console.log("WS closed, reconnecting...");
  setTimeout(reconnect, 5000);
});
```

## Pattern 4 — Historical Event Indexing

```typescript
// scripts/index-past-events.ts
import { createPublicClient, http } from "viem";
import { avalanche } from "viem/chains";

const client = createPublicClient({
  chain: avalanche,
  transport: http("https://api.avax.network/ext/bc/C/rpc")
});

async function indexHistoricalEvents(
  contractAddress: `0x${string}`,
  fromBlock: bigint,
  toBlock: bigint
) {
  const CHUNK_SIZE = 2000n; // Avalanche allows larger ranges than Ethereum
  const results = [];

  for (let from = fromBlock; from < toBlock; from += CHUNK_SIZE) {
    const to = from + CHUNK_SIZE > toBlock ? toBlock : from + CHUNK_SIZE;
    
    const logs = await client.getLogs({
      address: contractAddress,
      fromBlock: from,
      toBlock: to
    });
    
    results.push(...logs);
    console.log(`Indexed blocks ${from}-${to}: ${logs.length} events`);
  }

  return results;
}

// Usage
const currentBlock = await client.getBlockNumber();
const deployBlock = 35000000n; // Block when contract was deployed
const events = await indexHistoricalEvents(
  "0xYOUR_CONTRACT",
  deployBlock,
  currentBlock
);
console.log(`Total events: ${events.length}`);
```

## Pattern 5 — Webhook Dispatch

```typescript
// src/webhook-dispatcher.ts
import axios from "axios";

interface EventPayload {
  event: string;
  contractAddress: string;
  blockNumber: number;
  txHash: string;
  args: Record<string, any>;
  timestamp: number;
}

class WebhookDispatcher {
  private webhookUrls: string[];

  constructor(urls: string[]) {
    this.webhookUrls = urls;
  }

  async dispatch(payload: EventPayload) {
    const results = await Promise.allSettled(
      this.webhookUrls.map(url =>
        axios.post(url, payload, {
          timeout: 5000,
          headers: {
            "Content-Type": "application/json",
            "X-Webhook-Source": "avalanche-event-listener"
          }
        })
      )
    );

    results.forEach((result, i) => {
      if (result.status === "rejected") {
        console.error(`Webhook ${this.webhookUrls[i]} failed:`, result.reason);
      }
    });
  }
}

// Example: dispatch on Transfer event
const dispatcher = new WebhookDispatcher([
  process.env.WEBHOOK_URL_1!,
  process.env.WEBHOOK_URL_2!
]);

contract.on("Transfer", async (from, to, value, event) => {
  await dispatcher.dispatch({
    event: "Transfer",
    contractAddress: CONTRACT_ADDRESS,
    blockNumber: event.log.blockNumber,
    txHash: event.log.transactionHash,
    args: { from, to, value: value.toString() },
    timestamp: Date.now()
  });
});
```

## Pattern 6 — Postgres Event Store

```typescript
// src/event-store.ts — store events in PostgreSQL
import { Pool } from "pg";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Create events table
await pool.query(`
  CREATE TABLE IF NOT EXISTS contract_events (
    id SERIAL PRIMARY KEY,
    event_name VARCHAR(100) NOT NULL,
    contract_address VARCHAR(42) NOT NULL,
    block_number BIGINT NOT NULL,
    tx_hash VARCHAR(66) NOT NULL,
    log_index INTEGER NOT NULL,
    args JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(tx_hash, log_index)
  );
  CREATE INDEX IF NOT EXISTS idx_event_name ON contract_events(event_name);
  CREATE INDEX IF NOT EXISTS idx_contract ON contract_events(contract_address);
  CREATE INDEX IF NOT EXISTS idx_block ON contract_events(block_number);
`);

async function storeEvent(log: any, parsedArgs: Record<string, string>) {
  await pool.query(
    `INSERT INTO contract_events
     (event_name, contract_address, block_number, tx_hash, log_index, args)
     VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT (tx_hash, log_index) DO NOTHING`,
    [
      log.eventName,
      log.address,
      log.blockNumber,
      log.transactionHash,
      log.logIndex,
      JSON.stringify(parsedArgs)
    ]
  );
}
```

## Checkpoint / Resume Pattern

Essential for production — don't re-index from block 0 on restart:

```typescript
// src/checkpoint.ts
import * as fs from "fs";

const CHECKPOINT_FILE = ".checkpoint";

function loadCheckpoint(): bigint {
  if (fs.existsSync(CHECKPOINT_FILE)) {
    const block = parseInt(fs.readFileSync(CHECKPOINT_FILE, "utf-8").trim());
    return BigInt(block);
  }
  return 0n; // Start from beginning
}

function saveCheckpoint(block: bigint) {
  fs.writeFileSync(CHECKPOINT_FILE, block.toString());
}

// On startup
let lastProcessedBlock = loadCheckpoint();

// After processing each batch
saveCheckpoint(currentBlock);
```

## Reliability Patterns

```typescript
// Reconnect on WebSocket drop
function createReconnectingClient() {
  let unwatch: (() => void) | null = null;

  function connect() {
    const client = createPublicClient({
      chain: avalanche,
      transport: webSocket("wss://api.avax.network/ext/bc/C/ws")
    });

    unwatch = client.watchContractEvent({
      // ... event config
      onError: (error) => {
        console.error("Connection error, reconnecting in 5s:", error);
        unwatch?.();
        setTimeout(connect, 5000);
      }
    });
  }

  connect();
}
```

## Core Workflow

1. Choose pattern: WebSocket (real-time) vs. polling (simple HTTP) vs. ethers.js provider (Node.js backend)
2. Set up provider with reconnect logic and exponential backoff
3. Subscribe to events with `eth_getLogs` or `eth_subscribe`
4. Decode raw logs using ABI with `decodeEventLog` (viem) or `parseLog` (ethers)
5. Write decoded events to database (Postgres) with idempotency key
6. Implement checkpoint/resume to survive restarts without reprocessing

## Key concepts

| Concept | Description |
|---|---|
| `eth_subscribe` | WebSocket-based real-time event subscription |
| `eth_getLogs` | HTTP polling to fetch historical/recent event logs |
| `topics[0]` | Keccak-256 hash of event signature — used to filter log types |
| `decodeEventLog` | viem utility to decode raw log data using an ABI |
| Idempotency key | Deduplication key (txHash + logIndex) preventing double-processing |
| Checkpoint | Saved block number allowing resume after a crash |
| Exponential backoff | Retry delay that grows on each failure to prevent flooding RPC |

## Common errors

| Error | Cause | Fix |
|---|---|---|
| Events missed on reconnect | Not replaying from last checkpoint | Save `lastBlock` to DB; replay on startup |
| Duplicate events processed | No idempotency check | Use `ON CONFLICT DO NOTHING` with `tx_hash + log_index` |
| WebSocket disconnects silently | Provider timeout | Listen to `provider.on('disconnect')` and reconnect |
| `eth_getLogs` range too large | Node returns error for large ranges | Paginate: max 2000 blocks per call on public RPCs |

## Next skills

- `avacloud-indexing` — AvaCloud Glacier API for indexed event queries
- `indexing-subgraph` — The Graph subgraphs for queryable event data
- `avalanche-rpc` — RPC endpoints, rate limits, and providers
