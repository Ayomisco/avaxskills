# RULES — blueprints

These rules apply whenever the `blueprints` skill is active. Blueprints are starting points — skipping review steps can lock users out of their own chain.

## Mandatory rules

### R1 — Always test on Fuji before mainnet
Every blueprint-based L1 must complete a full test cycle on Fuji (deploy, send transactions, exercise all precompiles, test validator rotation) before mainnet deployment. Mainnet deployments with validator staking cannot be easily undone.

### R2 — Review every genesis field before deploying
Blueprints are starting points, not final configs. Review and understand every field — especially `chainId`, `adminAddresses`, `gasLimit`, and `nativeCurrency`. Deploying without understanding these fields leads to misconfigured chains.

### R3 — Use a unique chain ID
Always verify your chosen `chainId` is not used by another network at https://chainlist.org before deploying. Duplicate chain IDs cause MetaMask, wallet, and explorer conflicts.

### R4 — Set multisig as all precompile admin addresses
Every precompile admin address (FeeManager, RewardManager, NativeMinter, ContractDeployerAllowList, TxAllowList, ValidatorAllowList) must be a Safe multisig, not an EOA, on mainnet. Losing an EOA admin key permanently locks the precompile config.

### R5 — Verify hardware before gaming blueprint
The gaming blueprint sets `gasLimit: 30000000`. Before deploying, confirm your validator nodes have at least 16 CPU cores and 64 GB RAM. Under-powered validators will fall behind and be penalized.

### R6 — Understand the allowlist model before enterprise deployment
Enterprise blueprints use `txAllowList` by default — only explicitly allowed addresses can send transactions. Always have a plan for onboarding new users (KYC oracle, admin tx to add addresses) before going live.

## Anti-patterns

- Do NOT use blueprint defaults for `chainId` (e.g., 99999, 88888) — these are examples, not unique values.
- Do NOT use an EOA for any precompile admin on mainnet.
- Do NOT treat blueprint gas limits as optimal for all hardware — benchmark your nodes first.
- Do NOT deploy to mainnet without at least 5 validators committed to running the L1 indefinitely.
- Do NOT ignore the `targetBlockRate` setting — it affects finality time and user experience significantly.
