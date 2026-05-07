---
name: "avalanche-rpc"
version: "1.0.0"
spec: "agentskills@1.0"
license: "Apache-2.0"
tier: 1
description: "Interact with Avalanche C/P/X-Chain via RPC — read balances, blocks, transactions, and Avalanche-specific methods."
trigger: |
  Use when: user wants to make raw RPC calls to Avalanche, use curl or fetch to query chain state, understand the difference between C/P/X chain APIs, or troubleshoot RPC errors.
  Do NOT use for: viem/ethers.js SDK usage (use viem/wagmi skills), Avalanche CLI commands.
last_updated: "2026-05-01"
avalanche_networks: [fuji, mainnet]
related_skills:
  - viem
  - avalanche-js
  - contract-addresses
---

## Overview

Avalanche exposes three different RPC APIs for its three chains. C-Chain uses standard Ethereum JSON-RPC (eth_* methods). P-Chain and X-Chain have Avalanche-specific APIs (platform_* and avm_*). This skill covers the key methods for each chain with real curl examples.

## When to fetch

Fetch when a user needs to make raw HTTP requests to Avalanche, script chain interactions without an SDK, or understand the underlying API structure.

## Core Workflow

### C-Chain RPC — Standard Ethereum Methods

**Base URLs:**
- Mainnet: `https://api.avax.network/ext/bc/C/rpc`
- Fuji: `https://api.avax-test.network/ext/bc/C/rpc`

**Get balance:**
```bash
curl -X POST https://api.avax-test.network/ext/bc/C/rpc \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "eth_getBalance",
    "params": ["0x8db97C7cEcE249c2b98bDC0226Cc4C2A57BF52FC", "latest"]
  }'
# Returns hex wei: "0x295BE96E64066972000000" = 1000000 AVAX
```

**Get current block number:**
```bash
curl -X POST https://api.avax.network/ext/bc/C/rpc \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"eth_blockNumber","params":[]}'
```

**Get transaction:**
```bash
curl -X POST https://api.avax.network/ext/bc/C/rpc \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc":"2.0","id":1,
    "method":"eth_getTransactionByHash",
    "params":["0xTX_HASH"]
  }'
```

**Get transaction receipt (includes logs):**
```bash
curl -X POST https://api.avax.network/ext/bc/C/rpc \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc":"2.0","id":1,
    "method":"eth_getTransactionReceipt",
    "params":["0xTX_HASH"]
  }'
```

**Call a contract function (read-only):**
```bash
# Read WAVAX name() function
curl -X POST https://api.avax.network/ext/bc/C/rpc \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc":"2.0","id":1,
    "method":"eth_call",
    "params":[{
      "to": "0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7",
      "data": "0x06fdde03"
    }, "latest"]
  }'
# 0x06fdde03 = keccak256("name()") first 4 bytes
```

**Get gas price:**
```bash
curl -X POST https://api.avax.network/ext/bc/C/rpc \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"eth_gasPrice","params":[]}'
# Returns current gas price in hex wei (typically ~25 Gwei = 0x5D21DBA00)
```

**Get EIP-1559 fee data:**
```bash
curl -X POST https://api.avax.network/ext/bc/C/rpc \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"eth_feeHistory","params":[5,"latest",[25,75]]}'
```

**Get logs (events):**
```bash
curl -X POST https://api.avax.network/ext/bc/C/rpc \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc":"2.0","id":1,
    "method":"eth_getLogs",
    "params":[{
      "address": "0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7",
      "topics": ["0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef"],
      "fromBlock": "0x1000000",
      "toBlock": "latest"
    }]
  }'
# topics[0] = Transfer(address,address,uint256) event signature
```

**Send raw transaction:**
```bash
curl -X POST https://api.avax-test.network/ext/bc/C/rpc \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc":"2.0","id":1,
    "method":"eth_sendRawTransaction",
    "params":["0xSIGNED_HEX_TX"]
  }'
```

### Avalanche-Specific C-Chain Methods

**Get atomic TX (cross-chain):**
```bash
curl -X POST https://api.avax.network/ext/bc/C/avax \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc":"2.0","id":1,
    "method":"avax.getAtomicTx",
    "params":{"txID": "ATOMIC_TX_ID"}
  }'
```

**Get AVAX balance on C-Chain (different endpoint):**
```bash
curl -X POST https://api.avax.network/ext/bc/C/avax \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc":"2.0","id":1,
    "method":"avax.getBalance",
    "params":{"address": "C-avax1...", "assetID": "FvwEAhmxKfeiG8SnEvq42hc6A3fnDcvZ45RwNwXkdaqAgdPAS"}
  }'
```

### P-Chain API — Validator and Subnet Management

**Base URL:** `https://api.avax.network/ext/bc/P` (mainnet) or `https://api.avax-test.network/ext/bc/P` (Fuji)

**Get current validators:**
```bash
curl -X POST https://api.avax.network/ext/bc/P \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc":"2.0","id":1,
    "method":"platform.getCurrentValidators",
    "params":{}
  }'
# Returns all C-Chain/Primary Network validators
```

