---
name: "core-wallet"
version: "1.0.0"
spec: "agentskills@1.0"
license: "Apache-2.0"
tier: 3
description: "Integrate Core Wallet into Avalanche dApps — wallet detection, connection, signing, Subnet switching, multi-chain support (C/P/X-Chain), and Core-specific features."
trigger: |
  Use when: user wants to integrate Core Wallet, detect Core extension, connect to Core, switch networks in Core, sign transactions with Core, or build a dApp that works with Avalanche's native wallet.
last_updated: "2026-05-07"
avalanche_networks: [c-chain, fuji, custom-l1]
related_skills:
  - wallet-setup
  - evm-wallet-integration
  - wagmi
  - viem
  - subnet-deployment
---

## Overview

**Core Wallet** is Avalanche's native browser extension and mobile wallet. It has first-class support for:
- All Avalanche chains: C-Chain, X-Chain, P-Chain
- Custom Subnets / L1s (auto-detection via the Subnet Explorer)
- Avalanche Warp Messaging signatures
- Hardware wallet integration (Ledger)
- NFTs, DeFi, and bridging via built-in browser

Unlike MetaMask, Core can sign P-Chain and X-Chain transactions directly — critical for validator management and cross-chain operations.

**Core Wallet website:** `https://core.app`
**Core SDK:** `https://github.com/ava-labs/core-extension`

## When to fetch

Fetch when someone asks about Core Wallet integration, detection, network switching for Avalanche chains, or building Avalanche-native dApps.

## Wallet Detection

Core Wallet injects `window.avalanche` (not just `window.ethereum`):

```typescript
// Detect Core Wallet specifically
function detectCoreWallet(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof (window as any).avalanche !== "undefined" &&
    (window as any).avalanche.isAvalanche === true
  );
}

// Prefer Core over MetaMask when both are installed
function getProvider(): any {
  if (typeof window === "undefined") return null;
  
  const { avalanche, ethereum } = window as any;
  
  // Core detected (preferred for Avalanche dApps)
  if (avalanche?.isAvalanche) return avalanche;
  
  // Core may also be on window.ethereum when it's the default wallet
  if (ethereum?.isAvalanche) return ethereum;
  
  // Fallback to any EIP-1193 provider
  return ethereum ?? null;
}
```

## Connection (Vanilla EIP-1193)

```typescript
async function connectCoreWallet() {
  const provider = getProvider();
  
  if (!provider) {
    window.open("https://core.app", "_blank");
    throw new Error("Core Wallet not installed");
  }
  
  // Request account access
  const accounts: string[] = await provider.request({
    method: "eth_requestAccounts"
  });
  
  console.log("Connected:", accounts[0]);
  return accounts[0];
}

// Listen for account changes
provider.on("accountsChanged", (accounts: string[]) => {
  if (accounts.length === 0) {
    console.log("Disconnected");
  } else {
    console.log("Account changed:", accounts[0]);
  }
});

// Listen for chain changes
provider.on("chainChanged", (chainId: string) => {
  // chainId is hex: "0xA86A" = C-Chain mainnet
  console.log("Chain changed to:", parseInt(chainId, 16));
  window.location.reload(); // recommended by EIP-1193
});
```

## Network Switching

### Switch to Avalanche C-Chain

```typescript
async function switchToAvalanche(provider: any) {
  try {
    await provider.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: "0xA86A" }] // 43114
    });
  } catch (error: any) {
    // Chain not added yet — add it
    if (error.code === 4902) {
      await addAvalancheNetwork(provider);
    } else {
      throw error;
    }
  }
}

async function addAvalancheNetwork(provider: any) {
  await provider.request({
    method: "wallet_addEthereumChain",
    params: [{
      chainId: "0xA86A",
      chainName: "Avalanche C-Chain",
      nativeCurrency: { name: "Avalanche", symbol: "AVAX", decimals: 18 },
      rpcUrls: ["https://api.avax.network/ext/bc/C/rpc"],
      blockExplorerUrls: ["https://subnets.avax.network/c-chain"]
    }]
  });
}
```

### Switch to Fuji Testnet

```typescript
async function switchToFuji(provider: any) {
  try {
    await provider.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: "0xA869" }] // 43113
    });
  } catch (error: any) {
    if (error.code === 4902) {
      await provider.request({
        method: "wallet_addEthereumChain",
        params: [{
          chainId: "0xA869",
          chainName: "Avalanche Fuji Testnet",
          nativeCurrency: { name: "Avalanche", symbol: "AVAX", decimals: 18 },
          rpcUrls: ["https://api.avax-test.network/ext/bc/C/rpc"],
          blockExplorerUrls: ["https://subnets-test.avax.network/c-chain"]
        }]
      });
    }
  }
}
```

### Add a Custom L1/Subnet

```typescript
async function addCustomL1(
  provider: any,
  params: {
    chainId: number;
    name: string;
    rpcUrl: string;
    symbol: string;
    explorerUrl?: string;
  }
) {
  await provider.request({
    method: "wallet_addEthereumChain",
    params: [{
      chainId: "0x" + params.chainId.toString(16),
      chainName: params.name,
      nativeCurrency: {
        name: params.symbol,
        symbol: params.symbol,
        decimals: 18
      },
      rpcUrls: [params.rpcUrl],
      ...(params.explorerUrl && { blockExplorerUrls: [params.explorerUrl] })
    }]
  });
}

// Example: add custom L1
await addCustomL1(provider, {
  chainId: 200001,
  name: "My Custom L1",
  rpcUrl: "https://api.avax-test.network/ext/bc/YOUR_CHAIN_ID/rpc",
  symbol: "MCL",
  explorerUrl: "https://subnets-test.avax.network"
});
```

