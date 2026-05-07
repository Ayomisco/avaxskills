---
name: "qa"
version: "1.0.0"
spec: "agentskills@1.0"
license: "Apache-2.0"
tier: 4
description: "Pre-launch quality checklist for Avalanche dApps — Fuji to Mainnet promotion gates, validator readiness, and UX testing."
trigger: |
  Use when: preparing for mainnet launch, promoting from Fuji to Mainnet, setting up a Subnet for production, defining launch readiness criteria, or building a QA checklist.
  Do NOT use for: day-to-day development, writing new features, debugging individual bugs.
last_updated: "2026-05-01"
avalanche_networks: [fuji, mainnet]
related_skills:
  - security
  - audit
  - frontend-ux
---

## Overview

Launching on Avalanche requires meeting quality gates across smart contracts, infrastructure, validator readiness, and user experience. This skill provides actionable checklists for Fuji testnet validation, mainnet promotion, and Subnet launch readiness. Each checklist item must be signed off before proceeding.

## When to fetch

Fetch this skill 1-2 weeks before a planned mainnet launch, when setting up CI/CD for a Subnet deployment, or when defining the acceptance criteria for a production release.

## Core Workflow

### Phase 1: Fuji Testnet Checklist

Complete all items on Fuji before mainnet deployment begins.

**Smart Contracts**
- [ ] All contracts deployed to Fuji with verified source on Snowtrace testnet
- [ ] Verify URL: `https://subnets-test.avax.network/c-chain/address/<addr>#code`
- [ ] All unit tests passing (`forge test` / `npx hardhat test`)
- [ ] Fork tests passing against Fuji at pinned block
- [ ] Test coverage ≥90% on critical paths
- [ ] Fuzz tests run for ≥10,000 iterations on financial math
- [ ] Slither static analysis run; all Critical/High findings resolved
- [ ] Manual audit completed (internal or external)

**Functional Testing**
- [ ] All user flows tested end-to-end on Fuji with real wallet (MetaMask)
- [ ] Happy path: deposit, trade, withdraw, claim
- [ ] Unhappy path: insufficient balance, slippage exceeded, oracle failure
- [ ] Edge cases: zero amounts, max amounts, self-transfer

**Cross-Chain (if applicable)**
- [ ] Teleporter message send tested on Fuji → target chain
- [ ] Teleporter message receipt and handler tested
- [ ] Failed message retry tested
- [ ] Fee estimation verified correct

**Infrastructure**
- [ ] RPC endpoints load tested (if self-hosted)
- [ ] Monitoring alerts configured (Snowtrace webhooks, custom alerts)
- [ ] Frontend deployed to staging environment
- [ ] Wallet connection tested: MetaMask, Core, WalletConnect

### Phase 2: Mainnet Promotion Checklist

Do not proceed without all Fuji items complete.

**Security Sign-Off**
- [ ] External audit report received and all Critical/High findings resolved
- [ ] Audit re-scope completed if contracts changed post-audit
- [ ] Admin keys migrated to Gnosis Safe (3-of-5 or stronger)
- [ ] All precompile admin addresses are multisig (not EOA)
- [ ] Emergency pause mechanism tested on Fuji
- [ ] Incident response plan documented and team briefed

**Deployment**
- [ ] Deployment script reviewed and dry-run completed
- [ ] Constructor arguments documented and verified
- [ ] Contract verification on Snowtrace (mainnet) completed
  ```bash
  forge verify-contract \
    --chain-id 43114 \
    --etherscan-api-key $SNOWTRACE_API_KEY \
    <CONTRACT_ADDRESS> \
    src/MyContract.sol:MyContract
  ```
- [ ] All proxy admin addresses are multisig

**Operational Readiness**
- [ ] Real-time monitoring dashboard live (Dune, Tenderly, or custom)
- [ ] On-call rotation defined
- [ ] Incident runbook documented
- [ ] Rollback plan defined (pause + upgrade path)
- [ ] Disclosure channel established (security@yourproject.com)

