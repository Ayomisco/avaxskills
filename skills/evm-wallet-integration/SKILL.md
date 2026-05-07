---
name: "evm-wallet-integration"
version: "1.0.0"
spec: "agentskills@1.0"
license: "Apache-2.0"
tier: 4
description: "Integrate wallets into Avalanche dApps — Reown AppKit, Dynamic.xyz, and custom wagmi implementations."
trigger: |
  Use when: adding wallet connection to an Avalanche dApp, setting up Reown AppKit or Dynamic.xyz, building a custom wagmi wallet connector, or adding multi-wallet support with Subnet network switching.
  Do NOT use for: backend wallet operations, non-browser environments, hardware wallet firmware.
last_updated: "2026-05-01"
avalanche_networks: [fuji, mainnet]
related_skills:
  - wagmi
  - core-wallet
  - frontend-ux
---

## Overview

Avalanche dApps support the full EVM wallet ecosystem. This skill covers three integration paths: Reown AppKit (fastest setup, batteries included), Dynamic.xyz (enterprise-grade, social login), and raw wagmi (maximum control). All three support Avalanche C-Chain and custom Subnets.

## When to fetch

Fetch at the start of any dApp project when choosing and implementing wallet connectivity. Also fetch when adding multi-wallet support, implementing Subnet network switching, or migrating from a legacy Web3Modal/ConnectKit setup.

## Core Workflow

### Option A: Reown AppKit (Recommended for most projects)

1. **Install**

   ```bash
   npm install @reown/appkit @reown/appkit-adapter-wagmi wagmi viem @tanstack/react-query
   ```

2. **Configure for Avalanche**

   ```typescript
   // config/appkit.ts
   import { createAppKit } from "@reown/appkit/react";
   import { WagmiAdapter } from "@reown/appkit-adapter-wagmi";
   import { avalanche, avalancheFuji } from "@reown/appkit/networks";

   // Get projectId from https://cloud.reown.com
   const projectId = process.env.NEXT_PUBLIC_REOWN_PROJECT_ID!;

   const networks = [avalanche, avalancheFuji];

   export const wagmiAdapter = new WagmiAdapter({
     projectId,
     networks,
   });

   createAppKit({
     adapters: [wagmiAdapter],
     networks,
     projectId,
     metadata: {
       name: "My Avalanche App",
       description: "DeFi on Avalanche",
       url: "https://myapp.com",
       icons: ["https://myapp.com/icon.png"],
     },
     features: {
       analytics: true,
       email: false,       // Disable if you don't want email login
       socials: [],        // Add "google", "github" etc. if needed
     },
   });
   ```

3. **Wrap your app**

   ```tsx
   // app/layout.tsx (Next.js App Router)
   import { WagmiProvider } from "wagmi";
   import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
   import { wagmiAdapter } from "@/config/appkit";
   import "@reown/appkit/react";  // Side effect import

   const queryClient = new QueryClient();

   export default function RootLayout({ children }: { children: React.ReactNode }) {
     return (
       <html>
         <body>
           <WagmiProvider config={wagmiAdapter.wagmiConfig}>
             <QueryClientProvider client={queryClient}>
               {children}
             </QueryClientProvider>
           </WagmiProvider>
         </body>
       </html>
     );
   }
   ```

4. **Add the connect button**

   ```tsx
   // components/Header.tsx
   export function Header() {
     return (
       <header>
         <h1>My App</h1>
         {/* Reown AppKit web component — no imports needed */}
         <appkit-button />
       </header>
     );
   }
   ```

5. **Add custom Subnet to AppKit**

   ```typescript
   import { defineChain } from "@reown/appkit/networks";

   const mySubnet = defineChain({
     id: 12345,
     name: "My Subnet",
     nativeCurrency: { name: "GAS", symbol: "GAS", decimals: 18 },
     rpcUrls: {
       default: { http: ["https://my-subnet-rpc.com/ext/bc/C/rpc"] },
     },
     blockExplorers: {
       default: { name: "Explorer", url: "https://explorer.mysubnet.com" },
     },
   });

   // Add to networks array
   const networks = [avalanche, avalancheFuji, mySubnet];
   ```

### Option B: Dynamic.xyz

6. **Install and configure**

   ```bash
   npm install @dynamic-labs/sdk-react-core @dynamic-labs/ethereum @dynamic-labs/wagmi-connector
   ```

   ```tsx
   // app/providers.tsx
   import { DynamicContextProvider } from "@dynamic-labs/sdk-react-core";
   import { EthereumWalletConnectors } from "@dynamic-labs/ethereum";
   import { DynamicWagmiConnector } from "@dynamic-labs/wagmi-connector";
   import { WagmiProvider, createConfig } from "wagmi";
   import { avalanche, avalancheFuji } from "wagmi/chains";
   import { http } from "wagmi";

   const wagmiConfig = createConfig({
     chains: [avalanche, avalancheFuji],
     transports: {
       [avalanche.id]: http("https://api.avax.network/ext/bc/C/rpc"),
       [avalancheFuji.id]: http("https://api.avax-test.network/ext/bc/C/rpc"),
     },
   });

   export function Providers({ children }: { children: React.ReactNode }) {
     return (
       <DynamicContextProvider
         settings={{
           environmentId: process.env.NEXT_PUBLIC_DYNAMIC_ENV_ID!,
           walletConnectors: [EthereumWalletConnectors],
           // Override supported chains
           overrides: {
             evmNetworks: [
               {
                 chainId: 43114,
                 networkId: 43114,
                 name: "Avalanche C-Chain",
                 nativeCurrency: { name: "AVAX", symbol: "AVAX", decimals: 18 },
                 rpcUrls: ["https://api.avax.network/ext/bc/C/rpc"],
                 blockExplorerUrls: ["https://subnets.avax.network/c-chain"],
               },
             ],
           },
         }}
       >
         <WagmiProvider config={wagmiConfig}>
           <DynamicWagmiConnector>{children}</DynamicWagmiConnector>
         </WagmiProvider>
       </DynamicContextProvider>
     );
   }
   ```

