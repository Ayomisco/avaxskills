---
name: "gas"
version: "1.0.0"
spec: "agentskills@1.0"
license: "Apache-2.0"
tier: 2
description: "Avalanche fee mechanics — dynamic base fee, priority fee, gas estimation patterns, and fee config on Subnets."
trigger: |
  Use when: user asks about gas fees on Avalanche, why transactions are failing due to gas, how to estimate gas, or how to configure fees on a custom Subnet.
  Do NOT use for: Ethereum mainnet gas (different), token transfer costs (those are gas × price).
last_updated: "2026-05-01"
avalanche_networks: [fuji, mainnet]
related_skills:
  - subnet-evm-config
  - precompiles
  - performance-optimization
---

## Overview

Avalanche C-Chain uses EIP-1559 style dynamic fees. The base fee adjusts based on block utilization, starting around 25 nAVAX (0.000000025 AVAX) per gas unit. Typical transactions cost $0.001-$0.05 — much cheaper than Ethereum. Custom Subnets can configure their own fee structure including fully gasless setups.

## When to fetch

Fetch when users encounter gas errors, need to estimate fees, configure Subnet gas parameters, or understand why their transactions are failing or pending.

## Core Workflow

### Current Gas Price (C-Chain)

```bash
# Get current base fee
curl -X POST https://api.avax.network/ext/bc/C/rpc \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"eth_gasPrice","params":[]}'
# Returns hex: "0x5D21DBA00" = 25,000,000,000 wei = 25 Gwei = 25 nAVAX

# Get EIP-1559 fee history
curl -X POST https://api.avax.network/ext/bc/C/rpc \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"eth_feeHistory","params":[5,"latest",[10,50,90]]}'
```

**Typical C-Chain gas prices:**
| Condition | Base Fee | Priority Fee | Total Gas Price |
|---|---|---|---|
| Normal | 25 nAVAX | 2 nAVAX | 27 nAVAX |
| Busy | 50-100 nAVAX | 5 nAVAX | 55-105 nAVAX |
| Very busy | 200+ nAVAX | 10+ nAVAX | 210+ nAVAX |

**Convert nAVAX to AVAX:** divide by 1,000,000,000 (1e9)

### Estimate Gas for a Transaction

```bash
# Estimate gas for a simple ETH transfer
curl -X POST https://api.avax.network/ext/bc/C/rpc \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc":"2.0","id":1,"method":"eth_estimateGas",
    "params":[{
      "from": "0xYOUR_ADDRESS",
      "to": "0xTARGET_ADDRESS",
      "value": "0xDE0B6B3A7640000"
    }]
  }'
# Returns: "0x5208" = 21000 (standard ETH transfer gas)

# Estimate gas for a contract call
curl -X POST https://api.avax.network/ext/bc/C/rpc \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc":"2.0","id":1,"method":"eth_estimateGas",
    "params":[{
      "from": "0xYOUR_ADDRESS",
      "to": "0xCONTRACT_ADDRESS",
      "data": "0xa9059cbb000000000000000000000000RECIPIENT00000000000000000000000000000000000000000000000000000000000DE0B6B3A7640000"
    }]
  }'
```

**In TypeScript with viem:**
```typescript
import { createPublicClient, http, parseEther } from "viem";
import { avalanche } from "viem/chains";

const client = createPublicClient({
  chain: avalanche,
  transport: http("https://api.avax.network/ext/bc/C/rpc"),
});

// Estimate gas
const gas = await client.estimateGas({
  account: "0xYOUR_ADDRESS" as `0x${string}`,
  to: "0xCONTRACT" as `0x${string}`,
  data: "0x...",
});
console.log("Estimated gas:", gas.toString());

// Get fee data
const fees = await client.estimateFeesPerGas();
console.log("Max fee per gas:", fees.maxFeePerGas, "wei");
console.log("Max priority fee:", fees.maxPriorityFeePerGas, "wei");

// Calculate total cost
const totalCost = gas * (fees.maxFeePerGas ?? 0n);
console.log("Estimated cost:", Number(totalCost) / 1e18, "AVAX");
```

### Gas Optimization Techniques

**Storage optimization (most impactful):**
```solidity
// BAD: multiple small storage slots
uint8 public a;    // slot 0, wastes 248 bits
uint256 public b;  // slot 1
uint8 public c;    // slot 2, wastes 248 bits

// GOOD: pack into fewer slots
uint8 public a;    // slot 0 (packed)
uint8 public c;    // slot 0 (packed with a)
uint240 _padding;  // slot 0 (fill remaining)
uint256 public b;  // slot 1

// Cost: SLOAD = 2,100 gas cold, 100 gas warm
// Pack variables that fit in 32 bytes together
```

**Calldata optimization:**
```solidity
// BAD: using memory for read-only arrays in external functions
function process(uint256[] memory ids) external { ... }

// GOOD: use calldata
function process(uint256[] calldata ids) external { ... }
// Calldata: 4 gas/byte non-zero, 3 gas/byte zero
// Memory: additional copy cost
```

