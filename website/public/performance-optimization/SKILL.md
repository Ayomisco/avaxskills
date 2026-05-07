---
name: "performance-optimization"
version: "1.0.0"
spec: "agentskills@1.0"
license: "Apache-2.0"
tier: 3
description: "Optimize Avalanche applications — sub-second finality patterns, gas optimization, parallel execution, and Subnet scaling."
trigger: |
  Use when: user wants to optimize their Avalanche dApp performance, reduce gas costs, take advantage of fast finality, or decide when to use a Subnet for scaling.
  Do NOT use for: Ethereum optimization (different), non-EVM performance tuning.
last_updated: "2026-05-01"
avalanche_networks: [fuji, mainnet]
related_skills:
  - subnet-deployment
  - gas
  - testing
---

## Overview

Avalanche's performance advantages over Ethereum: 1-2 second finality (vs 12+ minutes), ~4,500 TPS on C-Chain, and near-zero fees enable application patterns impossible on Ethereum. This skill covers how to take advantage of these properties: confirming finality programmatically, gas optimization specific to Avalanche, parallel transaction patterns, and the Subnet scaling decision.

## When to fetch

Fetch when a user needs to optimize an existing Avalanche dApp, implement latency-sensitive features, or decide whether to use a Subnet for scaling.

## Core Workflow

### Sub-Second Finality Patterns

Avalanche achieves irreversible finality in 1-2 seconds. One block confirmation is enough:

```typescript
import { createPublicClient, http } from "viem";
import { avalanche } from "viem/chains";

const client = createPublicClient({
  chain: avalanche,
  transport: http("https://api.avax.network/ext/bc/C/rpc"),
  pollingInterval: 500,  // Poll every 500ms (Avalanche blocks every ~2s)
});

// Wait for ONE confirmation (sufficient for Avalanche finality)
async function waitForFinality(txHash: `0x${string}`) {
  const start = Date.now();

  const receipt = await client.waitForTransactionReceipt({
    hash: txHash,
    confirmations: 1,  // 1 block = final on Avalanche (not probabilistic)
    timeout: 10_000,   // 10 second max wait
  });

  const elapsed = Date.now() - start;
  console.log(`Finalized in ${elapsed}ms. Status: ${receipt.status}`);
  return receipt;
}

// Check finality status directly
async function isFinal(txHash: `0x${string}`): Promise<boolean> {
  const receipt = await client.getTransactionReceipt({ hash: txHash });
  return receipt !== null && receipt.blockNumber !== null;
}
```

**Event-driven patterns (faster than polling):**
```typescript
// Subscribe to new blocks — only works with WebSocket transport
import { createPublicClient, webSocket } from "viem";

const wsClient = createPublicClient({
  chain: avalanche,
  transport: webSocket("wss://api.avax.network/ext/bc/C/ws"),
});

// Watch for specific transaction confirmation
const unwatch = wsClient.watchBlocks({
  onBlock: async (block) => {
    // New block = new finalized transactions
    console.log("New block:", block.number.toString(), "at", new Date(Number(block.timestamp) * 1000).toISOString());
    // Check if your tx is in this block
    unwatch();
  },
});
```

### Gas Optimization for Avalanche C-Chain

