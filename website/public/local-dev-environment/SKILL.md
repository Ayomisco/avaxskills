---
name: "local-dev-environment"
version: "1.0.0"
spec: "agentskills@1.0"
license: "Apache-2.0"
tier: 0
description: "Set up a local Avalanche development environment — AvalancheGo local node, Hardhat local chain, Foundry Anvil, and connecting tools. For developers who want to build and test without Fuji."
trigger: |
  Use when: user wants to run Avalanche locally, set up a local dev environment, test without spending testnet tokens, run AvalancheGo locally, or debug on a local chain.
last_updated: "2026-05-07"
avalanche_networks: [local]
related_skills:
  - quickstart
  - evm-hardhat
  - evm-foundry
  - subnet-deployment
---

## Overview

Three options for local Avalanche development:

1. **Hardhat local node** — simplest, no Avalanche-specific features, good for contract unit tests
2. **Foundry Anvil** — fastest for contract tests, fork mainnet/Fuji at any block
3. **AvalancheGo local** — full Avalanche node locally, required for Subnet/L1 dev and Warp testing

Choose based on what you're building:
- Pure EVM contracts → Hardhat or Anvil
- Subnet/L1 or Warp messages → AvalancheGo local

## When to fetch

Fetch when someone wants a local dev environment, asks about running Avalanche locally, or wants to test without using Fuji testnet.

## Option 1 — Hardhat Local Node (Fastest Setup)

```bash
# Install
npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox

# Create project
npx hardhat init

# Start local node
npx hardhat node
# Listening on http://127.0.0.1:8545
# 20 pre-funded accounts printed to console
```

```typescript
// hardhat.config.ts — add Avalanche network alongside local
import "@nomicfoundation/hardhat-toolbox";

export default {
  solidity: "0.8.20",
  networks: {
    hardhat: {
      chainId: 43114,  // Simulate C-Chain chain ID locally
    },
    localhost: {
      url: "http://127.0.0.1:8545",
      chainId: 43114
    },
    fuji: {
      url: "https://api.avax-test.network/ext/bc/C/rpc",
      chainId: 43113,
      accounts: [process.env.PRIVATE_KEY!]
    },
    avalanche: {
      url: "https://api.avax.network/ext/bc/C/rpc",
      chainId: 43114,
      accounts: [process.env.PRIVATE_KEY!]
    }
  }
};
```

```bash
# Deploy to local Hardhat
npx hardhat run scripts/deploy.ts --network localhost

# Run tests (uses in-process Hardhat EVM, no node needed)
npx hardhat test
```

## Option 2 — Foundry Anvil (Fast + Fork Support)

```bash
# Install Foundry
curl -L https://foundry.paradigm.xyz | bash
foundryup

# Start Anvil (local EVM node)
anvil

# Fork from Fuji (replay real state locally)
anvil --fork-url https://api.avax-test.network/ext/bc/C/rpc

# Fork from Mainnet at specific block
anvil --fork-url https://api.avax.network/ext/bc/C/rpc --fork-block-number 40000000
```

**Anvil defaults:**
- RPC: `http://127.0.0.1:8545`
- Chain ID: 31337 (override with `--chain-id 43114`)
- 10 pre-funded accounts (10,000 ETH each)

```bash
# Deploy with Foundry to local Anvil
forge script scripts/Deploy.s.sol:DeployScript \
  --rpc-url http://127.0.0.1:8545 \
  --broadcast \
  --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80

# Run Foundry tests (no node needed)
forge test -vvv
```

**Fork mainnet to test with real tokens:**
```bash
# Start forked mainnet
anvil --fork-url https://api.avax.network/ext/bc/C/rpc

# In your test: impersonate WAVAX whale
vm.startPrank(0xWHALE_ADDRESS);
IERC20(WAVAX).transfer(address(this), 1000 ether);
vm.stopPrank();
```

## Option 3 — AvalancheGo Local Node

Required for: custom Subnets/L1s, Warp message testing, P-Chain/X-Chain operations.

### Install AvalancheGo

```bash
# Download latest release
curl -sSfL https://raw.githubusercontent.com/ava-labs/avalanchego/master/scripts/install.sh | sh

# Or download directly from GitHub Releases
# https://github.com/ava-labs/avalanchego/releases

# Verify
./avalanchego --version
```

### Run a Local Fuji-Like Network

```bash
# Start a local single-node network (custom local network)
./avalanchego \
  --network-id=local \
  --http-host=127.0.0.1 \
  --http-port=9650 \
  --staking-enabled=false \
  --snow-sample-size=1 \
  --snow-quorum-size=1 \
  --log-level=info \
  --data-dir=/tmp/avalanche-local

# C-Chain RPC will be available at:
# http://127.0.0.1:9650/ext/bc/C/rpc
```

### Local Network Config (for contracts)

