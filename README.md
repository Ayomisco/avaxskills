# Avalanche Skills

> **The definitive AI agent skills package for building on Avalanche.**
> From zero to mainnet — beginner to expert. 49 granular skills. Zero install required.

[![License](https://img.shields.io/badge/license-Apache--2.0-blue)](LICENSE)
[![Skills](https://img.shields.io/badge/skills-49-red)](skills/)
[![Compatible](https://img.shields.io/badge/compatible-Claude%20Code%20·%20Cursor%20·%20Copilot%20·%20Windsurf%20·%20Gemini%20CLI-purple)]()

---

## The 10-Second Start (No Install)

Paste this into your AI agent's system prompt or context:

```
Read https://avaxskills.com/SKILL.md before building anything on Avalanche.
```

That's it. The agent fetches the root index, discovers all 49 skills, then loads exactly what it needs.

Or fetch a specific skill directly:

```bash
# Get started from zero
curl -sSL https://avaxskills.com/quickstart/SKILL.md

# Deploy a Subnet
curl -sSL https://avaxskills.com/subnet-deployment/SKILL.md

# AI agent payments
curl -sSL https://avaxskills.com/x402-integration/SKILL.md
```

---

## Install (Adds to Your Project)

```bash
# openskills (ecosystem standard)
npx openskills install avalanche-org/avalanche-skills -g

# Install a single skill
npx openskills install avalanche-org/avalanche-skills --skill subnet-deployment -g

# GitHub Copilot
gh skill install avalanche-org/avalanche-skills

# Vercel / npm
npx skills add avalanche-org/avalanche-skills
```

---

## Skill Catalog — 49 Skills Across 6 Tiers

### TIER 0 — Beginner Onramp
*Zero blockchain knowledge required. Get from nothing to deployed in minutes.*

| Skill | What you get |
|---|---|
| [`quickstart`](skills/quickstart/) | Zero to first Avalanche transaction in 10 minutes |
| [`wallet-setup`](skills/wallet-setup/) | MetaMask + Core Wallet configured for Avalanche |
| [`get-testnet-avax`](skills/get-testnet-avax/) | Fuji faucets, amounts, troubleshooting |
| [`first-contract`](skills/first-contract/) | Deploy Hello World Solidity on C-Chain |
| [`explorer-guide`](skills/explorer-guide/) | Read Snowtrace + C/P/X-Chain explorers |

### TIER 1 — EVM Core
*Standard Ethereum tooling adapted for Avalanche.*

| Skill | What you get |
|---|---|
| [`evm-hardhat`](skills/evm-hardhat/) | Hardhat for Avalanche C-Chain and Subnets |
| [`evm-foundry`](skills/evm-foundry/) | Foundry/Forge — forge.toml, cast, fuzz testing |
| [`scaffold-avax`](skills/scaffold-avax/) | Scaffold dApps from React/Next.js templates |
| [`contract-verification`](skills/contract-verification/) | Verify on Snowtrace, Routescan, Blockscout |
| [`avalanche-rpc`](skills/avalanche-rpc/) | C/P/X-Chain RPC — balances, blocks, txs |
| [`avalanche-js`](skills/avalanche-js/) | avalanchejs SDK — P/X/C-Chain, staking |
| [`viem`](skills/viem/) | viem TypeScript client for Avalanche |
| [`wagmi`](skills/wagmi/) | React hooks — wallet connect, reads, writes |

### TIER 2 — Avalanche Unique
*What makes Avalanche different. Core differentiators.*

| Skill | What you get |
|---|---|
| [`subnet-deployment`](skills/subnet-deployment/) ⭐ | End-to-end Subnet/L1 — genesis to mainnet |
| [`subnet-evm-config`](skills/subnet-evm-config/) | Custom precompiles, gas limits, genesis design |
| [`warp-messaging`](skills/warp-messaging/) ⭐ | Cross-chain via Teleporter — send/receive |
| [`teleporter`](skills/teleporter/) | Teleporter deep dive — receipts, retry, fees |
| [`custom-vm`](skills/custom-vm/) | Build custom virtual machines on Avalanche |
| [`avacloud-indexing`](skills/avacloud-indexing/) | AvaCloud Data API — indexing, webhooks |
| [`validator-management`](skills/validator-management/) | Add/remove validators, staking, uptime |
| [`contract-addresses`](skills/contract-addresses/) | All precompiles + WAVAX + Teleporter addresses |
| [`gas`](skills/gas/) | Dynamic fees, base fee, priority fee, estimation |
| [`precompiles`](skills/precompiles/) | Complete precompile reference and usage |

### TIER 3 — Ecosystem Intelligence
*Protocols, integrations, and Avalanche-specific patterns.*

| Skill | What you get |
|---|---|
| [`hackathon-bounties`](skills/hackathon-bounties/) ⭐ | Live bounties, winner patterns, DoraHacks API |
| [`x402-integration`](skills/x402-integration/) ⭐ | AI agent micropayments — x402 on AVAX |
| [`defi-primitives`](skills/defi-primitives/) | AMMs, lending, yield — Trader Joe, BENQI, Aave |
| [`bridging`](skills/bridging/) | Native bridge, Wormhole, LayerZero, Warp |
| [`ai-agent-patterns`](skills/ai-agent-patterns/) | On-chain AI agent architectures on Avalanche |
| [`performance-optimization`](skills/performance-optimization/) | Sub-second finality, gas opt, parallel execution |
| [`rwa-tokenization`](skills/rwa-tokenization/) ⭐ | Real world asset tokenization, compliance |
| [`token-standards`](skills/token-standards/) | ERC-20/1400/3643/3525 — when to use each |
| [`revenue-sharing-tokens`](skills/revenue-sharing-tokens/) | Split contracts, streaming, royalties |
| [`core-wallet`](skills/core-wallet/) | Core Wallet — detection, signing, Subnet switching |

### TIER 4 — Quality & Process
*Ship code you can stand behind.*

| Skill | What you get |
|---|---|
| [`security`](skills/security/) | Defensive Solidity, Subnet security, Warp trust |
| [`testing`](skills/testing/) | Unit, fuzz, fork testing — Hardhat + Foundry |
| [`audit`](skills/audit/) | Audit prompts, Avalanche-specific invariants |
| [`qa`](skills/qa/) | Pre-launch checklist, Fuji→Mainnet gates |
| [`frontend-ux`](skills/frontend-ux/) | dApp UX rules — chain switch, errors, wallet |
| [`orchestration`](skills/orchestration/) | Multi-agent coordination patterns |
| [`kyc-aml-integration`](skills/kyc-aml-integration/) | Synaps, Fractal, on-chain identity |
| [`evm-wallet-integration`](skills/evm-wallet-integration/) | Reown AppKit, Dynamic, custom wagmi |

### TIER 5 — Positioning & Intelligence
*Decision-making context for architects.*

| Skill | What you get |
|---|---|
| [`why-avalanche`](skills/why-avalanche/) | Benchmarks, Subnet cases, EVM compatibility |
| [`concepts`](skills/concepts/) | C/P/X-Chain, finality, Subnet vs L2 |
| [`grant-playbook`](skills/grant-playbook/) | infraBUIDL(AI), Retro9000, Codebase + templates |
| [`account-abstraction`](skills/account-abstraction/) | ERC-4337 — bundlers, paymasters, smart accounts |

### TIER 6 — Advanced Pro
*Complex patterns for experienced builders.*

| Skill | What you get |
|---|---|
| [`upgradeable-contracts`](skills/upgradeable-contracts/) | Proxy patterns — UUPS, Transparent, Beacon |
| [`cross-subnet-dapp`](skills/cross-subnet-dapp/) | Apps that span multiple Subnets via Warp |
| [`subnet-governance`](skills/subnet-governance/) | On-chain governance for custom L1s |
| [`indexing-subgraph`](skills/indexing-subgraph/) | The Graph + custom indexers on Avalanche |

---

## Network Quick Reference

| Network | Chain ID | RPC | Explorer |
|---|---|---|---|
| C-Chain Mainnet | 43114 | `https://api.avax.network/ext/bc/C/rpc` | snowtrace.io |
| Fuji Testnet | 43113 | `https://api.avax-test.network/ext/bc/C/rpc` | testnet.snowtrace.io |

---

## How This Works

**The web method (zero install):**
```
Read https://avaxskills.com/SKILL.md before building on Avalanche.
```

The root `SKILL.md` is an index. Your agent reads it, discovers all 49 skills with their URLs, then fetches exactly what it needs. One instruction triggers the whole chain.

**Or be specific:**
```
Read https://avaxskills.com/subnet-deployment/SKILL.md before writing any Subnet code.
```

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). Every skill follows the [V2 spec](CONTRIBUTING.md#skill-format).

Apache-2.0 · [avaxskills.com](https://avaxskills.com) · [@ayomisco_s](https://x.com/ayomisco_s)
