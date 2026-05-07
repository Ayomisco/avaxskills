---
name: "audit"
version: "1.0.0"
spec: "agentskills@1.0"
license: "Apache-2.0"
tier: 4
description: "Structured audit prompts and checklists for Avalanche contracts — Subnet-specific checks and Teleporter invariants."
trigger: |
  Use when: preparing contracts for external audit, doing an internal security review, prompting an AI agent to review code for vulnerabilities, or verifying Teleporter/Warp invariants before mainnet.
  Do NOT use for: general code quality review, performance optimization, UI/UX review.
last_updated: "2026-05-01"
avalanche_networks: [fuji, mainnet]
related_skills:
  - security
  - testing
  - qa
---

## Overview

An audit on Avalanche must cover standard EVM vulnerabilities plus Avalanche-specific attack surfaces: Warp message trust assumptions, precompile access control, Subnet validator risks, and Teleporter invariants. This skill provides a complete audit checklist, AI audit prompt templates, and guidance on writing audit-ready code.

## When to fetch

Fetch before any mainnet deployment, after completing major feature work, or whenever an AI agent is tasked with reviewing contract security. Also fetch when a third-party auditor needs a scope definition.

## Core Workflow

1. **Prepare audit-ready code**
   ```bash
   # Generate flat files for auditors
   forge flatten src/MyContract.sol > audit/MyContract.flat.sol

   # Generate NatSpec documentation
   forge doc

   # Export ABI
   forge inspect MyContract abi > audit/MyContract.abi.json

   # Run slither before sending to auditor
   slither . --filter-paths "lib/,node_modules/" --checklist > audit/slither-report.md
   ```

2. **AI audit prompt — general security review**

   Use this prompt when asking an AI agent to review a contract:

   ```
   You are a senior smart contract security auditor. Review the following Solidity contract
   for security vulnerabilities. Focus on:

   1. Reentrancy (check for CEI violations, missing nonReentrant guards)
   2. Access control (tx.origin use, missing role checks, owner single points of failure)
   3. Integer arithmetic (overflow/underflow in unchecked blocks)
   4. Oracle manipulation (price feed staleness, missing bounds checks)
   5. Front-running (commit-reveal missing, deadline parameters)
   6. Denial of service (loops over unbounded arrays, push-based payments)
   7. Signature replay (missing nonce or chainId in signatures)
   8. Avalanche-specific: Warp/Teleporter trust (is sourceBlockchainID validated? is originSender validated? is msg.sender checked against TELEPORTER_MESSENGER?)
   9. Avalanche-specific: Precompile access (are precompile admin addresses multisig?)
   10. Upgradeable contracts: storage layout collisions, missing initializer guards

   For each finding, report: severity (Critical/High/Medium/Low/Informational), location, description, and recommended fix.

   Contract:
   [PASTE CONTRACT HERE]
   ```

3. **AI audit prompt — Teleporter invariants**

   ```
   Review this Teleporter-integrated contract for cross-chain invariants:

   1. Does receiveTeleporterMessage check msg.sender == TELEPORTER_MESSENGER_ADDRESS?
   2. Does it validate sourceBlockchainID against a whitelist?
   3. Does it validate originSenderAddress against a whitelist?
   4. Are there reentrancy risks in the message handler?
   5. Is there a message replay attack vector (same message ID delivered twice)?
   6. Does the contract handle failed message delivery gracefully?
   7. Is there a fee mechanism to pay for Teleporter gas on the destination?
   8. Can an attacker craft a message to drain funds or bypass access control?

   Contract:
   [PASTE CONTRACT HERE]
   ```

4. **Complete Audit Checklist**

