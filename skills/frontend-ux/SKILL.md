---
name: "frontend-ux"
version: "1.0.0"
spec: "agentskills@1.0"
license: "Apache-2.0"
tier: 4
description: "Mandatory UX rules for Avalanche dApps — chain switching, pending state management, error surfacing, and wallet UX."
trigger: |
  Use when: building a dApp UI, implementing wallet connection, handling transactions in React, showing transaction status, or adding Avalanche network switching.
  Do NOT use for: smart contract development, backend APIs, non-web frontends.
last_updated: "2026-05-01"
avalanche_networks: [fuji, mainnet]
related_skills:
  - wagmi
  - evm-wallet-integration
  - qa
---

## Overview

Avalanche's 1-2 second finality changes UX assumptions compared to Ethereum, but the frontend still needs proper pending states, chain switching, and meaningful error messages. This skill covers the mandatory UX patterns for Avalanche dApps: always showing the active network, handling MetaMask chain switch prompts, managing transaction lifecycle state, and surfacing actionable error messages.

## When to fetch

Fetch when building any React component that interacts with a wallet or smart contract. Also fetch when reviewing a dApp UI for launch readiness or when users report confusing transaction states or error messages.

## Core Workflow

1. **Always show the active network**

   Never assume the user is on the right network. Display it prominently and update reactively.

   ```tsx
   // components/NetworkBadge.tsx
   import { useChainId, useChains } from "wagmi";

   const NETWORK_COLORS: Record<number, string> = {
     43114: "bg-red-500",   // Mainnet — red for real money
     43113: "bg-yellow-400", // Fuji testnet
   };

   export function NetworkBadge() {
     const chainId = useChainId();
     const chains = useChains();
     const chain = chains.find((c) => c.id === chainId);

     if (!chain) return <span className="badge bg-gray-400">Unknown Network</span>;

     return (
       <span className={`badge ${NETWORK_COLORS[chainId] ?? "bg-gray-500"} text-white`}>
         {chain.name}
         {chainId === 43114 && " ⚠️ Mainnet"}
       </span>
     );
   }
   ```

2. **Handle MetaMask chain switch request**

   ```tsx
   // hooks/useRequireNetwork.ts
   import { useChainId, useSwitchChain } from "wagmi";
   import { avalanche, avalancheFuji } from "wagmi/chains";

   const TARGET_CHAIN = process.env.NEXT_PUBLIC_ENV === "production"
     ? avalanche
     : avalancheFuji;

   export function useRequireNetwork() {
     const chainId = useChainId();
     const { switchChain, isPending, error } = useSwitchChain();
     const isCorrectChain = chainId === TARGET_CHAIN.id;

     const requestSwitch = () => {
       if (!isCorrectChain) {
         switchChain({ chainId: TARGET_CHAIN.id });
       }
     };

     return { isCorrectChain, requestSwitch, isSwitching: isPending, switchError: error };
   }
   ```

   ```tsx
   // Usage in a component
   export function ActionButton() {
     const { isCorrectChain, requestSwitch, isSwitching } = useRequireNetwork();

     if (!isCorrectChain) {
       return (
         <button onClick={requestSwitch} disabled={isSwitching}>
           {isSwitching ? "Switching..." : "Switch to Avalanche"}
         </button>
       );
     }

     return <button onClick={handleAction}>Deposit</button>;
   }
   ```

3. **Transaction lifecycle state management**

   Avalanche is fast (1-2s finality) but don't assume instant. Track all three states: signing, pending, confirmed.

   ```tsx
   // hooks/useTransaction.ts
   import { useState } from "react";
   import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";

   type TxState = "idle" | "signing" | "pending" | "success" | "error";

   export function useDeposit() {
     const [txState, setTxState] = useState<TxState>("idle");
     const [txError, setTxError] = useState<string | null>(null);

     const { writeContractAsync } = useWriteContract();

     const deposit = async (amount: bigint) => {
       setTxState("signing");
       setTxError(null);

       try {
         const hash = await writeContractAsync({
           address: VAULT_ADDRESS,
           abi: VAULT_ABI,
           functionName: "deposit",
           args: [amount],
         });

         setTxState("pending");
         // Don't assume instant — wait for receipt
         const receipt = await waitForReceipt(hash);

         if (receipt.status === "success") {
           setTxState("success");
         } else {
           setTxState("error");
           setTxError("Transaction reverted on-chain");
         }
       } catch (err) {
         setTxState("error");
         setTxError(parseError(err));
       }
     };

     return { deposit, txState, txError };
   }

   function parseError(err: unknown): string {
     if (err instanceof Error) {
       if (err.message.includes("User rejected")) return "Transaction cancelled";
       if (err.message.includes("insufficient funds")) return "Insufficient AVAX for gas";
       if (err.message.includes("Slippage")) return "Price moved — try again";
       return err.message.slice(0, 100); // Truncate long messages
     }
     return "Unknown error";
   }
   ```

