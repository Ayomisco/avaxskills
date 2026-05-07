---
name: "validator-manager-contract"
version: "1.0.0"
spec: "agentskills@1.0"
license: "Apache-2.0"
tier: 6
description: "Deploy and use the ValidatorManager smart contract (ACP-99) to manage Avalanche L1 validators on-chain."
trigger: |
  Use when: ACP-99 ValidatorManager, on-chain validator management, NativeTokenValidatorManager, ERC20TokenValidatorManager, PoAValidatorManager, on-chain staking for Avalanche L1, validator rotation via smart contract, registerValidator, initiateValidatorRemoval, completeValidatorRemoval
  Do NOT use for: CLI-based validator management, C-Chain validator operations, P-Chain staking, delegation on the primary network
last_updated: "2026-05-07"
avalanche_networks: [fuji, mainnet]
related_skills:
  - subnet-deployment
  - subnet-evm-config
  - validator-management
  - acps
  - warp-messaging
---

## Overview

ACP-99 introduced the `ValidatorManager` smart contract — an on-chain way to manage Avalanche L1 validators instead of relying on CLI and P-Chain transactions. Validators are registered, rotated, and removed by calling the contract, which uses Warp messaging to synchronize state with the P-Chain. This enables DAO governance over validators, on-chain staking, slashing, and automated validator rotation.

GitHub: https://github.com/ava-labs/icm-contracts/tree/main/contracts/validator-manager  
Docs: https://build.avax.network/docs/avalanche-l1s/validator-manager

## When to fetch

Fetch this skill when:
- A user wants on-chain validator management for their L1
- A user asks about ACP-99, ValidatorManager, or PoAValidatorManager
- A user wants to add or remove validators via a smart contract
- A user wants on-chain staking or slashing for a custom L1

## Core Workflow

### 1. Choose validator manager type

| Contract | Use case | Staking token |
|----------|----------|---------------|
| `PoAValidatorManager` | Permissioned L1s — owner controls validators | None (permissioned) |
| `NativeTokenValidatorManager` | Permissionless L1s — stake the native gas token | Native gas token |
| `ERC20TokenValidatorManager` | Permissionless L1s — stake an ERC-20 token | ERC-20 |

**Choose PoAValidatorManager** when:
- Your L1 is permissioned (enterprise, gaming with controlled validators)
- You want a multisig or DAO to control who validates

**Choose NativeTokenValidatorManager** when:
- Your L1 has a native gas token users can stake
- You want a permissionless staking model similar to Ethereum

**Choose ERC20TokenValidatorManager** when:
- Your staking token is a separate ERC-20 (not the native gas token)
- You want liquid staking or receipt tokens

### 2. Deploy the chosen contract to your L1

Clone the ICM contracts repo:

```bash
git clone https://github.com/ava-labs/icm-contracts
cd icm-contracts
npm install
```

Deploy with Foundry (recommended):

```bash
# Set environment variables
export PRIVATE_KEY=<your-deployer-private-key>
export RPC_URL=<your-L1-RPC-endpoint>

# Deploy PoAValidatorManager
forge script script/DeployPoAValidatorManager.s.sol \
  --rpc-url $RPC_URL \
  --private-key $PRIVATE_KEY \
  --broadcast

# Deploy NativeTokenValidatorManager
forge script script/DeployNativeTokenValidatorManager.s.sol \
  --rpc-url $RPC_URL \
  --private-key $PRIVATE_KEY \
  --broadcast

# Deploy ERC20TokenValidatorManager (requires token address)
forge script script/DeployERC20ValidatorManager.s.sol \
  --rpc-url $RPC_URL \
  --private-key $PRIVATE_KEY \
  --broadcast \
  --sig "run(address)" <ERC20_TOKEN_ADDRESS>
```

Note the deployed contract address — you need it for genesis configuration.

### 3. Configure the initial validator set in genesis

The ValidatorManager contract address must be referenced in the L1's genesis as a precompile admin or storage initialization:

```json
{
  "config": {
    "validatorManagerConfig": {
      "validatorManagerAddress": "0xDEPLOYED_VALIDATOR_MANAGER_ADDRESS",
      "initialValidators": [
        {
          "nodeID": "NodeID-5ZUdznHE5QiNVFkGKMEfNxAYvF6HVbCTA",
          "blsPublicKey": "0x...",
          "weight": 100
        }
      ]
    }
  }
}
```

Deploy the L1 with this genesis:

```bash
avalanche blockchain create myL1 --config ./genesis-with-validator-manager.json
avalanche blockchain deploy myL1 --network fuji
```

### 4. Register new validators via the contract