**Legal & Compliance**
- [ ] Terms of service published
- [ ] Privacy policy published
- [ ] KYC/AML requirements assessed (if applicable)
- [ ] Regulatory review completed for target markets

### Phase 3: Subnet Launch Checklist

Additional requirements for custom Subnet launches.

**Validator Readiness**
- [ ] Minimum 5 independent validators confirmed
- [ ] No single entity controls >40% of stake weight
- [ ] All validators running compatible Subnet-EVM version
- [ ] Validators have agreed to SLA (uptime ≥99%)
- [ ] Validator monitoring set up (node health endpoints)
  ```bash
  # Check validator health
  curl -X POST \
    -H "Content-Type: application/json" \
    --data '{"jsonrpc":"2.0","id":1,"method":"health.health","params":{}}' \
    http://validator-node:9650/ext/health
  ```

**Genesis Verification**
- [ ] genesis.json reviewed by security team
- [ ] Chain ID unique and not conflicting with known chains
- [ ] Gas limit appropriate (≥8M, recommended 15M)
- [ ] Precompile configurations match intended access control
- [ ] Initial token distribution verified
- [ ] Genesis hash documented

**Bridge & Interoperability**
- [ ] ICTT (Interchain Token Transfer) bridge tested on testnet
- [ ] Teleporter contracts deployed and verified on both chains
- [ ] Bridge fee parameters documented
- [ ] Bridge limits (per-tx, per-day) configured

**Post-Launch**
- [ ] First 48 hours monitoring on-call staffed
- [ ] Community announcement prepared
- [ ] Documentation published (user guides, developer docs)
- [ ] Bug bounty program live

### Automated QA Commands

```bash
# Full pre-launch test run
forge test --fork-url https://api.avax-test.network/ext/bc/C/rpc -vvv

# Slither security scan
slither . --filter-paths "lib/,node_modules/" --checklist | tee audit/slither-report.md

# Gas snapshot (compare before/after)
forge snapshot
git diff .gas-snapshot

# Contract size check (limit 24KB)
forge build --sizes | awk '{if ($2 > 20) print "WARNING: "$1" is "$2"KB"}'

# Verify deployment on Fuji
cast code <CONTRACT_ADDRESS> --rpc-url https://api.avax-test.network/ext/bc/C/rpc | wc -c
```

## Key concepts

**Promotion Gate**: The Fuji → Mainnet promotion is a one-way gate. Treat it as such. Every item on the checklist must be signed off by a named team member, not just checked off.

**Multisig Admin**: On mainnet, any address with admin power (contract owner, precompile admin, upgrade authority) must be a Gnosis Safe. Single EOA admin keys are a critical security risk.

**Emergency Pause**: Every contract with significant TVL should have a pause mechanism. Test it on Fuji — verify the pause actually stops fund movement and can be unpaused.

**Validator Diversity**: Avalanche Subnets with fewer than 5 validators, or with validators controlled by one entity, are vulnerable to collusion and censorship. This is a hard launch gate.

**Audit Re-scope**: If you change contracts after an audit, the changes must be reviewed. Even small changes can introduce new vulnerabilities at integration points.

## Common errors

| Error | Cause | Fix |
|---|---|---|
| Contract not verified on Snowtrace | Missing Etherscan API key or wrong compiler settings | Match exact solc version, optimizer runs, and constructor args used in deployment |
| Gnosis Safe can't execute txs | Wrong network added to Safe | Add Avalanche C-Chain (43114) to Safe's supported networks |
| Validator not syncing Subnet | Wrong Subnet ID in config | Verify Subnet ID matches genesis and P-Chain registration |
| Genesis hash mismatch | genesis.json changed after initial test | Lock genesis.json in version control; never modify after first use |
| Emergency pause breaks cross-chain flow | Pause doesn't stop Teleporter callbacks | Ensure pause modifier is on `receiveTeleporterMessage` too |

## Next skills

- `security` — implement security requirements from this checklist
- `audit` — run audit as part of mainnet promotion gate
- `frontend-ux` — UX testing checklist for dApp launch
