# EVM Foundry Rules

## Must-Follow
- Always use `.env` with `$(grep KEY .env | cut -d= -f2)` — never paste private keys in terminal history
- Always run `forge test` before any deployment — no exceptions
- Always use `forge verify-contract` for mainnet deployments
- Use `vm.prank` for access control tests — don't skip permission testing

## Never Do
- Never commit `broadcast/` folder contents with private key derivation — keep it gitignored
- Never use `forge create` with `--private-key` flag in CI without masking the key
- Never skip `forge fmt` — inconsistent formatting makes diffs unreadable
- Never use `block.timestamp` or `block.number` in tests without `vm.warp` / `vm.roll`

## Always Check
- Run `forge build --sizes` to check contract size limits (24KB max)
- Run `forge coverage` before declaring tests complete
- Verify `foundry.toml` has correct `[rpc_endpoints]` for Avalanche before scripting
