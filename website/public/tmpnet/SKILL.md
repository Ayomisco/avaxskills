---
name: "tmpnet"
version: "1.0.0"
spec: "agentskills@1.0"
license: "Apache-2.0"
tier: 2
description: "Spin up temporary local Avalanche networks for testing — multi-node setups, custom L1s, and CI environments."
trigger: |
  Use when: spinning up a local Avalanche network for testing, using tmpnet, Avalanche Network Runner replacement, multi-node local testing, CI Avalanche network, AvalancheGo test fixtures, programmatic local network setup in Go tests
  Do NOT use for: mainnet node setup, validator management on live networks, Fuji testnet, production deployments
last_updated: "2026-05-07"
avalanche_networks: [fuji, mainnet]
related_skills:
  - node-setup
  - subnet-deployment
  - testing
  - local-dev-environment
---

## Overview

`tmpnet` is Avalanche's official temporary network framework for local testing, located at `tests/fixture/tmpnet` inside the AvalancheGo repository. It replaces the older Avalanche Network Runner (ANR). tmpnet spins up real multi-node AvalancheGo networks in-process or via subprocess for Go integration tests and CI pipelines. It is the tool used by AvalancheGo's own CI suite.

Docs: https://build.avax.network/docs/tooling/tmpnet  
Source: `github.com/ava-labs/avalanchego/tests/fixture/tmpnet`

## When to fetch

Fetch this skill when:
- A user wants a local multi-node Avalanche network for testing
- A user asks about tmpnet, ANR replacement, or AvalancheGo test fixtures
- A user is writing Go integration tests that need a real Avalanche network
- CI pipeline needs an ephemeral Avalanche network

## Core Workflow

### 1. Install prerequisites

```bash
# Go 1.21+
go version

# Clone AvalancheGo (tmpnet lives here)
git clone https://github.com/ava-labs/avalanchego
cd avalanchego

# Build the avalanchego binary
./scripts/build.sh

# The binary is at: ./build/avalanchego
export AVALANCHEGO_PATH=$(pwd)/build/avalanchego
```

### 2. Network configuration

tmpnet uses a `Network` struct to define the network. The minimum viable config:

```go
package mytest

import (
    "github.com/ava-labs/avalanchego/tests/fixture/tmpnet"
    "github.com/ava-labs/avalanchego/config"
)

func newTestNetwork() *tmpnet.Network {
    return &tmpnet.Network{
        // Number of nodes (5 is the minimum for full consensus)
        Nodes: tmpnet.NewNodesOrPanic(5),
        // ChainConfigs lets you override C-Chain or X-Chain config
        ChainConfigs: map[string]tmpnet.FlagsMap{
            "C": {
                "log-level": "debug",
            },
        },
    }
}
```

### 3. Start a local multi-node network

**In a Go test (recommended):**

```go
package integration_test

import (
    "testing"
    "github.com/ava-labs/avalanchego/tests/fixture/tmpnet"
    "github.com/ava-labs/avalanchego/tests/fixture/e2e"
)

func TestMyFeature(t *testing.T) {
    // StartNetwork creates, starts, and registers cleanup
    network := e2e.StartNetwork(
        t,
        &tmpnet.Network{
            Nodes: tmpnet.NewNodesOrPanic(5),
        },
        os.Getenv("AVALANCHEGO_PATH"),
        "",   // rootDataDir — empty = temp dir
        0,    // validatorCount (0 = use Nodes count)
        0,    // duration (0 = for the test duration)
    )

    // Get C-Chain RPC endpoint
    cChainURI := network.Nodes[0].URI + "/ext/bc/C/rpc"
    t.Logf("C-Chain RPC: %s", cChainURI)
}
```

**Standalone (CLI-style) via Go main:**

```go
network, err := tmpnet.StartNetwork(
    ctx,
    logger,
    rootDataDir,      // e.g. "/tmp/mytest-network"
    &tmpnet.Network{
        Nodes: tmpnet.NewNodesOrPanic(5),
    },
    avalancheGoPath,
    pluginDir,
)
if err != nil {
    log.Fatal(err)
}
defer network.Stop(context.Background())
```

