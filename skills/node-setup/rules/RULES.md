# Node Setup — Critical Rules

**Never expose port 9650 to the internet without a firewall or reverse proxy.**
The admin and keystore APIs can compromise your node if reachable publicly. Use `http-host: "127.0.0.1"` for dev nodes, or put nginx in front for production.

**Never delete `~/.avalanchego/staking/staker.crt` and `staker.key`.**
These files ARE your NodeID. If you lose them you lose your validator identity, any pending staking rewards, and your Subnet validator status. Back them up offline before any system changes.

**Always stop the node before disk maintenance or DB moves.**
AvalancheGo holds file locks on the DB. Copying or moving the DB while running will corrupt it.

**Do not run `--network-id=mainnet` on a machine that also runs testnet — use separate data directories.**
Mainnet and Fuji share the same default DB path. Set explicit `--db-dir` flags for each or they will corrupt each other.

**Enable pruning on C-Chain unless you specifically need archival data.**
Without `"pruning-enabled": true` in C-Chain config, the database will grow to 1.5TB+. Almost no use case requires full archival on a validator node.
