---
name: "why-avalanche"
version: "1.0.0"
spec: "agentskills@1.0"
license: "Apache-2.0"
tier: 5
description: "When to choose Avalanche — performance benchmarks, Subnet use cases, EVM compatibility story, and competitive positioning."
trigger: |
  Use when: evaluating Avalanche for a new project, comparing Avalanche to Ethereum L2s or Cosmos, explaining Avalanche's value proposition, or deciding whether to use C-Chain or a custom Subnet.
  Do NOT use for: implementation details, writing contracts, deploying infrastructure.
last_updated: "2026-05-01"
related_skills:
  - concepts
  - subnet-deployment
---

## Overview

Avalanche offers a unique combination of EVM compatibility, high throughput, fast finality, and appchain isolation via Subnets. Choosing Avalanche makes most sense for teams that need dedicated blockspace, fast settlement, or custom chain rules — while staying in the Solidity/EVM ecosystem. This skill helps frame that choice with concrete numbers and tradeoffs.

## When to fetch

Fetch when a user asks "why Avalanche?" or "should I use Avalanche vs X?", when starting a new project and evaluating L1/L2 options, or when writing positioning content for a grant application or pitch.

## Core Workflow

### Performance Benchmarks

| Metric | Avalanche C-Chain | Ethereum L1 | Optimism/Arbitrum | Polygon PoS |
|---|---|---|---|---|
| TPS (practical) | ~4,500 | ~15 | ~2,000-4,000 | ~7,000 |
| Finality | 1-2 seconds | 12-15 min (probabilistic) | 7 days (fraud proof) | 2-3 seconds |
| Gas fees (typical) | $0.01-0.10 | $1-50 | $0.01-0.50 | $0.001-0.01 |
| EVM compatible | Full | Native | Full | Full |
| Custom chain rules | Via Subnet | No | No (L2 stack) | No |
| Dedicated blockspace | Via Subnet | No | Via L3/AppChain | Limited |

### When Avalanche Wins

**Use Avalanche C-Chain when:**
- You need fast settlement for trading, gaming, or payments (1-2s finality vs 15 min on Ethereum)
- You want Ethereum tooling (Hardhat, Foundry, MetaMask, ethers.js) with better UX
- You're building DeFi and need proven liquidity infrastructure (AVAX, USDC, wrapped assets)
- You need Chainlink oracles, The Graph, and standard EVM infrastructure
- Budget matters: gas fees are 10-100x lower than Ethereum L1

**Use a Custom Subnet (Avalanche L1) when:**
- Your application needs dedicated blockspace (gaming, high-frequency trading, enterprise)
- You need custom gas tokens (pay gas in your protocol token)
- You need custom precompiles (native randomness, KYC enforcement at VM level)
- You need privacy from public mempool (custom validator set)
- You're building for a regulated industry (banking, RWA) needing permissioned validators
- Compliance requires geographic validator control

### Avalanche vs. Alternatives

**Avalanche vs. Ethereum L2s (Optimism, Arbitrum, Base)**

| Consideration | Avalanche Subnet | OP/Arb L2 |
|---|---|---|
| Sequencer risk | None (validator set) | Single sequencer (centralized risk) |
| Finality | 1-2s native | 7 days (OP fraud proof) / instant soft |
| Custom VM | Yes (Subnet-EVM, HyperSDK) | Limited (OP Stack forks) |
| Validator control | Full control | None (L1 validators) |
| Token for gas | Custom native token | Must use ETH (mostly) |
| Ecosystem | Avalanche ecosystem | Ethereum ecosystem |
| Best for | Appchains needing isolation | Teams wanting Ethereum settlement |

**Avalanche vs. Cosmos**

| Consideration | Avalanche Subnet | Cosmos Chain |
|---|---|---|
| EVM compatibility | Full (Subnet-EVM) | Via EVM module (partial) |
| Developer tooling | Ethereum-native | Cosmos SDK (Go) |
| IBC / Warp | Warp messaging | IBC (mature) |
| Validator bootstrapping | Subset of Avalanche validators | Independent set |
| Security model | Shared validator pool possible | App-specific chain |
| Best for | EVM teams, fast iteration | Cosmos ecosystem, IBC interop |

**Avalanche vs. Solana**

| Consideration | Avalanche | Solana |
|---|---|---|
| Smart contract language | Solidity (EVM) | Rust/Anchor |
| TPS | ~4,500 (C-Chain) | ~65,000 |
| Developer ecosystem | Ethereum-sized | Growing but smaller |
| Finality | 1-2s | ~400ms |
| Best for | EVM devs, DeFi composability | High-frequency, gaming |

### EVM Compatibility Story

Avalanche C-Chain is a full EVM — not a compatibility layer. This means:

```bash
# Works without modification on Avalanche:
- All Solidity versions (0.6.x → 0.8.x)
- OpenZeppelin contracts (any version)
- Hardhat, Foundry, Truffle
- MetaMask, WalletConnect, Ledger
- ethers.js, viem, web3.js
- Chainlink VRF, Price Feeds, Automation
- The Graph (subgraphs)
- Gnosis Safe
- OpenSea, Blur (NFT marketplaces)
- Most DeFi infrastructure
```

### When Avalanche Is NOT the Right Fit

- You need maximum interoperability with Ethereum DeFi liquidity and don't want bridge risk — use Ethereum L1 or a major L2
- You're building a Solana-native product with tight latency requirements (<400ms) — stay on Solana
- You need IBC and the Cosmos ecosystem — use Cosmos
- Your team has no EVM experience and wants a different programming model — consider Move-based chains
- You need 100,000+ TPS — Subnet-EVM tops out around 4,500 on C-Chain (Subnets can go higher with custom VMs)

## Key concepts

**Subnet**: An Avalanche Subnet is a sovereign network running its own VM, with its own validator set (who must also validate the Avalanche Primary Network). Think of it as an appchain with built-in interoperability via Warp messaging.

**Snow Consensus**: Avalanche uses a family of leaderless, probabilistic consensus protocols (Snowflake/Snowball). Nodes repeatedly sample random peers; consensus emerges from repeated agreement, not leader election. This enables 1-2s finality with thousands of validators.

**C-Chain vs Subnet**: C-Chain is Avalanche's shared EVM — one chain, shared blockspace. A Subnet is a dedicated EVM (or custom VM) with isolated blockspace. C-Chain is where you start; Subnets are where you scale.

**Primary Network**: Every Avalanche Subnet validator must also validate the Primary Network (C/P/X chains). This provides shared economic security without requiring a full re-validator-bootstrap.

**Warp Messaging**: Native cross-chain messaging between Subnets, signed by the source Subnet's validator set. No external bridge protocol needed.

## Common errors

| Misconception | Reality |
|---|---|
| "Avalanche is an Ethereum L2" | Avalanche is an independent L1 — not a rollup, not secured by Ethereum |
| "Subnets don't pay AVAX fees" | Subnet validators must stake AVAX on the Primary Network; Subnets can use any gas token |
| "Avalanche finality is probabilistic" | Snow consensus achieves probabilistic finality but is treated as final after 1-2s in practice |
| "Avalanche is just fast Ethereum" | Subnets add appchain isolation, custom VMs, and permissioned validators that Ethereum L2s can't match |

## Next skills

- `concepts` — deep dive into C/P/X-Chain, Snow consensus, and AVAX tokenomics
- `subnet-deployment` — deploy your own Avalanche L1
