---
name: "explorer-guide"
version: "1.0.0"
spec: "agentskills@1.0"
license: "Apache-2.0"
tier: 0
description: "Read and navigate Snowtrace (C-Chain), P-Chain explorer, and X-Chain explorer on Avalanche."
trigger: |
  Use when: user needs to read blockchain data on Snowtrace, understand transaction details, look up contract state, read events/logs, or navigate Avalanche block explorers.
  Do NOT use for: programmatic data queries (use avalanche-rpc or avalanche-js), writing transactions.
last_updated: "2026-05-01"
avalanche_networks: [fuji, mainnet]
related_skills:
  - avalanche-rpc
  - first-contract
  - concepts
---

## Overview

Avalanche has multiple explorers for its different chains. Snowtrace covers C-Chain (EVM), while separate explorers handle P-Chain (staking/validators) and X-Chain (native AVAX transfers). Blocks on Avalanche finalize in ~1-2 seconds — dramatically faster than Ethereum's ~12 seconds.

## When to fetch

Fetch when a user is trying to understand transaction data, verify a deployment, decode event logs, or find contract information on Snowtrace.

## Core Workflow

### C-Chain — Snowtrace

**Mainnet:** https://subnets.avax.network/c-chain
**Fuji Testnet:** https://subnets-test.avax.network/c-chain

**Search by:** address, transaction hash, block number, token name.

**Reading a Transaction:**

Navigate to any transaction hash. Key fields:

| Field | Meaning |
|---|---|
| Status | Success (green) or Failed (red). Failed txs still cost gas. |
| Block | Block number. Click to see all txs in that block. |
| Timestamp | When finalized. Avalanche: ~1-2s after broadcast. |
| From / To | Sender and recipient addresses. |
| Value | AVAX transferred (not counting tokens). |
| Transaction Fee | Gas used × gas price = fee in AVAX. |
| Gas Price | In Gwei/nAVAX. C-Chain uses EIP-1559 dynamic fees. |
| Gas Limit | Max gas allowed. Actual used shown separately. |
| Gas Used By Txn | Actual gas consumed. Refund = (limit - used) × price. |
| Input Data | Raw calldata. If contract is verified, decoded to function + args. |

**Reading a Contract:**

On a contract address page:
- **Contract tab** → source code if verified, bytecode if not
- **Read Contract** → call view functions without spending gas
- **Write Contract** → connect wallet and execute state-changing functions
- **Events tab** → all emitted events with decoded params (if ABI known)
- **Internal Txns** → subcalls between contracts in a transaction

**Reading Events/Logs:**

Click a transaction → "Logs" tab:
```
Address: 0x... (contract that emitted)
Name: Transfer (if contract is verified and ABI known)
Topics[0]: 0xddf252... (keccak256 of event signature)
Topics[1]: 0x000...address (indexed param 1 = from)
Topics[2]: 0x000...address (indexed param 2 = to)
Data: 0x000...value (non-indexed params)
```

**Token Transfers tab** → all ERC-20/721/1155 transfers in one transaction.

### P-Chain Explorer

**URL:** https://subnets.avax.network/p-chain

Shows:
- Validator set (current validators, stake amounts, end times)
- Subnet registry (all Subnets and their blockchain IDs)
- P-Chain transactions (AddValidator, AddSubnetValidator, CreateChain)

**Find a Subnet:**
https://subnets.avax.network/subnets → search by Subnet ID

**Find validators for a Subnet:**
https://subnets.avax.network/subnets/{SUBNET_ID}/validators

### X-Chain Explorer

**URL:** https://subnets.avax.network/x-chain

Shows AVAX native transfers on the X-Chain. Less commonly needed for developers (most development is C-Chain).

### AvaCloud Explorer (Routescan)

**URL:** https://routescan.io for broader ecosystem

**Fuji:** https://subnets-test.avax.network/c-chain (same as Snowtrace, powered by Routescan)

### Block Time and Finality

| Chain | Block Time | Finality |
|---|---|---|
| C-Chain | ~2 seconds | ~1-2 seconds (instant after block) |
| Ethereum (comparison) | ~12 seconds | ~12-15 minutes (for full economic finality) |

Avalanche uses a DAG-based consensus — transactions are finalized in the block they're included in. No "wait for 12 confirmations" needed.

### API Access via Snowtrace

For programmatic access, Snowtrace provides an Etherscan-compatible API:

```bash
# Get contract ABI (verified contracts only)
curl "https://api.snowtrace.io/api?module=contract&action=getabi&address=0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7&apikey=YOUR_API_KEY"

# Get transactions for an address
curl "https://api.snowtrace.io/api?module=account&action=txlist&address=0xYOUR_ADDRESS&startblock=0&endblock=99999999&sort=desc&apikey=YOUR_API_KEY"

# Fuji API
curl "https://api-testnet.snowtrace.io/api?module=account&action=txlist&address=0xYOUR_ADDRESS&apikey=YOUR_API_KEY"
```

Get a free API key at https://subnets.avax.network/c-chain/myapikey.

## Key concepts

**Transaction hash** — Unique identifier for a transaction. 66 characters starting with 0x. Use this to look up any transaction on Snowtrace.

**Block explorer ABI** — If a contract is verified, Snowtrace stores the ABI and can decode all function calls and events. Unverified = raw hex only.

**Internal transactions** — When a smart contract calls another contract, those sub-calls appear in Internal Txns, not the main Transactions list.

**Gas refund** — If you set a high gas limit but only use part of it, the unused gas is refunded. You only pay for gas actually consumed.

**Finality on Avalanche** — Unlike Ethereum's probabilistic finality, Avalanche achieves irreversible finality in ~1-2 seconds. One confirmation is enough.

## Common errors

| Error | Cause | Fix |
|---|---|---|
| "Contract Source Code Not Verified" | Contract wasn't verified | Verify via Hardhat or Foundry (see contract-verification skill) |
| Transaction shows as "Failed" | Revert or out-of-gas | Click on tx to see exact revert reason in logs |
| Can't find transaction | Looking on wrong network | Check if you're on mainnet vs testnet Snowtrace |
| Wrong address on explorer | Checksummed vs lowercase | Snowtrace accepts both; paste full address without changes |
| Events not decoded | Contract not verified | Verify contract first; events are raw hex without ABI |

## Next skills

- `contract-verification` — get your contract source visible on Snowtrace
- `avalanche-rpc` — programmatic access to the same data
- `first-contract` — deploy a contract and see it on Snowtrace