| Category | Check | Severity if Missing | Status |
|---|---|---|---|
| **Access Control** | No `tx.origin` for auth | Critical | [ ] |
| **Access Control** | Admin functions behind `onlyOwner` or role | Critical | [ ] |
| **Access Control** | Owner is multisig (not EOA) on mainnet | High | [ ] |
| **Access Control** | Role renounce/transfer is protected | High | [ ] |
| **Reentrancy** | All external calls follow CEI | Critical | [ ] |
| **Reentrancy** | `nonReentrant` on state-changing external functions | High | [ ] |
| **Reentrancy** | No cross-function reentrancy via shared state | High | [ ] |
| **Arithmetic** | No `unchecked` on user-controlled values | High | [ ] |
| **Arithmetic** | Division before multiplication caught | Medium | [ ] |
| **Oracle** | Price staleness check (updatedAt + threshold) | High | [ ] |
| **Oracle** | Price bounds check (not zero, not extreme) | High | [ ] |
| **Oracle** | Uses Chainlink, not custom or manipulable source | High | [ ] |
| **Front-Running** | Slippage parameters on swaps | High | [ ] |
| **Front-Running** | Commit-reveal for sensitive actions | Medium | [ ] |
| **DoS** | No unbounded loops over user-controlled arrays | High | [ ] |
| **DoS** | Pull payment pattern (not push) | Medium | [ ] |
| **Signatures** | EIP-712 signatures include chainId and nonce | High | [ ] |
| **Signatures** | Nonce incremented after use | High | [ ] |
| **Upgradeability** | Storage layout has no gaps between upgrades | Critical | [ ] |
| **Upgradeability** | `initialize` has `initializer` modifier | Critical | [ ] |
| **Upgradeability** | `_disableInitializers()` in constructor | High | [ ] |
| **Warp/Teleporter** | `msg.sender == TELEPORTER_MESSENGER` check | Critical | [ ] |
| **Warp/Teleporter** | `sourceBlockchainID` whitelist enforced | Critical | [ ] |
| **Warp/Teleporter** | `originSenderAddress` whitelist enforced | Critical | [ ] |
| **Warp/Teleporter** | Message replay protected | High | [ ] |
| **Precompile** | Admin addresses are multisig | Critical | [ ] |
| **Precompile** | Precompile enable/disable is governed | High | [ ] |
| **Subnet** | Validator set has ≥5 independent operators | High | [ ] |
| **Subnet** | Genesis config reviewed by security team | High | [ ] |
| **ERC Standards** | ERC-20: SafeERC20 used for transfers | Medium | [ ] |
| **ERC Standards** | ERC-721: reentrancy in `onERC721Received` | High | [ ] |
| **Events** | All state changes emit events | Low | [ ] |
| **Tests** | Coverage ≥90% on critical paths | High | [ ] |
| **Tests** | Fuzz tests on financial math | High | [ ] |
| **Tests** | Fork tests run on Fuji before mainnet | High | [ ] |

5. **Write audit-ready code — NatSpec template**
   ```solidity
   // SPDX-License-Identifier: Apache-2.0
   pragma solidity ^0.8.24;

   /// @title MyProtocol
   /// @author Your Team
   /// @notice [One sentence: what users do with this contract]
   /// @dev [Technical notes for auditors: key invariants, trust assumptions]
   /// @custom:security-contact security@yourproject.com
   contract MyProtocol {

       /// @notice Deposits tokens into the vault
       /// @dev Caller must have approved this contract for `amount` tokens
       /// @param token ERC-20 token address to deposit
       /// @param amount Amount to deposit (in token's native decimals)
       /// @return shares Number of vault shares minted to caller
       function deposit(address token, uint256 amount)
           external
           nonReentrant
           returns (uint256 shares)
       {
           // ...
       }
   }
   ```

6. **Run automated tools before audit**
   ```bash
   # Slither — static analysis
   slither . --filter-paths "lib/" --print human-summary

   # Mythril — symbolic execution (slower, deeper)
   myth analyze src/MyContract.sol --solc-version 0.8.24 --max-depth 10

   # Aderyn — Rust-based static analyzer
   cargo install aderyn
   aderyn .

   # Check for known vulnerable patterns
   grep -rn "tx.origin" src/
   grep -rn "block.timestamp ==" src/
   grep -rn "transfer(" src/ | grep -v "safeTransfer"
   ```

## Key concepts

**Audit Scope**: Define what is in scope (contract addresses, chains) and out of scope (admin key management, frontend) before engaging an auditor. Unclear scope leads to missed findings.

**Severity Levels**: Critical = funds at risk, immediate. High = funds at risk, specific conditions. Medium = protocol dysfunction. Low = best practice violation. Info = no security impact.

**Teleporter Invariant**: The Teleporter contract guarantees message delivery ordering within a chain pair, but does NOT guarantee the content is valid or from a trusted source. Your contract must validate both.

**Fix Before Audit**: Run Slither and fix all High/Medium findings before paying for a manual audit. Auditors should spend time on logic, not linting.

**Re-audit on Upgrade**: Any upgrade to a contract in production requires a new audit or at minimum a diff review against the previous audited code.

## Common errors

| Error | Cause | Fix |
|---|---|---|
| Slither false positive on reentrancy | Slither doesn't see `nonReentrant` modifier | Add `// slither-disable-next-line reentrancy-eth` with justification |
| Auditor flags `block.timestamp` | Used for time-lock logic | Document the trust assumption; use `block.number` as alternative |
| Missing event findings | State changes without events | Add events to all setters and critical state transitions |
| Upgrade breaks storage layout | New variable inserted before existing | Always append new variables; use storage gaps |
| Warp trust finding | Source not validated | Add `require(sourceBlockchainID == ALLOWED_CHAIN)` |

## Next skills

- `security` — implement fixes for audit findings
- `testing` — add regression tests for all audit findings
- `qa` — use audit report as part of mainnet launch gate
