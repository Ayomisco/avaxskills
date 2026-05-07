---
name: "wagmi"
version: "1.0.0"
spec: "agentskills@1.0"
license: "Apache-2.0"
tier: 1
description: "React hooks for Avalanche dApps — wallet connection, contract reads/writes, and transaction handling."
trigger: |
  Use when: user wants to build a React/Next.js dApp on Avalanche with wallet connection, contract interactions, or transaction state management. Triggers on 'wagmi Avalanche', 'React hooks blockchain', 'wallet connect React'.
  Do NOT use for: non-React environments (use viem), server-side only scripts, mobile apps.
last_updated: "2026-05-01"
avalanche_networks: [fuji, mainnet]
related_skills:
  - viem
  - evm-wallet-integration
  - scaffold-avax
  - frontend-ux
---

## Overview

wagmi is the standard React hooks library for EVM dApps. It wraps viem, handles wallet state, and provides hooks for all common operations. This skill covers wagmi v2 (latest) configured for Avalanche C-Chain with RainbowKit for wallet UI.

## When to fetch

Fetch when building any React or Next.js frontend that needs wallet connection and contract interaction on Avalanche.

## Core Workflow

### Step 1 — Install

```bash
npm install wagmi viem @rainbow-me/rainbowkit @tanstack/react-query
```

### Step 2 — Configure wagmi for Avalanche

`config/wagmi.ts`:
```typescript
import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { avalanche, avalancheFuji } from "viem/chains";
import { defineChain } from "viem";

// Optional: define a custom Subnet
const mySubnet = defineChain({
  id: 12345,
  name: "My Subnet",
  nativeCurrency: { name: "MYTOKEN", symbol: "MYT", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://api.avax-test.network/ext/bc/YOUR_CHAIN_ID/rpc"] },
  },
});

export const config = getDefaultConfig({
  appName: "My Avalanche dApp",
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID!, // cloud.walletconnect.com
  chains: [avalanche, avalancheFuji, mySubnet],
  ssr: true,  // Enable for Next.js
});
```

### Step 3 — Wrap App with Providers

`app/providers.tsx` (Next.js App Router):
```typescript
"use client";

import { WagmiProvider } from "wagmi";
import { RainbowKitProvider } from "@rainbow-me/rainbowkit";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { config } from "@/config/wagmi";
import "@rainbow-me/rainbowkit/styles.css";

const queryClient = new QueryClient();

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
```

`app/layout.tsx`:
```typescript
import { Providers } from "./providers";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
```

### Step 4 — Wallet Connection

```typescript
"use client";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount, useBalance, useChainId, useSwitchChain } from "wagmi";
import { avalanche, avalancheFuji } from "viem/chains";

export function WalletInfo() {
  const { address, isConnected, chain } = useAccount();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  const { data: balance } = useBalance({ address });

  return (
    <div>
      <ConnectButton />
      
      {isConnected && (
        <div>
          <p>Address: {address}</p>
          <p>Chain: {chain?.name} (ID: {chainId})</p>
          <p>Balance: {balance?.formatted} {balance?.symbol}</p>
          
          {/* Network switcher */}
          {chainId !== avalancheFuji.id && (
            <button onClick={() => switchChain({ chainId: avalancheFuji.id })}>
              Switch to Fuji
            </button>
          )}
        </div>
      )}
    </div>
  );
}
```

### Step 5 — Read Contract State

```typescript
"use client";
import { useReadContract, useReadContracts } from "wagmi";
import { parseAbi, formatUnits } from "viem";

const erc20Abi = parseAbi([
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function balanceOf(address) view returns (uint256)",
  "function totalSupply() view returns (uint256)",
]);

const WAVAX = "0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7" as const;

// Single read
export function TokenName() {
  const { data: name, isLoading, error } = useReadContract({
    address: WAVAX,
    abi: erc20Abi,
    functionName: "name",
    chainId: 43114,  // Avalanche mainnet
  });

  if (isLoading) return <span>Loading...</span>;
  if (error) return <span>Error: {error.message}</span>;
  return <span>{name}</span>;
}

// Read with args (user's balance)
export function UserBalance({ address }: { address: `0x${string}` }) {
  const { data: balance } = useReadContract({
    address: WAVAX,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: [address],
    chainId: 43114,
    query: {
      enabled: !!address,  // Only run when address exists
      refetchInterval: 5000,  // Refresh every 5 seconds
    },
  });

  return <span>{balance ? formatUnits(balance, 18) : "0"} WAVAX</span>;
}

// Batch reads with useReadContracts
export function TokenInfo() {
  const { data } = useReadContracts({
    contracts: [
      { address: WAVAX, abi: erc20Abi, functionName: "name", chainId: 43114 },
      { address: WAVAX, abi: erc20Abi, functionName: "symbol", chainId: 43114 },
      { address: WAVAX, abi: erc20Abi, functionName: "totalSupply", chainId: 43114 },
    ],
  });

  const [name, symbol, totalSupply] = data || [];
  return (
    <div>
      <p>Name: {name?.result as string}</p>
      <p>Symbol: {symbol?.result as string}</p>
      <p>Supply: {totalSupply?.result ? formatUnits(totalSupply.result as bigint, 18) : "0"}</p>
    </div>
  );
}
```

