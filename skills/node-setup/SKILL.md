---
name: "node-setup"
version: "1.0.0"
spec: "agentskills@1.0"
license: "Apache-2.0"
tier: 2
description: "Install, configure, and run an AvalancheGo node — local dev node, Fuji testnet sync, and Mainnet validator setup."
trigger: |
  Use when: user wants to run their own Avalanche node, set up a validator, run a local dev environment,
  sync with Fuji or Mainnet, configure AvalancheGo, or set up node infrastructure.
  Do NOT use for: adding a validator to a Subnet (use validator-management), deploying contracts (use evm-hardhat).
last_updated: "2026-05-07"
avalanche_networks: [fuji, mainnet]
related_skills:
  - validator-management
  - subnet-deployment
  - platform-cli
  - concepts
---

## Overview

AvalancheGo is the official Go implementation of the Avalanche node. Running your own node gives you a private RPC endpoint, full control over data, and the ability to become a validator. A node syncs all three chains (C, P, X) and can participate in consensus. Minimum specs: 8-core CPU, 16GB RAM, 1TB NVMe SSD, 5Mbps internet.

> **Fastest start for developers:** Use the pre-built install script. Full sync to Mainnet takes 2–8 hours. Fuji testnet syncs in under 1 hour.

## When to fetch

Fetch when the user wants to run infrastructure, become a validator, set up a local RPC endpoint, or build node-dependent tooling. Skip this for contract development — use public RPCs instead.

## Core Workflow

### Step 1 — Install AvalancheGo

**Option A: Install script (recommended)**
```bash
curl -sSfL https://raw.githubusercontent.com/ava-labs/avalanchego/master/scripts/install.sh | sh
```
Installs to `~/avalanche-node/`. Creates a systemd service (`avalanchego`) automatically on Linux.

**Option B: Build from source**
```bash
git clone https://github.com/ava-labs/avalanchego.git
cd avalanchego
./scripts/build.sh
# binary: ./build/avalanchego
```

**Option C: Docker**
```bash
docker pull avaplatform/avalanchego:latest
docker run -d \
  -p 9650:9650 -p 9651:9651 \
  -v ~/.avalanchego:/root/.avalanchego \
  avaplatform/avalanchego:latest
```

**Verify installation:**
```bash
avalanchego --version
# AvalancheGo/v1.x.x [linux/amd64]
```

---

### Step 2 — Configure the Node

Config file location: `~/.avalanchego/configs/node.json`

**Fuji testnet (for development):**
```json
{
  "network-id": "fuji",
  "http-host": "127.0.0.1",
  "http-port": 9650,
  "staking-port": 9651,
  "db-dir": "~/.avalanchego/db",
  "log-level": "info",
  "api-admin-enabled": false,
  "api-keystore-enabled": false,
  "api-metrics-enabled": true,
  "index-enabled": false
}
```

**Mainnet (for validators):**
```json
{
  "network-id": "mainnet",
  "http-host": "0.0.0.0",
  "http-port": 9650,
  "staking-port": 9651,
  "db-dir": "/data/avalanchego/db",
  "log-level": "info",
  "api-admin-enabled": false,
  "api-metrics-enabled": true,
  "index-enabled": true
}
```

**C-Chain config** (`~/.avalanchego/configs/chains/C/config.json`):
```json
{
  "pruning-enabled": true,
  "snapshot-async": true,
  "rpc-gas-cap": 50000000,
  "rpc-tx-fee-cap": 100
}
```

---

### Step 3 — Start the Node

**Direct:**
```bash
avalanchego --config-file ~/.avalanchego/configs/node.json
```

**systemd (Linux — production):**
```bash
# Service file created by install script at /etc/systemd/system/avalanchego.service
sudo systemctl start avalanchego
sudo systemctl enable avalanchego   # start on boot
sudo systemctl status avalanchego
```

**Check logs:**
```bash
journalctl -u avalanchego -f          # live logs
journalctl -u avalanchego --since "1h ago"
```

---

### Step 4 — Verify Sync Status

Check if bootstrapping is complete:
```bash
curl -X POST http://127.0.0.1:9650/ext/health \
  -H 'Content-Type: application/json' \
  --data '{"jsonrpc":"2.0","id":1,"method":"health.health","params":{}}'
```

Response when fully synced:
```json
{
  "result": {
    "healthy": true,
    "checks": {
      "C": {"message": {"reachable": true, "bootstrapped": true}},
      "P": {"message": {"reachable": true, "bootstrapped": true}},
      "X": {"message": {"reachable": true, "bootstrapped": true}}
    }
  }
}
```