### 4. Run tests against the network

```go
// Each node exposes standard Avalanche APIs
nodeURI := network.Nodes[0].URI  // e.g. http://127.0.0.1:9650

// C-Chain JSON-RPC
cChainRPC := nodeURI + "/ext/bc/C/rpc"

// P-Chain API
pChainAPI := nodeURI + "/ext/bc/P"

// Health check
healthURI := nodeURI + "/ext/health"

// Pre-funded accounts (genesis)
// tmpnet funds a set of test keys — get them via:
keys := network.PreFundedKeys  // []*secp256k1.PrivateKey
```

### 5. Custom L1 / Subnet in tmpnet

```go
subnet := &tmpnet.Subnet{
    Name: "my-test-l1",
    Chains: []*tmpnet.Chain{
        {
            VMName:  "subnetevm",
            Genesis: genesisBytes, // your custom genesis JSON as []byte
            Config:  chainConfigBytes,
        },
    },
    ValidatorIDs: network.GetNodeIDs(), // use all nodes as validators
}

network, err := tmpnet.StartNetwork(ctx, logger, rootDataDir, &tmpnet.Network{
    Nodes:   tmpnet.NewNodesOrPanic(5),
    Subnets: []*tmpnet.Subnet{subnet},
}, avalancheGoPath, pluginDir)
```

### 6. Clean up

```go
// Stop all nodes and remove data (use defer in tests)
if err := network.Stop(context.Background()); err != nil {
    t.Errorf("failed to stop network: %v", err)
}

// Or remove the data dir manually:
os.RemoveAll(rootDataDir)
```

**CI cleanup (GitHub Actions):**

```yaml
- name: Stop tmpnet
  if: always()
  run: |
    kill $(cat /tmp/mytest-network/pids) 2>/dev/null || true
    rm -rf /tmp/mytest-network
```

## Network config

tmpnet generates its own genesis with pre-funded accounts and does not connect to Fuji or Mainnet. It uses local network ID `12345` by default.

| Parameter | Default | Notes |
|-----------|---------|-------|
| Network ID | 12345 | Local only — never seen on mainnet |
| Nodes | 5 | Minimum for BFT consensus |
| Pre-funded balance | 300M AVAX per key | Test keys only — no real value |
| AVALANCHEGO_PATH | (must be set) | Path to compiled avalanchego binary |

## Key concepts

- **tmpnet vs ANR**: tmpnet is the current tool; ANR (Avalanche Network Runner) is deprecated. Do not use ANR for new projects.
- **Plugin directory**: If your test uses a custom VM (e.g., Subnet-EVM), set `pluginDir` to the directory containing the VM binary named by its VM ID.
- **Pre-funded keys**: tmpnet provides a set of secp256k1 test keys pre-funded in genesis. Never use these keys on real networks.
- **Node URI**: Each node gets a random port. Always read `node.URI` dynamically — never hardcode a port.
- **Data dir**: Each network run gets its own directory. In CI, use a temp dir and clean it up in `always:` steps.

## Common errors

| Error | Cause | Fix |
|-------|-------|-----|
| `AVALANCHEGO_PATH not set` | env var missing | `export AVALANCHEGO_PATH=/path/to/avalanchego` |
| `exec: no such file or directory` | binary path wrong | Build AvalancheGo first: `./scripts/build.sh` |
| `not enough nodes to achieve consensus` | fewer than 5 nodes | Use `tmpnet.NewNodesOrPanic(5)` minimum |
| `plugin not found` | custom VM binary missing | Place VM binary in `pluginDir` named by VM ID |
| Nodes still running after test | no cleanup called | Always call `network.Stop()` in `defer` or CI `always:` |

## Next skills

- **node-setup** — production AvalancheGo node setup (not tmpnet)
- **subnet-deployment** — deploy real L1s to Fuji/mainnet after local testing
- **testing** — Avalanche testing patterns and frameworks
- **local-dev-environment** — full local dev setup including tmpnet
