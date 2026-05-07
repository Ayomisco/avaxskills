---
name: "subnet-governance"
version: "1.0.0"
spec: "agentskills@1.0"
license: "Apache-2.0"
tier: 6
description: "Implement on-chain governance for Avalanche custom L1s — voting mechanisms, upgrade paths, and validator coordination."
trigger: |
  Use when: implementing governance for a Subnet, setting up Governor contracts on Subnet-EVM, designing upgrade governance for precompile configs, adding timelocks, or implementing emergency pause mechanisms for a Subnet.
  Do NOT use for: C-Chain-only governance, off-chain governance tooling like Snapshot.
last_updated: "2026-05-01"
avalanche_networks: [fuji, mainnet]
related_skills:
  - subnet-deployment
  - upgradeable-contracts
  - security
---

## Overview

Avalanche Subnet governance combines standard OpenZeppelin Governor contracts with Subnet-EVM-specific controls: precompile admin governance, validator set coordination via Warp, and genesis parameter upgrades. This skill covers the full governance stack from Governor contract setup to emergency mechanisms and precompile change proposals.

## When to fetch

Fetch when designing the governance layer for a new Subnet, when a Subnet needs to upgrade its precompile configuration through community vote, or when implementing timelocked upgrade authority for a Subnet's smart contracts.

## Core Workflow

### Governor Contract Setup

1. **Install OpenZeppelin**

   ```bash
   npm install @openzeppelin/contracts
   # For upgradeable Governor
   npm install @openzeppelin/contracts-upgradeable
   ```

2. **Deploy a Governor for your Subnet**

   ```solidity
   // contracts/SubnetGovernor.sol
   // SPDX-License-Identifier: Apache-2.0
   pragma solidity ^0.8.24;

   import "@openzeppelin/contracts/governance/Governor.sol";
   import "@openzeppelin/contracts/governance/extensions/GovernorSettings.sol";
   import "@openzeppelin/contracts/governance/extensions/GovernorCountingSimple.sol";
   import "@openzeppelin/contracts/governance/extensions/GovernorVotes.sol";
   import "@openzeppelin/contracts/governance/extensions/GovernorVotesQuorumFraction.sol";
   import "@openzeppelin/contracts/governance/extensions/GovernorTimelockControl.sol";

   contract SubnetGovernor is
       Governor,
       GovernorSettings,
       GovernorCountingSimple,
       GovernorVotes,
       GovernorVotesQuorumFraction,
       GovernorTimelockControl
   {
       constructor(
           IVotes _token,           // ERC-20 votes token or ERC-721 votes
           TimelockController _timelock
       )
           Governor("SubnetGovernor")
           GovernorSettings(
               1,           // votingDelay: 1 block (~2s on Avalanche)
               50400,       // votingPeriod: ~7 days at 2s/block
               100_000e18   // proposalThreshold: 100k tokens to propose
           )
           GovernorVotes(_token)
           GovernorVotesQuorumFraction(4) // 4% quorum
           GovernorTimelockControl(_timelock)
       {}

       // Required overrides
       function votingDelay() public view override(Governor, GovernorSettings) returns (uint256) {
           return super.votingDelay();
       }

       function votingPeriod() public view override(Governor, GovernorSettings) returns (uint256) {
           return super.votingPeriod();
       }

       function quorum(uint256 blockNumber)
           public view override(Governor, GovernorVotesQuorumFraction) returns (uint256) {
           return super.quorum(blockNumber);
       }

       function proposalThreshold() public view override(Governor, GovernorSettings) returns (uint256) {
           return super.proposalThreshold();
       }

       function state(uint256 proposalId)
           public view override(Governor, GovernorTimelockControl) returns (ProposalState) {
           return super.state(proposalId);
       }

       function _queueOperations(uint256 proposalId, address[] memory targets, uint256[] memory values, bytes[] memory calldatas, bytes32 descriptionHash)
           internal override(Governor, GovernorTimelockControl) returns (uint48) {
           return super._queueOperations(proposalId, targets, values, calldatas, descriptionHash);
       }

       function _executeOperations(uint256 proposalId, address[] memory targets, uint256[] memory values, bytes[] memory calldatas, bytes32 descriptionHash)
           internal override(Governor, GovernorTimelockControl) {
           super._executeOperations(proposalId, targets, values, calldatas, descriptionHash);
       }

       function _cancel(address[] memory targets, uint256[] memory values, bytes[] memory calldatas, bytes32 descriptionHash)
           internal override(Governor, GovernorTimelockControl) returns (uint256) {
           return super._cancel(targets, values, calldatas, descriptionHash);
       }

       function _executor() internal view override(Governor, GovernorTimelockControl) returns (address) {
           return super._executor();
       }
   }
   ```

