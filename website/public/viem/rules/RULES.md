# Viem Rules

## Must-Follow
- Always import Avalanche chains from `viem/chains`: `avalanche`, `avalancheFuji`
- Always type addresses as `` `0x${string}` `` (viem's Address type) — not plain strings
- Use `createPublicClient` for reads, `createWalletClient` for writes — don't mix them
- Always handle `ContractFunctionRevertedError` — contract reverts throw typed errors in viem

## Never Do
- Never store private keys in `createWalletClient` in browser code — use wallet connector (wagmi)
- Never use viem v1 APIs in viem v2 projects — the APIs changed significantly
- Never cast addresses with `as Address` without validation — use `getAddress` for checksumming

## Always Check
- Confirm the chain object matches the actual network you're targeting
- Use `parseEther` / `formatEther` for all AVAX/token amount conversions
- Handle BigInt arithmetic correctly — JavaScript `number` loses precision above `Number.MAX_SAFE_INTEGER`
