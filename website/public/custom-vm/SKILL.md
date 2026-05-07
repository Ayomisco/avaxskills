---
name: "custom-vm"
version: "1.0.0"
spec: "agentskills@1.0"
license: "Apache-2.0"
tier: 2
description: "Build and deploy a custom virtual machine on Avalanche — VM interface implementation and deployment."
trigger: |
  Use when: user wants to build a non-EVM blockchain on Avalanche, implement a custom VM, or deploy a Go-based virtual machine as a Subnet.
  Do NOT use for: standard EVM Subnet deployment (use subnet-deployment), Solidity contract development.
last_updated: "2026-05-01"
related_skills:
  - subnet-deployment
  - validator-management
---

## Overview

Avalanche allows any Go program implementing the VM interface to run as a Subnet's execution layer. You're not limited to EVM — you can build a custom state machine, consensus rules, and API. The VM interface connects your logic to Avalanche consensus. This skill covers the VM interface, the SpacesVM reference implementation, and deploying a custom VM.

## When to fetch

Fetch when a user needs non-EVM execution (e.g., a custom database, game state machine, or novel consensus model) on Avalanche. Most projects should use Subnet-EVM instead.

## Core Workflow

### Step 1 — VM Interface Requirements

Your custom VM must implement the `block.ChainVM` interface from AvalancheGo:

```go
// From github.com/ava-labs/avalanchego/snow/engine/snowman/block
type ChainVM interface {
    common.VM        // Initialize, Shutdown, Version, CreateStaticHandlers, CreateHandlers, HealthCheck
    Getter           // GetBlock(id ids.ID) (Block, error)
    Parser           // ParseBlock(ctx context.Context, blockBytes []byte) (Block, error)
    Builder          // BuildBlock(ctx context.Context) (Block, error)
    common.Bootstrapable
}

// Each Block must implement:
type Block interface {
    snowman.Block // ID, Parent, Height, Timestamp, Verify, Accept, Reject
    Bytes() []byte
    Status() choices.Status
}
```

### Step 2 — Project Structure

```bash
mkdir my-custom-vm && cd my-custom-vm
go mod init github.com/yourorg/my-custom-vm
go get github.com/ava-labs/avalanchego

# Project layout
my-custom-vm/
├── main/
│   └── main.go          # Entry point — runs gRPC server
├── vm/
│   ├── vm.go            # VM implementation
│   ├── block.go         # Block implementation
│   ├── state.go         # State management
│   └── api.go           # HTTP API handlers
├── cmd/
│   └── my-vm/
│       └── main.go
└── go.mod
```

### Step 3 — Minimal VM Implementation

```go
// vm/vm.go
package vm

import (
    "context"
    "github.com/ava-labs/avalanchego/database"
    "github.com/ava-labs/avalanchego/ids"
    "github.com/ava-labs/avalanchego/snow"
    "github.com/ava-labs/avalanchego/snow/engine/common"
    "github.com/ava-labs/avalanchego/snow/engine/snowman/block"
)

type VM struct {
    ctx        *snow.Context
    db         database.Database
    preferred  ids.ID
    toEngine   chan<- common.Message
    // ... your state
}

func (vm *VM) Initialize(
    ctx context.Context,
    chainCtx *snow.Context,
    db database.Database,
    genesisBytes []byte,
    upgradeBytes []byte,
    configBytes []byte,
    toEngine chan<- common.Message,
    _ []*common.Fx,
    appSender common.AppSender,
) error {
    vm.ctx = chainCtx
    vm.db = db
    vm.toEngine = toEngine
    
    // Initialize genesis if DB is empty
    if err := vm.initGenesis(genesisBytes); err != nil {
        return err
    }
    return nil
}

func (vm *VM) BuildBlock(ctx context.Context) (block.Block, error) {
    // Create a new block from pending transactions
    // Must include parent, height, timestamp, content
    return vm.buildNewBlock()
}

func (vm *VM) ParseBlock(ctx context.Context, blockBytes []byte) (block.Block, error) {
    // Deserialize block bytes into a Block struct
    return vm.parseBlock(blockBytes)
}

func (vm *VM) GetBlock(_ context.Context, id ids.ID) (block.Block, error) {
    // Retrieve a block by ID from storage
    return vm.getBlock(id)
}

func (vm *VM) SetPreference(ctx context.Context, id ids.ID) error {
    vm.preferred = id
    return nil
}

func (vm *VM) LastAccepted(context.Context) (ids.ID, error) {
    return vm.lastAcceptedID, nil
}

func (vm *VM) Shutdown(context.Context) error {
    return vm.db.Close()
}

func (vm *VM) Version(context.Context) (string, error) {
    return "1.0.0", nil
}
```

