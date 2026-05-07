---
name: "platform-cli"
version: "1.0.0"
spec: "agentskills@1.0"
license: "Apache-2.0"
tier: 1
description: "Complete reference for the Avalanche Platform CLI — the official 2026 replacement for the deprecated Avalanche CLI. Covers install, key management, wallet ops, subnet creation, chain creation, L1 conversion, and validator management."
trigger: |
  Use when: user wants to use Platform CLI, install Platform CLI, run platform commands, manage validators with CLI, or anytime someone references `platform subnet`, `platform chain`, `platform keys`, `platform transfer`, or `platform l1` commands.
  Also use when: user is migrating from the old `avalanche subnet` CLI to the new tooling.
  Do NOT use: for UI-based deployment via Builder Console (use subnet-deployment skill instead).
last_updated: "2026-05-07"
avalanche_networks: [fuji, mainnet, local]
related_skills:
  - subnet-deployment
  - validator-management
  - subnet-evm-config
---

## Overview

**Platform CLI** (`platform`) is the official Avalanche command-line tool for creating and managing Avalanche L1s, validators, and the P-Chain operations. It replaces the deprecated `avalanche` CLI.

> **Note:** The old `avalanche subnet`, `avalanche network`, and `avalanche key` commands are deprecated as of 2026. Use `platform` commands instead.

## When to fetch

Use when: user wants to create an Avalanche L1/Subnet, manage validator keys, transfer AVAX between C-Chain and P-Chain, register or remove validators (ACP-77), deploy a custom chain, or interact with the P-Chain from the command line.
Do NOT use for: smart contract deployments (use evm-hardhat or evm-foundry), frontend wallet operations, or cross-chain messaging.

## Installation

```bash
# Install Platform CLI
curl -sSfL build.avax.network/install/platform-cli | sh

# Verify installation
platform version

# Upgrade to latest
curl -sSfL build.avax.network/install/platform-cli | sh
```

## Key Management

```bash
# Generate a new key pair
platform keys generate --name mykey

# Import existing private key
platform keys import --name mykey --private-key 0xYOUR_PRIVATE_KEY

# List all managed keys
platform keys list

# Export key (private key — keep secret)
platform keys export --name mykey

# Delete a key
platform keys delete --name mykey
```

Keys are stored locally in `~/.platform-cli/keys/`. **Never commit key files to git.** Use environment variables for CI/CD:

```bash
platform keys import --name ci-key --private-key $PLATFORM_PRIVATE_KEY
```

## Wallet Operations

```bash
# Check P-Chain balance
platform wallet balance --key-name mykey --network fuji
platform wallet balance --key-name mykey --network mainnet

# Check C-Chain balance
platform wallet balance --key-name mykey --network fuji --chain c

# Transfer AVAX from C-Chain to P-Chain (required before subnet creation)
platform transfer c-to-p --amount 0.5 --key-name mykey --network fuji

# Transfer AVAX from P-Chain back to C-Chain
platform transfer p-to-c --amount 0.5 --key-name mykey --network fuji

# Check transfer status
platform transfer status --tx-id 0xTX_HASH --network fuji
```

**Why C-to-P is needed:** Subnet creation and chain creation fees are paid on P-Chain. C-Chain AVAX must be cross-chain transferred to P-Chain first.

## Subnet Operations

### Create a Subnet

```bash
# Create a new Subnet on Fuji
platform subnet create --key-name mykey --network fuji

# Output:
# Subnet ID: 2QYfFcfZ9Dxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
# Transaction ID: 3ZxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxJ

export SUBNET_ID=2QYfFcfZ9Dxx...
```

### Subnet Status

```bash
# Get Subnet details from P-Chain
platform subnet describe --subnet-id $SUBNET_ID --network fuji
```

### Convert Subnet to L1

Converting to L1 requires a `ValidatorManager` contract deployed on your chain (see `subnet-deployment` skill for full workflow):

```bash
platform subnet convert-l1 \
  --subnet-id $SUBNET_ID \
  --chain-id $CHAIN_ID \
  --manager $VALIDATOR_MANAGER_ADDRESS \
  --validators YOUR_NODE_IP:9650 \
  --validator-balance 1.0 \
  --key-name mykey \
  --network fuji
```

For multiple validators:
```bash
platform subnet convert-l1 \
  --subnet-id $SUBNET_ID \
  --chain-id $CHAIN_ID \
  --manager $MANAGER_ADDRESS \
  --validators 1.2.3.4:9650 \
  --validators 5.6.7.8:9650 \
  --validator-balance 1.0 \
  --key-name mykey \
  --network fuji
```

## Chain Operations

### Create a Blockchain on a Subnet

```bash
platform chain create \
  --subnet-id $SUBNET_ID \
  --genesis /path/to/genesis.json \
  --name "MyChain" \
  --key-name mykey \
  --network fuji

# Output:
# Blockchain ID: 3RZgGdaH1xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
# RPC URL: https://api.avax-test.network/ext/bc/3RZgGdaH1xxx/rpc
# WebSocket URL: wss://api.avax-test.network/ext/bc/3RZgGdaH1xxx/ws

export CHAIN_ID=3RZgGdaH1xxx...
```

### Chain Info

```bash
# Get chain status / RPC details
platform chain describe --blockchain-id $CHAIN_ID --network fuji
```

## L1 Validator Management (ACP-77)

### Register a New Validator

After `ValidatorManager` contract emits a `RegisterL1ValidatorMessage` warp message:

```bash
platform l1 register-validator \
  --balance 1.33 \
  --pop 0xBLS_PROOF_OF_POSSESSION \
  --message 0xWARP_MESSAGE_HEX \
  --key-name mykey \
  --network fuji
```

