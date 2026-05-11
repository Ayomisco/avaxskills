---
name: "precompiles"
version: "1.0.0"
spec: "agentskills@1.0"
license: "Apache-2.0"
tier: 2
description: "Complete reference for Avalanche Subnet-EVM precompiles — NativeMinter, FeeManager, AllowList, RewardManager, and Warp."
trigger: |
  Use when: user wants to use Avalanche precompiles (NativeMinter, FeeManager, AllowList, WarpMessenger), mint native tokens from a contract, restrict deployers, or adjust fees on-chain.
  Do NOT use for: C-Chain contracts (precompiles only work on Subnets where they're enabled), general ERC-20 minting.
last_updated: "2026-05-01"
avalanche_networks: [fuji, mainnet]
related_skills:
  - subnet-evm-config
  - contract-addresses
  - security
---

## Overview

Avalanche Subnet-EVM precompiles are native Solidity-callable contracts at fixed addresses. Unlike regular smart contracts, they're implemented in Go and execute as part of the VM. Each precompile must be explicitly enabled in the Subnet genesis. They give Subnet developers power not available in standard EVM: minting native tokens, restricting who can deploy, adjusting fees dynamically.

## When to fetch

Fetch when building Subnet-specific features or calling precompile functions from Solidity. Precompiles only work on Subnets where they're configured.

## Core Workflow

### 1. ContractDeployerAllowList (0x0200000000000000000000000000000000000000)

Restricts which addresses can deploy smart contracts. Everyone else's deployments revert.

**Enable in genesis:**
```json
"contractDeployerAllowListConfig": {
  "adminAddresses": ["0xADMIN"],
  "enabledAddresses": ["0xDEV1", "0xDEV2"],
  "blockTimestamp": 0
}
```

**Solidity interface:**
```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IAllowList {
    // Roles
    uint256 constant NONE = 0;
    uint256 constant ENABLED = 1;
    uint256 constant ADMIN = 2;
    uint256 constant MANAGER = 3; // Subnet-EVM v0.5.0+

    event RoleSet(uint256 indexed role, address indexed account, address indexed sender, uint256 oldRole);

    function readAllowList(address addr) external view returns (uint256 role);
    function setAdmin(address addr) external;
    function setEnabled(address addr) external;
    function setManager(address addr) external;
    function setNone(address addr) external;
}

contract DeployerManager {
    IAllowList constant DEPLOYER_ALLOW_LIST = 
        IAllowList(0x0200000000000000000000000000000000000000);

    modifier onlyAdmin() {
        require(DEPLOYER_ALLOW_LIST.readAllowList(msg.sender) == 2, "Not admin"); // 2 = ADMIN role
        _;
    }

    function allowDeployer(address dev) external onlyAdmin {
        DEPLOYER_ALLOW_LIST.setEnabled(dev);
    }

    function revokeDeployer(address dev) external onlyAdmin {
        DEPLOYER_ALLOW_LIST.setNone(dev);
    }

    function isDeployer(address addr) external view returns (bool) {
        uint256 role = DEPLOYER_ALLOW_LIST.readAllowList(addr);
        return role == 1 || role == 2 || role == 3; // ENABLED, ADMIN, or MANAGER
    }
}
```

**Direct call from external wallet (as admin):**
```bash
# Set enabled deployer (using cast)
cast send 0x0200000000000000000000000000000000000000 \
  "setEnabled(address)" \
  0xDEVELOPER_ADDRESS \
  --rpc-url YOUR_SUBNET_RPC \
  --private-key $ADMIN_KEY
```

### 2. NativeMinter (0x0200000000000000000000000000000000000001)

Allows authorized addresses to mint the Subnet's native gas token.

**Enable in genesis:**
```json
"contractNativeMinterConfig": {
  "adminAddresses": ["0xADMIN"],
  "enabledAddresses": ["0xMINTER_CONTRACT"],
  "blockTimestamp": 0
}
```

**Solidity interface:**
```solidity
interface INativeMinter {
    event NativeCoinMinted(address indexed sender, address indexed recipient, uint256 amount);

    // Mint native tokens to a recipient
    function mintNativeCoin(address addr, uint256 amount) external;

    // AllowList management (same as other precompiles)
    function readAllowList(address addr) external view returns (uint256);
    function setAdmin(address addr) external;
    function setEnabled(address addr) external;
    function setNone(address addr) external;
}

contract TokenMinter {
    INativeMinter constant MINTER = INativeMinter(0x0200000000000000000000000000000000000001);
    
    address public admin;

    constructor() {
        admin = msg.sender;
    }

    // Mint native tokens from an external trigger (e.g., bridge)
    function mintTo(address recipient, uint256 amount) external {
        require(msg.sender == admin, "Not admin");
        MINTER.mintNativeCoin(recipient, amount);
    }

    // Bridge-style minting: burn on source chain, mint here
    function bridgeMint(address recipient, uint256 amount, bytes calldata proof) external {
        // Verify proof from source chain (your logic)
        _verifyBridgeProof(proof);
        MINTER.mintNativeCoin(recipient, amount);
    }

    function _verifyBridgeProof(bytes calldata proof) internal view {
        // Implement cross-chain proof verification
    }
}
```

**Important:** The contract calling `mintNativeCoin` must itself be in the NativeMinter allowlist (ENABLED or ADMIN role).

### 3. TxAllowList (0x0200000000000000000000000000000000000002)

Restricts which addresses can send ANY transactions (stricter than DeployerAllowList).

**Enable in genesis:**
```json
"transactionAllowListConfig": {
  "adminAddresses": ["0xADMIN"],
  "enabledAddresses": ["0xALLOWED_USER1"],
  "blockTimestamp": 0
}
```

**Same interface as ContractDeployerAllowList** — same ABI, different address.

```solidity
IAllowList constant TX_ALLOW_LIST = IAllowList(0x0200000000000000000000000000000000000002);

function canTransact(address user) external view returns (bool) {
    uint256 role = TX_ALLOW_LIST.readAllowList(user);
    return role > 0;  // Any non-NONE role can transact
}
```

### 4. FeeManager (0x0200000000000000000000000000000000000003)

Allows admins to change the fee configuration dynamically without a hard fork.

**Enable in genesis:**
```json
"feeManagerConfig": {
  "adminAddresses": ["0xADMIN"],
  "blockTimestamp": 0
}
```

**Solidity interface:**
```solidity
interface IFeeManager {
    struct FeeConfig {
        uint256 gasLimit;
        uint256 targetBlockRate;
        uint256 minBaseFee;
        uint256 targetGas;
        uint256 baseFeeChangeDenominator;
        uint256 minBlockGasCost;
        uint256 maxBlockGasCost;
        uint256 blockGasCostStep;
    }

    event FeeConfigChanged(
        address indexed sender,
        FeeConfig oldFeeConfig,
        FeeConfig newFeeConfig
    );

    function getFeeConfig() external view returns (FeeConfig memory config);
    function getFeeConfigLastChangedAt() external view returns (uint256 blockNumber);
    function setFeeConfig(FeeConfig calldata config) external;

    function readAllowList(address addr) external view returns (uint256);
    function setAdmin(address addr) external;
    function setEnabled(address addr) external;
    function setNone(address addr) external;
}

contract FeeGovernance {
    IFeeManager constant FEE_MANAGER = IFeeManager(0x0200000000000000000000000000000000000003);

    // Read current fee config
    function getCurrentFeeConfig() external view returns (IFeeManager.FeeConfig memory) {
        return FEE_MANAGER.getFeeConfig();
    }

    // Admin: increase gas limit for high demand
    function increaseGasLimit(uint256 newGasLimit) external {
        require(FEE_MANAGER.readAllowList(msg.sender) >= 2, "Not admin");
        IFeeManager.FeeConfig memory current = FEE_MANAGER.getFeeConfig();
        current.gasLimit = newGasLimit;
        current.targetGas = newGasLimit * 5 / 4;  // 1.25x gasLimit
        FEE_MANAGER.setFeeConfig(current);
    }

    // Admin: set minimum base fee (e.g., for anti-spam)
    function setMinFee(uint256 minFeeGwei) external {
        require(FEE_MANAGER.readAllowList(msg.sender) >= 2, "Not admin");
        IFeeManager.FeeConfig memory current = FEE_MANAGER.getFeeConfig();
        current.minBaseFee = minFeeGwei * 1 gwei;
        FEE_MANAGER.setFeeConfig(current);
    }
}
```

### 5. RewardManager (0x0200000000000000000000000000000000000004)

Controls how validator rewards and transaction fees are distributed.

**Enable in genesis:**
```json
"rewardManagerConfig": {
  "adminAddresses": ["0xADMIN"],
  "initialRewardConfig": {
    "allowFeeRecipients": false
  },
  "blockTimestamp": 0
}
```

**Solidity interface:**
```solidity
interface IRewardManager {
    struct RewardAddressConfig {
        address rewardAddress;
    }

    event RewardAddressChanged(address indexed sender, address indexed oldRewardAddress, address indexed newRewardAddress);
    event FeeRecipientsAllowed(address indexed sender);
    event RewardsDisabled(address indexed sender);

    function setRewardAddress(address addr) external;
    function allowFeeRecipients() external;
    function disableRewards() external;
    function currentRewardAddress() external view returns (address rewardAddress);
    function areFeeRecipientsAllowed() external view returns (bool isAllowed);

    function readAllowList(address addr) external view returns (uint256);
    function setAdmin(address addr) external;
    function setEnabled(address addr) external;
}

contract RewardController {
    IRewardManager constant REWARD_MANAGER = IRewardManager(0x0200000000000000000000000000000000000004);

    // Send all fees to a treasury
    function setTreasury(address treasury) external {
        REWARD_MANAGER.setRewardAddress(treasury);
    }

    // Let validators set their own reward address (like C-Chain)
    function enableValidatorRewards() external {
        REWARD_MANAGER.allowFeeRecipients();
    }

    // Burn all fees (deflationary)
    function burnFees() external {
        REWARD_MANAGER.disableRewards();
    }
}
```

### 6. WarpMessenger (0x0200000000000000000000000000000000000005)

Low-level cross-chain messaging. Usually accessed via Teleporter (higher-level). This is the raw precompile.

**Always enabled** on Subnets configured with `"warpConfig"` in genesis.

**Solidity interface:**
```solidity
interface IWarpMessenger {
    struct WarpMessage {
        bytes32 sourceChainID;
        address originSenderAddress;
        bytes payload;
    }

    struct WarpBlockHash {
        bytes32 sourceChainID;
        bytes32 blockHash;
    }

    event SendWarpMessage(address indexed sender, bytes32 indexed messageID, bytes message);

    // Send a Warp message
    function sendWarpMessage(bytes calldata payload) external returns (bytes32 messageID);

    // Get a verified Warp message (called by relayer)
    function getVerifiedWarpMessage(uint32 index)
        external view returns (WarpMessage memory message, bool valid);

    // Get this chain's blockchain ID
    function getBlockchainID() external view returns (bytes32 blockchainID);

    // Get verified block hash
    function getVerifiedWarpBlockHash(uint32 index)
        external view returns (WarpBlockHash memory warpBlockHash, bool valid);
}

// Usage: get this chain's ID
bytes32 myChainID = IWarpMessenger(0x0200000000000000000000000000000000000005).getBlockchainID();
```

## Key concepts

**AllowList roles** — All allow-list precompiles use the same role system: 0=NONE, 1=ENABLED, 2=ADMIN, 3=MANAGER. Admins can manage all roles. Managers can manage ENABLED but not ADMIN.

**Must be in allowlist** — For NativeMinter, the calling contract address must be ENABLED or ADMIN in the allowlist. You can't call it from an arbitrary address.

**Precompile ABI** — Import precompile interfaces from https://github.com/ava-labs/subnet-evm/blob/master/contracts/contracts/interfaces/

**Genesis enables precompile** — Without the config in genesis.json, calling the precompile address just returns empty. Always verify precompile is enabled: `extcodesize(precompileAddress) > 0`.

**Same address everywhere** — 0x0200... addresses are fixed for every Subnet-EVM chain. But the precompile is only active if enabled in that chain's genesis.

## Common errors

| Error | Cause | Fix |
|---|---|---|
| Precompile call returns empty | Not enabled in genesis | Add the config section to genesis.json before deployment |
| `caller is not admin` | Wrong role | Check `readAllowList(msg.sender)` == 2 (ADMIN) |
| `mintNativeCoin` reverts | Calling contract not in NativeMinter allowlist | Add contract address to `enabledAddresses` in genesis |
| Cannot call setEnabled | Caller is ENABLED but not ADMIN | Only ADMIN can manage other roles |
| `extcodesize` returns 0 | Precompile not configured | Verify genesis config, restart node after genesis change |

## Next skills

- `subnet-evm-config` — configure precompiles in genesis.json
- `contract-addresses` — complete address reference
- `security` — security implications of precompile admin access
