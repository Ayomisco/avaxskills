---
name: "hackathon-bounties"
version: "1.0.0"
spec: "agentskills@1.0"
license: "Apache-2.0"
tier: 3
description: "Current Avalanche hackathon bounties, winning patterns, judge signals, and DoraHacks submission strategy."
trigger: |
  Use when: user is participating in an Avalanche hackathon, wants to win bounties, needs to understand what judges look for, asks about DoraHacks submission, wants to know the best project ideas for Avalanche.
  Do NOT use for: general smart contract development with no hackathon context.
last_updated: "2026-05-01"
related_skills:
  - why-avalanche
  - x402-integration
  - subnet-deployment
  - grant-playbook
  - warp-messaging
---

## Overview

Avalanche runs regular hackathons on DoraHacks with large prize pools across multiple tracks. The judges consistently reward projects that actually use Avalanche-unique features (Subnets, Warp, x402) over projects that are just EVM contracts that could run anywhere. This skill gives you the winning playbook: which tracks exist, what wins, what loses, and how to submit.

## When to fetch

Fetch at the start of any hackathon session. Cross-reference with `x402-integration` and `subnet-deployment` for the most competitive tracks.

## Core Workflow

### Current Active Tracks (2025-2026)

**Find current bounties:** https://dorahacks.io/avalanche

**Primary tracks:**

**1. infraBUIDL(AI) — Highest prizes ($5K-$25K)**
- Goal: Infrastructure for AI agents on Avalanche
- What wins: x402 payment protocol, agent wallet management, on-chain memory, MCP tools that use Avalanche
- What judges look for: real agents making real on-chain calls, not just demos
- Stack hint: x402 + Claude/GPT-4 + Avalanche C-Chain + Subnet (bonus)

**2. DeFi Innovation ($3K-$15K)**
- Goal: Novel DeFi primitives or improvements on Avalanche
- What wins: new AMM curves, novel lending mechanics, cross-Subnet DeFi, real yield sources
- What judges look for: TVL potential, genuine innovation (not a fork), Warp cross-chain capability
- Stack hint: Subnet-EVM + Warp + Teleporter for cross-chain DeFi

**3. Real World Assets (RWA) ($5K-$20K)**
- Goal: Tokenize real-world assets using Avalanche
- What wins: regulatory-aware design (KYC hooks, transfer restrictions), dedicated Subnet for compliance isolation, real asset partnership or dataset
- What judges look for: legal awareness, compliance architecture, actual asset backing
- Stack hint: ERC-1400/ERC-3643 + Subnet with allowlist precompile + KYC integration

**4. AI Agents ($5K-$25K)**
- Goal: AI agents that use blockchain for payments/memory/coordination
- What wins: agents that pay for API calls with AVAX/USDC, multi-agent systems, on-chain state persistence
- What judges look for: genuine agent autonomy (not a chatbot), real on-chain interactions
- Stack hint: x402 + Claude API + Avalanche + MCP server

### What Judges Score (Estimated Weight)

| Criterion | Weight | Notes |
|---|---|---|
| Avalanche-native features | 30% | Subnets, Warp, precompiles, x402 — not just EVM |
| Technical execution | 25% | Working demo, clean code, real transactions |
| Innovation | 20% | Genuinely new, not a copy of existing projects |
| Real user/market value | 15% | Actual problem being solved, not a toy |
| Presentation quality | 10% | Demo video, clear pitch, docsheetsumbit quality |

**Bonus points:**
- Live on Fuji testnet (not just localhost)
- Cross-chain messaging (Warp/Teleporter)
- Custom Subnet deployed (even if simple)
- AI integration with real agent behavior
- Working frontend + wallet integration

### Winning Project Patterns from Past Hackathons

**Pattern 1: AI Agent + x402 Payments**
- Agent autonomously pays for data/compute using USDC on C-Chain
- x402 server gating premium API endpoints
- Agent accumulates results and posts to chain
- Why it wins: uses Avalanche-unique payment speed, demonstrates AI autonomy

**Pattern 2: Cross-Subnet DeFi**
- DeFi protocol deployed across C-Chain + custom Subnet
- Uses Teleporter for cross-chain token transfers and price sync
- Separate Subnet gives custom gas token or permissioned trading
- Why it wins: Warp messaging is Avalanche's killer feature — judges love to see it

**Pattern 3: RWA with Compliance Subnet**
- Tokenize real asset (real estate, invoice, carbon credit)
- Dedicated Subnet with ContractDeployerAllowList (permissioned)
- KYC hook using AllowList precompile
- Transfer restrictions via ERC-1400 partitions
- Why it wins: RWA track + Subnet usage = double points

**Pattern 4: AI Memory Protocol**
- On-chain storage for AI agent memory/context
- IPFS for large data, on-chain index/hash
- Agent reads/writes memory across sessions
- Incentivization layer for memory providers
- Why it wins: novel infra + AI narrative

**Pattern 5: MCP Server for Avalanche**
- Model Context Protocol server exposing Avalanche tools
- Tools: check balance, send transaction, read contract, query validators
- Claude/GPT-4 can call Avalanche directly
- Why it wins: enables any AI to use Avalanche, infrastructure play

### Common Mistakes That Lose Bounties

**Technical mistakes:**
- Only working on localhost (no Fuji deployment)
- Using Hardhat network for demo (not real chain)
- Missing events/logs (judges verify on Snowtrace)
- No frontend — CLI-only demos score lower

