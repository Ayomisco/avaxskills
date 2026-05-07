# RULES — validator-manager-contract

These rules apply whenever the `validator-manager-contract` skill is active. ValidatorManager controls network liveness — mistakes can halt the chain or permanently lock out validators.

## Mandatory rules

### R1 — Never remove the last validator
Never call `initiateValidatorRemoval` on the last remaining validator of an L1. With zero validators, the network cannot produce blocks and will halt with no recovery path. Always ensure at least one healthy validator remains before removing another.

### R2 — Always test validator rotation on Fuji first
Before rotating validators on mainnet, perform a complete test on Fuji: add a new validator, confirm registration via Warp, then remove an old validator and confirm removal. Only proceed to mainnet after the full flow succeeds on Fuji.

### R3 — Account for Warp relay time (2+ blocks)
The two-step initiate/complete flow for both registration and removal requires waiting for the Warp message to be relayed. This takes at least 2 blocks. Do not call `completeValidatorRegistration` or `completeValidatorRemoval` immediately — wait for relay confirmation. Implement retry logic with exponential backoff.

### R4 — Use PoAValidatorManager only for permissioned L1s
`PoAValidatorManager` gives the owner full control over the validator set. Use it only for L1s where a trusted operator (company, DAO multisig) controls validators. For permissionless public L1s, use `NativeTokenValidatorManager` or `ERC20TokenValidatorManager`.

### R5 — Deploy ValidatorManager fresh per L1
There are no shared ValidatorManager addresses. Each L1 requires its own deployment. Never attempt to reuse a ValidatorManager contract from another L1 — the contract is initialized with chain-specific Warp configuration.

### R6 — Use a Safe multisig as PoAValidatorManager owner
For `PoAValidatorManager`, always set the owner to a Safe multisig on mainnet. An EOA owner means a single key controls all validator additions and removals — a single point of failure.

### R7 — Store validationIDs persistently
Save the `validationID` bytes32 returned by `initiateValidatorRegistration` to persistent storage immediately. You need it to call `initiateValidatorRemoval` later. If lost, you must query contract events to recover it.

### R8 — Set reasonable registration expiry
When calling `initiateValidatorRegistration`, set `registrationExpiry` to at least 5 minutes (300 seconds) in the future, but no more than 24 hours. Too short: Warp relay misses the window. Too long: expired registration attempts accumulate.

## Anti-patterns

- Do NOT remove a validator that is validating a Subnet that depends on it for quorum.
- Do NOT call `completeValidatorRegistration` or `completeValidatorRemoval` in the same transaction as the initiate call — Warp delivery is asynchronous.
- Do NOT use `ERC20TokenValidatorManager` with an ERC-20 token that has fee-on-transfer behavior — staking math will break.
- Do NOT deploy ValidatorManager without setting the correct Warp registry address for your L1.
- Do NOT rotate all validators simultaneously — stagger rotations to maintain continuous consensus coverage.
