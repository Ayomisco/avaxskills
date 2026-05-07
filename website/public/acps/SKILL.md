---
name: "acps"
version: "1.0.0"
spec: "agentskills@1.0"
license: "Apache-2.0"
tier: 5
description: "Understand and track Avalanche Community Proposals (ACPs) — network changes, how to engage, and how to align grant applications with active ACPs."
trigger: |
  Use when: user asks about Avalanche network upgrades, upcoming protocol changes, how decisions get made,
  ACP process, aligning a project with Avalanche's roadmap, or writing a grant application.
  Do NOT use for: smart contract development, Subnet deployment, or day-to-day coding tasks.
last_updated: "2026-05-07"
related_skills:
  - why-avalanche
  - grant-playbook
  - concepts
  - subnet-deployment
  - validator-management
---

## Overview

Avalanche Community Proposals (ACPs) are the formal mechanism by which Avalanche evolves. Anyone can write an ACP; validators vote on activation. Understanding the ACP pipeline tells you what Avalanche is becoming — not just what it is now. For builders, knowing which ACPs are active or upcoming lets you build ahead of the curve and write grant applications that the Foundation actually wants to fund.

ACPs live at: **https://github.com/avalanche-foundation/ACPs**

## When to fetch

Fetch when deciding what to build (align with open ACPs), writing a grant application (reference relevant ACPs), or when asked about Avalanche's technical roadmap. Also fetch when code touches staking, fees, or Subnet mechanics — these areas change via ACPs.

## Core Workflow

### Step 1 — Browse Active ACPs

```bash
# All ACPs (open, accepted, rejected, stale)
https://github.com/avalanche-foundation/ACPs

# Filter by status
https://github.com/avalanche-foundation/ACPs/pulls?q=is%3Aopen+label%3AProposal
```

Each ACP folder: `ACPs/{number}-{name}/README.md`

---

### Step 2 — Understand the ACP Lifecycle

```
Idea
  └─► Draft PR opened on github.com/avalanche-foundation/ACPs
        └─► Community discussion in PR comments
              └─► Validator signaling (via avalanche-cli or staking UI)
                    ├─► Activated (included in AvalancheGo release)
                    └─► Rejected / Stale
```

**Validator voting** happens via AvalancheGo's `--avalanche-proposal-support` flag or via the Builder Hub UI. A supermajority of stake (typically 80%) is needed for activation.

---

### Step 3 — Key ACPs Every Builder Should Know

| ACP | Name | Status | Impact |
|---|---|---|---|
| ACP-77 | Reinventing Subnets | Activated | Renamed "Subnets" → "Avalanche L1s". Sovereign L1s no longer need Primary Network validators. Changes `platform` CLI commands. |
| ACP-118 | Warp Signature Request API | Activated | Standardizes how Warp signatures are requested and returned. Affects cross-chain messaging code. |
| ACP-131 | Cancun EIPs on C-Chain | Activated | EIP-4844 blobs, MCOPY opcode, transient storage on C-Chain. If you use Solidity 0.8.24+ features, this enabled them. |
| ACP-125 | Reduce C-Chain Min Base Fee | Activated | Reduced minimum base fee from 25 nAVAX to 1 nAVAX. Affects gas estimation if you hard-coded the old minimum. |
| ACP-20 | Ed25519 P-Chain Signatures | Draft | Allows Ed25519 keys for staking. Affects wallet integrations that sign P-Chain transactions. |
| ACP-62 | Disable AddValidator/AddDelegator | Activated | Old staking methods deprecated. Use `AddPermissionlessValidator` and `AddPermissionlessDelegator`. |

---

### Step 4 — Track New ACPs

Watch the GitHub repo for new proposals:
```
https://github.com/avalanche-foundation/ACPs/subscription
```

Join the ACP discussion Discord channel:
```
discord.gg/avalanche → #acp-discussion
```

Monitor Avalanche blog for ACP roundups:
```
https://medium.com/avalancheavax
```

---

### Step 5 — Writing Code That Survives ACPs

Three areas change frequently:

**1. Staking and P-Chain operations**
ACP-62 deprecated `AddValidator`/`AddDelegator`. Always use the `Permissionless` variants:
```typescript
// WRONG (deprecated by ACP-62)
await pchain.addValidator(...)
// RIGHT
await pchain.addPermissionlessValidator(...)
```

**2. Fee handling**
ACP-125 changed the minimum base fee. Never hardcode fee amounts — always query:
```typescript
// Query current base fee dynamically
const fee = await provider.getFeeData()
const gasPrice = fee.maxFeePerGas  // use this, not a hardcoded value
```

**3. Cross-chain messaging**
ACP-118 changes how Warp signature requests work. If you query signatures directly from nodes, update to the new `warp_getMessageSignature` RPC method.

---

### Step 6 — Aligning Grants with ACPs

**Why this matters:** The Avalanche Foundation funds projects that accelerate the network's stated direction. If an ACP is "Accepted" but waiting for tooling, building that tooling is a grant fast-track.

**Tactical approach:**
1. Find ACPs in "Accepted" or "Implementable" status
2. Look for what tooling, examples, or SDKs are missing for that ACP
3. Build that gap
4. In your grant application: "ACP-77 changed Subnets to L1s. We built the first developer skills package covering the new Platform CLI and L1 economics (avalanche-l1-economics skill). This directly supports developer adoption of ACP-77."

**Current high-value ACP alignment opportunities (May 2026):**
- ACP-77: L1 tooling, economics calculators, migration guides (Subnet → L1)
- AI agent payments: x402 protocol aligns with Avalanche's AI × Web3 push
- Interoperability: Warp messaging tooling aligns with cross-chain ACPs

---

## Key concepts

- **ACP** — Avalanche Community Proposal. Formal document proposing a change to the Avalanche protocol, tooling, or processes.
- **Validator signaling** — Validators indicate support/opposition for an ACP via their node config. This is the voting mechanism.
- **Activation threshold** — Typically 80% of stake weight must signal support before an ACP activates in a network upgrade.
- **Network upgrade** — A specific AvalancheGo release that includes one or more activated ACPs. Named releases (e.g., "Durango", "Etna") bundle multiple ACPs.
- **Etna upgrade** — Most recent major upgrade (late 2024/early 2025). Included ACP-77 (L1s) and ACP-118 (Warp API). Code written before Etna may use deprecated patterns.

---

## Common errors

| Error | Cause | Fix |
|---|---|---|
| `method not found: AddValidator` | ACP-62 deprecated this RPC | Switch to `AddPermissionlessValidator` |
| Cross-chain message signature fetch fails | ACP-118 changed the API | Update to `warp_getMessageSignature` RPC method |
| Gas estimation too high / too low | Hardcoded gas price pre-ACP-125 | Always fetch live fee data, never hardcode |
| L1 creation commands different from docs | ACP-77 renamed Subnets to L1s | Use `platform l1` CLI commands, not `avalanche subnet` |

---

## Next skills

- `grant-playbook` — Use ACP alignment to strengthen your grant application
- `why-avalanche` — How ACPs fit into Avalanche's broader competitive positioning
- `validator-management` — Updated validator operations post-ACP-62
- `warp-messaging` — Updated cross-chain messaging post-ACP-118
- `subnet-deployment` — Updated L1 deployment post-ACP-77