Check bootstrap progress per chain:
```bash
# P-Chain
curl -X POST http://127.0.0.1:9650/ext/bc/P \
  -H 'Content-Type: application/json' \
  --data '{"jsonrpc":"2.0","id":1,"method":"platform.isBootstrapped","params":{"chain":"P"}}'
```

---

### Step 5 — Get Your Node ID (for validators)

```bash
curl -X POST http://127.0.0.1:9650/ext/info \
  -H 'Content-Type: application/json' \
  --data '{"jsonrpc":"2.0","id":1,"method":"info.getNodeID","params":{}}'
```

Response:
```json
{
  "result": {
    "nodeID": "NodeID-5mb46qkSBj81k9g9e4VFjGGSbaaSLFRzD",
    "nodePOP": {
      "publicKey": "0x...",
      "proofOfPossession": "0x..."
    }
  }
}
```
Save this `nodeID` — you need it to add yourself as a validator.

---

### Step 6 — Expose C-Chain RPC (optional)

Your node's C-Chain RPC endpoint:
```
http://127.0.0.1:9650/ext/bc/C/rpc
```

Use this in Hardhat/Foundry instead of the public RPC for unlimited requests:
```typescript
// hardhat.config.ts
networks: {
  mainnet: {
    url: "http://127.0.0.1:9650/ext/bc/C/rpc",
    chainId: 43114,
  }
}
```

For external access, put nginx in front and restrict to known IPs.

---

### Step 7 — Pruning and Maintenance

**Disk usage (approximate after full sync):**
| Network | C-Chain | P-Chain | X-Chain | Total |
|---|---|---|---|---|
| Mainnet (pruned) | ~350GB | ~40GB | ~20GB | ~420GB |
| Mainnet (archival) | ~1.5TB | ~40GB | ~20GB | ~1.6TB |
| Fuji (pruned) | ~30GB | ~5GB | ~3GB | ~38GB |

**Enable pruning** (C-Chain config, already shown above):
```json
{ "pruning-enabled": true }
```

**Update AvalancheGo:**
```bash
# Re-run install script to update in-place
curl -sSfL https://raw.githubusercontent.com/ava-labs/avalanchego/master/scripts/install.sh | sh
sudo systemctl restart avalanchego
```

**Database backup before major updates:**
```bash
sudo systemctl stop avalanchego
cp -r ~/.avalanchego/db ~/.avalanchego/db.backup
sudo systemctl start avalanchego
```

---

## Network config

| Chain | RPC Endpoint (local) | Purpose |
|---|---|---|
| C-Chain | `http://localhost:9650/ext/bc/C/rpc` | Smart contracts, EVM |
| P-Chain | `http://localhost:9650/ext/bc/P` | Validators, Subnets |
| X-Chain | `http://localhost:9650/ext/bc/X` | Asset exchange |
| Health | `http://localhost:9650/ext/health` | Node status |
| Metrics | `http://localhost:9650/ext/metrics` | Prometheus metrics |

---

## Key concepts

- **Bootstrap** — Initial sync where your node downloads and verifies all historical blocks. C-Chain bootstrapping is the slowest (2–6 hours on Mainnet).
- **NodeID** — Your node's unique identity on the network. Derived from your staking certificate. Required to add yourself as a validator.
- **Staking certificate** — TLS cert at `~/.avalanchego/staking/staker.crt`. Back this up — losing it means losing your NodeID.
- **Pruning** — Deletes old state that isn't needed for consensus. Reduces C-Chain disk from ~1.5TB to ~350GB. Enabled by default in modern AvalancheGo.
- **API port (9650)** — HTTP API. Never expose this to the internet without authentication/firewall.

---

## Common errors

| Error | Cause | Fix |
|---|---|---|
| `connection refused` on port 9650 | Node not started or wrong port | Check `systemctl status avalanchego`, confirm port in config |
| Bootstrap stuck at same height | Slow peers or outdated DB | Restart node, check disk space, try `--bootstrap-retry-enabled=true` |
| `disk full` crash | C-Chain DB grew beyond disk | Enable pruning in C-Chain config, add disk space |
| Node shows unhealthy after update | DB format change | Stop node, move old DB, let it resync (or restore backup) |
| `staker.crt not found` | First run or wrong path | Node generates it on first start in `~/.avalanchego/staking/` |

---

## Next skills

- `validator-management` — Add your node as a validator once it's synced
- `subnet-deployment` — Deploy a Subnet using your running node
- `platform-cli` — Platform CLI uses your node's RPC for Subnet operations
- `avalanche-rpc` — Full RPC method reference for your local endpoint