### Add Balance to a Validator Slot

```bash
# Each L1 validator slot consumes 1.33 AVAX/month from P-Chain
platform l1 add-balance \
  --validation-id VALIDATION_ID \
  --balance 2.0 \
  --key-name mykey \
  --network mainnet
```

### Disable / Remove a Validator

```bash
platform l1 disable-validator \
  --validation-id VALIDATION_ID \
  --key-name mykey \
  --network mainnet
```

### List Active Validators

```bash
# L1 validators for a specific chain
platform l1 validators --blockchain-id $CHAIN_ID --network fuji
```

## Primary Network Validator Management

Primary Network validators are separate from L1 validators. They validate the X/P/C chains:

```bash
# Add a Primary Network validator
# Minimum: 2,000 AVAX stake, 14–365 day duration
platform validator add \
  --node-id NodeID-7Xhw2mDxuDS44j42TCB6U5579esbSt3Lg \
  --stake 2000 \
  --duration 336h \
  --key-name mykey \
  --network mainnet

# Check validator status
platform validator status \
  --node-id NodeID-7Xhw2mDxuDS44j42TCB6U5579esbSt3Lg \
  --network mainnet

# List your validators
platform validator list --key-name mykey --network mainnet
```

## Node Info

```bash
# Get NodeID, BLS public key, BLS proof of possession for any node
platform node info --ip YOUR_NODE_IP:9650

# Output:
# NodeID: NodeID-7Xhw2mDxuDS44j42TCB6U5579esbSt3Lg
# BLS Public Key: 0x8f95dc...
# BLS Proof of Possession: 0x9a7c...
```

## Global Flags

```bash
# Available on all commands:
--network fuji        # Fuji testnet (default)
--network mainnet     # Avalanche mainnet
--network local       # Local node at http://127.0.0.1:9650
--rpc-url URL         # Custom node URL (overrides --network)
--key-name NAME       # Key to use (from keys list)
--timeout 60s         # Custom timeout (default: 30s)
--output json         # JSON output format
--verbose             # Verbose logging
```

## Environment Variables

```bash
# Set defaults to avoid passing flags repeatedly:
export PLATFORM_NETWORK=fuji
export PLATFORM_KEY_NAME=mykey
export PLATFORM_RPC_URL=https://api.avax-test.network

# Import private key from env (CI/CD pattern):
platform keys import --name ci-key --private-key $PLATFORM_PRIVATE_KEY
```

## Migration from Avalanche CLI

| Old Command | New Command |
|---|---|
| `avalanche subnet create mySubnet` | `platform subnet create --key-name mykey` |
| `avalanche subnet deploy mySubnet --network fuji` | `platform chain create --subnet-id $ID --genesis genesis.json --key-name mykey --network fuji` |
| `avalanche subnet addValidator mySubnet` | `platform l1 register-validator ...` |
| `avalanche key create myKey` | `platform keys generate --name mykey` |
| `avalanche key list` | `platform keys list` |
| `avalanche network start` | AvalancheGo + `./avalanchego --network-id=local` |
| `avalanche network stop` | `pkill avalanchego` |
| `avalanche subnet describe mySubnet` | `platform subnet describe --subnet-id $ID` |

**Key difference:** Platform CLI does not store named Subnet configs locally. You reference subnets by their on-chain Subnet IDs. Keep your Subnet ID, Blockchain ID, and RPC URL in your project's environment or `.env` file.

## Core Workflow

1. Install Platform CLI: `curl -sSfL build.avax.network/install/platform-cli | sh`
2. Generate or import key: `platform keys generate --name mykey`
3. Fund P-Chain on Fuji: get AVAX from faucet, transfer C→P with `platform transfer c-to-p`
4. Create Subnet: `platform subnet create --key-name mykey --network fuji`
5. Create Chain: `platform chain create --subnet-id $ID --genesis genesis.json --name MyChain --key-name mykey --network fuji`
6. Convert to L1 (ACP-77): `platform subnet convert-l1 --subnet-id $ID --chain-id $CID --manager $MANAGER --validators IP:9650 --validator-balance 1.0 --key-name mykey --network fuji`
7. Register validators: `platform l1 register-validator --balance 1.33 --pop ... --message ...`

## Key concepts

| Concept | Description |
|---|---|
| Subnet | Container that owns validator set and blockchains |
| Chain | A blockchain inside a Subnet, with its own VM and genesis |
| L1 conversion (ACP-77) | Converts a Subnet to an independent L1 with its own validator staking |
| ValidatorManager | Smart contract on C-Chain controlling who can validate an L1 |
| BLS key | Validator identity key required for ACP-77 L1 registration |
| PoP (Proof of Possession) | BLS signature proving the validator controls the BLS key |

## Common errors

| Error | Cause | Fix |
|---|---|---|
| `insufficient P-Chain balance` | No AVAX on P-Chain | `platform transfer c-to-p --amount 1.0 --key-name mykey` |
| `key not found: mykey` | Key doesn't exist | `platform keys generate --name mykey` or `platform keys import` |
| `connection refused` | Node unavailable | Check node is running; use `--rpc-url` to override URL |
| `invalid private key format` | Wrong key format | Key must start with `0x` and be 64 hex chars |
| `BLS key not found` | Node lacks BLS keys | Upgrade AvalancheGo to ≥v1.10.0 (BLS auto-generated) |
| `subnet not found` | Wrong Subnet ID or wrong network | Verify `--network` flag matches where Subnet was created |

## Next skills

- `subnet-deployment` — full L1 deployment workflow (prerequisites, genesis, ValidatorManager)
- `validator-management` — ACP-77 validator monitoring, balance management, and troubleshooting
- `subnet-evm-config` — deep genesis configuration and precompile setup
