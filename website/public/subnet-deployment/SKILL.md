---
name: "subnet-deployment"
version: "2.0.0"
spec: "agentskills@1.0"
license: "Apache-2.0"
tier: 2
description: "Deploy a custom Avalanche L1/Subnet from scratch — genesis config, validator bootstrap, Fuji testnet, and mainnet promotion."
trigger: |
  Use when: user wants to create their own blockchain on Avalanche, deploy a Subnet, configure a custom L1, set up Subnet-EVM, bootstrap validators, or asks about Avalanche L1s.
  Do NOT use for: deploying contracts to C-Chain, cross-chain messaging setup, or general EVM development.
last_updated: "2026-05-07"
avalanche_networks: [fuji, mainnet]
related_skills:
  - platform-cli
  - subnet-evm-config
  - warp-messaging
  - validator-management
  - contract-addresses
  - precompiles
---

## Overview

An Avalanche Subnet (now called Avalanche L1) is your own sovereign blockchain that uses Avalanche consensus. You choose the validator set, gas token, fee structure, and which EVM precompiles to enable. This gives you full control: custom gas tokens, allowlisted deployers, native minting, and cross-chain messaging via Warp. Subnets are the flagship Avalanche feature — they're what makes Avalanche unique vs Ethereum L2s.

> **Tooling Update (2026):** `avalanche subnet` CLI is **deprecated**. Use **Platform CLI** or **Builder Console**.

Two paths:
1. **Web UI (Easiest):** `https://build.avax.network/console/create-l1` — handles everything via a UI
2. **CLI (Full Control):** Install Platform CLI: `curl -sSfL build.avax.network/install/platform-cli | sh`

## When to fetch

Fetch this skill whenever someone asks to create a new blockchain, deploy a Subnet, or set up a custom L1 on Avalanche. Also fetch for hackathon projects that want to showcase Subnet uniqueness.

## Core Workflow

### Step 1 — Install Platform CLI

```bash
curl -sSfL build.avax.network/install/platform-cli | sh
platform version   # verify
```

Set up a key and fund the P-Chain:
```bash
platform keys generate --name mykey
platform wallet balance --key-name mykey --network fuji

# Bridge AVAX from C-Chain to P-Chain (needed for subnet/chain creation fees)
platform transfer c-to-p --amount 0.5 --key-name mykey --network fuji
```

Get Fuji testnet AVAX: `https://build.avax.network/console/primary-network/faucet`

### Step 2 — Create Subnet

```bash
platform subnet create --key-name mykey --network fuji
# Output: Subnet ID: 2QYfFcfZ9abc...
export SUBNET_ID=2QYfFcfZ9abc...
```

Then create a blockchain on it (after writing your genesis.json in Step 3):
```bash
platform chain create \
  --subnet-id $SUBNET_ID \
  --genesis genesis.json \
  --name "MyChain" \
  --key-name mykey \
  --network fuji
# Blockchain ID: 3RZgGdaH1abc...
# RPC URL: https://api.avax-test.network/ext/bc/3RZgGdaH1abc/rpc
export CHAIN_ID=3RZgGdaH1abc...
```

Old interactive wizard approach is no longer used. Key genesis decisions:

**1. Choose VM type:**
```
? Which Virtual Machine would you like to use?
> Subnet-EVM        ← Choose this for EVM compatibility
  Custom VM
```

**2. Configure genesis (choose method):**
```
? How would you like to set your genesis?
> I want to use default values     ← Start here for first Subnet
  Advanced: I want to walk through all the genesis params
  I want to use a custom genesis file
```

**3. Default token for gas:**
```
? What do you want to name your token (e.g., TEST)?
> MYTOKEN
```

**4. EVM chain ID:**
```
? What's the ChainId for your subnet's EVM?
> 12345
# Pick any unused ID. Check chainlist.org for conflicts.
# For production, pick something unique above 200000.
```

**5. Token allocation:**
```
? How would you like to distribute funds?
> Airdrop 1 million tokens to the default ewoq address (do not use in production)
# For testnet/dev: use ewoq (address: 0x8db97C7cEcE249c2b98bDC0226Cc4C2A57BF52FC)
# For production: specify your own address
```

After wizard completes, genesis is saved at:
`~/.avalanche-cli/subnets/mySubnet/genesis.json`

### Step 3 — Review and Customize Genesis

View the generated genesis:
```bash
cat ~/.avalanche-cli/subnets/mySubnet/genesis.json
```

Key genesis fields:

