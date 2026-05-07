---
name: "blueprints"
version: "1.0.0"
spec: "agentskills@1.0"
license: "Apache-2.0"
tier: 2
description: "Use Avalanche Blueprints — pre-configured L1 templates for gaming, DeFi, and enterprise use cases."
trigger: |
  Use when: deploying an Avalanche L1 from a template, using Avalanche Blueprints, gaming L1 setup, DeFi L1 template, enterprise L1 with validator allowlist, Builder Hub Console blueprints, pre-configured genesis templates
  Do NOT use for: custom genesis from scratch, raw subnet-evm config without a template, C-Chain configuration
last_updated: "2026-05-07"
avalanche_networks: [fuji, mainnet]
related_skills:
  - subnet-deployment
  - subnet-evm-config
  - precompiles
  - avalanche-l1-economics
---

## Overview

Avalanche Blueprints are pre-configured L1 (Avalanche Subnet) templates available from the Builder Hub Console at `build.avax.network/console`. Each blueprint ships with a tested genesis configuration, recommended precompiles, and validator setup for a specific vertical. Blueprints are starting points — you customize them before deploying. They are not final production configs.

Docs: https://build.avax.network/docs/avalanche-l1s/deploy-a-avalanche-l1  
Console: https://build.avax.network/console

## When to fetch

Fetch this skill when:
- A user wants to deploy an Avalanche L1 and asks which template to use
- A user mentions gaming, DeFi, or enterprise L1 on Avalanche
- A user asks about Builder Hub Console blueprints
- A user wants a pre-configured genesis without building from scratch

## Core Workflow

### 1. Access Builder Hub Console

Navigate to https://build.avax.network/console and sign in. Select **"Launch an L1"** → **"Use a Blueprint"**.

Alternatively, use Avalanche CLI with a saved blueprint config:

```bash
# Install CLI
curl -sSfL https://raw.githubusercontent.com/ava-labs/avalanche-cli/main/scripts/install.sh | sh

avalanche network create
# Follow the interactive wizard — it exposes blueprint options
```

### 2. Choose a template

| Blueprint | Best for | Key features |
|-----------|----------|-------------|
| **Gaming** | High-throughput games, NFT minting | High gas limit, custom gas token, allowlisted deployers, 1s blocks |
| **DeFi** | DEX, lending, yield protocols | Fee manager precompile, standard EVM precompiles, 2s blocks |
| **Enterprise** | Regulated use cases, KYC chains | Validator allowlist, deployer allowlist, compliance-ready genesis |

### 3. Gaming blueprint — customize

Gaming blueprints are optimized for throughput. Key settings to review:

```json
{
  "config": {
    "chainId": 99999,
    "gasLimit": 30000000,
    "targetBlockRate": 1,
    "feeConfig": {
      "gasLimit": 30000000,
      "targetBlockRate": 1,
      "minBaseFee": 1000000000,
      "targetGas": 15000000,
      "baseFeeChangeDenominator": 48,
      "minBlockGasCost": 0,
      "maxBlockGasCost": 10000000,
      "blockGasCostStep": 500000
    },
    "contractDeployerAllowListConfig": {
      "blockTimestamp": 0,
      "adminAddresses": ["0xYOUR_ADMIN_ADDRESS"],
      "enabledAddresses": ["0xDEPLOYER_ADDRESS"]
    }
  },
  "nativeCurrency": {
    "name": "GameToken",
    "symbol": "GAME",
    "decimals": 18
  }
}
```

