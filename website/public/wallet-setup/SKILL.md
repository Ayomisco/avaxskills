---
name: "wallet-setup"
version: "1.0.0"
spec: "agentskills@1.0"
license: "Apache-2.0"
tier: 0
description: "Configure MetaMask and Core Wallet for Avalanche C-Chain, Fuji testnet, and custom Subnets."
trigger: |
  Use when: user needs to configure a wallet for Avalanche, add Avalanche networks to MetaMask, set up Core Wallet, import a custom Subnet RPC, or asks about AVAX vs WAVAX.
  Do NOT use for: programmatic wallet creation in code (use viem/wagmi skills), Ledger hardware wallet setup.
last_updated: "2026-05-01"
avalanche_networks: [fuji, mainnet]
related_skills:
  - get-testnet-avax
  - first-contract
  - core-wallet
---

## Overview

Avalanche uses two wallet options: MetaMask (universal EVM wallet) and Core Wallet (Avalanche-native, supports X-Chain and P-Chain). For C-Chain development, MetaMask works perfectly. For cross-chain operations or staking, Core Wallet is required. This skill covers both plus custom Subnet RPC configuration.

## When to fetch

Fetch when a user's wallet is misconfigured, they're getting wrong network errors, or they need to add Avalanche to an existing MetaMask. Also covers the AVAX/WAVAX distinction that trips up many developers.

## Core Workflow

### MetaMask — Add Avalanche Mainnet

Open MetaMask → Networks dropdown → Add network → Add manually:

| Field | Value |
|---|---|
| Network Name | Avalanche Network C-Chain |
| New RPC URL | https://api.avax.network/ext/bc/C/rpc |
| Chain ID | 43114 |
| Currency Symbol | AVAX |
| Block Explorer URL | https://subnets.avax.network/c-chain |

Alternative (auto-add): Visit https://chainlist.org, search "Avalanche", click "Add to MetaMask".

### MetaMask — Add Fuji Testnet

| Field | Value |
|---|---|
| Network Name | Avalanche Fuji C-Chain |
| New RPC URL | https://api.avax-test.network/ext/bc/C/rpc |
| Chain ID | 43113 |
| Currency Symbol | AVAX |
| Block Explorer URL | https://subnets-test.avax.network/c-chain |

Show test networks in MetaMask: Settings → Advanced → Show test networks → ON.

### Core Wallet — Install and Setup

1. Visit https://core.app — Avalanche's official wallet
2. Install browser extension or mobile app
3. Core natively supports C-Chain, P-Chain, and X-Chain
4. Import existing MetaMask seed phrase or create new

Core Wallet advantages over MetaMask:
- Supports P-Chain staking natively
- X-Chain asset transfers built-in
- Subnet network auto-discovery
- Native AVAX bridge from Ethereum

### Add a Custom Subnet RPC

When you deploy a Subnet with Avalanche CLI, add it to MetaMask:

```
Network Name: My Subnet (or whatever you named it)
RPC URL: https://api.avax-test.network/ext/bc/{BLOCKCHAIN_ID}/rpc
Chain ID: {your genesis chainId, e.g. 12345}
Currency Symbol: {your gas token symbol}
Block Explorer: (leave blank if no explorer)
```

Get the Blockchain ID:
```bash
avalanche subnet describe mySubnet
# Look for "Blockchain ID" field
```

For local development Subnets:
```
RPC URL: http://127.0.0.1:9650/ext/bc/{BLOCKCHAIN_ID}/rpc
```

### AVAX vs WAVAX

| | AVAX | WAVAX |
|---|---|---|
| Type | Native gas token | ERC-20 wrapped version |
| Address | N/A (native) | 0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7 |
| Use | Pay gas fees | DEX swaps, DeFi protocols |
| MetaMask | Shows automatically | Add as custom token |

**To wrap AVAX → WAVAX:**
```solidity
// Call deposit() with AVAX value on WAVAX contract
IWAVAX(0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7).deposit{value: 1 ether}();
```

**Add WAVAX to MetaMask:** Import token → paste `0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7`.

### Switching Networks Programmatically

```javascript
// Add and switch to Fuji in a dApp
await window.ethereum.request({
  method: "wallet_addEthereumChain",
  params: [{
    chainId: "0xA869", // 43113 in hex
    chainName: "Avalanche Fuji Testnet",
    nativeCurrency: { name: "AVAX", symbol: "AVAX", decimals: 18 },
    rpcUrls: ["https://api.avax-test.network/ext/bc/C/rpc"],
    blockExplorerUrls: ["https://subnets-test.avax.network/c-chain"],
  }],
});
```

For mainnet (chainId `0xA86A` = 43114):
```javascript
await window.ethereum.request({
  method: "wallet_switchEthereumChain",
  params: [{ chainId: "0xA86A" }],
});
```

## Network config

| Network | Chain ID | Hex Chain ID | RPC |
|---|---|---|---|
| C-Chain Mainnet | 43114 | 0xA86A | https://api.avax.network/ext/bc/C/rpc |
| Fuji Testnet | 43113 | 0xA869 | https://api.avax-test.network/ext/bc/C/rpc |

## Key concepts

**C-Chain** — The EVM chain. All smart contracts live here. Chain ID 43114 (mainnet), 43113 (Fuji).

**P-Chain** — Platform chain. Validator management, staking. Not EVM. Core Wallet required.

**X-Chain** — Exchange chain. Fast AVAX transfers. Not EVM. Core Wallet required.

**RPC URL format** — C-Chain uses `/ext/bc/C/rpc`. Custom Subnets use `/ext/bc/{BLOCKCHAIN_ID}/rpc`.

**Private key security** — Never paste private keys in browser console or share them. For development, use a dedicated dev wallet with only testnet AVAX.

## Common errors

| Error | Cause | Fix |
|---|---|---|
| "Could not fetch chain ID" when adding network | Wrong RPC URL | Double-check URL format, especially the /ext/bc/C/rpc suffix |
| MetaMask shows "Chain ID already exists" | Network with that chain ID already added | Go to Settings → Networks and find/edit the existing one |
| Transaction sent to wrong chain | Network not switched | Always verify network name in MetaMask before confirming |
| AVAX not showing | Correct network but RPC down | Try alternative RPC: https://avalanche-c-chain-rpc.publicnode.com |
| Core Wallet shows wrong balance | P-Chain vs C-Chain confusion | Check which chain tab is selected in Core Wallet |

## Next skills

- `get-testnet-avax` — fund your Fuji wallet
- `first-contract` — deploy a contract with the configured wallet
- `core-wallet` — deep dive into Core Wallet dApp integration
