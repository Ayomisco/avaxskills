# Wagmi Rules

## Must-Follow
- Always configure `chains` with `avalanche` and/or `avalancheFuji` from `viem/chains`
- Always wrap your app with `WagmiProvider` and `QueryClientProvider` at the root
- Always handle `isPending`, `isError`, `isSuccess` states for every contract write
- Use `useWriteContract` + `useWaitForTransactionReceipt` for reliable transaction lifecycle

## Never Do
- Never use wagmi v1 APIs in wagmi v2 projects — `useContractWrite`, `usePrepareContractWrite` are removed
- Never skip error handling on contract writes — reverts happen and must be shown to users
- Never use `useBalance` without null checks — balance can be undefined before wallet connects

## Always Check
- Verify `wagmi.config.ts` includes the correct chain IDs for Avalanche networks
- Test wallet connection with Core Wallet and MetaMask — provider behavior differs
- Confirm `useAccount().chainId` matches expected network before writing transactions
