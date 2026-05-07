---
name: "security"
version: "1.0.0"
spec: "agentskills@1.0"
license: "Apache-2.0"
tier: 4
description: "Defensive Solidity on Avalanche — Subnet validator security, precompile risks, Warp trust assumptions, and common attack vectors."
trigger: |
  Use when: writing or reviewing Solidity contracts, auditing access control, implementing cross-chain message handlers, configuring precompiles, thinking about Subnet security.
  Do NOT use for: general networking security, AWS/infra hardening, non-smart-contract topics.
last_updated: "2026-05-01"
avalanche_networks: [fuji, mainnet]
related_skills:
  - audit
  - testing
  - qa
---

## Overview

Avalanche introduces unique security surfaces beyond standard EVM: Subnet validator collusion, Warp/Teleporter message trust, and precompile access control. This skill covers defensive Solidity patterns for C-Chain and Subnet-EVM, with Avalanche-specific threat models. Always combine with the `audit` and `testing` skills before mainnet deployment.

## When to fetch

Fetch this skill when writing any external-facing contract function, handling cross-chain messages, configuring precompile admin roles, or performing a pre-launch security pass. Also fetch when an AI agent proposes `tx.origin` for auth or an unchecked external call.

## Core Workflow

1. **Run static analysis first**
   ```bash
   # Slither on your contracts
   pip install slither-analyzer
   slither contracts/ --filter-paths node_modules --checklist

   # Mythril symbolic execution
   pip install mythril
   myth analyze contracts/MyContract.sol --solc-version 0.8.24
   ```

2. **Apply ReentrancyGuard to all state-changing external functions**
   ```solidity
   // UNSAFE — no guard
   function withdraw(uint256 amount) external {
       balances[msg.sender] -= amount;
       (bool ok,) = msg.sender.call{value: amount}("");
       require(ok);
   }

   // SAFE — CEI pattern + guard
   import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

   contract SafeVault is ReentrancyGuard {
       mapping(address => uint256) public balances;

       function withdraw(uint256 amount) external nonReentrant {
           require(balances[msg.sender] >= amount, "Insufficient");
           balances[msg.sender] -= amount;          // Effects first
           (bool ok,) = msg.sender.call{value: amount}("");  // Interaction last
           require(ok, "Transfer failed");
       }
   }
   ```

3. **Access control — never use tx.origin**
   ```solidity
   // UNSAFE
   function adminAction() external {
       require(tx.origin == owner, "Not owner"); // Phishing vector
   }

   // SAFE
   function adminAction() external {
       require(msg.sender == owner, "Not owner");
   }

   // PREFERRED — OpenZeppelin roles
   import "@openzeppelin/contracts/access/AccessControl.sol";

   contract MyContract is AccessControl {
       bytes32 public constant OPERATOR_ROLE = keccak256("OPERATOR_ROLE");

       function sensitiveAction() external onlyRole(OPERATOR_ROLE) {
           // ...
       }
   }
   ```

4. **Warp/Teleporter message trust — validate source chain and sender**
   ```solidity
   // UNSAFE — accepts any cross-chain message
   function receiveMessage(bytes32 sourceChainID, address sender, bytes calldata payload) external {
       _processPayload(payload); // Never do this
   }

   // SAFE — whitelist source chain + sender
   bytes32 public constant ALLOWED_CHAIN = 0xabc...;  // Source Subnet chain ID
   address public constant TRUSTED_SENDER = 0x123...;

   function receiveTeleporterMessage(
       bytes32 sourceBlockchainID,
       address originSenderAddress,
       bytes calldata message
   ) external override {
       require(msg.sender == TELEPORTER_MESSENGER, "Not Teleporter");
       require(sourceBlockchainID == ALLOWED_CHAIN, "Wrong chain");
       require(originSenderAddress == TRUSTED_SENDER, "Untrusted sender");
       _processMessage(message);
   }
   ```

5. **Precompile access control — use multisig, not EOA**
   ```bash
   # In genesis.json — set precompile admin to Gnosis Safe, not a dev key
   # UNSAFE
   "adminAddresses": ["0xYourPersonalWallet"]

   # SAFE
   "adminAddresses": ["0xGnosisSafeAddress"]
   ```

   ```solidity
   // Verify precompile admin in tests
   IAllowList allowList = IAllowList(CONTRACT_DEPLOYER_ALLOW_LIST);
   address admin = 0xGnosisSafe;
   assertEq(uint256(allowList.readAllowList(admin)), uint256(AllowListRole.Admin));
   ```

