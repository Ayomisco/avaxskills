---
name: "grant-playbook"
version: "1.0.0"
spec: "agentskills@1.0"
license: "Apache-2.0"
tier: 5
description: "All Avalanche grant programs — infraBUIDL(AI), Retro9000, Codebase grants, and Foundation grants with application templates."
trigger: |
  Use when: applying for Avalanche grants, evaluating which grant program fits a project, writing grant applications, or understanding Avalanche Foundation funding criteria.
  Do NOT use for: non-Avalanche grant programs, general fundraising strategy, VC fundraising.
last_updated: "2026-05-01"
related_skills:
  - hackathon-bounties
  - why-avalanche
---

## Overview

The Avalanche ecosystem has multiple grant programs targeting different project stages and types. This skill covers all active programs, their focus areas, funding amounts, and application strategies. Each program has distinct criteria — matching your project to the right program is the first step.

## When to fetch

Fetch when starting a grant application, when a project is nearing a milestone that could qualify for retroactive funding, or when evaluating whether to build on Avalanche for grant-backed funding support.

## Core Workflow

### Program Overview

| Program | Focus | Amount | Stage |
|---|---|---|---|
| infraBUIDL(AI) | AI + blockchain infra | Up to $50k | Build phase |
| Retro9000 | Retroactive contributions | Varies (up to $1M+) | Post-launch |
| Codebase | Dev tools & ecosystem | $5k–$100k | Build phase |
| Foundation Grants | Large ecosystem projects | $100k+ | Growth phase |

### 1. infraBUIDL(AI) Program

**Focus**: Infrastructure projects combining AI and blockchain, with emphasis on Avalanche. Targets: AI agent frameworks, autonomous AI systems using crypto rails, on-chain AI coordination, verifiable AI.

**Amount**: Up to $50,000 in AVAX

**What they fund**:
- AI agent infrastructure that uses Avalanche for payments or coordination
- On-chain verifiable AI outputs
- Developer tools for building AI + blockchain apps
- Cross-chain AI agent communication using Warp/Teleporter

**Application URL**: https://grants.avax.network

**Winning application template**:

```
## Project Name: [Name]

## One-liner: [What it does in 1 sentence]

## Problem: [2-3 sentences on the problem you're solving]

## Solution: [What you're building and how it uses Avalanche]

## Why Avalanche:
- Fast finality (1-2s) enables real-time agent coordination
- Low gas costs make per-task micropayments viable
- [Specific Avalanche feature your project uses]

## Technical Architecture:
[Diagram or description of key components and how Avalanche is used]

## Traction / Progress:
- [Code repo link]
- [Demo link or video]
- [Any users / integrations]

## Milestones:
1. [Milestone 1] — [Date] — [$X of grant]
2. [Milestone 2] — [Date] — [$Y of grant]
3. Launch on Fuji — [Date] — [$Z of grant]
4. Mainnet launch — [Date] — [Final disbursement]

## Team:
- [Name]: [Background, relevant experience]
- [GitHub profiles]

## Grant Amount Requested: $[X]

## How funds will be used:
- Development: $X (describe)
- Auditing: $X
- Infrastructure: $X
```

### 2. Retro9000 Program

**Focus**: Retroactive rewards for builders who have already shipped on Avalanche. Modeled on Optimism's RetroPGF. Rewards past contributions to the ecosystem.

**Amount**: Varies — small projects: $1k-$10k; large ecosystem contributions: $100k-$1M+

**Eligibility**:
- Must have shipped something on Avalanche (testnet or mainnet)
- Must have demonstrated impact (users, TVL, developer adoption, etc.)
- Open to: protocols, tools, content, infrastructure

**How to qualify**:
1. Build and launch on Avalanche (Fuji counts)
2. Generate measurable impact
3. Apply retroactively with proof of work and metrics

**What Retro9000 rewards**:
- Open-source developer tooling used by other builders
- Protocols with measurable TVL or user activity
- Educational content with demonstrated reach
- Infrastructure others depend on

**Application URL**: https://retro9000.avax.network (check for current round)