### Step 6 — Write Contract State

```typescript
"use client";
import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { parseAbi, parseUnits } from "viem";
import { useState } from "react";

const myContractAbi = parseAbi([
  "function setGreeting(string memory greeting) external",
  "function mint(address to, uint256 amount) external",
  "event GreetingSet(address indexed by, string greeting)",
]);

export function WriteContract() {
  const [greeting, setGreeting] = useState("");
  
  const { writeContract, data: hash, isPending, error } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const handleSetGreeting = () => {
    writeContract({
      address: "0xYOUR_CONTRACT" as `0x${string}`,
      abi: myContractAbi,
      functionName: "setGreeting",
      args: [greeting],
      chainId: 43113,  // Fuji
    });
  };

  return (
    <div>
      <input
        value={greeting}
        onChange={(e) => setGreeting(e.target.value)}
        placeholder="Enter greeting"
      />
      <button
        onClick={handleSetGreeting}
        disabled={isPending || isConfirming}
      >
        {isPending ? "Confirm in wallet..." : isConfirming ? "Confirming on Avalanche..." : "Set Greeting"}
      </button>
      
      {hash && <p>TX: {hash}</p>}
      {isSuccess && <p>Greeting set!</p>}
      {error && <p>Error: {error.message}</p>}
    </div>
  );
}
```

### Step 7 — Watch Events

```typescript
"use client";
import { useWatchContractEvent } from "wagmi";
import { parseAbi } from "viem";
import { useState } from "react";

export function EventWatcher() {
  const [events, setEvents] = useState<string[]>([]);

  useWatchContractEvent({
    address: "0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7",  // WAVAX
    abi: parseAbi(["event Transfer(address indexed from, address indexed to, uint256 value)"]),
    eventName: "Transfer",
    chainId: 43114,
    onLogs: (logs) => {
      logs.forEach((log) => {
        const msg = `${log.args.from?.slice(0,6)}... → ${log.args.to?.slice(0,6)}...`;
        setEvents((prev) => [msg, ...prev].slice(0, 10));
      });
    },
  });

  return (
    <div>
      <h3>Recent WAVAX Transfers</h3>
      {events.map((e, i) => <p key={i}>{e}</p>)}
    </div>
  );
}
```

### Step 8 — Handle Gas Estimation

```typescript
import { useEstimateGas } from "wagmi";
import { parseEther } from "viem";

export function GasEstimate({ to, value }: { to: `0x${string}`; value: string }) {
  const { data: gas } = useEstimateGas({
    to,
    value: parseEther(value),
  });
  
  return <span>Estimated gas: {gas?.toString()}</span>;
}
```

## Key concepts

**WagmiProvider + QueryClientProvider** — Required wrappers. wagmi uses react-query internally for caching and refetching.

**useWriteContract + useWaitForTransactionReceipt** — Two-step pattern: write returns a hash, then wait for the receipt to confirm the tx landed on Avalanche (~2s).

**chainId in hooks** — Always specify `chainId` in contract hooks to avoid calling the wrong network. Avalanche mainnet = 43114, Fuji = 43113.

**SSR hydration** — Set `ssr: true` in wagmi config for Next.js. Use dynamic imports or `"use client"` to avoid hydration mismatches with wallet state.

**query.enabled** — Use `enabled: !!address` to prevent hooks from running before data is ready (prevents unnecessary RPC calls).

## Common errors

| Error | Cause | Fix |
|---|---|---|
| Hydration mismatch | Wallet state differs between server/client | Add `ssr: true` to config; use `"use client"` directive |
| "Chain not configured" | Chain missing from config | Add `avalancheFuji` or `avalanche` to `chains` array |
| Transaction rejected | User rejected in wallet | Check `error.name === "UserRejectedRequestError"` |
| Hook shows stale data | Aggressive caching | Add `refetchInterval: 3000` to query options |
| `wagmi context` error | Hook used outside provider | Ensure component is inside `<WagmiProvider>` |

## Next skills

- `viem` — lower-level client if you need non-React usage
- `evm-wallet-integration` — MetaMask, Core Wallet specific integration
- `scaffold-avax` — full-stack template with wagmi pre-configured