### Option C: Custom wagmi Setup

7. **Minimal wagmi setup**

   ```typescript
   // config/wagmi.ts
   import { createConfig, http } from "wagmi";
   import { avalanche, avalancheFuji } from "wagmi/chains";
   import { injected, walletConnect, coinbaseWallet } from "wagmi/connectors";

   export const wagmiConfig = createConfig({
     chains: [avalanche, avalancheFuji],
     connectors: [
       injected(),           // MetaMask, Core, browser wallets
       walletConnect({
         projectId: process.env.NEXT_PUBLIC_WC_PROJECT_ID!,
       }),
       coinbaseWallet({
         appName: "My Avalanche App",
       }),
     ],
     transports: {
       [avalanche.id]: http("https://api.avax.network/ext/bc/C/rpc"),
       [avalancheFuji.id]: http("https://api.avax-test.network/ext/bc/C/rpc"),
     },
   });
   ```

8. **Custom connect UI**

   ```tsx
   // components/WalletModal.tsx
   import { useConnect, useAccount, useDisconnect, useChainId, useSwitchChain } from "wagmi";
   import { avalanche } from "wagmi/chains";

   export function WalletModal() {
     const { connectors, connect, isPending } = useConnect();
     const { address, isConnected } = useAccount();
     const { disconnect } = useDisconnect();
     const chainId = useChainId();
     const { switchChain } = useSwitchChain();

     if (isConnected) {
       return (
         <div>
           <p>{address?.slice(0, 6)}...{address?.slice(-4)}</p>
           {chainId !== avalanche.id && (
             <button onClick={() => switchChain({ chainId: avalanche.id })}>
               Switch to Avalanche
             </button>
           )}
           <button onClick={() => disconnect()}>Disconnect</button>
         </div>
       );
     }

     return (
       <div>
         {connectors.map((connector) => (
           <button
             key={connector.uid}
             onClick={() => connect({ connector })}
             disabled={isPending}
           >
             {connector.name}
           </button>
         ))}
       </div>
     );
   }
   ```

## Network config

| Network | Chain ID | RPC | Explorer |
|---|---|---|---|
| C-Chain Mainnet | 43114 | https://api.avax.network/ext/bc/C/rpc | https://subnets.avax.network/c-chain |
| Fuji Testnet | 43113 | https://api.avax-test.network/ext/bc/C/rpc | https://subnets-test.avax.network/c-chain |

## Key concepts

**Reown AppKit vs Dynamic**: AppKit is the simplest path — copy-paste setup, built-in UI, WalletConnect support. Dynamic.xyz adds enterprise features: social login, email wallets, embedded wallets, and better analytics. Choose Dynamic for B2B or regulated products.

**wagmi as Foundation**: Both AppKit and Dynamic use wagmi under the hood. All `useAccount`, `useWriteContract`, `useReadContract` hooks work the same regardless of which wallet library you use.

**Subnet Network Switching**: Custom Subnets require `wallet_addEthereumChain` — wagmi's `useSwitchChain` handles this automatically if the chain config includes RPC and metadata.

**WalletConnect Project ID**: Required for WalletConnect v2 (mobile wallets). Get one free at cloud.reown.com. Without it, only injected wallets (MetaMask) work.

**Core Wallet**: Avalanche's native wallet (Core) shows as an injected provider. No special setup needed — the `injected()` connector picks it up automatically.

## Common errors

| Error | Cause | Fix |
|---|---|---|
| `projectId is required` | Missing Reown/WC project ID | Set `NEXT_PUBLIC_REOWN_PROJECT_ID` in `.env.local` |
| Chain not supported | Subnet not in wagmi config | Add chain via `defineChain` and include in `chains` array |
| `wallet_switchEthereumChain` fails with 4902 | Chain not in wallet | Catch error, call `wallet_addEthereumChain` instead |
| Connector not found | No injected wallet | Show "Install MetaMask" prompt when `connector.ready === false` |
| Hydration mismatch (Next.js) | Wallet state renders on server | Wrap wallet UI in `<ClientOnly>` or use `dynamic` import with `ssr: false` |

## Next skills

- `wagmi` — deep wagmi hooks and patterns
- `core-wallet` — Avalanche Core wallet specific features
- `frontend-ux` — UX patterns for transaction states and errors