6. **Integer arithmetic — use Solidity 0.8+ or SafeMath**
   ```solidity
   // Solidity ^0.8.0 reverts on overflow by default
   // For unchecked blocks, be explicit
   function safeAdd(uint256 a, uint256 b) internal pure returns (uint256) {
       unchecked {
           uint256 c = a + b;
           require(c >= a, "Overflow");
           return c;
       }
   }
   ```

7. **Front-running mitigation on C-Chain**
   ```solidity
   // Use commit-reveal for sensitive operations
   mapping(bytes32 => bool) public commitments;

   function commit(bytes32 hash) external {
       commitments[hash] = true;
   }

   function reveal(uint256 value, bytes32 salt) external {
       bytes32 hash = keccak256(abi.encodePacked(msg.sender, value, salt));
       require(commitments[hash], "No commitment");
       delete commitments[hash];
       _execute(value);
   }
   ```

## Network config

| Network | Chain ID | RPC | Explorer |
|---|---|---|---|
| C-Chain Mainnet | 43114 | https://api.avax.network/ext/bc/C/rpc | https://subnets.avax.network/c-chain |
| Fuji Testnet | 43113 | https://api.avax-test.network/ext/bc/C/rpc | https://subnets-test.avax.network/c-chain |

## Security Checklist

| # | Check | Status |
|---|---|---|
| 1 | No `tx.origin` for auth anywhere in codebase | [ ] |
| 2 | All external state-changing functions have `nonReentrant` or explicit CEI | [ ] |
| 3 | Cross-chain message handlers validate `msg.sender == TELEPORTER_MESSENGER` | [ ] |
| 4 | Cross-chain handlers validate `sourceBlockchainID` whitelist | [ ] |
| 5 | Cross-chain handlers validate `originSenderAddress` whitelist | [ ] |
| 6 | Precompile admin addresses are multisig (Gnosis Safe), not EOA | [ ] |
| 7 | No unchecked arithmetic on user-controlled values | [ ] |
| 8 | Access control uses roles (AccessControl), not single-owner | [ ] |
| 9 | Emergency pause mechanism exists and is tested | [ ] |
| 10 | Validator set collusion: Subnet has ≥5 independent validators | [ ] |
| 11 | No selfdestruct unless explicitly required | [ ] |
| 12 | Oracle prices validated (staleness, deviation bounds) | [ ] |
| 13 | ERC-20 approve race condition mitigated (use increaseAllowance) | [ ] |
| 14 | All events emitted for state changes | [ ] |

## Key concepts

**CEI Pattern**: Checks-Effects-Interactions. Always update state before making external calls to prevent reentrancy.

**Warp Trust Model**: Warp messages are signed by the source Subnet's validator set. Your contract must still validate the logical sender — Warp proves the chain, not that the sending contract is trusted.

**Precompile Admin**: Subnet-EVM precompiles (AllowList, FeeManager, etc.) have admin addresses. If those addresses are EOAs, a compromised key = full precompile control. Always use multisig.

**Validator Collusion**: A Subnet with <5 validators controlled by one entity can censor or reorder transactions. Enforce validator diversity in genesis and ongoing governance.

**Front-Running on C-Chain**: Avalanche has a mempool; block proposers can see pending txs. Use commit-reveal or private mempools (Flashbots-style) for high-value ops.

## Common errors

| Error | Cause | Fix |
|---|---|---|
| `ReentrancyGuard: reentrant call` | External call triggers same function | Fix call order: state update before external call |
| `Not Teleporter` revert | receiveMessage called by wrong address | Check `msg.sender == TELEPORTER_MESSENGER_ADDRESS` |
| Precompile returns permission denied | Caller not in allowlist | Add caller address via admin, use multisig admin |
| Silent ERC-20 transfer failure | Token returns false instead of reverting | Use SafeERC20's `safeTransfer` |
| `tx.origin != owner` phishing | Malicious contract tricks EOA into calling it | Replace `tx.origin` with `msg.sender` throughout |

## Next skills

- `audit` — structured audit checklists and AI audit prompts
- `testing` — write tests that catch these vulnerabilities
- `qa` — pre-launch gate checklist including security sign-off
