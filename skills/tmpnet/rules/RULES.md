# RULES — tmpnet

These rules apply whenever the `tmpnet` skill is active. tmpnet is for local testing only — violations can leave orphan processes or leak test credentials.

## Mandatory rules

### R1 — Set AVALANCHEGO_PATH before starting
Always set the `AVALANCHEGO_PATH` environment variable (or pass the path programmatically) to the compiled `avalanchego` binary before starting any tmpnet network. Without it, the network will fail to start with a cryptic error.

```bash
export AVALANCHEGO_PATH=/path/to/avalanchego/build/avalanchego
```

### R2 — Always clean up after tests
Always call `network.Stop()` and remove the data directory after tests complete. Use `defer network.Stop(ctx)` in Go tests and an `if: always()` step in CI. tmpnet leaves processes running and data on disk if not explicitly stopped.

### R3 — Minimum 5 nodes for consensus
Always use at least 5 nodes (`tmpnet.NewNodesOrPanic(5)`) to reach BFT consensus. Fewer nodes will cause consensus to stall and tests to hang.

### R4 — Never use tmpnet for mainnet-like testing
tmpnet uses a local network ID (12345) with genesis configs containing massive pre-funded balances. It is fundamentally different from mainnet/Fuji. Never draw performance or economic conclusions from tmpnet results.

### R5 — Read node URIs dynamically
Never hardcode node ports. tmpnet assigns random ports on each run. Always read `network.Nodes[i].URI` after the network starts.

### R6 — Custom VM binaries must be named by VM ID
When testing a custom VM, the binary in `pluginDir` must be named by the VM's ID (32-byte hash, base58-encoded), not a human-readable name. Use `avalanche vm id <vm-name>` to get the correct ID.

## Anti-patterns

- Do NOT use tmpnet for load testing or benchmarking — local network performance does not reflect mainnet.
- Do NOT commit tmpnet data directories to version control — they contain generated keys and large state files.
- Do NOT run multiple tmpnet networks on the same ports — use fresh temp dirs for parallel test runs.
- Do NOT use ANR (Avalanche Network Runner) — it is deprecated. Use tmpnet instead.
- Do NOT assume pre-funded test keys have any value — they are test-only and regenerated each run.
