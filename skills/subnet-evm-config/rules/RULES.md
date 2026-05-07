# Subnet-EVM Config Rules

## Must-Follow
- Always set a unique `chainId` — check chainlist.org before choosing
- Always configure `feeConfig` in genesis — do not use defaults for production chains
- Always set `adminAddresses` for precompiles to a multisig or governance contract on mainnet
- Always test genesis configuration on local AvalancheGo network before Fuji

## Never Do
- Never reuse chain IDs from existing networks — causes wallet and tooling conflicts
- Never use `avalanche subnet` commands for configuration — Platform CLI only
- Never set `minBaseFee: 0` without alternative spam protection mechanism
- Never launch with `adminAddresses` pointing to a single EOA — use multisig

## Always Check
- Validate genesis.json format with `platform chain create --dry-run` before submitting
- Confirm all precompile admin addresses are correct checksummed addresses
- Test chain restart with the exact genesis config to verify state loads correctly
