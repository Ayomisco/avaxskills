# AVALANCHE SKILLS — Full Project Documentation v2.0

> **avaxskills.com** · Apache-2.0 · Compatible with Claude Code · Cursor · Copilot · Codex · Windsurf · Gemini CLI
>
> Install: `npx openskills install avalanche-org/avalanche-skills -g`

---

## What Changed — V1 → V2

| Area | V1 (Wrong) | V2 (Correct) |
|---|---|---|
| Installer | Custom `npx avaxskills` CLI | `npx openskills install` (ecosystem standard) |
| Folder spec | SKILL.md + references/ + scripts/ | SKILL.md + references/ + **rules/** + scripts/ + **.zip** |
| Root files | README only | README + **llms.txt** + **AGENTS.md** + **root SKILL.md** + sitemap.xml |
| Skill count | 16 broad skills | 32 granular skills (one concept per skill) |
| Frontmatter | Basic YAML | Adds `spec`, `license`, `related_skills` |
| Skill depth | Each skill covered many things | One skill = one specific thing (Celo model) |
| Website | Next.js Phase 1 | Static Vercel + `/api/skill?topic=X` — Phase 2 |

---

## Repo Structure (Definitive)

```
avalanche-skills/
├── README.md              ← Human landing page
├── SKILL.md               ← Root index skill — agents fetch this first (NEW)
├── AGENTS.md              ← How to wire skills into each agent (NEW)
├── llms.txt               ← LLM-native discovery file — CRITICAL (NEW)
├── sitemap.xml            ← Web crawler + agent discovery (NEW)
├── CONTRIBUTING.md
├── LICENSE                ← Apache-2.0
├── package.json           ← openskills registry metadata
│
├── skills/
│   └── {skill-name}/
│       ├── SKILL.md       ← Required: instructions + YAML frontmatter
│       ├── references/    ← Detailed docs (loaded on demand)
│       ├── rules/         ← Best practices agents MUST follow (NEW)
│       ├── scripts/       ← Executable bash/ts helpers
│       └── {skill}.zip    ← Packaged distribution (NEW)
│
├── website/               ← Phase 2 only
│   ├── public/skills/     ← HTTP mirror of /skills/ (curl-fetchable)
│   └── api/               ← /api/skill?topic=X and /api/search?q=X
│
└── scripts/
    ├── validate-skill.ts
    ├── package-skills.sh  ← Auto-generates .zip per release (NEW)
    └── generate-index.ts
```

### Root SKILL.md — Agent Entry Point

```yaml
---
name: avalanche-skills
description: Complete AI agent skills index for building on Avalanche —
             Subnets, Warp, C-Chain, x402, RWA, DeFi, testing, security.
---

# Avalanche Skills
> Fetch any skill: curl https://avaxskills.com/{skill-name}/SKILL.md

## Development Tools
- evm-hardhat          → /evm-hardhat/SKILL.md
- evm-foundry          → /evm-foundry/SKILL.md
- scaffold-avax        → /scaffold-avax/SKILL.md
- contract-verification → /contract-verification/SKILL.md
- avalanche-cli        → /avalanche-cli/SKILL.md
... [all 32 skills]
```

### llms.txt

```
# Avalanche Skills
> The definitive AI agent skills package for building on Avalanche

## Quick start (no install required)
curl -sSL https://avaxskills.com/SKILL.md

## Install
npx openskills install avalanche-org/avalanche-skills -g

## Skills index
https://avaxskills.com/api/skills.json

## Key skills
- /subnet-deployment/SKILL.md  — Create custom Avalanche L1s
- /warp-messaging/SKILL.md     — Cross-chain via Teleporter
- /x402-integration/SKILL.md   — AI agent payments on AVAX
- /rwa-tokenization/SKILL.md   — Real world asset tokenization
- /hackathon-bounties/SKILL.md — Live Avalanche bounty data
```

---

## Skill Format Specification (V2)

### Updated YAML Frontmatter

```yaml
---
name: "subnet-deployment"
version: "1.0.0"
spec: "agentskills@1.0"              # NEW: compatibility marker
license: "Apache-2.0"                # NEW: required
description: "One sentence. Include trigger phrases."
trigger: |
  Use when: custom appchain, Subnet, dedicated chain.
  Do NOT use for: C-Chain contract deployment.
last_updated: "2026-05-01"
avalanche_networks: [fuji, mainnet]
related_skills:                      # NEW: cross-linking
  - warp-messaging
  - contract-addresses
  - validator-management
---
```

### Required Sections

| Section | Purpose | Token budget |
|---|---|---|
| Overview | 2–4 sentences. What does this skill enable? | < 100 tokens |
| When to fetch | Explicit triggers + anti-triggers | < 80 tokens |
| Core Workflow | Numbered steps. Exact commands. | < 600 tokens |
| Network config | Chain ID, RPC, explorer table (network skills) | < 100 tokens |
| Key concepts | ≤5 Avalanche-specific definitions | < 150 tokens |
| Common errors | Table: Error / Cause / Fix. Top 3–5 only. | < 150 tokens |
| Next skills | Which skills to fetch next (0G pattern) | < 50 tokens |

> **HARD CAP**: SKILL.md under 500 lines. CI rejects PRs that exceed this.

### The rules/ Folder

| Folder | Content type | Example |
|---|---|---|
| SKILL.md | Core workflow — what to do | Deploy a Subnet end-to-end |
| references/ | Deep docs — how things work | Full Teleporter API reference |
| **rules/** | Guardrails — what NOT to do | Never set gas limit below 8M on Subnet-EVM |
| scripts/ | Working code — runnable helpers | create-subnet.sh, deploy.ts |

---

## Complete Skill Catalog — 32 Granular Skills

> **One skill = one thing.** Agents load exactly what they need.

### Development Tools

| Skill | Description | Phase |
|---|---|---|
| `evm-hardhat` | Hardhat for Avalanche C-Chain and Subnets. Project setup, compilation, testing, deployment, verification. | Phase 1 |
| `evm-foundry` | Foundry/Forge for Avalanche. forge.toml config, cast commands, fuzz testing, broadcast deployment. | Phase 1 |
| `scaffold-avax` | Scaffold Avalanche dApps from templates. React, Next.js, wallet provider setup. | Phase 1 |
| `contract-verification` | Verify contracts on Snowtrace, Routescan, Blockscout, and Sourcify. API and CLI methods. | Phase 1 |
| `avalanche-cli` | Avalanche CLI tool. Subnet creation, deploy, config, node management commands. | Phase 2 |

### Blockchain Interaction

| Skill | Description | Phase |
|---|---|---|
| `avalanche-rpc` | Interact with C/P/X-Chain via RPC. Read balances, blocks, transactions, Avalanche-specific methods. | Phase 1 |
| `viem` | viem TypeScript client for Avalanche. C-Chain config, wallet client, public client setup. | Phase 1 |
| `wagmi` | React hooks for Avalanche dApps. Wallet connection, contract reads/writes, transaction handling. | Phase 2 |
| `avalanche-js` | avalanchejs SDK for P-Chain and X-Chain. Native AVAX transfers, staking, asset creation. | Phase 2 |
| `contract-addresses` | All Avalanche system contracts — precompiles, WAVAX, Teleporter, fee manager on Mainnet and Fuji. | Phase 1 |
| `gas` | Avalanche fee mechanics. Dynamic fees, base fee, priority fee, gas estimation patterns. | Phase 2 |

### Subnet & Custom L1 (Core Differentiator)

| Skill | Description | Phase |
|---|---|---|
| `subnet-deployment` | End-to-end Subnet creation. Genesis config, validator bootstrap, Fuji deploy, Mainnet promotion. | **Phase 1 ⭐** |
| `subnet-evm-config` | Subnet-EVM configuration. Custom precompiles, gas limits, fee config, genesis block design. | Phase 1 |
| `validator-management` | Add/remove validators. Node IDs, staking amounts, uptime monitoring, reward tracking. | Phase 2 |
| `custom-vm` | Build and deploy a custom virtual machine on Avalanche. VM interface, SpacesVM reference. | Phase 2 |
| `avacloud-indexing` | AvaCloud Data API. On-chain indexing, webhooks, event streaming, managed node access. | Phase 2 |

### Cross-Chain

| Skill | Description | Phase |
|---|---|---|
| `warp-messaging` | Avalanche Warp Messaging protocol. ITeleporterMessenger interface, send/receive patterns, fees. | **Phase 1 ⭐** |
| `teleporter` | Teleporter Solidity library deep dive. Message receipts, retry logic, fee handling, test setup. | Phase 2 |
| `bridging` | Bridge assets to/from Avalanche. Native bridge, Wormhole, LayerZero, third-party bridges. | Phase 2 |

### Wallet Integration

| Skill | Description | Phase |
|---|---|---|
| `evm-wallet-integration` | Integrate wallets into Avalanche dApps. Reown AppKit, Dynamic, wagmi custom implementations. | Phase 2 |
| `core-wallet` | Core Wallet integration. Avalanche's native wallet — detection, signing, Subnet switching. | Phase 2 |
| `account-abstraction` | ERC-4337 account abstraction on Avalanche. Bundlers, paymasters, smart accounts. | Phase 3 |

### AI Agent Infrastructure

| Skill | Description | Phase |
|---|---|---|
| `x402-integration` | x402 HTTP payment protocol for AI agents. Pay-per-use AVAX micropayments, middleware, agent client. | **Phase 1 ⭐** |
| `ai-agent-patterns` | Build on-chain AI agents on Avalanche. x402 flows, memory patterns, tool use, multi-step workflows. | Phase 2 |
| `orchestration` | Multi-agent orchestration patterns on Avalanche. Manager/worker patterns, on-chain coordination. | Phase 2 |

### DeFi, Assets & RWA

| Skill | Description | Phase |
|---|---|---|
| `token-standards` | ERC-20, ERC-1400, ERC-3643, ERC-3525 standards on Avalanche. When to use each. | Phase 2 |
| `revenue-sharing-tokens` | Revenue distribution token patterns on Avalanche. Split contracts, streaming payments, royalties. | Phase 2 |
| `defi-primitives` | Core DeFi on C-Chain. AMMs, lending vaults, yield strategies. Trader Joe, BENQI, Aave. | Phase 2 |
| `rwa-tokenization` | Real world asset tokenization on Avalanche. Compliance-aware token design, KYC hooks, partition models. | **Phase 2 ⭐** |
| `kyc-aml-integration` | Light KYC/AML integration for Avalanche dApps. Synaps, Fractal, on-chain identity, privacy tradeoffs. | Phase 2 |

### Security, Testing & Quality

| Skill | Description | Phase |
|---|---|---|
| `security` | Defensive Solidity on Avalanche. Subnet validator security, precompile risks, Warp trust assumptions. | Phase 1 |
| `testing` | Unit, fuzz, and fork testing. Hardhat + Foundry patterns, local Subnet test environment. | Phase 2 |
| `audit` | Structured audit prompts for Avalanche contracts. Subnet-specific checks, Teleporter invariants. | Phase 2 |
| `qa` | Pre-launch quality checklist. Fuji → Mainnet promotion gates, validator readiness, UX testing. | Phase 2 |
| `frontend-ux` | Mandatory Avalanche dApp UX rules. Chain switching, pending states, error surfacing, wallet UX. | Phase 2 |

### Intelligence & Positioning

| Skill | Description | Phase |
|---|---|---|
| `hackathon-bounties` | Live Avalanche bounty criteria, past winner patterns, judge signals. DoraHacks API integration. | **Phase 1 ⭐** |
| `why-avalanche` | When to choose Avalanche. Performance benchmarks, Subnet use cases, EVM compatibility story. | Phase 1 |
| `concepts` | Core mental models. C/P/X-Chain, finality model, Subnet vs L2, AVAX tokenomics. | Phase 1 |
| `performance-optimization` | Sub-second finality patterns, gas optimization, parallel execution, Subnet scaling. | Phase 3 |
| `grant-playbook` | All Avalanche grant programs. infraBUIDL(AI), Retro9000, Codebase, Foundation + templates. | Phase 3 |

---

## Skills in Action — Real Discord Question

> **Real question from Avalanche Discord:**
> "I'm working on tokenizing a pharma business (FDA-approved treatment). Questions: 1) Best smart contract template for revenue-sharing/utility token? 2) Small projects that launched without heavy compliance? 3) Resources for light KYC/AML? 4) Pitfalls to avoid — e.g. accidentally creating a security?"

| Question | Skill to load | What the agent gets |
|---|---|---|
| Revenue-sharing token template | `revenue-sharing-tokens` | ERC-20 + Split contract pattern, streaming, worked Solidity examples |
| Utility vs. security token | `token-standards` | ERC-20/1400/3643 comparison, Howey Test checklist |
| Light KYC/AML options | `kyc-aml-integration` | Synaps, Fractal, Civic integrations, on-chain identity hooks |
| Avoiding accidental securities | `security` | Token design guardrails, legal red flags, Reg D/CF references |
| RWA tokenization context | `rwa-tokenization` | Compliance-aware architecture, partition models, Subnet isolation |

**Agent prompt pattern:**
```
Fetch these skills before answering:
curl https://avaxskills.com/token-standards/SKILL.md
curl https://avaxskills.com/revenue-sharing-tokens/SKILL.md
curl https://avaxskills.com/kyc-aml-integration/SKILL.md
curl https://avaxskills.com/rwa-tokenization/SKILL.md
curl https://avaxskills.com/security/SKILL.md
```

---

## Avalanche Network Reference

### Networks

| Network | Chain ID | RPC Endpoint | Explorer |
|---|---|---|---|
| Avalanche Mainnet (C-Chain) | 43114 | https://api.avax.network/ext/bc/C/rpc | https://snowtrace.io |
| Fuji Testnet (C-Chain) | 43113 | https://api.avax-test.network/ext/bc/C/rpc | https://testnet.snowtrace.io |
| AvaCloud Custom RPC | Custom | https://{subnet-id}.rpc.avax.network | https://routescan.io |
| Local (Avalanche-CLI) | Custom | http://localhost:9650/ext/bc/{chainID}/rpc | localhost |

### Key Contract Addresses (Mainnet C-Chain)

| Contract | Address | Purpose |
|---|---|---|
| WAVAX | 0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7 | Wrapped AVAX for DeFi |
| Teleporter Messenger | 0x253b2784c75e510dD0fF1da844684a1aC0aa5fcf | Cross-chain messaging |
| Native Minter Precompile | 0x0200000000000000000000000000000000000001 | Subnet-EVM native mint |
| Fee Manager Precompile | 0x0200000000000000000000000000000000000003 | Subnet-EVM fee config |
| Warp Messenger Precompile | 0x0200000000000000000000000000000000000005 | Warp protocol access |

---

## Installation & Agent Integration

### openskills (Primary — Ecosystem Standard)
```bash
npx openskills install avalanche-org/avalanche-skills -g
npx openskills install avalanche-org/avalanche-skills --skill subnet-deployment -g
pnpm dlx openskills install avalanche-org/avalanche-skills -g
bunx openskills install avalanche-org/avalanche-skills -g
```

### npx skills (Vercel Standard)
```bash
npx skills add avalanche-org/avalanche-skills
npx skills add https://github.com/avalanche-org/avalanche-skills/tree/main/skills/subnet-deployment
```

### gh skill (GitHub Copilot)
```bash
gh skill install avalanche-org/avalanche-skills
gh skill install avalanche-org/avalanche-skills --skill warp-messaging
```

### curl (Zero-install)
```bash
curl -sSL https://avaxskills.com/SKILL.md                           # root index
curl -sSL https://avaxskills.com/subnet-deployment/SKILL.md         # specific skill
curl -sSL 'https://avaxskills.com/api/skill?topic=subnet'           # JSON API
```

---

## Discovery & Distribution

| Directory | URL | Action |
|---|---|---|
| SkillsMP Marketplace | skillsmp.com | Auto-indexed — ensure package.json is correct |
| skills.sh leaderboard | skills.sh | Submit after Phase 1 launch |
| VoltAgent/awesome-agent-skills | github.com/VoltAgent/... | Submit PR — 1000+ skills, actively curated |
| heilcheng/awesome-agent-skills | github.com/heilcheng/... | Submit PR |
| Anthropic Claude Marketplace | claude.ai/marketplace | Submit after Phase 2 with metrics |
| awesome-avalanche lists | GitHub search | PR to community Avalanche resource lists |

---

*Documentation v2.0 · @ayomisco_s · avaxskills.com · Apache-2.0*