**Customize before deploying:**
- Set `chainId` to a unique value (check https://chainlist.org for conflicts)
- Set `adminAddresses` to your Safe multisig, not an EOA
- Set `nativeCurrency` name/symbol for your game token
- Adjust `gasLimit` based on your node hardware (30M requires strong CPUs)

### 4. DeFi blueprint — customize

```json
{
  "config": {
    "chainId": 88888,
    "targetBlockRate": 2,
    "feeManagerConfig": {
      "blockTimestamp": 0,
      "adminAddresses": ["0xYOUR_MULTISIG"]
    },
    "rewardManagerConfig": {
      "blockTimestamp": 0,
      "adminAddresses": ["0xYOUR_MULTISIG"]
    },
    "contractNativeMinterConfig": {
      "blockTimestamp": 0,
      "adminAddresses": ["0xYOUR_MULTISIG"]
    }
  }
}
```

Key DeFi blueprint precompiles enabled:
- `FeeManager` (0x0200000000000000000000000000000000000003) — adjust fees via governance
- `RewardManager` (0x0200000000000000000000000000000000000004) — direct fee revenue
- `NativeMinter` (0x0200000000000000000000000000000000000001) — mint native gas token

### 5. Enterprise blueprint — customize

```json
{
  "config": {
    "chainId": 77777,
    "validatorConfig": {
      "allowlistConfig": {
        "adminAddresses": ["0xYOUR_MULTISIG"],
        "enabledAddresses": ["0xVALIDATOR_1", "0xVALIDATOR_2"]
      }
    },
    "contractDeployerAllowListConfig": {
      "adminAddresses": ["0xYOUR_MULTISIG"],
      "enabledAddresses": ["0xAPPROVED_DEPLOYER"]
    },
    "txAllowListConfig": {
      "adminAddresses": ["0xYOUR_MULTISIG"],
      "enabledAddresses": ["0xKYC_VERIFIED_USER_1"]
    }
  }
}
```

Enterprise key properties:
- `txAllowList`: only KYC-verified addresses can send transactions
- `validatorAllowList`: only approved node operators can validate
- Combine with an off-chain KYC oracle for automated address allowlisting

### 6. Deploy to Fuji

```bash
# Deploy using Avalanche CLI with your customized config
avalanche blockchain create myL1 --config ./my-blueprint-config.json

# Deploy to Fuji
avalanche blockchain deploy myL1 --network fuji

# Note the Subnet ID and Chain ID from output — save these
```

### 7. Deploy to Mainnet

After thorough Fuji testing:

```bash
avalanche blockchain deploy myL1 --network mainnet
```

You will need validators with AVAX staked. The CLI will prompt for validator keys and confirm mainnet deployment.

## Network config

All blueprint-based L1s share the same validator infrastructure as the Avalanche primary network but run their own consensus. Fuji and Mainnet blueprint deployments use real AvalancheGo nodes.

| Blueprint | Default Block Rate | Default Gas Limit | Recommended Nodes |
|-----------|--------------------|-------------------|-------------------|
| Gaming | 1s | 30,000,000 | 5+ with 16+ cores |
| DeFi | 2s | 15,000,000 | 5+ with 8+ cores |
| Enterprise | 2s | 8,000,000 | 5+ allowlisted validators |

## Key concepts

- **Blueprint vs custom genesis**: A blueprint is a validated starting point. You still own the final genesis and must understand every field.
- **Precompile admin addresses**: Every precompile admin in a blueprint config MUST be a Safe multisig on mainnet — not an EOA. Losing the admin key means losing the ability to change fee parameters, allowlists, etc.
- **Gas limits in gaming blueprints**: 30M gas/block is extremely high. Validate your node hardware before deploying. Under-powered nodes will fall behind and be slashed.
- **Chain ID uniqueness**: Pick a chain ID not used by any other network. Use https://chainlist.org to verify. Duplicate chain IDs cause wallet and tooling issues.

## Common errors

| Error | Cause | Fix |
|-------|-------|-----|
| Nodes falling behind (gaming) | Gas limit too high for hardware | Reduce `gasLimit` or upgrade node hardware |
| `chainId already in use` | Duplicate chain ID | Pick a unique chain ID |
| Precompile admin locked out | Admin is an EOA, private key lost | Always use multisig as admin |
| Validators rejected | Allowlist not configured | Add validator addresses to `validatorAllowList` |
| Transaction reverted for normal user | `txAllowList` enabled but address not allowed | Add address to `txAllowList.enabledAddresses` |

## Next skills

- **subnet-deployment** — full manual genesis and deployment workflow
- **subnet-evm-config** — deep dive on Subnet-EVM genesis fields
- **precompiles** — all Subnet-EVM precompile reference
- **avalanche-l1-economics** — gas token economics and fee design
- **safe-multisig** — set up the multisig to use as blueprint admin