Adding a validator is a two-step Warp-based flow:

**Step 1: Initiate registration on your L1**

```solidity
// IPoAValidatorManager or INativeTokenValidatorManager
interface IValidatorManager {
    function initiateValidatorRegistration(
        bytes memory nodeID,          // NodeID as bytes
        bytes memory blsPublicKey,    // BLS public key
        uint64 registrationExpiry,    // Unix timestamp — when this registration attempt expires
        PChainOwner memory remainingBalanceOwner,
        PChainOwner memory disableOwner,
        uint64 weight                 // Validator weight
    ) external returns (bytes32 validationID);
}
```

```typescript
// Example using ethers.js
const validationID = await validatorManager.initiateValidatorRegistration(
    nodeIDBytes,
    blsPublicKeyBytes,
    Math.floor(Date.now() / 1000) + 300, // expires in 5 minutes
    { threshold: 1, addresses: [ownerAddress] },
    { threshold: 1, addresses: [ownerAddress] },
    100 // weight
);
console.log(`Validation ID: ${validationID}`);
```

**Step 2: Complete registration (after Warp message relay)**

The Teleporter/Warp relayer delivers the registration message to the P-Chain. Then call:

```solidity
function completeValidatorRegistration(uint32 messageIndex) external;
```

```typescript
// After Warp message is relayed (~2+ blocks)
await validatorManager.completeValidatorRegistration(messageIndex);
```

### 5. Remove validators (two-step flow)

Removing a validator also uses a Warp-based two-step process. Do NOT remove the last validator.

**Step 1: Initiate removal on your L1**

```solidity
function initiateValidatorRemoval(bytes32 validationID) external;
```

```typescript
await validatorManager.initiateValidatorRemoval(validationID);
```

**Step 2: Wait for Warp relay (2+ blocks), then complete**

```solidity
function completeValidatorRemoval(uint32 messageIndex) external;
```

```typescript
// After Warp message is relayed
await validatorManager.completeValidatorRemoval(messageIndex);
```

For `NativeTokenValidatorManager` and `ERC20TokenValidatorManager`, the staked tokens are returned to the staker during `completeValidatorRemoval`.

## Network config

ValidatorManager contracts must be deployed fresh for each L1. There are no shared addresses. Each L1 has its own ValidatorManager instance.

| Parameter | Value |
|-----------|-------|
| Warp relay time | ~2+ blocks after initiating |
| Registration expiry | Set when initiating — use 5–15 minutes |
| Minimum validator weight | 1 (configurable per L1) |
| Contract addresses | Unique per L1 — deployed fresh each time |

## Key concepts

- **ACP-99**: The Avalanche Community Proposal that introduced on-chain ValidatorManager. Read it at https://github.com/avalanche-foundation/ACPs/tree/main/ACPs/99-validator-manager.
- **validationID**: A unique `bytes32` identifier for each validator registration attempt. Store this after `initiateValidatorRegistration`.
- **Two-step flow**: Both registration and removal use a Warp message. Step 1 initiates on the L1; the Warp relayer delivers to P-Chain; step 2 completes the operation. There is no atomic single-step operation.
- **Weight**: Validator weight affects consensus voting power. On `PoAValidatorManager`, the owner sets weight. On staking managers, weight is proportional to stake amount.
- **BLS public key**: Required for all validators since ACP-77. Validators must register a BLS key when joining. Get this from the node's `info.getNodeID` API.

## Common errors

| Error | Cause | Fix |
|-------|-------|-----|
| `Registration expired` | Warp relay took too long | Increase `registrationExpiry` to 15+ minutes |
| `Invalid BLS key` | BLS public key malformed | Get BLS key from `curl -X POST --data '{"jsonrpc":"2.0","id":1,"method":"info.getNodeID","params":{}}' <node>/ext/info` |
| `Not authorized` (PoA) | Caller is not owner | Call from the owner address (or multisig) |
| `Removing last validator` | Only one validator remaining | Add a new validator before removing the last one |
| `completeValidatorRemoval` reverts | Warp message not yet relayed | Wait 2+ blocks and retry |
| `Insufficient stake` | Stake below minimum | Check `minimumStakeAmount()` on the contract |

## Next skills

- **subnet-deployment** — deploy the L1 that will use ValidatorManager
- **subnet-evm-config** — genesis configuration details for the L1
- **validator-management** — CLI-based validator management (non-contract approach)
- **acps** — understand ACP-99 and other Avalanche Community Proposals
- **warp-messaging** — understand the Warp layer used by ValidatorManager
- **safe-multisig** — use Safe as the PoAValidatorManager owner