3. **Timelock Controller**

   ```solidity
   // Deploy TimelockController before Governor
   import "@openzeppelin/contracts/governance/TimelockController.sol";

   // In deployment script:
   address[] memory proposers = new address[](1);
   proposers[0] = address(governor); // Governor can propose

   address[] memory executors = new address[](1);
   executors[0] = address(0); // Anyone can execute after delay

   TimelockController timelock = new TimelockController(
       2 days,    // Minimum delay before execution
       proposers,
       executors,
       address(0) // No admin (fully governed)
   );
   ```

4. **Governance token (ERC-20 with votes)**

   ```solidity
   // contracts/GovernanceToken.sol
   pragma solidity ^0.8.24;

   import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Votes.sol";
   import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";

   contract GovernanceToken is ERC20Votes, ERC20Permit {
       constructor(address initialHolder)
           ERC20("Subnet Gov Token", "SGT")
           ERC20Permit("Subnet Gov Token")
       {
           _mint(initialHolder, 10_000_000e18);
       }

       // Required override
       function _update(address from, address to, uint256 value)
           internal override(ERC20, ERC20Votes) {
           super._update(from, to, value);
       }
   }
   ```

### Governance Proposals

5. **Submit a proposal via TypeScript**

   ```typescript
   // scripts/propose.ts
   import { ethers } from "hardhat";

   async function propose() {
     const [proposer] = await ethers.getSigners();
     const governor = await ethers.getContractAt("SubnetGovernor", GOVERNOR_ADDRESS);

     // Example: proposal to update fee recipient
     const targets = [PROTOCOL_ADDRESS];
     const values = [0n];
     const calldatas = [
       protocol.interface.encodeFunctionData("setFeeRecipient", [NEW_FEE_RECIPIENT])
     ];
     const description = "# Proposal 1: Update fee recipient\nTransfer protocol fees to community multisig.";

     const tx = await governor.propose(targets, values, calldatas, description);
     const receipt = await tx.wait();

     // Get proposal ID from event
     const event = receipt.logs.find((log) => log.fragment?.name === "ProposalCreated");
     const proposalId = event?.args?.proposalId;
     console.log("Proposal ID:", proposalId.toString());
   }
   ```

6. **Vote on a proposal**

   ```typescript
   // Cast vote: 0 = Against, 1 = For, 2 = Abstain
   const voteTx = await governor.castVote(proposalId, 1);
   await voteTx.wait();
   console.log("Voted For proposal", proposalId.toString());

   // With reason
   await governor.castVoteWithReason(proposalId, 1, "This improves the protocol fee structure");
   ```

### Precompile Governance

7. **Propose a precompile config change**

   ```solidity
   // contracts/PrecompileGovernance.sol
   // Governs changes to Subnet-EVM precompiles (FeeManager, ContractDeployerAllowList, etc.)
   pragma solidity ^0.8.24;

   import "@subnet-evm/contracts/interfaces/IFeeManager.sol";

   contract PrecompileGovernance {
       address public constant FEE_MANAGER = 0x020000000000000000000000000000000000000F;
       address public immutable timelock;

       modifier onlyTimelock() {
           require(msg.sender == timelock, "Only timelock");
           _;
       }

       constructor(address _timelock) {
           timelock = _timelock;
       }

       // Called by timelock after governance vote passes
       function setFeeConfig(
           uint256 gasLimit,
           uint256 targetBlockRate,
           uint256 minBaseFee,
           uint256 targetGas,
           uint256 baseFeeChangeDenominator,
           uint256 minBlockGasCost,
           uint256 maxBlockGasCost,
           uint256 blockGasCostStep
       ) external onlyTimelock {
           IFeeManager(FEE_MANAGER).setFeeConfig(
               gasLimit,
               targetBlockRate,
               minBaseFee,
               targetGas,
               baseFeeChangeDenominator,
               minBlockGasCost,
               maxBlockGasCost,
               blockGasCostStep
           );
       }
   }
   ```