```json
{
  "config": {
    "chainId": 12345,
    "homesteadBlock": 0,
    "eip150Block": 0,
    "eip155Block": 0,
    "eip158Block": 0,
    "byzantiumBlock": 0,
    "constantinopleBlock": 0,
    "petersburgBlock": 0,
    "istanbulBlock": 0,
    "muirGlacierBlock": 0,
    "subnetEVMTimestamp": 0,
    "feeConfig": {
      "gasLimit": 8000000,          // ≥8M recommended
      "minBaseFee": 25000000000,    // 25 gwei minimum
      "targetGas": 15000000,        // Target gas per 10s window
      "baseFeeChangeDenominator": 36,
      "minBlockGasCost": 0,
      "maxBlockGasCost": 1000000,
      "targetBlockRate": 2,         // 2 second blocks
      "blockGasCostStep": 200000
    },
    "contractDeployerAllowListConfig": {
      "adminAddresses": ["0xYOUR_ADMIN_ADDRESS"],
      "blockTimestamp": 0
    },
    "contractNativeMinterConfig": {
      "adminAddresses": ["0xYOUR_ADMIN_ADDRESS"],
      "blockTimestamp": 0
    }
  },
  "alloc": {
    "8db97c7cece249c2b98bdc0226cc4c2a57bf52fc": {
      "balance": "0x295BE96E64066972000000"
    }
  },
  "nonce": "0x0",
  "timestamp": "0x0",
  "gasLimit": "0x7A1200",
  "difficulty": "0x0",
  "mixHash": "0x0000000000000000000000000000000000000000000000000000000000000000",
  "coinbase": "0x0000000000000000000000000000000000000000",
  "number": "0x0",
  "gasUsed": "0x0",
  "parentHash": "0x0000000000000000000000000000000000000000000000000000000000000000"
}
```

**Critical genesis values to set for production:**
- `chainId` — unique, check chainlist.org
- `gasLimit` — minimum 8,000,000 (0x7A1200), recommend 12,000,000
- `feeConfig.minBaseFee` — set to 0 for gasless Subnet (custom gas token)
- `alloc` — pre-fund your actual deployment addresses
- Remove `contractDeployerAllowListConfig` if you want open deployment

Edit genesis manually if needed:
```bash
# Edit the genesis file directly
nano ~/.avalanche-cli/subnets/mySubnet/genesis.json
```

Or use advanced wizard:
```bash
avalanche subnet configure mySubnet
```

### Step 4 — Convert Subnet to L1

Before converting, deploy a `ValidatorManager` contract to your chain:

```bash
npm install @avalabs/icm-contracts
# In hardhat.config.ts add your chain (RPC from Step 2, chainId from genesis)
npx hardhat run scripts/deploy-validator-manager.ts --network mychain
export MANAGER_ADDRESS=0xDEPLOYED_ADDRESS
```

Minimal `PoAManager` deploy script:
```typescript
import { ethers } from "hardhat";
async function main() {
  const [deployer] = await ethers.getSigners();
  const VMImpl = await ethers.getContractFactory("ValidatorManager");
  const vm = await VMImpl.deploy();
  const PoA = await ethers.getContractFactory("PoAManager");
  const poa = await PoA.deploy(vm.address, deployer.address);
  console.log("PoAManager:", poa.address);
}
main();
```

Then convert:
```bash
platform subnet convert-l1 \
  --subnet-id $SUBNET_ID \
  --chain-id $CHAIN_ID \
  --manager $MANAGER_ADDRESS \
  --validators YOUR_NODE_IP:9650 \
  --validator-balance 1.0 \
  --key-name mykey \
  --network fuji
```

**Save these:** Subnet ID, Blockchain ID, RPC URL.

### Step 5 — Manage Validators via Platform CLI

Get node info:
```bash
platform node info --ip YOUR_NODE_IP:9650
# Returns: NodeID, BLS public key, BLS proof of possession
```

Register additional validators:
```bash
# After ValidatorManager emits a RegisterL1ValidatorMessage warp message:
platform l1 register-validator \
  --balance 1.0 \
  --pop 0xBLS_PROOF \
  --message 0xWARP_MESSAGE_HEX \
  --key-name mykey --network fuji
```

For Primary Network validators (separate from L1 validators):
```bash
# Primary Network: minimum 2,000 AVAX stake, 14-365 day duration
platform validator add \
  --node-id NodeID-7Xhw2mDx... \
  --stake 2000 \
  --duration 336h \
  --key-name mykey --network mainnet
```

**L1 validators:** Each validator slot costs 1.33 AVAX/month to P-Chain (burned).

### Step 6 — Test Your Subnet

Add the Subnet to MetaMask:
- RPC URL: from the deploy output above
- Chain ID: 12345 (whatever you set)
- Currency: MYTOKEN

Test transactions:
```bash
# Using cast (Foundry)
cast chain-id --rpc-url https://api.avax-test.network/ext/bc/2Rxx.../rpc
cast block-number --rpc-url https://api.avax-test.network/ext/bc/2Rxx.../rpc
cast balance 0x8db97C7cEcE249c2b98bDC0226Cc4C2A57BF52FC --rpc-url https://api.avax-test.network/ext/bc/2Rxx.../rpc
```

