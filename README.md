# Avalanche Skills

> **The definitive AI agent skills package for building on Avalanche.**
> From zero to mainnet — beginner to expert. 66 granular skills. Zero install required.

[![License](https://img.shields.io/badge/license-Apache--2.0-blue)](LICENSE)
[![Skills](https://img.shields.io/badge/skills-66-red)](skills/)
[![Compatible](https://img.shields.io/badge/compatible-Claude%20Code%20·%20Cursor%20·%20Copilot%20·%20Windsurf%20·%20Gemini%20CLI-purple)]()

---

## The 10-Second Start (Zero Install)

Paste this one line into your AI agent's system prompt, CLAUDE.md, or .cursorrules:

```
Read https://avaxskills.com/SKILL.md before building anything on Avalanche.
```

The agent fetches the root index, discovers all 66 skills with their URLs, then loads exactly what it needs. One line triggers the whole chain.

Or fetch a specific skill directly:

```bash
curl -sSL https://avaxskills.com/quickstart/SKILL.md        # start from zero
curl -sSL https://avaxskills.com/subnet-deployment/SKILL.md # deploy a Subnet/L1
curl -sSL https://avaxskills.com/warp-messaging/SKILL.md    # cross-chain messaging
curl -sSL https://avaxskills.com/x402-integration/SKILL.md  # AI agent payments
```

---

## Install Methods

| Method | Command | Status |
| --- | --- | --- |
| **curl** (zero install) | `curl -sSL https://avaxskills.com/SKILL.md` | ✅ Live |
| **Tell the agent** | `Read https://avaxskills.com/SKILL.md before building on Avalanche.` | ✅ Live |
| **npm** | `npm install avaxskills` | ✅ Live |
| **openskills** | `npx openskills install Ayomisco/avaxskills -g` | 🔜 Coming |
| **GitHub Copilot** | `gh skill install Ayomisco/avaxskills` | 🔜 Coming |

---

## Skill Catalog — 66 Skills Across 7 Tiers

### TIER 0 — Beginner Onramp
*Zero blockchain knowledge required. Zero to deployed in minutes.*

| Skill | What you get |
|---|---|
| [`quickstart`](skills/quickstart/) | Zero to first Avalanche transaction in 10 minutes |
| [`wallet-setup`](skills/wallet-setup/) | MetaMask + Core Wallet for Avalanche and Subnets |
| [`get-testnet-avax`](skills/get-testnet-avax/) | Fuji faucets, limits, troubleshooting |
| [`first-contract`](skills/first-contract/) | Deploy Hello World Solidity on C-Chain with Remix |
| [`explorer-guide`](skills/explorer-guide/) | Read Snowtrace + C/P/X-Chain explorers |
| [`local-dev-environment`](skills/local-dev-environment/) | Full local Avalanche dev setup |

### TIER 1 — EVM Core
*Standard Ethereum tooling adapted for Avalanche.*

| Skill | What you get |
|---|---|
| [`evm-hardhat`](skills/evm-hardhat/) | Hardhat for C-Chain and Subnets — compile, test, deploy |
| [`evm-foundry`](skills/evm-foundry/) | Foundry/Forge — forge.toml, cast, fuzz testing |
| [`scaffold-avax`](skills/scaffold-avax/) | Scaffold dApps from React/Next.js templates |
| [`contract-verification`](skills/contract-verification/) | Verify on Snowtrace, Routescan, Blockscout, Sourcify |
| [`avalanche-rpc`](skills/avalanche-rpc/) | C/P/X-Chain RPC — balances, blocks, transactions |
| [`avalanche-js`](skills/avalanche-js/) | avalanchejs SDK — P/X/C-Chain, staking, asset creation |
| [`avalanche-sdk`](skills/avalanche-sdk/) | New TypeScript SDK — C-Chain, P-Chain, Data API |
| [`viem`](skills/viem/) | viem TypeScript client for Avalanche |
| [`wagmi`](skills/wagmi/) | React hooks — wallet connect, contract reads/writes |
| [`platform-cli`](skills/platform-cli/) | Platform CLI — P-Chain ops: staking, subnets, transfers |
| [`migrate-from-ethereum`](skills/migrate-from-ethereum/) | Port existing Ethereum dApps to Avalanche |
| [`nft-basics`](skills/nft-basics/) | ERC-721 and ERC-1155 NFTs on C-Chain |
| [`token-launch`](skills/token-launch/) | Launch an ERC-20 token end-to-end |
| [`data-feeds-oracles`](skills/data-feeds-oracles/) | Chainlink and Pyth price feeds on Avalanche |

### TIER 2 — Avalanche Unique
*What makes Avalanche different from every other chain.*

| Skill | What you get |
|---|---|
| [`node-setup`](skills/node-setup/) | Install, configure, and sync an AvalancheGo node |
| [`subnet-deployment`](skills/subnet-deployment/) ⭐ | Genesis to mainnet — end-to-end custom L1 creation |
| [`subnet-evm-config`](skills/subnet-evm-config/) | Custom precompiles, gas limits, genesis block design |
| [`warp-messaging`](skills/warp-messaging/) ⭐ | Cross-chain via Teleporter — send/receive patterns |
| [`teleporter`](skills/teleporter/) | Teleporter deep dive — receipts, retry, fees |
| [`avalanche-ictt`](skills/avalanche-ictt/) | Interchain Token Transfer — move ERC-20s across L1s |
| [`custom-vm`](skills/custom-vm/) | Build and deploy custom virtual machines |
| [`avacloud-indexing`](skills/avacloud-indexing/) | AvaCloud Data API — indexing, webhooks, event streaming |
| [`validator-management`](skills/validator-management/) | Add/remove validators, staking amounts, uptime |
| [`contract-addresses`](skills/contract-addresses/) | All precompiles + WAVAX + Teleporter on Mainnet and Fuji |
| [`gas`](skills/gas/) | Dynamic fees, base fee, priority fee, estimation |
| [`precompiles`](skills/precompiles/) | NativeMinter, FeeManager, AllowList, Warp — complete ref |
| [`avalanche-l1-economics`](skills/avalanche-l1-economics/) | Tokenomics design for custom L1s |
| [`tmpnet`](skills/tmpnet/) | Temporary local networks for testing and CI |
| [`blueprints`](skills/blueprints/) | Pre-configured L1 templates for gaming, DeFi, enterprise |
| [`avalanche-deploy`](skills/avalanche-deploy/) | Cloud playbooks for L1s and validators on AWS/GCP/Azure |

### TIER 3 — Ecosystem Intelligence
*Protocols, DeFi, AI payments, and Avalanche-specific patterns.*

| Skill | What you get |
|---|---|
| [`hackathon-bounties`](skills/hackathon-bounties/) ⭐ | Live bounties, winner patterns, DoraHacks strategy |
| [`x402-integration`](skills/x402-integration/) ⭐ | AI agent micropayments — x402 HTTP protocol on AVAX |
| [`defi-primitives`](skills/defi-primitives/) | AMMs, lending, yield — Trader Joe, BENQI, Aave |
| [`bridging`](skills/bridging/) | Native bridge, Wormhole, LayerZero, Warp bridges |
| [`ai-agent-patterns`](skills/ai-agent-patterns/) | On-chain AI agent architectures on Avalanche |
| [`performance-optimization`](skills/performance-optimization/) | Sub-second finality, gas opt, parallel execution |
| [`rwa-tokenization`](skills/rwa-tokenization/) ⭐ | Real world assets — compliance-aware design, KYC hooks |
| [`token-standards`](skills/token-standards/) | ERC-20/1400/3643/3525 — when to use each |
| [`revenue-sharing-tokens`](skills/revenue-sharing-tokens/) | Split contracts, streaming payments, royalties |
| [`core-wallet`](skills/core-wallet/) | Core Wallet — detection, signing, Subnet switching |
| [`event-driven-backend`](skills/event-driven-backend/) | Backend patterns triggered by on-chain events |

### TIER 4 — Quality & Process
*Ship code you can stand behind.*

| Skill | What you get |
|---|---|
| [`security`](skills/security/) | Defensive Solidity, Subnet security, Warp trust assumptions |
| [`testing`](skills/testing/) | Unit, fuzz, fork testing — Hardhat + Foundry patterns |
| [`audit`](skills/audit/) | AI audit prompts, Avalanche-specific checklists |
| [`qa`](skills/qa/) | Pre-launch checklist — Fuji to Mainnet promotion gates |
| [`frontend-ux`](skills/frontend-ux/) | dApp UX rules — chain switch, pending states, errors |
| [`orchestration`](skills/orchestration/) | Multi-agent coordination, on-chain task queues |
| [`kyc-aml-integration`](skills/kyc-aml-integration/) | Synaps, Fractal, Civic — on-chain identity patterns |
| [`evm-wallet-integration`](skills/evm-wallet-integration/) | Reown AppKit, Dynamic.xyz, custom wagmi connectors |

### TIER 5 — Positioning & Intelligence
*Architecture decisions, ecosystem context, and grants.*

| Skill | What you get |
|---|---|
| [`why-avalanche`](skills/why-avalanche/) | Benchmarks, Subnet use cases, EVM compatibility story |
| [`concepts`](skills/concepts/) | C/P/X-Chain, Snow consensus, Subnet vs L2 |
| [`grant-playbook`](skills/grant-playbook/) | infraBUIDL(AI), Retro9000, Codebase + application templates |
| [`account-abstraction`](skills/account-abstraction/) | ERC-4337 — bundlers, paymasters, smart accounts |
| [`acps`](skills/acps/) | Avalanche Community Proposals — track, align, grant-target |

### TIER 6 — Advanced Pro
*Complex patterns for experienced Avalanche builders.*

| Skill | What you get |
|---|---|
| [`upgradeable-contracts`](skills/upgradeable-contracts/) | UUPS, Transparent Proxy, Beacon — storage layout rules |
| [`cross-subnet-dapp`](skills/cross-subnet-dapp/) | Apps that span multiple Subnets via Warp |
| [`subnet-governance`](skills/subnet-governance/) | On-chain governance for custom L1s |
| [`indexing-subgraph`](skills/indexing-subgraph/) | The Graph + custom indexers on Avalanche |
| [`safe-multisig`](skills/safe-multisig/) | Gnosis Safe on Avalanche — treasury, DAO, contract ownership |
| [`validator-manager-contract`](skills/validator-manager-contract/) | ValidatorManager contract (ACP-99) — on-chain validator ops |

---

## Network Reference

### Mainnet

| Chain | Purpose | Chain ID | RPC | Explorer |
| --- | --- | --- | --- | --- |
| **C-Chain** | Smart contracts (EVM) | 43114 | `https://api.avax.network/ext/bc/C/rpc` | [subnets.avax.network/c-chain](https://subnets.avax.network/c-chain) |
| **P-Chain** | Validators + Subnets | — | `https://api.avax.network/ext/bc/P` | [subnets.avax.network/p-chain](https://subnets.avax.network/p-chain) |
| **X-Chain** | Asset exchange | — | `https://api.avax.network/ext/bc/X` | [subnets.avax.network/x-chain](https://subnets.avax.network/x-chain) |

### Fuji Testnet

| Chain | Chain ID | RPC | Explorer |
|---|---|---|---|
| **C-Chain** | 43113 | `https://api.avax-test.network/ext/bc/C/rpc` | [subnets-test.avax.network/c-chain](https://subnets-test.avax.network/c-chain) |
| **P-Chain** | — | `https://api.avax-test.network/ext/bc/P` | [subnets-test.avax.network/p-chain](https://subnets-test.avax.network/p-chain) |
| **X-Chain** | — | `https://api.avax-test.network/ext/bc/X` | [subnets-test.avax.network/x-chain](https://subnets-test.avax.network/x-chain) |

### Custom L1 / Subnet-EVM

| Setup | RPC |
|---|---|
| Local (Avalanche-CLI) | `http://localhost:9650/ext/bc/{chainID}/rpc` |
| AvaCloud Managed | `https://{subnet-id}.rpc.avax.network` |

> Testnet faucet: **[faucet.avax.network](https://faucet.avax.network)** — select Fuji C-Chain, get 2 AVAX free.

---

## Key Contract Addresses (Mainnet C-Chain)

| Contract | Address |
|---|---|
| WAVAX | `0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7` |
| Teleporter Messenger | `0x253b2784c75e510dD0fF1da844684a1aC0aa5fcf` |
| Native Minter Precompile | `0x0200000000000000000000000000000000000001` |
| Fee Manager Precompile | `0x0200000000000000000000000000000000000003` |
| Warp Messenger Precompile | `0x0200000000000000000000000000000000000005` |

---

## How This Works

**The web method (0G model — zero install):**
```
Read https://avaxskills.com/SKILL.md before building on Avalanche.
```

The root `SKILL.md` is a complete index. Your agent reads it, sees all 66 skills with their URLs, then fetches exactly what it needs. One fetch triggers the whole chain.

**Or be specific:**
```
Read https://avaxskills.com/subnet-deployment/SKILL.md before writing any Subnet code.
Read https://avaxskills.com/x402-integration/SKILL.md before implementing agent payments.
```

**Every skill also serves at its URL — works with curl, fetch(), or any HTTP client:**

```bash
curl https://avaxskills.com/warp-messaging/SKILL.md
curl https://avaxskills.com/warp-messaging/rules/RULES.md
curl https://avaxskills.com/warp-messaging/references/teleporter-abi.json
```

---

## Repository Structure

```
avalanche-skills/
├── README.md              ← You are here
├── SKILL.md               ← Root agent index — fetch this first
├── AGENTS.md              ← Wiring guide for Claude, Cursor, Copilot, Windsurf
├── llms.txt               ← LLM-native discovery (like robots.txt for AI)
├── sitemap.xml            ← Web crawler + agent discovery
├── CONTRIBUTING.md        ← How to add or improve a skill
├── LICENSE                ← Apache-2.0
├── package.json
│
├── skills/                ← 66 skills across 7 tiers
│   └── {skill-name}/
│       ├── SKILL.md       ← Core instructions (< 500 lines)
│       ├── rules/         ← Hard guardrails agents must follow
│       ├── references/    ← Deep docs, ABIs, config refs
│       └── scripts/       ← Runnable helpers
│
├── website/               ← avaxskills.com (Next.js)
│   ├── app/
│   │   ├── page.tsx       ← Homepage
│   │   ├── [...slug]/route.ts  ← Serves /{skill}/SKILL.md
│   │   └── api/           ← /api/skills /api/skill /api/search
│   └── scripts/sync-skills.mjs  ← Copies skills to public/
│
└── scripts/
    ├── validate-skill.ts  ← CI validator
    ├── package-skills.sh  ← Generates .zip per skill
    └── generate-index.ts  ← Builds skills.json
```

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). Every skill follows the V2 spec — YAML frontmatter, 7 required sections, 500-line hard cap, `rules/` for guardrails, `references/` for deep docs.

Apache-2.0 · [avaxskills.com](https://avaxskills.com) · [@ayomisco_s](https://x.com/ayomisco_s) · [github.com/Ayomisco/avaxskills](https://github.com/Ayomisco/avaxskills)
