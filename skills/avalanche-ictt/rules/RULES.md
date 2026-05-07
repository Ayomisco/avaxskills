# RULES — avalanche-ictt

These rules are enforced whenever the `avalanche-ictt` skill is active. Violations may result in stuck funds or broken bridges.

## Mandatory rules

### R1 — Register before transfer
Always call `registerWithHome()` on the TokenRemote contract and wait for the Warp message to be relayed to TokenHome before attempting any `transferToDestination`. A TokenRemote that is not registered will cause all transfers to revert on the home chain.

### R2 — Collateral must cover transfers
Always call `addCollateral()` on TokenHome for at least the amount being transferred before initiating a cross-chain transfer. The `collateral >= circulating remote supply` invariant is enforced on-chain; under-collateralized calls revert.

### R3 — Approve before transferring
Always call `ERC20.approve(tokenHomeAddress, amount)` before calling `transferToDestination`. Forgetting approval is the most common revert cause.

### R4 — Never skip the Teleporter Manager address
Always provide a non-zero `teleporterManager` when deploying TokenHome or TokenRemote. Use a Safe multisig, not an EOA, on mainnet. The manager can pause Teleporter message reception — an EOA key loss means you cannot respond to a security incident.

### R5 — Verify Teleporter Registry per chain
The Teleporter Registry address differs per chain. Never copy an address from one chain and use it on another without verifying it in the official docs or via `avalanche teleporter deploy --list`.

### R6 — Test full round-trip on Fuji first
Always perform a complete transfer (home → remote → back to home) on Fuji testnet before deploying to mainnet. A one-way test is insufficient — redemption path bugs are common.

### R7 — Do not deploy to mainnet without an audit
TokenHome and TokenRemote hold real user funds. If you customize the contracts beyond the official templates, obtain a security audit before mainnet deployment.

## Anti-patterns

- Do NOT call `transferToDestination` before `registerWithHome` is confirmed relayed.
- Do NOT use `address(0)` as `teleporterManager` on mainnet — it makes the contract permanently unpaused.
- Do NOT assume token decimals match across chains — always pass `tokenDecimals` explicitly.
- Do NOT run a single-validator Teleporter relayer in production — run at least 2 for redundancy.

## Quick reference

```
Deploy order:
1. TokenHome on source chain
2. TokenRemote on destination chain
3. registerWithHome() (on TokenRemote)  ← wait for relay
4. addCollateral() (on TokenHome)
5. transferToDestination() (on TokenHome)
```