**Metrics to track from day one** (needed for retro application):
```
- Unique users (wallet addresses) interacting with your contract
- Total transactions processed
- TVL (if DeFi)
- Developer adoptions (if tooling)
- GitHub stars / forks (if open source)
- npm downloads (if SDK/library)
```

### 3. Codebase Grants

**Focus**: Developer tooling, SDKs, documentation, and ecosystem infrastructure. Lower amounts, faster approval cycles.

**Amount**: $5,000–$100,000

**Best for**:
- Developer tools (CLI tools, SDKs, testing frameworks)
- Documentation improvements
- Integrations (connecting Avalanche to other ecosystems)
- Education resources and tutorials

**Application URL**: https://grants.avax.network

**Key evaluation criteria**:
- Will this help other developers build on Avalanche?
- Is there a gap in current tooling this fills?
- Is the team capable of delivering?
- Is the code open-source?

### 4. Foundation Grants

**Focus**: Large-scale ecosystem projects, DeFi protocols with significant TVL potential, cross-chain infrastructure, consumer applications with mass-market potential.

**Amount**: $100,000–$1,000,000+

**Requirements**:
- Proven team with track record
- Detailed technical specification
- Clear go-to-market plan
- Committed to Avalanche as primary/launch chain
- Ideally: some traction or existing product

**Contact**: grants@avax.network or via https://grants.avax.network

### Application Strategy

**Step 1: Qualify your project**
```
infraBUIDL(AI)?  →  Does it use AI + Avalanche infra?
Retro9000?       →  Have you shipped something with measurable impact?
Codebase?        →  Is it developer tooling or ecosystem infrastructure?
Foundation?      →  Is it large-scale with proven team + traction?
```

**Step 2: Build before you apply**

For all programs, having working code dramatically improves approval rates:
```bash
# Minimum bar for a strong application:
- Working demo on Fuji testnet
- Public GitHub repo
- README with setup instructions
- At least one measurable metric (users, transactions, etc.)
```

**Step 3: Align with Avalanche narrative**

Current focus areas (2025-2026):
- AI agents using crypto rails (payments, coordination)
- Real-world asset (RWA) tokenization
- Institutional DeFi
- Gaming and consumer apps
- Developer infrastructure

**Step 4: Milestone structure**

Grant disbursements are typically milestone-based. Structure milestones as:
- Milestone 1 (25%): Core smart contracts deployed on Fuji + verified
- Milestone 2 (25%): Frontend + integration complete + Fuji testing done
- Milestone 3 (25%): External audit complete + mainnet deployment
- Milestone 4 (25%): Post-launch: X users, Y transactions, public documentation

**Step 5: Follow up**

Most grant committees review monthly. If no response in 3 weeks, one polite follow-up email is appropriate. Include: project name, application date, brief status update.

## Key concepts

**Retroactive vs. Proactive**: Retro9000 funds what you've already built. infraBUIDL and Codebase fund what you're going to build. Apply to Retro9000 after launch; apply to others before.

**Grant vs. Investment**: Grants are typically non-dilutive (no equity). They do have milestone requirements and may require open-sourcing your code.

**AVAX Denomination**: Most grants pay in AVAX. Factor in price volatility when planning — ask if USD-denominated payments are available for larger grants.

**Exclusivity**: Avalanche grants do not typically require exclusivity. You can apply for grants from multiple ecosystems simultaneously (but disclose this).

## Common errors

| Mistake | Fix |
|---|---|
| Applying with no code | Build a Fuji demo first — even minimal — before applying |
| Vague milestones | Use concrete, verifiable milestones with dates and deliverables |
| No Avalanche-specific rationale | Explain specifically why Avalanche and what Avalanche features you use |
| Requesting too much with no track record | Start with Codebase grants; prove yourself before Foundation grants |
| Missing metrics | Track user activity from day one; grant reviews want to see traction |

## Next skills

- `hackathon-bounties` — win Avalanche hackathon prizes
- `why-avalanche` — articulate Avalanche's advantages for grant applications