```typescript
// hardhat.config.ts
localAvax: {
  url: "http://127.0.0.1:9650/ext/bc/C/rpc",
  chainId: 43112, // local network chain ID
  accounts: [
    // ewoq private key (pre-funded on local network)
    "56289e99c94b6912bfc12adc093c9b51124f0dc54ac7a766b2bc5ccf558d8027"
  ]
}
```

**ewoq address (pre-funded locally):**
- Address: `0x8db97C7cEcE249c2b98bDC0226Cc4C2A57BF52FC`
- Private key: `56289e99c94b6912bfc12adc093c9b51124f0dc54ac7a766b2bc5ccf558d8027`
- Balance: 1M AVAX on local network
- **NEVER use ewoq on Fuji or Mainnet**

### Check Local Node Status

```bash
# Bootstrapping status
curl -X POST --data '{"jsonrpc":"2.0","id":1,"method":"info.isBootstrapped","params":{"chain":"C"}}' \
  -H 'content-type:application/json' http://127.0.0.1:9650/ext/info

# Node ID
curl -X POST --data '{"jsonrpc":"2.0","id":1,"method":"info.getNodeID"}' \
  -H 'content-type:application/json' http://127.0.0.1:9650/ext/info
```

### Deploy Local Subnet (for L1 testing)

```bash
# Install Platform CLI
curl -sSfL build.avax.network/install/platform-cli | sh

# Create subnet on local node
platform subnet create --key-name ewoq --rpc-url http://127.0.0.1:9650

# Create blockchain
platform chain create \
  --subnet-id $SUBNET_ID \
  --genesis genesis.json \
  --name "TestChain" \
  --key-name ewoq \
  --rpc-url http://127.0.0.1:9650
```

## MetaMask Local Setup

Add local network to MetaMask:
- Network Name: `Avalanche Local`
- RPC URL: `http://127.0.0.1:9650/ext/bc/C/rpc` (AvalancheGo) or `http://127.0.0.1:8545` (Hardhat/Anvil)
- Chain ID: `43112` (local AvalancheGo) or `31337` (Anvil) or `43114` (Hardhat with chainId override)
- Currency Symbol: `AVAX`

## Environment Variables

```bash
# .env for local development
PRIVATE_KEY=56289e99c94b6912bfc12adc093c9b51124f0dc54ac7a766b2bc5ccf558d8027
LOCAL_RPC=http://127.0.0.1:9650/ext/bc/C/rpc
HARDHAT_RPC=http://127.0.0.1:8545
```

Never commit real private keys to `.env`. The ewoq key above is safe to share (publicly known test key).

## Comparison

| | Hardhat | Anvil | AvalancheGo |
|---|---|---|---|
| Setup time | 2 min | 2 min | 10 min |
| Mainnet fork | ✅ | ✅ | ❌ |
| Subnet/L1 support | ❌ | ❌ | ✅ |
| Warp messages | ❌ | ❌ | ✅ |
| P-Chain/X-Chain | ❌ | ❌ | ✅ |
| Fast iteration | ✅ | ✅ (fastest) | medium |
| Resource usage | low | low | high |

## Core Workflow

1. Install Node.js 20+, Foundry (`foundryup`), AvalancheGo (optional)
2. For Hardhat: `npm install --save-dev hardhat` → `npx hardhat node` → chain ID 31337, RPC `http://127.0.0.1:8545`
3. For Anvil: `anvil --chain-id 43112` (matching Fuji chain ID helps with config reuse)
4. Add local network to MetaMask: `http://127.0.0.1:8545`, chain ID 31337/43112
5. Use pre-funded accounts from Hardhat/Anvil output — never use real keys locally
6. For full Avalanche node: run `avalanchego --network-id=local` and connect to `http://localhost:9650`

## Key concepts

| Concept | Description |
|---|---|
| Hardhat Network | In-process EVM node, fastest for unit tests, no real consensus |
| Anvil | Foundry's local node, supports mainnet forking, very fast |
| AvalancheGo local | Real multi-chain Avalanche node: C, P, X chains + Subnets |
| Fork mode | Anvil feature: mirrors mainnet state locally for realistic testing |
| Chain ID 31337 | Default Hardhat chain ID (Anvil defaults to 31337 too) |
| `.env` | Store `PRIVATE_KEY` and `RPC_URL` here — never hardcode |

## Common errors

| Error | Cause | Fix |
|---|---|---|
| `ECONNREFUSED 127.0.0.1:8545` | Local node not running | Start `npx hardhat node` or `anvil` first |
| MetaMask shows wrong balance | Cached nonce or state | Reset MetaMask account under Advanced settings |
| Tx nonce mismatch | Hardhat reset but MetaMask didn't | Reset account nonce in MetaMask Advanced |
| AvalancheGo won't start | Port 9650 in use | `lsof -i :9650` and kill blocking process |

## Next skills

- `evm-hardhat` — full Hardhat setup and test patterns
- `evm-foundry` — Foundry testing and scripting
- `subnet-deployment` — deploy a local Subnet/L1 with AvalancheGo
- `quickstart` — first steps on Avalanche
