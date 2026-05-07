---
name: "validator-management"
version: "1.0.0"
spec: "agentskills@1.0"
license: "Apache-2.0"
tier: 2
description: "Add and remove validators on Avalanche Subnets — node IDs, staking amounts, uptime monitoring, reward tracking."
trigger: |
  Use when: user wants to add/remove validators, check validator uptime, manage staking on a Subnet, or query validator status via API.
  Do NOT use for: deploying the Subnet itself (use subnet-deployment), general Hardhat/contract deployment.
last_updated: "2026-05-01"
avalanche_networks: [fuji, mainnet]
related_skills:
  - subnet-deployment
  - subnet-evm-config
---

## Overview

Validators are nodes that process and finalize transactions on Avalanche Subnets. Every Subnet validator must also validate the Primary Network (staking at least 2,000 AVAX on mainnet). This skill covers node setup, getting node IDs, adding validators via CLI and API, monitoring uptime, and understanding rewards.

## When to fetch

Fetch when a user needs to add validators to their Subnet, check validator status, or understand staking requirements.

## Core Workflow

### Step 1 — Get Node ID

Each validator node has a unique Node ID derived from its TLS certificate. Get it from your running avalanchego node:

```bash
# On your validator node
curl -X POST http://localhost:9650/ext/info \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"info.getNodeID","params":{}}'
# Returns: "nodeID": "NodeID-7Xhw2mDxuDS44j42TCB6U5579esbSt3Lg"

# Via Avalanche CLI (if CLI is on same machine)
avalanche node nodeID
```

Node ID format: `NodeID-{CB58_encoded_public_key}`

### Step 2 — Node Requirements

**Minimum hardware for a Subnet validator:**
- CPU: 8 cores (AMD/Intel x86-64)
- RAM: 16 GB
- Storage: 500 GB NVMe SSD (for Primary Network + Subnet state)
- Network: 5 Mbps up/down, stable connection

**Recommended for production:**
- CPU: 16+ cores
- RAM: 32+ GB
- Storage: 1 TB+ NVMe SSD

