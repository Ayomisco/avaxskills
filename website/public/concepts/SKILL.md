---
name: "concepts"
version: "1.0.0"
spec: "agentskills@1.0"
license: "Apache-2.0"
tier: 5
description: "Core Avalanche mental models — C/P/X-Chain roles, Snow consensus, finality model, Subnet vs L2, and AVAX tokenomics."
trigger: |
  Use when: explaining how Avalanche works, learning the C/P/X-Chain distinction, understanding Snow consensus, comparing Subnets to L2 rollups, or explaining AVAX tokenomics.
  Do NOT use for: implementation tasks, writing code, deploying contracts.
last_updated: "2026-05-01"
related_skills:
  - why-avalanche
  - subnet-deployment
  - validator-management
---

## Overview

Avalanche's architecture differs fundamentally from Ethereum and rollup-based chains. The three-chain model (C/P/X), Snow consensus, and the Subnet model require new mental models even for experienced EVM developers. This skill builds the conceptual foundation needed to make good architectural decisions on Avalanche.

## When to fetch

Fetch when onboarding to Avalanche for the first time, when explaining Avalanche to a new team member, when an implementation decision depends on understanding the chain model (e.g., "where does staking happen?"), or when debugging cross-chain flows.

## Core Workflow

### The Three-Chain Model

Avalanche's Primary Network consists of three interoperable chains, each optimized for different operations:

```
┌─────────────────────────────────────────────────────────┐
│                   Avalanche Primary Network              │
│                                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │   C-Chain    │  │   P-Chain    │  │   X-Chain    │  │
│  │  (Contract)  │  │  (Platform)  │  │  (Exchange)  │  │
│  │              │  │              │  │              │  │
│  │ EVM          │  │ Validators   │  │ AVAX native  │  │
│  │ Smart        │  │ Subnets      │  │ transfers    │  │
│  │ contracts    │  │ Staking      │  │ (UTXO model) │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────┘
```

**C-Chain (Contract Chain)**
- Full EVM execution environment
- Where all Solidity smart contracts live
- Supports all Ethereum tooling
- Chain ID: 43114 (mainnet), 43113 (Fuji)
- Gas paid in AVAX
- RPC: `https://api.avax.network/ext/bc/C/rpc`

**P-Chain (Platform Chain)**
- Manages validators and delegators
- Where Subnets are created and configured
- Where AVAX is staked for validation
- UTXO-based (not EVM)
- Not directly accessible from Solidity — use Avalanche.js or AvalancheGo API
- API: `https://api.avax.network/ext/bc/P`

**X-Chain (Exchange Chain)**
- Native AVAX and asset transfers
- Extremely fast, low-fee AVAX movement
- DAG-based (Directed Acyclic Graph) — not a sequential blockchain
- Use for: fast AVAX withdrawals from exchanges, atomic swaps
- API: `https://api.avax.network/ext/bc/X`

### Interacting with Each Chain

```typescript
// C-Chain — use ethers.js / viem / wagmi as normal
import { createPublicClient, http } from "viem";
import { avalanche } from "viem/chains";
const client = createPublicClient({
  chain: avalanche,
  transport: http("https://api.avax.network/ext/bc/C/rpc"),
});

// P-Chain — use Avalanche.js
import { Avalanche } from "@avalabs/avalanchejs";
const avax = new Avalanche("api.avax.network", undefined, "https", 1);
const pchain = avax.PChain();
const validators = await pchain.getCurrentValidators();

// X-Chain — use Avalanche.js
const xchain = avax.XChain();
const balance = await xchain.getBalance(xAddress, "AVAX");
```

### Snow Consensus — How Finality Works

Avalanche uses a family of consensus protocols called Snow (Snowflake → Snowball → Avalanche):

```
Round 1: Node A queries k random nodes → 80% say "Yes" → confidence++
Round 2: Node A queries k random nodes → 85% say "Yes" → confidence++
Round N: confidence > threshold → FINALIZED (1-2 seconds)
```

Key properties:
- **Leaderless**: No block proposer rotation — any node can initiate
- **Sub-sampled voting**: Each node only queries a random sample (k nodes), not all validators
- **Probabilistic safety**: Safety probability approaches 1 exponentially fast
- **Liveness**: As long as >51% of stake is honest, network progresses