## Wagmi Integration (React)

Core Wallet works as a standard EIP-1193 provider in wagmi:

```typescript
// wagmi.config.ts
import { createConfig, http } from "wagmi";
import { avalanche, avalancheFuji } from "wagmi/chains";
import { injected } from "wagmi/connectors";

export const config = createConfig({
  chains: [avalanche, avalancheFuji],
  connectors: [
    injected({
      target() {
        return {
          id: "core",
          name: "Core Wallet",
          provider: typeof window !== "undefined"
            ? (window as any).avalanche ?? (window as any).ethereum
            : undefined
        };
      }
    })
  ],
  transports: {
    [avalanche.id]: http("https://api.avax.network/ext/bc/C/rpc"),
    [avalancheFuji.id]: http("https://api.avax-test.network/ext/bc/C/rpc")
  }
});
```

```tsx
// ConnectButton.tsx
import { useConnect, useAccount, useDisconnect } from "wagmi";

export function ConnectButton() {
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();

  if (isConnected) {
    return (
      <div>
        <span>{address?.slice(0, 6)}...{address?.slice(-4)}</span>
        <button onClick={() => disconnect()}>Disconnect</button>
      </div>
    );
  }

  return (
    <button onClick={() => connect({ connector: connectors[0] })}>
      Connect Core Wallet
    </button>
  );
}
```

## Viem Integration

```typescript
import { createWalletClient, custom, publicActions } from "viem";
import { avalanche } from "viem/chains";

async function getCoreWalletClient() {
  const provider = (window as any).avalanche ?? (window as any).ethereum;
  if (!provider) throw new Error("Core Wallet not found");

  const [account] = await provider.request({ method: "eth_requestAccounts" });

  return createWalletClient({
    account,
    chain: avalanche,
    transport: custom(provider)
  }).extend(publicActions);
}

// Usage
const client = await getCoreWalletClient();
const balance = await client.getBalance({ address: client.account.address });
const hash = await client.sendTransaction({
  to: "0x...",
  value: parseEther("0.1")
});
```

## Signing Messages

```typescript
// Personal sign (EIP-191)
async function signMessage(provider: any, message: string) {
  const accounts = await provider.request({ method: "eth_accounts" });
  const signature = await provider.request({
    method: "personal_sign",
    params: [message, accounts[0]]
  });
  return signature;
}

// EIP-712 typed data signing
async function signTypedData(provider: any, domain: any, types: any, value: any) {
  const accounts = await provider.request({ method: "eth_accounts" });
  const signature = await provider.request({
    method: "eth_signTypedData_v4",
    params: [accounts[0], JSON.stringify({ domain, types, primaryType: "Message", message: value })]
  });
  return signature;
}
```

## Core Mobile (WalletConnect)

For mobile Core Wallet connections, use WalletConnect v2:

```typescript
import { WalletConnectConnector } from "wagmi/connectors/walletConnect";

const wcConnector = new WalletConnectConnector({
  options: {
    projectId: process.env.NEXT_PUBLIC_WC_PROJECT_ID!,
    metadata: {
      name: "My Avalanche dApp",
      description: "Built on Avalanche",
      url: "https://myapp.com",
      icons: ["https://myapp.com/icon.png"]
    }
  }
});
```

Get a WalletConnect Project ID at `https://cloud.walletconnect.com`

## Network Config Reference

| Network | Chain ID | Hex | RPC URL |
|---|---|---|---|
| C-Chain Mainnet | 43114 | 0xA86A | https://api.avax.network/ext/bc/C/rpc |
| C-Chain Fuji | 43113 | 0xA869 | https://api.avax-test.network/ext/bc/C/rpc |
| Custom L1 | any | hex | https://api.avax-test.network/ext/bc/{CHAIN_ID}/rpc |

## Core Workflow

1. Check `window.ethereum` (or `window.avalanche`) is available
2. Call `eth_requestAccounts` to prompt connection
3. Store returned address; subscribe to `accountsChanged` and `chainChanged`
4. Switch to the required network with `wallet_switchEthereumChain`
5. Send transactions via `eth_sendTransaction` or sign typed data via `eth_signTypedData_v4`

## Key concepts

| Concept | Description |
|---|---|
| EIP-1193 | Standard JS provider interface for Ethereum-compatible wallets |
| `eth_requestAccounts` | Prompts user to connect — triggers the extension popup |
| `wallet_switchEthereumChain` | Switches the wallet to a different network |
| `wallet_addEthereumChain` | Adds a custom network (required for custom Subnets) |
| Core Wallet | Avalanche-native wallet with Avalanche-specific APIs at `window.avalanche` |
| WalletConnect | Protocol for connecting mobile wallets to dApps via QR code / deep link |

## Common errors

| Error | Code | Cause | Fix |
|---|---|---|---|
| User rejected | 4001 | User denied connection | Show helpful message, allow retry |
| Chain not added | 4902 | Network not in wallet | Use `wallet_addEthereumChain` |
| Provider undefined | — | Core not installed | Redirect to `https://core.app` |
| `eth_requestAccounts` pending | — | Popup blocked | Handle async — user must approve |

## Next skills

- `wagmi` — full wagmi v2 integration with React
- `viem` — low-level Ethereum client for Avalanche
- `evm-wallet-integration` — multi-wallet support (MetaMask, Rainbow, Coinbase)
- `subnet-deployment` — deploying the custom L1 your dApp needs to add