4. **Pending state UI — show meaningful feedback**

   ```tsx
   // components/TransactionStatus.tsx
   type TxState = "idle" | "signing" | "pending" | "success" | "error";

   const MESSAGES: Record<TxState, string> = {
     idle: "",
     signing: "Confirm in your wallet...",
     pending: "Submitting to Avalanche...",
     success: "Transaction confirmed!",
     error: "",
   };

   export function TransactionStatus({
     txState,
     txError,
     txHash,
   }: {
     txState: TxState;
     txError: string | null;
     txHash?: string;
   }) {
     if (txState === "idle") return null;

     return (
       <div className={`alert ${txState === "error" ? "alert-error" : "alert-info"}`}>
         {txState !== "error" && <Spinner />}
         <span>{MESSAGES[txState] || txError}</span>
         {txHash && txState !== "signing" && (
           <a
             href={`https://subnets.avax.network/c-chain/tx/${txHash}`}
             target="_blank"
             rel="noopener noreferrer"
           >
             View on Snowtrace
           </a>
         )}
       </div>
     );
   }
   ```

5. **Wallet connection state management**

   ```tsx
   // components/ConnectButton.tsx
   import { useAccount, useConnect, useDisconnect } from "wagmi";
   import { injected } from "wagmi/connectors";

   export function ConnectButton() {
     const { address, isConnected, isConnecting } = useAccount();
     const { connect } = useConnect();
     const { disconnect } = useDisconnect();

     if (isConnecting) return <button disabled>Connecting...</button>;

     if (isConnected && address) {
       return (
         <div className="flex items-center gap-2">
           <NetworkBadge />
           <span>{address.slice(0, 6)}...{address.slice(-4)}</span>
           <button onClick={() => disconnect()}>Disconnect</button>
         </div>
       );
     }

     return (
       <button onClick={() => connect({ connector: injected() })}>
         Connect Wallet
       </button>
     );
   }
   ```

6. **Add Avalanche networks to MetaMask programmatically**

   ```tsx
   // utils/addAvalancheNetwork.ts
   export async function addAvalancheMainnet() {
     await window.ethereum?.request({
       method: "wallet_addEthereumChain",
       params: [{
         chainId: "0xA86A",  // 43114 in hex
         chainName: "Avalanche C-Chain",
         nativeCurrency: { name: "AVAX", symbol: "AVAX", decimals: 18 },
         rpcUrls: ["https://api.avax.network/ext/bc/C/rpc"],
         blockExplorerUrls: ["https://subnets.avax.network/c-chain"],
       }],
     });
   }

   export async function addFujiTestnet() {
     await window.ethereum?.request({
       method: "wallet_addEthereumChain",
       params: [{
         chainId: "0xA869",  // 43113 in hex
         chainName: "Avalanche Fuji Testnet",
         nativeCurrency: { name: "AVAX", symbol: "AVAX", decimals: 18 },
         rpcUrls: ["https://api.avax-test.network/ext/bc/C/rpc"],
         blockExplorerUrls: ["https://subnets-test.avax.network/c-chain"],
       }],
     });
   }
   ```

## Network config

| Network | Chain ID | Hex | RPC | Explorer |
|---|---|---|---|---|
| C-Chain Mainnet | 43114 | 0xA86A | https://api.avax.network/ext/bc/C/rpc | https://subnets.avax.network/c-chain |
| Fuji Testnet | 43113 | 0xA869 | https://api.avax-test.network/ext/bc/C/rpc | https://subnets-test.avax.network/c-chain |

## Key concepts

**1-2s Finality**: Avalanche achieves finality in 1-2 seconds — faster than Ethereum L1 but not instant. Always show a "pending" state. Do not update UI optimistically before tx confirmation unless you handle rollback.

**Chain Switch vs Add**: `wallet_switchEthereumChain` switches to a known chain. `wallet_addEthereumChain` adds + switches. If the chain isn't in the wallet, `switchEthereumChain` throws error 4902 — catch it and call `addEthereumChain`.

**User Rejected = 4001**: MetaMask error code 4001 means the user rejected the transaction. This is normal — never show it as a system error. Show "Cancelled by user."

**Revert Reason Parsing**: Contract revert reasons are buried in the RPC error. Parse `err.cause?.reason` or the error message string to extract meaningful text.

**Gas Estimation**: `eth_estimateGas` works on Avalanche. Always let wagmi/ethers estimate gas rather than hardcoding — gas costs change with network upgrades.

## Common errors

| Error | Cause | Fix |
|---|---|---|
| `Switch chain request failed` | User has chain but wrong RPC | Use `wallet_addEthereumChain` as fallback |
| Error code 4902 | Chain not in wallet | Catch 4902, call `wallet_addEthereumChain` |
| `User rejected the request` (4001) | User clicked "Cancel" | Show "Transaction cancelled" — not an error |
| Transaction hash but no receipt | tx dropped from mempool (rare) | Poll `getTransactionReceipt` with timeout; show "Transaction may have failed" |
| Wrong network after connect | User connected on wrong chain | Show network badge + switch prompt immediately on connect |

## Next skills

- `wagmi` — deep wagmi configuration for Avalanche
- `evm-wallet-integration` — Reown AppKit and Dynamic.xyz setup
- `qa` — UX testing checklist for launch readiness
