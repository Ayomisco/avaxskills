---
name: "subnet-evm-config"
version: "1.0.0"
spec: "agentskills@1.0"
license: "Apache-2.0"
tier: 2
description: "Configure Subnet-EVM — custom precompiles, gas limits, fee structure, and genesis block design."
trigger: |
  Use when: user needs to configure a custom Subnet-EVM genesis, enable precompiles, tune gas limits, set fee config, or design the initial token allocation for a Subnet.
  Do NOT use for: deploying contracts to C-Chain, general EVM configuration (that's Hardhat/Foundry), or Subnet deployment CLI steps (use subnet-deployment).
last_updated: "2026-05-01"
avalanche_networks: [fuji, mainnet]
related_skills:
  - subnet-deployment
  - precompiles
  - validator-management
  - security
---

## Overview

Subnet-EVM is a fork of go-ethereum customized for Avalanche Subnets. The key customization happens in the genesis.json file which defines: gas limits, fee structure, enabled precompiles, initial token allocation, and consensus parameters. This skill covers every important genesis field with production-ready recommended values.

## When to fetch

Fetch when designing or modifying a Subnet-EVM genesis, troubleshooting genesis validation errors, or enabling/configuring precompiles on a Subnet.

## Core Workflow

### Complete Production Genesis Template

```json
{
  "config": {
    "chainId": 54321,
    "homesteadBlock": 0,
    "eip150Block": 0,
    "eip150Hash": "0x0000000000000000000000000000000000000000000000000000000000000000",
    "eip155Block": 0,
    "eip158Block": 0,
    "byzantiumBlock": 0,
    "constantinopleBlock": 0,
    "petersburgBlock": 0,
    "istanbulBlock": 0,
    "muirGlacierBlock": 0,
    "subnetEVMTimestamp": 0,
    "feeConfig": {
      "gasLimit": 12000000,
      "targetBlockRate": 2,
      "minBaseFee": 25000000000,
      "targetGas": 15000000,
      "baseFeeChangeDenominator": 36,
      "minBlockGasCost": 0,
      "maxBlockGasCost": 1000000,
      "blockGasCostStep": 200000
    },
    "contractDeployerAllowListConfig": {
      "adminAddresses": ["0xADMIN_ADDRESS"],
      "enabledAddresses": [],
      "blockTimestamp": 0
    },
    "contractNativeMinterConfig": {
      "adminAddresses": ["0xADMIN_ADDRESS"],
      "enabledAddresses": [],
      "blockTimestamp": 0
    },
    "feeManagerConfig": {
      "adminAddresses": ["0xADMIN_ADDRESS"],
      "enabledAddresses": [],
      "blockTimestamp": 0
    },
    "rewardManagerConfig": {
      "adminAddresses": ["0xADMIN_ADDRESS"],
      "enabledAddresses": [],
      "blockTimestamp": 0
    },
    "warpConfig": {
      "blockTimestamp": 0,
      "quorumNumerator": 67
    }
  },
  "alloc": {
    "ADMIN_ADDRESS_WITHOUT_0x": {
      "balance": "0x152D02C7E14AF6800000"
    }
  },
  "nonce": "0x0",
  "timestamp": "0x0",
  "extraData": "0x00",
  "gasLimit": "0xB71B00",
  "difficulty": "0x0",
  "mixHash": "0x0000000000000000000000000000000000000000000000000000000000000000",
  "coinbase": "0x0000000000000000000000000000000000000000",
  "number": "0x0",
  "gasUsed": "0x0",
  "parentHash": "0x0000000000000000000000000000000000000000000000000000000000000000"
}
```

### Fee Configuration Deep Dive

```json
"feeConfig": {
  "gasLimit": 12000000,
  // MUST be ≥8,000,000. Recommended: 12,000,000 for standard Subnets.
  // Higher = more throughput per block but higher validator CPU.
  // C-Chain uses 8,000,000. Ethereum uses ~30,000,000.

  "targetBlockRate": 2,
  // Target seconds between blocks. C-Chain uses 2.
  // Lower = faster blocks but higher network load.
  // Recommended: 2 for standard use, 1 for high-throughput gaming/DeFi.

  "minBaseFee": 25000000000,
  // Minimum base fee in wei (25 Gwei). 
  // Set to 0 for a gasless Subnet (if you want to subsidize gas).
  // Set to 1000000000000 (1000 Gwei) to make gas expensive and reduce spam.

  "targetGas": 15000000,
  // Target gas per 10-second window (5 blocks × 2s each).
  // Formula: targetGas = gasLimit × targetBlockRate × 5
  // With gasLimit=12M and rate=2: 12000000 × 2 × 5 = 120,000,000
  // (note: this is per 10s window, so 15M per block equivalent)
  // Recommended: set to gasLimit * 1.25

  "baseFeeChangeDenominator": 36,
  // Controls how fast base fee changes. Higher = more stable fee.
  // C-Chain default: 36. Lower = fee responds faster to demand.

  "minBlockGasCost": 0,
  // Minimum total gas cost per block (for validators).
  // 0 = no minimum. Raise if you want to ensure validators are compensated.

  "maxBlockGasCost": 1000000,
  // Maximum total gas cost limit per block.

  "blockGasCostStep": 200000
  // How much blockGasCost changes per second difference from target rate.
}
```

**Gasless Subnet config** (gas paid in custom token, subsidized by protocol):
```json
"feeConfig": {
  "gasLimit": 15000000,
  "targetBlockRate": 2,
  "minBaseFee": 0,
  "targetGas": 15000000,
  "baseFeeChangeDenominator": 36,
  "minBlockGasCost": 0,
  "maxBlockGasCost": 0,
  "blockGasCostStep": 0
}
```

### Precompile Configuration

**ContractDeployerAllowList** — Restrict who can deploy contracts:
```json
"contractDeployerAllowListConfig": {
  "adminAddresses": ["0xADMIN"],    // Can add/remove from allowlist
  "enabledAddresses": ["0xDEV1", "0xDEV2"],  // Pre-allowlisted deployers
  "blockTimestamp": 0
}
```

**ContractNativeMinter** — Allow minting of native gas token:
```json
"contractNativeMinterConfig": {
  "adminAddresses": ["0xADMIN"],    // Can grant/revoke minter role
  "enabledAddresses": ["0xMINTER_CONTRACT"],  // Can call mintNativeCoin
  "blockTimestamp": 0
}
```

**FeeManager** — Allow dynamic fee adjustment:
```json
"feeManagerConfig": {
  "adminAddresses": ["0xADMIN"],
  "enabledAddresses": [],
  "blockTimestamp": 0
}
```

**RewardManager** — Configure validator reward distribution:
```json
"rewardManagerConfig": {
  "adminAddresses": ["0xADMIN"],
  "enabledAddresses": [],
  "initialRewardConfig": {
    "allowFeeRecipients": false
  },
  "blockTimestamp": 0
}
```

**Warp** — Enable cross-chain messaging:
```json
"warpConfig": {
  "blockTimestamp": 0,
  "quorumNumerator": 67
  // 67% of validators must sign Warp messages. Standard is 67 (2/3+1).
}
```

### Token Allocation

The `alloc` field pre-funds addresses at genesis (no transactions needed):

```json
"alloc": {
  "8db97c7cece249c2b98bdc0226cc4c2a57bf52fc": {
    "balance": "0x295BE96E64066972000000"
  },
  "youradminaddresswithout0x": {
    "balance": "0x152D02C7E14AF6800000"
  }
}
```

**Balance value reference** (18 decimal token):
| AVAX | Hex Value |
|---|---|
| 1 AVAX | `0xDE0B6B3A7640000` |
| 100 AVAX | `0x56BC75E2D63100000` |
| 1,000 AVAX | `0x3635C9ADC5DEA00000` |
| 1,000,000 AVAX | `0x295BE96E64066972000000` |
| 1,000,000,000 AVAX | `0x033B2E3C9FD0803CE8000000` |

Calculate:
```javascript
// Node.js
const amountInAVAX = 1000000n;
const hexBalance = "0x" + (amountInAVAX * 10n**18n).toString(16);
```

**Address format in alloc:** Lowercase, NO 0x prefix.

### EVM Version Configuration

```json
"config": {
  "subnetEVMTimestamp": 0,
  // Leave at 0 to enable all Subnet-EVM features from genesis.
  
  // For mainnet C-Chain equivalent EVM opcodes, use "paris":
  "evm_version": "paris"
  // Note: set in genesis metadata, not JSON key.
}
```

Avalanche supports up to cancun (EIP-4844 partial support). For maximum compatibility with Ethereum tooling, use `paris` EVM version in Hardhat/Foundry config.

### Modifying Precompiles After Genesis

You CANNOT change genesis after deployment. But you can update precompile configs using the precompile contracts themselves if you're an admin:

```solidity
// Add a new deployer to the ContractDeployerAllowList
IAllowList allowList = IAllowList(0x0200000000000000000000000000000000000000);
allowList.setEnabled(newDeployerAddress);
// Only works if msg.sender is in adminAddresses
```

### Validate Genesis Before Deployment

```bash
# Check if genesis is valid before deploying
avalanche subnet create mySubnet --genesis path/to/genesis.json

# Or test locally first
avalanche subnet deploy mySubnet --local
```

Common validation:
```bash
# Python validation script
python3 -c "
import json, sys
with open('genesis.json') as f:
    g = json.load(f)
assert 'config' in g
assert 'chainId' in g['config']
assert g['config']['feeConfig']['gasLimit'] >= 8000000
assert len(g.get('alloc', {})) > 0
print('Genesis structure looks valid')
print('Chain ID:', g['config']['chainId'])
print('Gas limit:', g['config']['feeConfig']['gasLimit'])
print('Allocated addresses:', len(g['alloc']))
"
```

## Key concepts

**Genesis is immutable** — Once deployed, genesis.json cannot be changed. The only way to change parameters is if you enabled the corresponding admin precompile.

**gasLimit in feeConfig vs top-level gasLimit** — `feeConfig.gasLimit` controls the Subnet-EVM gas limit. The top-level `gasLimit` (hex) must match: convert feeConfig.gasLimit to hex for the top-level field.

**Minimum gasLimit = 8,000,000** — Subnet-EVM rejects genesis with gasLimit below 8M. Recommended production value: 12M-15M.

**blockTimestamp = 0** — Setting precompile blockTimestamp to 0 enables it from the genesis block. Setting a future timestamp enables it later (useful for planned upgrades).

**alloc addresses** — Must be lowercase hex WITHOUT 0x prefix. Include at least one funded address or validators have no way to pay fees initially.

## Common errors

| Error | Cause | Fix |
|---|---|---|
| `gas limit too low` during genesis validation | gasLimit < 8,000,000 | Set feeConfig.gasLimit ≥ 8000000 |
| `invalid precompile config` | Wrong address format in adminAddresses | Use 0x-prefixed checksummed addresses |
| `incompatible fee config` | targetGas too low relative to gasLimit | Set targetGas ≈ gasLimit × 1.25 |
| `balance not hex` | alloc balance as decimal | Always use "0x" + hex string, not plain decimal |
| `address format wrong in alloc` | Using 0x prefix or uppercase | Must be lowercase, no 0x prefix in alloc keys |
| Precompile not working after deploy | blockTimestamp in future | Set blockTimestamp to 0 for immediate activation |

## Next skills

- `precompiles` — full precompile interface and Solidity usage
- `validator-management` — validators and staking after Subnet launch
- `security` — security review for custom genesis configs