**Software:** AvalancheGo (https://github.com/ava-labs/avalanchego/releases)

**Required avalanchego config for Subnet validators:**
```json
{
  "track-subnets": "YOUR_SUBNET_ID,ANOTHER_SUBNET_ID",
  "api-admin-enabled": false,
  "http-port": 9650
}
```

Or via command line:
```bash
./avalanchego \
  --network-id=fuji \
  --track-subnets=2TxxxxxxxxxJ \
  --data-dir=/data/avalanchego
```

### Step 3 — Add a Validator to Primary Network

Before adding a Subnet validator, the node must be a Primary Network validator:

**Minimum stake:** 2,000 AVAX (mainnet), 1 AVAX (Fuji)
**Minimum duration:** 2 weeks (mainnet), 24 hours (Fuji)
**Maximum duration:** 1 year

Via Avalanche CLI:
```bash
avalanche primaryNetwork addValidator \
  --network fuji \
  --nodeID NodeID-7Xhw2mDxuDS44j42TCB6U5579esbSt3Lg \
  --stakeAmount 1000000000  \  # 1 AVAX in nAVAX for Fuji
  --startTime "2024-06-01T00:00:00Z" \
  --endTime "2024-07-01T00:00:00Z" \
  --key myKey \
  --delegation-fee 2  # 2% fee
```

Via P-Chain API:
```bash
curl -X POST https://api.avax-test.network/ext/bc/P \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "platform.addValidator",
    "params": {
      "nodeID": "NodeID-7Xhw2mDxuDS44j42TCB6U5579esbSt3Lg",
      "startTime": 1717200000,
      "endTime": 1719792000,
      "stakeAmount": 1000000000,
      "rewardAddress": "P-fuji1youraddress...",
      "delegationFeeRate": 2,
      "username": "myUser",
      "password": "myPass"
    }
  }'
```

### Step 4 — Add Validator to Your Subnet

After the node is a Primary Network validator:

```bash
# Via Avalanche CLI (recommended)
avalanche subnet addValidator mySubnet \
  --network fuji \
  --nodeID NodeID-7Xhw2mDxuDS44j42TCB6U5579esbSt3Lg \
  --key myKey

# This prompts for:
# - Start time (must be in future, at least 20 seconds)
# - End time (must be before Primary Network validation end)
# - Stake amount (Fuji: 1 AVAX, Mainnet: 2000 AVAX per Subnet requirements)
```

**Constraints:**
- Subnet validation end time must be ≤ Primary Network validation end time
- Node must be syncing the Subnet (`track-subnets` in config)
- At least one control key holder must sign

### Step 5 — Check Validator Status

```bash
# Check current validators for your Subnet
curl -X POST https://api.avax-test.network/ext/bc/P \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "platform.getCurrentValidators",
    "params": {
      "subnetID": "YOUR_SUBNET_ID"
    }
  }'
```

Response fields per validator:
```json
{
  "nodeID": "NodeID-...",
  "startTime": "1717200000",
  "endTime": "1719792000",
  "stakeAmount": "1000000000",
  "uptime": "0.9998",        // 99.98% uptime
  "connected": true,
  "txID": "2Tx...",          // AddValidator transaction ID
  "rewardOwner": {
    "threshold": 1,
    "addresses": ["P-fuji1..."]
  }
}
```

**Check pending validators** (not yet started):
```bash
curl -X POST https://api.avax-test.network/ext/bc/P \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "platform.getPendingValidators",
    "params": {"subnetID": "YOUR_SUBNET_ID"}
  }'
```

### Step 6 — Monitor Uptime

Uptime is checked by peers and reported to the P-Chain at the end of the validation period. Minimum uptime for rewards is typically 80%.

**Check node uptime:**
```bash
# On the validator node
curl -X POST http://localhost:9650/ext/health \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"health.getLiveness"}'

# Check network connectivity
curl -X POST http://localhost:9650/ext/info \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"info.peers","params":{}}'
# Should show 10+ peers for mainnet
```

**Monitor via AvaCloud Dashboard:**
1. Go to https://avacloud.io
2. Add your node ID to monitoring
3. Set alerts for uptime drops

**Automated uptime check script:**
```bash
#!/bin/bash
NODE_ID="NodeID-7Xhw2mDxuDS44j42TCB6U5579esbSt3Lg"
SUBNET_ID="YOUR_SUBNET_ID"

UPTIME=$(curl -s -X POST https://api.avax-test.network/ext/bc/P \
  -H "Content-Type: application/json" \
  -d "{\"jsonrpc\":\"2.0\",\"id\":1,\"method\":\"platform.getCurrentValidators\",\"params\":{\"subnetID\":\"$SUBNET_ID\",\"nodeIDs\":[\"$NODE_ID\"]}}" \
  | python3 -c "import sys,json; v=json.load(sys.stdin)['result']['validators']; print(v[0]['uptime'] if v else 'NOT FOUND')")

echo "Node $NODE_ID uptime: $UPTIME"
if python3 -c "exit(0 if float('$UPTIME') >= 0.8 else 1)" 2>/dev/null; then
  echo "OK: Above 80% threshold"
else
  echo "ALERT: Below 80% — may not receive rewards!"
fi
```

### Step 7 — Remove a Validator

Validators cannot be force-removed before their end time. They are removed automatically when the end time passes.

To remove early (only possible if you have control key):
```bash
# Via Avalanche CLI
avalanche subnet removeValidator mySubnet \
  --network fuji \
  --nodeID NodeID-7Xhw2mDxuDS44j42TCB6U5579esbSt3Lg \
  --key controlKey
```

### Staking Economics

| | Fuji Testnet | Mainnet |
|---|---|---|
| Primary Network minimum stake | 1 AVAX | 2,000 AVAX |
| Subnet validator minimum | 1 AVAX | 2,000 AVAX (+ Primary) |
| Reward rate | No rewards | ~7-10% APY (varies) |
| Delegation fee | N/A | 2-100% of delegator rewards |
| Minimum uptime for rewards | N/A | 80% |

## Key concepts

**Node ID vs Staker address** — Node ID identifies the validator node (TLS key). Staker address is the P-Chain address where staking rewards go. They're different.

**Primary Network first** — Every Subnet validator must be a Primary Network validator first. Subnet validation period must fit within Primary Network validation period.

**nAVAX units** — All P-Chain stake amounts are in nAVAX (nano-AVAX). 1 AVAX = 1,000,000,000 nAVAX. `2000 AVAX = 2000000000000 nAVAX`.

**track-subnets** — The avalanchego config flag that makes a node actually download and validate a Subnet's chain. Without this, the node won't sync the Subnet even if it's added as a validator.

**Uptime measurement** — Measured by other validators, not self-reported. Based on responsiveness to gossip protocol messages. Keep node online with stable internet.

## Common errors

| Error | Cause | Fix |
|---|---|---|
| `nodeID format invalid` | Missing NodeID- prefix | Format: `NodeID-7Xhw2mDxuDS44j42TCB6U5579esbSt3Lg` |
| `validator not found on primary network` | Node not yet a Primary validator | Add to Primary Network first |
| `end time must be before staker end time` | Subnet end > Primary end time | Set shorter end time for Subnet validation |
| Node not syncing Subnet | Missing track-subnets config | Add `--track-subnets=SUBNET_ID` to avalanchego |
| `start time in past` | startTime already passed | Use a timestamp at least 20 seconds in future |
| Validator added but not active | Pending state, waiting for start time | Check getPendingValidators; will become active at startTime |

## Next skills

- `subnet-deployment` — deploy the Subnet before adding validators
- `subnet-evm-config` — configure the genesis that validators will run
