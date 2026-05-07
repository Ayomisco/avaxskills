# RULES — safe-multisig

These rules apply whenever the `safe-multisig` skill is active. Multisig setup errors can result in permanent loss of contract admin access or treasury funds.

## Mandatory rules

### R1 — Never use an EOA as admin on mainnet contracts
An EOA (externally owned account / single private key) must never be used as the admin, owner, or privileged role on any mainnet smart contract. Always use a Safe multisig. A single compromised or lost key means permanent loss of admin access.

### R2 — Minimum 2-of-3 threshold; 3-of-5 for large treasuries
- For contracts controlling less than $100k of value: minimum **2-of-3** Safe.
- For contracts or treasuries controlling more than $100k: minimum **3-of-5** Safe.
- Never use a 1-of-N Safe — it provides no additional security over an EOA.

### R3 — Store signer keys on separate hardware wallets
Each Safe signer must use a separate Ledger or Trezor hardware wallet. Never store two signer keys on the same machine, the same seed phrase backup, or the same password manager. Geographic separation of hardware wallets is recommended for 3-of-5 setups.

### R4 — Test the exact Safe setup on Fuji before mainnet
Before deploying a Safe to mainnet, create the identical Safe on Fuji (same signer count, same threshold) and execute a test transaction (e.g., calling a no-op function). Verify every signer can sign and the execution succeeds. Then recreate on mainnet.

### R5 — All precompile admin addresses on a Subnet must be a Safe
Every precompile admin address in an Avalanche L1 genesis (FeeManager, RewardManager, NativeMinter, ContractDeployerAllowList, TxAllowList, ValidatorAllowList) must be a Safe multisig. Setting an EOA as precompile admin means a single key controls chain-level parameters.

### R6 — Never lose more than threshold - 1 signers simultaneously
Maintain at least `threshold + 1` active, reachable signers at all times. If you have a 2-of-3 Safe and one signer becomes unreachable (lost hardware wallet, person leaves organization), immediately execute a signer rotation transaction using the remaining 2 signers.

### R7 — Verify Safe address matches expected address before transferring ownership
Before calling `transferOwnership(safeAddress)` on any contract, independently verify the Safe address by checking it on the Safe UI and confirming the signer list and threshold. A typo in the Safe address means ownership is transferred to an uncontrolled or non-existent address.

## Anti-patterns

- Do NOT use a 1-of-1 or 1-of-N Safe — this is functionally identical to an EOA.
- Do NOT store multiple signer keys on the same device or in the same seed phrase.
- Do NOT use a Safe with test signers (MetaMask hot wallets) for mainnet treasury or production contracts.
- Do NOT skip the Fuji test — signing flows differ subtly between UI and protocol-kit, and both must be verified.
- Do NOT create a Safe where all signers belong to the same organization with no external check — use a 2-of-3 with one independent signer for large treasuries.
- Do NOT ignore the transaction service URL — using the wrong chain ID in API Kit will silently propose to the wrong network.
