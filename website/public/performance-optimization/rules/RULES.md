# Performance Optimization Rules

## Must-Follow
- Always batch RPC calls with `eth_call` multicall when reading multiple contract values
- Always cache static data (contract addresses, ABIs, known constants) — never fetch on every request
- Use `view` and `pure` functions for read operations — they are free and fast
- Pack storage variables (use `uint128` together, use `bytes32` instead of `string` for fixed data)

## Never Do
- Never loop over unbounded arrays in on-chain code — gas cost scales linearly, hits block limit
- Never use `SSTORE` unnecessarily — storage writes are the most expensive EVM operation
- Never make redundant RPC calls — batch reads and cache aggressively
- Never emit large event data — use indexed fields strategically, keep event payloads minimal

## Always Check
- Profile gas usage with `hardhat-gas-reporter` or `forge snapshot` before optimization
- Measure actual RPC call count in your frontend — use browser DevTools Network tab
- Verify contract size stays under 24KB (`forge build --sizes`)