**Get validators for a specific Subnet:**
```bash
curl -X POST https://api.avax.network/ext/bc/P \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc":"2.0","id":1,
    "method":"platform.getCurrentValidators",
    "params":{"subnetID": "YOUR_SUBNET_ID"}
  }'
```

**Get all Subnets:**
```bash
curl -X POST https://api.avax.network/ext/bc/P \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"platform.getSubnets","params":{}}'
```

**Get blockchain ID by alias:**
```bash
curl -X POST https://api.avax.network/ext/info \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc":"2.0","id":1,
    "method":"info.getBlockchainID",
    "params":{"alias": "C"}
  }'
# Returns: C-Chain blockchain ID as CB58 string
```

**Get P-Chain balance:**
```bash
curl -X POST https://api.avax.network/ext/bc/P \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc":"2.0","id":1,
    "method":"platform.getBalance",
    "params":{"address": "P-avax1..."}
  }'
```

### X-Chain API — Native AVAX Transfers

**Base URL:** `https://api.avax.network/ext/bc/X`

**Get X-Chain balance:**
```bash
curl -X POST https://api.avax.network/ext/bc/X \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc":"2.0","id":1,
    "method":"avm.getBalance",
    "params":{
      "address": "X-avax1...",
      "assetID": "FvwEAhmxKfeiG8SnEvq42hc6A3fnDcvZ45RwNwXkdaqAgdPAS"
    }
  }'
# FvwEAh... is the AVAX asset ID on mainnet
```

### Info API

**Get node version and network:**
```bash
curl -X POST https://api.avax.network/ext/info \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"info.getNetworkName","params":{}}'
```

**Get node ID (needed for validators):**
```bash
# Only works on your own node, not public RPC
curl -X POST http://localhost:9650/ext/info \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"info.getNodeID","params":{}}'
```

### Rate Limits and Alternative RPCs

**Public RPCs (free, rate-limited):**
| Provider | Mainnet | Fuji |
|---|---|---|
| Ava Labs | https://api.avax.network/ext/bc/C/rpc | https://api.avax-test.network/ext/bc/C/rpc |
| PublicNode | https://avalanche-c-chain-rpc.publicnode.com | — |
| Ankr | https://rpc.ankr.com/avalanche | https://rpc.ankr.com/avalanche_fuji |
| Blast API | https://ava-mainnet.public.blastapi.io/ext/bc/C/rpc | — |

**Rate limits on public RPCs:** ~40-100 req/s. For production, use AvaCloud or Infura.

**AvaCloud managed RPC:** https://avacloud.io — dedicated endpoints, higher limits, monitoring.

## Network config

| Chain | Mainnet URL | Fuji URL |
|---|---|---|
| C-Chain EVM | https://api.avax.network/ext/bc/C/rpc | https://api.avax-test.network/ext/bc/C/rpc |
| C-Chain Avax | https://api.avax.network/ext/bc/C/avax | https://api.avax-test.network/ext/bc/C/avax |
| P-Chain | https://api.avax.network/ext/bc/P | https://api.avax-test.network/ext/bc/P |
| X-Chain | https://api.avax.network/ext/bc/X | https://api.avax-test.network/ext/bc/X |
| Info | https://api.avax.network/ext/info | https://api.avax-test.network/ext/info |

## Key concepts

**JSON-RPC 2.0** — All Avalanche APIs use JSON-RPC 2.0 format. Every request has `jsonrpc`, `id`, `method`, `params`. Response has `result` or `error`.

**Hex encoding** — Ethereum methods return numbers as hex strings (0x prefixed). Use `parseInt(hexValue, 16)` or `BigInt(hexValue)` to convert.

**CB58 vs hex addresses** — P-Chain and X-Chain use CB58 addresses (P-avax1..., X-avax1...). C-Chain uses hex addresses (0x...). These are different encodings of the same key.

**Endpoint namespacing** — `/ext/bc/C/rpc` (EVM methods), `/ext/bc/C/avax` (Avalanche-specific C-Chain methods), `/ext/bc/P` (P-Chain), `/ext/bc/X` (X-Chain).

## Common errors

| Error | Cause | Fix |
|---|---|---|
| `Method not found` | Calling P-Chain method on C-Chain RPC | Use correct endpoint for each chain |
| `404 Not Found` | Wrong URL format | Check endpoint path: /ext/bc/C/rpc not /ext/C/rpc |
| Rate limit 429 | Too many requests | Add delays, use private RPC, or distribute across endpoints |
| `Invalid params` | Missing required param | Check method documentation for required fields |
| Hex value looks wrong | Number not converted from hex | Remember all numbers are hex in eth_* responses |

## Next skills

- `viem` — TypeScript SDK that wraps these calls ergonomically
- `avalanche-js` — Official SDK for P-Chain and X-Chain operations
- `contract-addresses` — addresses to use with eth_call