### Step 4 — Entry Point

```go
// main/main.go
package main

import (
    "github.com/ava-labs/avalanchego/vms/rpcchainvm"
    "github.com/yourorg/my-custom-vm/vm"
)

func main() {
    // AvalancheGo communicates with custom VMs via gRPC
    rpcchainvm.Serve(context.Background(), &vm.VM{})
}
```

### Step 5 — Build and Package

```bash
# Build the VM binary
go build -o my-vm-binary ./main/

# AvalancheGo looks for VM plugins in its plugin directory
# Default: $AVALANCHEGO_DATA_DIR/plugins/
# Must be named with the VM ID (a CB58-encoded hash)

# Generate a VM ID (use any 32-byte hash)
VMID=$(echo -n "my-custom-vm" | sha256sum | cut -d' ' -f1 | xxd -r -p | base58check encode)

# Copy binary to plugin directory
cp my-vm-binary $GOPATH/src/github.com/ava-labs/avalanchego/build/plugins/$VMID
```

### Step 6 — Deploy via Avalanche CLI

```bash
# Deploy your custom VM Subnet
avalanche subnet create myCustomVM

# When prompted for VM type:
# ? Which Virtual Machine would you like to use?
# > Custom VM  ← Select this

# Provide VM ID and binary path when prompted

# Deploy to local network for testing
avalanche subnet deploy myCustomVM --local

# Deploy to Fuji
avalanche subnet deploy myCustomVM --network fuji
```

### Step 7 — SpacesVM as Reference

SpacesVM (https://github.com/ava-labs/spacesvm) is a production custom VM that implements a key-value store with ownership semantics. Good reference for:

```bash
git clone https://github.com/ava-labs/spacesvm
cd spacesvm
# Study: vm/vm.go, chain/block.go, chain/interpreter.go
```

Key patterns from SpacesVM:
- `interpreter.go` — how to execute transactions
- `block.go` — block verification and state transitions
- `api.go` — exposing an HTTP API from your VM

## Key concepts

**AvalancheGo plugin model** — Custom VMs are separate binaries that communicate with AvalancheGo via gRPC. AvalancheGo launches the binary when starting the chain.

**rpcchainvm** — The glue package that translates the gRPC protocol into your ChainVM interface. Always use `rpcchainvm.Serve()` as your entry point.

**Block lifecycle** — Build → Verify → Accept/Reject. Your VM builds blocks, AvalancheGo runs consensus, then calls Accept (finalized) or Reject (orphaned).

**VM ID** — 32-byte identifier for your VM. Must match the binary filename in the plugins directory. AvalancheGo uses this to launch the correct binary.

**Genesis bytes** — Passed to Initialize(). Your VM defines the format — JSON, protobuf, etc. Used to set up initial state.

## Common errors

| Error | Cause | Fix |
|---|---|---|
| VM binary not found | Wrong plugin directory or filename | Binary must be in `$AVALANCHEGO_DATA_DIR/plugins/{VMID}` |
| gRPC connection failed | Binary crashes on start | Run binary manually, check stderr for panic |
| Block verification fails | Invalid block format | Check that ParseBlock/BuildBlock are inverse operations |
| State corruption | Not committing DB on Accept | Call `db.Commit()` in your Block.Accept() |

## Next skills

- `subnet-deployment` — deploy the Subnet that runs your custom VM
- `validator-management` — add validators to your custom VM Subnet