**Events vs storage:**
```solidity
// Storing history in mapping: expensive
mapping(uint256 => address) public transferHistory;

// Better: emit events for off-chain indexing
event Transfer(address indexed from, address indexed to, uint256 amount);
// Events cost ~375 gas + 8 gas per byte (much cheaper than SSTORE)
```

**Unchecked arithmetic:**
```solidity
// Safe when you know overflow is impossible
for (uint256 i = 0; i < arr.length;) {
    // ... process arr[i]
    unchecked { ++i; }  // Saves ~30 gas per iteration
}
```

**Short-circuit checks:**
```solidity
// Put cheaper checks first
require(amount > 0, "Zero amount");  // cheap
require(balanceOf[msg.sender] >= amount, "Insufficient");  // SLOAD, expensive
```

### Configure Gas on a Custom Subnet

In `genesis.json`, the `feeConfig` controls everything:

**High-throughput Subnet:**
```json
"feeConfig": {
  "gasLimit": 30000000,      // 30M — Ethereum-level throughput
  "targetBlockRate": 2,
  "minBaseFee": 1000000000,  // 1 Gwei minimum (low cost)
  "targetGas": 37500000,     // 37.5M per 10s window
  "baseFeeChangeDenominator": 36,
  "minBlockGasCost": 0,
  "maxBlockGasCost": 10000000,
  "blockGasCostStep": 500000
}
```

**Gasless Subnet** (no fees charged):
```json
"feeConfig": {
  "gasLimit": 15000000,
  "targetBlockRate": 2,
  "minBaseFee": 0,           // Zero minimum fee
  "targetGas": 15000000,
  "baseFeeChangeDenominator": 36,
  "minBlockGasCost": 0,
  "maxBlockGasCost": 0,      // No block gas cost
  "blockGasCostStep": 0
}
```

**Update fee config dynamically** (if FeeManager precompile is enabled):

```solidity
interface IFeeManager {
    struct FeeConfig {
        uint256 gasLimit;
        uint256 targetBlockRate;
        uint256 minBaseFee;
        uint256 targetGas;
        uint256 baseFeeChangeDenominator;
        uint256 minBlockGasCost;
        uint256 maxBlockGasCost;
        uint256 blockGasCostStep;
    }
    
    function setFeeConfig(FeeConfig calldata config) external;
    function getFeeConfig() external view returns (FeeConfig memory);
    function getFeeConfigLastChangedAt() external view returns (uint256);
}

// Call as admin:
IFeeManager(0x0200000000000000000000000000000000000003).setFeeConfig(
    IFeeManager.FeeConfig({
        gasLimit: 15000000,
        targetBlockRate: 2,
        minBaseFee: 25000000000,  // 25 Gwei
        targetGas: 15000000,
        baseFeeChangeDenominator: 36,
        minBlockGasCost: 0,
        maxBlockGasCost: 1000000,
        blockGasCostStep: 200000
    })
);
```

### Typical Gas Costs on C-Chain

| Operation | Gas Units | At 25 nAVAX/gas | USD (AVAX=$20) |
|---|---|---|---|
| ETH transfer | 21,000 | 0.000525 AVAX | $0.0105 |
| ERC-20 transfer | 65,000 | 0.001625 AVAX | $0.0325 |
| ERC-20 approve | 46,000 | 0.00115 AVAX | $0.023 |
| Uniswap v2 swap | 150,000 | 0.00375 AVAX | $0.075 |
| Contract deploy (~10KB) | 1,500,000 | 0.0375 AVAX | $0.75 |
| SSTORE (new) | 22,100 | 0.0005525 AVAX | $0.01105 |

## Key concepts

**EIP-1559 on Avalanche** — C-Chain uses base fee + priority fee. Base fee is burned. Priority fee goes to validators. Base fee automatically adjusts based on block usage.

**nAVAX** — Smallest AVAX unit. 1 AVAX = 10^9 nAVAX = 10^9 Gwei-equivalent. Gas prices displayed in nAVAX by wallets.

**gasLimit vs gasUsed** — gasLimit is the max you'll pay. gasUsed is what was actually consumed. Unused gas is refunded. Set gasLimit too low = transaction reverts ("out of gas").

**Priority fee (tip)** — Paid to validators to prioritize your transaction. On Avalanche, blocks are rarely full enough to need tips. 1-2 nAVAX tip is usually sufficient.

**FeeManager precompile** — Allows admin to change fee config after genesis without hard fork. Must be enabled in genesis.

## Common errors

| Error | Cause | Fix |
|---|---|---|
| "Intrinsic gas too low" | gasLimit below 21,000 | Minimum for any tx is 21,000 |
| "Out of gas" | gasLimit too low for operation | Increase gasLimit (estimate with eth_estimateGas) |
| "Gas price too low" | maxFeePerGas below baseFee | Increase maxFeePerGas or use `eth_gasPrice` to get current |
| Transaction stuck pending | Base fee increased after tx submitted | Speed up in MetaMask (resubmit with higher fee) |
| "max priority fee > max fee" | Priority fee set higher than max fee | Set maxPriorityFeePerGas ≤ maxFeePerGas |

## Next skills

- `subnet-evm-config` — full genesis configuration including feeConfig
- `precompiles` — FeeManager precompile to update fees after deployment
- `performance-optimization` — broader optimization beyond gas