Deploy a contract to your Subnet:
```bash
# In hardhat.config.ts, add:
mySubnet: {
  url: "https://api.avax-test.network/ext/bc/2Rxx.../rpc",
  chainId: 12345,
  accounts: [process.env.PRIVATE_KEY]
}
# Then:
npx hardhat deploy --network mySubnet
```

### Step 7 — Local Development

For fast local iteration, use the L1 Toolbox:
- Web: `https://build.avax.network/tools/l1-toolbox`
- Supports mock validators for local testing

```bash
# Convert with a mock validator for local testing:
platform subnet convert-l1 \
  --subnet-id $SUBNET_ID \
  --chain-id $CHAIN_ID \
  --mock-validator \
  --key-name mykey \
  --rpc-url http://127.0.0.1:9650
```

Run AvalancheGo locally:
```bash
# Download AvalancheGo and run a local node
# https://github.com/ava-labs/avalanchego/releases
./avalanchego --network-id=fuji --http-port=9650
```

### Step 8 — Mainnet Promotion

**Prerequisites:**
- [ ] Fuji L1 running ≥2 weeks without issues
- [ ] Security audit complete (`audit` skill)
- [ ] Passed `qa` pre-launch checklist
- [ ] ValidatorManager contract audited
- [ ] Real AVAX on P-Chain (L1 validator slots: 1.33 AVAX/month; Primary Network: 2,000 AVAX)
- [ ] Genesis allocations verified with stakeholders

Repeat Steps 3–7 with `--network mainnet`.

**Platform CLI mainnet L1 management:**
```bash
# Add validator balance
platform l1 add-balance \
  --validation-id VALIDATION_ID \
  --balance 1.33 \
  --key-name mykey --network mainnet

# Disable a validator
platform l1 disable-validator \
  --validation-id VALIDATION_ID \
  --key-name mykey --network mainnet
```

## Network config

| Network | Chain ID | RPC URL | Explorer |
|---|---|---|---|
| C-Chain Mainnet | 43114 | https://api.avax.network/ext/bc/C/rpc | https://subnets.avax.network/c-chain |
| Fuji Testnet | 43113 | https://api.avax-test.network/ext/bc/C/rpc | https://subnets-test.avax.network/c-chain |
| Your Subnet (Fuji) | custom | https://api.avax-test.network/ext/bc/{BLOCKCHAIN_ID}/rpc | — |
| Your Subnet (Mainnet) | custom | https://api.avax.network/ext/bc/{BLOCKCHAIN_ID}/rpc | — |

## Key concepts

**Subnet vs Blockchain** — A Subnet is a validator set. A Blockchain runs on top of a Subnet. One Subnet can run multiple blockchains, but typically Subnets have one blockchain.

**Subnet ID vs Blockchain ID** — Subnet ID identifies the validator set on P-Chain. Blockchain ID identifies the specific chain. The RPC URL uses Blockchain ID, not Subnet ID.

**Genesis block** — The first block of your chain. Sets all initial state, allocations, and configuration. Cannot be changed after deployment — choose carefully.

**ewoq address** — `0x8db97C7cEcE249c2b98bDC0226Cc4C2A57BF52FC` — the well-known test address with private key `56289e99c94b6912bfc12adc093c9b51124f0dc54ac7a766b2bc5ccf558d8027`. Only use for local/testnet.

**Control keys** — P-Chain addresses that can add/remove validators from the Subnet. Set at Subnet creation. Guard these carefully on mainnet.

## Common errors

| Error | Cause | Fix |
|---|---|---|
| `invalid node ID format` | NodeID missing "NodeID-" prefix | Format: `NodeID-7Xhw2mDx...` (include prefix) |
| `insufficient funds` during deploy | Not enough AVAX on P-Chain | Bridge AVAX to P-Chain via Core Wallet or avalanchego |
| `genesis validation failed` | Invalid genesis.json structure | Validate JSON, check chainId is integer not string |
| Validator not syncing | Node can't find Subnet peers | Ensure `--track-subnets=SUBNET_ID` is set in avalanchego config |
| RPC URL returns 404 | Wrong Blockchain ID in URL | Get correct ID from `avalanche subnet describe mySubnet` |
| `cannot marshal state` | Genesis allocation format wrong | Balance must be hex string: `"0x295BE96E64066972000000"` |
| `start time must be in the future` | Validator start time passed | Use a future timestamp (at least 20 seconds ahead) |

## Next skills

- `subnet-evm-config` — customize precompiles, fee config, and genesis deeply
- `warp-messaging` — enable cross-chain messaging between your Subnet and C-Chain
- `validator-management` — detailed validator operations and monitoring
- `contract-addresses` — precompile addresses available on your Subnet
- `precompiles` — configure NativeMinter, FeeManager, AllowList on your Subnet