**Key difference from Ethereum:** C-Chain gas limit per block is 8M (vs Ethereum's ~30M). Transactions are cheaper per-unit but blocks fill faster under load. Optimize for gas units, not just price.

**Batch operations using multicall:**
```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract Multicall {
    struct Call {
        address target;
        bytes callData;
    }

    function aggregate(Call[] memory calls) public view returns (bytes[] memory returnData) {
        returnData = new bytes[](calls.length);
        for (uint256 i = 0; i < calls.length; i++) {
            (bool success, bytes memory ret) = calls[i].target.staticcall(calls[i].callData);
            require(success, "Call failed");
            returnData[i] = ret;
        }
    }
}
```

**Storage packing example:**
```solidity
// Unoptimized: 3 storage slots = 3 × 22,100 gas for new writes
contract Unoptimized {
    uint256 public price;    // slot 0: 32 bytes
    address public owner;    // slot 1: 20 bytes (12 wasted)
    bool public active;      // slot 2: 1 byte (31 wasted)
}

// Optimized: 2 storage slots = 2 × 22,100 gas
contract Optimized {
    uint256 public price;    // slot 0: 32 bytes
    address public owner;    // slot 1: 20 bytes
    bool public active;      // slot 1: 1 byte (packed with owner!)
}
// Gas saved: 22,100 gas (one fewer SSTORE)
// On Avalanche at 25 nAVAX/gas: 0.0005525 AVAX ≈ $0.01 savings per write
```

**Use `immutable` for constructor-set values:**
```solidity
// Reads from immutable are free (compile-time constant in bytecode)
contract WithImmutable {
    address public immutable owner;        // Free to read
    uint256 public immutable deployedAt;   // Free to read

    constructor() {
        owner = msg.sender;
        deployedAt = block.timestamp;
    }
}
```

**Avoid on-chain computation — precompute off-chain:**
```solidity
// BAD: compute Merkle proof on-chain
function verifyOnChain(bytes32[] memory proof) public view returns (bool) {
    bytes32 root = computeRoot(proof);  // Expensive!
    return root == merkleRoot;
}

// GOOD: verify Merkle proof on-chain (pre-computed off-chain)
function verifyProof(bytes32[] calldata proof, bytes32 leaf) public view returns (bool) {
    bytes32 computedHash = leaf;
    for (uint256 i = 0; i < proof.length; i++) {
        bytes32 proofElement = proof[i];
        if (computedHash <= proofElement) {
            computedHash = keccak256(abi.encodePacked(computedHash, proofElement));
        } else {
            computedHash = keccak256(abi.encodePacked(proofElement, computedHash));
        }
    }
    return computedHash == merkleRoot;  // O(log n), not O(n)
}
```

### Parallel Transaction Patterns

Since Avalanche has low fees and fast finality, you can send multiple transactions in parallel:

```typescript
import { createWalletClient, http, parseEther } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { avalanche } from "viem/chains";

async function sendParallelTransactions(
  privateKey: `0x${string}`,
  recipients: `0x${string}`[],
  amounts: bigint[]
) {
  const account = privateKeyToAccount(privateKey);
  const client = createWalletClient({
    account,
    chain: avalanche,
    transport: http("https://api.avax.network/ext/bc/C/rpc"),
  });

  // Get current nonce
  const publicClient = createPublicClient({ chain: avalanche, transport: http() });
  let nonce = await publicClient.getTransactionCount({ address: account.address });

  // Send all transactions in parallel with sequential nonces
  const hashes = await Promise.all(
    recipients.map((to, i) =>
      client.sendTransaction({
        to,
        value: amounts[i],
        nonce: nonce + i,  // Pre-assign nonces
      })
    )
  );

  console.log(`Sent ${hashes.length} transactions in parallel`);

  // Wait for all to finalize (~2 seconds for all)
  const receipts = await Promise.all(
    hashes.map((hash) => publicClient.waitForTransactionReceipt({ hash, confirmations: 1 }))
  );

  return receipts;
}
```

### When to Use a Subnet for Scaling

**Use C-Chain when:**
- Transaction volume < 1,000 TPS sustained
- You want access to existing DeFi liquidity (Trader Joe, Aave, BENQI)
- You're prototyping or early-stage
- You need to be on the same chain as your users/tokens

**Use a Subnet when:**
- Custom gas token required (your own token for gas, not AVAX)
- Regulatory compliance requires permissioned deployment/transactions
- Transaction volume > 4,500 TPS (C-Chain limit)
- Need custom precompiles (native minting, allowlisting)
- Want complete fee customization (gasless, high-frequency trading)
- Data sovereignty requirements

**Subnet performance characteristics:**
- Each Subnet has its OWN dedicated block space
- Custom gasLimit up to 30M+ per block
- Target block rate can be 1-2 seconds (or even 500ms for specialized use)
- Validator set can be optimized for your workload (high-memory, low-latency nodes)

**Example: High-frequency trading Subnet config:**
```json
"feeConfig": {
  "gasLimit": 30000000,      // 30M — 3x C-Chain
  "targetBlockRate": 1,      // 1-second blocks
  "minBaseFee": 0,           // Zero fees for market makers
  "targetGas": 37500000,
  "baseFeeChangeDenominator": 100,
  "minBlockGasCost": 0,
  "maxBlockGasCost": 0,
  "blockGasCostStep": 0
}
```

### Benchmarking

```typescript
// Measure actual transaction latency on Avalanche
async function measureLatency(client: any, numTx: number = 10) {
  const latencies: number[] = [];

  for (let i = 0; i < numTx; i++) {
    const start = Date.now();
    const hash = await client.sendTransaction({
      to: client.account.address,  // Self-transfer
      value: 0n,
    });
    await client.waitForTransactionReceipt({ hash, confirmations: 1 });
    latencies.push(Date.now() - start);
    await new Promise(r => setTimeout(r, 100));  // Small delay between txs
  }

  const avg = latencies.reduce((a, b) => a + b) / latencies.length;
  const min = Math.min(...latencies);
  const max = Math.max(...latencies);
  console.log(`Latency: avg=${avg}ms, min=${min}ms, max=${max}ms`);
}
```

**Typical Avalanche C-Chain benchmarks:**
- Simple ETH transfer: ~1.5-2s from broadcast to finality
- ERC-20 transfer: ~1.5-2s
- Complex DeFi swap: ~2-3s (same 1-block finality, slightly more processing)
- Throughput: ~4,500 simple transfers per second on C-Chain

## Key concepts

**Avalanche finality** — Transactions are irreversibly final after 1 block confirmation (~1-2 seconds). Unlike Ethereum's probabilistic finality where you wait 12-15 minutes for safety, one Avalanche confirmation is cryptographically final.

**Block gas limit** — C-Chain has 8M gas per block. At 2-second blocks = 4M gas/second throughput. Custom Subnets can have 30M+ gas per block.

**SLOAD warm vs cold** — First SLOAD in a transaction costs 2,100 gas (cold). Subsequent reads of same slot cost 100 gas (warm). EIP-2929 applies on Avalanche.

**calldata compression** — Zero bytes cost 4 gas, non-zero bytes cost 16 gas. Use efficient encodings for calldata-heavy operations.

**WebSocket vs HTTP** — HTTP polling adds latency. For real-time finality detection, use WebSocket subscriptions (if your RPC supports it).

## Common errors

| Error | Cause | Fix |
|---|---|---|
| Tx appears stuck | Node not broadcasting (nonce gap) | Check pending txs; fill nonce gap with self-transfer |
| Parallel txs fail | Nonce collision | Pre-calculate nonces before parallel send |
| Block explorer shows different finality | Explorer lag | Trust the RPC receipt, not explorer UI speed |
| Gas optimization breaks tests | Packing changes storage layout | Re-run tests after restructuring; check slot assignments |

## Next skills

- `subnet-deployment` — scale by deploying your own Subnet
- `gas` — detailed gas mechanics and fee configuration
- `testing` — performance and load testing your contracts