This is why Avalanche achieves 1-2s finality with thousands of validators — each validator only communicates with a small sample per round.

### Finality Model

```
Ethereum L1:    Transaction → 12-15 min → Probabilistic finality (6 blocks)
Optimistic L2:  Transaction → Instant soft → 7 days → Hard finality
Avalanche:      Transaction → 1-2 seconds → Hard finality ✓
```

For dApps: treat a transaction as final once confirmed in 1 block (~1-2s). No need for "wait 6 confirmations" logic.

### Subnets vs. L2 Rollups

| Property | Avalanche Subnet | Optimistic Rollup | ZK Rollup |
|---|---|---|---|
| Security | Own validator set (+ Primary Network stake) | Ethereum L1 (fraud proofs) | Ethereum L1 (ZK proofs) |
| Sequencer | No sequencer — decentralized | Usually centralized | Usually centralized |
| Finality | 1-2s on Subnet | Instant soft / 7 days hard | Instant soft / hours for ZK proof |
| Custom gas token | Yes | No (ETH) | No (ETH) |
| Custom VM | Yes | Limited (EVM only) | Limited |
| Ethereum liquidity | Via bridge | Native | Native |
| Permissioned validators | Yes | No | No |

**Key difference**: A Subnet has its own validator set and its own blockspace. An L2 shares Ethereum's validator set and posts data to Ethereum. This means:
- Subnet = more control, more responsibility (find your own validators)
- L2 = less control, inherit Ethereum security

### AVAX Tokenomics

**Total Supply**: 720 million AVAX (fixed cap — no inflation beyond this)

**Current Circulating Supply**: ~400M+ AVAX (increases as staking rewards vest)

**Use Cases**:

| Use | Chain | Amount |
|---|---|---|
| Smart contract gas fees | C-Chain | Burned (deflationary) |
| Staking (validator) | P-Chain | Min 2,000 AVAX to validate |
| Staking (delegator) | P-Chain | Min 25 AVAX to delegate |
| Subnet validator stake | P-Chain | Must also stake on Primary Network |
| Cross-chain transfers | All | Small fee burned |

**Fee Burning**: C-Chain gas fees are burned permanently. As transaction volume increases, AVAX supply decreases (deflationary pressure).

**Staking Rewards**: Validators earn 7-12% APY (varies by delegation, lock period). Min staking period: 2 weeks. Max: 1 year.

### Address Formats

```bash
# C-Chain — standard 0x Ethereum address
0x1234...5678

# P-Chain — bech32 with P- prefix
P-avax1234...

# X-Chain — bech32 with X- prefix
X-avax1234...

# Convert C-Chain address to P/X format:
# Same underlying key — different encoding
```

## Key concepts

**Validator**: A node that participates in consensus by staking AVAX on the P-Chain. Validators must also validate any Subnets they participate in.

**Delegator**: An AVAX holder who delegates stake to an existing validator to earn rewards without running a node (min 25 AVAX, takes a fee cut).

**Bootstrapping**: When a new node joins the network, it downloads and verifies historical blocks. Avalanche's DAG-based X-Chain bootstraps differently than the EVM C-Chain.

**Continuous Stake**: Unlike Ethereum's withdrawal queue, Avalanche staking has lock periods (2 weeks to 1 year). Stake is returned after the period ends.

**Primary Network**: The three-chain system (C/P/X) that all Subnet validators must also validate. This is the shared security foundation.

## Common errors

| Confusion | Clarification |
|---|---|
| Sending AVAX to P-Chain address on C-Chain | Each chain uses a different address format; use the bridge to move between chains |
| Looking for staking on C-Chain | Staking is on P-Chain only — use wallet.avax.network or avalanche.js |
| Assuming Subnet validators don't need AVAX | Subnet validators must stake AVAX on Primary Network too |
| Treating 1 Avalanche confirmation as unsafe | 1 confirmation on Avalanche = final (Snow consensus) |
| Confusing X-Chain and C-Chain | X-Chain is for native AVAX transfers; C-Chain is for EVM/smart contracts |

## Next skills

- `why-avalanche` — when to choose Avalanche for your project
- `subnet-deployment` — deploy your own Avalanche L1
- `validator-management` — run or manage Avalanche validators
