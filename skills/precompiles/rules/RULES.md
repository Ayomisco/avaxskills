# Precompiles Rules

## Must-Follow
- Always enable precompiles explicitly in genesis `config` — disabled by default
- Always restrict precompile admin access to a multisig or governance contract on mainnet
- Use AllowList pattern for NativeMinter and ContractDeployer — never leave open to all callers
- Always test precompile behavior on Fuji before mainnet activation

## Never Do
- Never give NativeMinter access to user-controlled contracts without strict supply caps
- Never use FeeManager without governance oversight — misconfigured fees can break the chain
- Never assume precompile addresses are the same as on Ethereum — they are Avalanche-specific (`0x02000000...`)

## Key Precompile Addresses
- ContractDeployer Allowlist: `0x0200000000000000000000000000000000000000`
- NativeMinter: `0x0200000000000000000000000000000000000001`
- TxAllowList: `0x0200000000000000000000000000000000000002`
- FeeManager: `0x0200000000000000000000000000000000000003`
- RewardManager: `0x0200000000000000000000000000000000000004`
- WarpMessenger: `0x0200000000000000000000000000000000000005`

## Always Check
- Verify precompile is enabled in chain config before calling it — calls to disabled precompiles revert
- Test AllowList admin address is correct and accessible before deploying to mainnet