**Strategic mistakes:**
- Building something that works on any EVM (no Avalanche differentiation)
- Cloning an existing project (Uniswap v2 fork, OpenZeppelin clone)
- No user journey — too much infra, no product
- Ignoring the track requirements and submitting to wrong track

**Presentation mistakes:**
- Demo video longer than 3 minutes (judges skip)
- No working link in submission (broken demo = disqualified)
- Missing GitHub repo or empty repo
- No README explaining the Avalanche-specific parts

### DoraHacks Submission Strategy

**Before deadline (72h+):**
1. Deploy to Fuji testnet — get real transaction hashes
2. Record demo video showing actual on-chain txs
3. Write clear README.md with: what it does, Avalanche features used, how to run

**Submission form fields:**
- **Project name**: Keep it memorable, 2-3 words
- **Track**: Choose primary + 1-2 secondary if eligible
- **Short description**: Lead with the Avalanche feature, not the problem
  - Bad: "A marketplace for digital assets"
  - Good: "Cross-Subnet NFT marketplace using Teleporter with custom gas token Subnet"
- **Demo URL**: Working link, not YouTube-only
- **GitHub**: Public repo with clean commit history (not one giant commit)
- **Demo video**: Under 3 minutes, show actual MetaMask confirmations on Fuji
- **Contract addresses**: Include verified Fuji addresses on Snowtrace

**Sample winning description format:**
```
[PROJECT NAME] uses [SPECIFIC AVALANCHE FEATURE] to solve [SPECIFIC PROBLEM] 
for [TARGET USER]. Unlike [EXISTING SOLUTION], we [KEY DIFFERENTIATOR].
Technical: [Subnet/Warp/x402/precompile used]. Live on Fuji at [address].
```

### Finding Bounties and Resources

**Official:**
- DoraHacks: https://dorahacks.io/avalanche
- Avalanche grants: https://www.avax.network/grants
- Discord: https://discord.gg/avalanche → #hackathon channel

**Discord channels to monitor:**
- `#avalanche-foundation` — official announcements
- `#hackathon` — current hackathon discussion and team formation
- `#faucet` — get testnet AVAX
- `#developers` — technical help from Ava Labs team

**Technical office hours:**
Ava Labs engineers often run office hours during hackathons. Check #hackathon Discord for schedule. Ask specifically about Warp/Teleporter or Subnet config — they know the stack.

### Stack Recommendations by Track

**infraBUIDL(AI):**
```
TypeScript + Claude API + x402 (Express middleware) + viem + Avalanche C-Chain
Optional: MCP server, custom Subnet, Warp for cross-chain agent calls
```

**DeFi:**
```
Solidity 0.8.20 + Hardhat/Foundry + Subnet-EVM + Teleporter
DEX: Uniswap v2 pattern adapted for custom gas token
Oracles: Chainlink on C-Chain, or Warp-based price feeds
```

**RWA:**
```
Solidity (ERC-1400 or ERC-3643) + Subnet with AllowList precompile
KYC: off-chain verify, on-chain allowlist update via FeeManager/AllowList admin
Frontend: Next.js + wagmi + Core Wallet
```

**AI Agents:**
```
Python or TypeScript agent + LLM (Claude/GPT) + Tool calling
Tools connect to Avalanche: read state, send tx, call contracts
x402 for paying other agents/services
On-chain state for memory persistence
```

### Quick Scorecard — Self-Assessment

Before submitting, check:
- [ ] Live on Fuji testnet with real tx hashes
- [ ] At least 1 Avalanche-unique feature (Subnet OR Warp OR x402 OR precompile)
- [ ] Demo video under 3 min showing actual transactions
- [ ] Working public URL (frontend or API)
- [ ] GitHub repo with README explaining Avalanche features used
- [ ] Correct track selected on DoraHacks
- [ ] Contract verified on testnet.snowtrace.io
- [ ] Events/logs visible on Snowtrace for demo transactions

## Key concepts

**Track alignment** — Each track has a budget and judges. Submit to the most specific track your project fits, not the one with the biggest prize. Wrong track = lower score.

**Avalanche differentiation** — The key question judges ask: "Could this be deployed on Ethereum with no changes?" If yes, you're not using Avalanche correctly. Warp, Subnets, and x402 are unique.

**Working demo > Perfect code** — Hackathon judges prefer a buggy demo that works over clean code that doesn't run. Deploy early, polish later.

**DoraHacks Buidl page** — Your primary submission artifact. Keep it under 500 words with clear sections. Judges read dozens — be scannable.

**Fuji over localhost** — Always deploy to Fuji. Judges verify addresses on Snowtrace. Local deployment = zero credibility.

## Common errors

| Error | Cause | Fix |
|---|---|---|
| Project not advancing in judging | No Avalanche differentiation | Add Subnet, Warp, or x402 to your architecture |
| Demo fails during judging | Only tested on localhost | Deploy to Fuji, test full flow from fresh wallet |
| Wrong track rejection | Misaligned submission | Read track requirements before building, not after |
| Low score despite good code | Poor presentation | Record clear demo video, write submission description focused on Avalanche features |
| Disqualified | Missing working demo link | Test all URLs before submitting; don't submit until it works |

## Next skills

- `why-avalanche` — articulate why Avalanche for your judges
- `x402-integration` — implement x402 for the AI agent tracks
- `subnet-deployment` — add a Subnet to score Avalanche differentiation points
- `warp-messaging` — cross-chain messaging for DeFi and AI agent tracks