8. **Emergency pause with guardian role**

   ```solidity
   // contracts/EmergencyPause.sol
   pragma solidity ^0.8.24;

   import "@openzeppelin/contracts/security/Pausable.sol";
   import "@openzeppelin/contracts/access/AccessControl.sol";

   contract EmergencyPause is Pausable, AccessControl {
       bytes32 public constant GUARDIAN_ROLE = keccak256("GUARDIAN_ROLE");
       bytes32 public constant GOVERNANCE_ROLE = keccak256("GOVERNANCE_ROLE");

       constructor(address guardian, address governance) {
           _grantRole(GUARDIAN_ROLE, guardian);    // Multisig for fast emergency
           _grantRole(GOVERNANCE_ROLE, governance); // Timelock for deliberate actions
       }

       // Guardian (multisig) can pause immediately — no governance vote needed
       function emergencyPause() external onlyRole(GUARDIAN_ROLE) {
           _pause();
       }

       // Only governance (timelock) can unpause — forces community review
       function unpause() external onlyRole(GOVERNANCE_ROLE) {
           _unpause();
       }
   }
   ```

9. **Warp-based validator voting (advanced)**

   ```solidity
   // For decisions that require validator consensus (e.g., Subnet parameter changes)
   // Validators sign off-chain, submit aggregate Warp message on-chain
   pragma solidity ^0.8.24;

   interface IWarpMessenger {
       function getVerifiedWarpMessage(uint32 index) external view
           returns (WarpMessage calldata message, bool valid);
   }

   contract ValidatorVoting {
       address constant WARP_PRECOMPILE = 0x0200000000000000000000000000000000000005;

       struct ValidatorVote {
           bytes32 proposalID;
           bool inFavor;
           uint256 stakeWeight;
       }

       function executeWithValidatorConsensus(
           uint32 warpMessageIndex,
           bytes calldata proposalCalldata
       ) external {
           (WarpMessage memory msg, bool valid) =
               IWarpMessenger(WARP_PRECOMPILE).getVerifiedWarpMessage(warpMessageIndex);

           require(valid, "Invalid Warp message");

           ValidatorVote memory vote = abi.decode(msg.payload, (ValidatorVote));
           require(vote.inFavor, "Validators voted against");
           require(vote.stakeWeight >= REQUIRED_STAKE_WEIGHT, "Insufficient stake support");

           // Execute the governed action
           (bool ok,) = address(this).call(proposalCalldata);
           require(ok, "Execution failed");
       }
   }
   ```

## Key concepts

**Governor + Timelock**: The standard pattern — Governor holds the vote; TimelockController enforces a delay before execution. The delay gives users time to exit if they disagree with a passed proposal.

**Guardian Pattern**: A fast-response multisig (Guardian) that can pause but NOT unpause. Unpause requires governance (timelock). This balances emergency responsiveness with community control over recovery.

**Precompile Admin**: Subnet-EVM precompile admin addresses should be transferred to the TimelockController after deployment. This puts precompile config changes under governance.

**Warp Validator Voting**: For decisions that are inherently about the validator set (e.g., accepting a new validator), you can use Warp signatures from validators as on-chain proof of validator consensus — more legitimate than a token vote for infrastructure decisions.

**Voting Delay on Avalanche**: With 2s blocks, 1 block voting delay is nearly instant. Set `votingDelay` to at least 1 day (43,200 blocks at 2s/block) to give token holders time to see the proposal before snapshot.

## Common errors

| Error | Cause | Fix |
|---|---|---|
| `Governor: proposer votes below proposal threshold` | Not enough tokens | Delegate tokens to proposer; lower threshold for testing |
| Proposal stuck in Pending | votingDelay not passed | Wait for delay; use `vm.roll` in tests |
| Timelock execution fails | Timelock not granted executor role on target | Grant timelock `DEFAULT_ADMIN_ROLE` or specific role on governed contract |
| Precompile call reverts | Caller not precompile admin | Transfer precompile admin to timelock; submit change via governance |
| Guardian can't unpause | Correctly: guardian can only pause | Only governance (timelock) can unpause — submit governance proposal |

## Next skills

- `subnet-deployment` — deploy the Subnet this governance governs
- `upgradeable-contracts` — govern contract upgrades with timelock
- `security` — audit governor contracts for common attack vectors (flash loan voting, proposer manipulation)
