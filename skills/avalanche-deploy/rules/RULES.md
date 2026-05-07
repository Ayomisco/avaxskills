# RULES — avalanche-deploy

These rules apply whenever the `avalanche-deploy` skill is active. Cloud deployments incur real costs and manage real validator credentials.

## Mandatory rules

### R1 — Always review cloud costs before deploying
Validator nodes run 24/7. Before deploying, calculate the estimated monthly cost using your cloud provider's pricing calculator. A 5-node AWS deployment costs approximately $300–800/month. Confirm budget approval before running `avalanche node create`.

### R2 — Back up state files immediately after deployment
The state files in `~/.avalanche-cli/nodes/` contain node IDs, IP addresses, and staking credentials. Back these up to a secure location (encrypted S3 bucket, 1Password, etc.) immediately after deployment. Without them, you cannot manage, update, or cleanly destroy your nodes.

### R3 — Back up staking keys
Back up each node's `staker.key` and `staker.crt` from `~/.avalanche-cli/nodes/<node-name>/`. Losing staking keys means losing the ability to prove validator identity. Store backups encrypted and offline.

### R4 — Use separate cloud accounts for testnet and mainnet
Never share cloud credentials, VPCs, or node state between Fuji testnet and mainnet deployments. A configuration mistake on a shared account could affect mainnet validators.

### R5 — Verify node sync before registering as validator
After provisioning, always confirm nodes are fully bootstrapped before adding them as validators. Use `avalanche node status <node-name>` and verify the node is in sync with the network tip. Registering an unsynced node wastes staking rewards.

### R6 — Do not destroy nodes with active validator stakes
Running `avalanche node destroy` removes the cloud instance. If that node is an active validator with staked AVAX, destroying it without first removing it from the validator set will result in slashing or lost rewards. Always remove the node from the validator set first (wait for staking period to end or initiate removal), then destroy.

## Anti-patterns

- Do NOT store cloud credentials in playbook YAML files — use environment variables or cloud IAM roles.
- Do NOT run Fuji and mainnet validators on the same cloud instance — separate them.
- Do NOT use `avalanche node destroy` in CI pipelines without explicit confirmation gates.
- Do NOT skip the state file backup — losing it means manual recovery via cloud console which is error-prone.
- Do NOT use under-powered instances (less than 8 vCPU / 16 GB RAM) for mainnet validators.
