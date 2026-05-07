---
name: "viem"
version: "1.0.0"
spec: "agentskills@1.0"
license: "Apache-2.0"
tier: 1
description: "Configure viem TypeScript client for Avalanche C-Chain — wallet client, public client, and contract interactions."
trigger: |
  Use when: user wants to use viem on Avalanche, set up createPublicClient or createWalletClient for C-Chain, read/write contracts with viem, or watch events.
  Do NOT use for: React hooks (use wagmi), P-Chain/X-Chain operations (use avalanche-js), non-TypeScript environments.
last_updated: "2026-05-01"
avalanche_networks: [fuji, mainnet]
related_skills:
  - wagmi
  - evm-hardhat
  - evm-wallet-integration
---

## Overview

viem is a TypeScript library for EVM interactions. It's lighter than ethers.js v5, fully typed, and tree-shakeable. For Avalanche, viem includes `avalanche` and `avalancheFuji` chains in `viem/chains`. This skill covers setup, contract reads/writes, and event watching on Avalanche C-Chain.

## When to fetch

Fetch when building TypeScript backends, scripts, or non-React frontends that interact with Avalanche. For React frontends, also fetch `wagmi` which wraps viem.

## Core Workflow

### Step 1 — Install

```bash
npm install viem
```

### Step 2 — Public Client (Read Operations)

```typescript
import { createPublicClient, http } from "viem";
import { avalanche, avalancheFuji } from "viem/chains";

// Mainnet
const mainnetClient = createPublicClient({
  chain: avalanche,
  transport: http("https://api.avax.network/ext/bc/C/rpc"),
});

// Fuji testnet
const fujiClient = createPublicClient({
  chain: avalancheFuji,
  transport: http("https://api.avax-test.network/ext/bc/C/rpc"),
});

// Custom Subnet
import { defineChain } from "viem";

const mySubnet = defineChain({
  id: 12345,
  name: "My Subnet",
  nativeCurrency: { name: "MYTOKEN", symbol: "MYT", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://api.avax-test.network/ext/bc/YOUR_CHAIN_ID/rpc"] },
  },
  blockExplorers: {
    default: { name: "Explorer", url: "https://myexplorer.com" },
  },
});

const subnetClient = createPublicClient({
  chain: mySubnet,
  transport: http(),
});
```

### Step 3 — Read Chain State

```typescript
// Get block number
const blockNumber = await fujiClient.getBlockNumber();
console.log("Block:", blockNumber.toString());

// Get AVAX balance
const balance = await fujiClient.getBalance({
  address: "0x8db97C7cEcE249c2b98bDC0226Cc4C2A57BF52FC",
});
console.log("Balance:", balance, "wei =", Number(balance) / 1e18, "AVAX");

// Get transaction
const tx = await mainnetClient.getTransaction({
  hash: "0xTX_HASH" as `0x${string}`,
});

// Get block
const block = await fujiClient.getBlock({ blockTag: "latest" });
console.log("Latest block timestamp:", block.timestamp);

// Get gas price
const gasPrice = await fujiClient.getGasPrice();
console.log("Gas price:", gasPrice, "wei =", Number(gasPrice) / 1e9, "gwei");

// Get fee data (EIP-1559)
const fees = await fujiClient.estimateFeesPerGas();
console.log("Max fee:", fees.maxFeePerGas);
console.log("Max priority fee:", fees.maxPriorityFeePerGas);
```

### Step 4 — Read Contracts

```typescript
import { createPublicClient, http, parseAbi } from "viem";
import { avalanche } from "viem/chains";

const client = createPublicClient({
  chain: avalanche,
  transport: http("https://api.avax.network/ext/bc/C/rpc"),
});

// Simple ABI definition
const erc20Abi = parseAbi([
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function balanceOf(address) view returns (uint256)",
  "function totalSupply() view returns (uint256)",
  "function allowance(address owner, address spender) view returns (uint256)",
]);

// Read single value
const name = await client.readContract({
  address: "0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7",  // WAVAX
  abi: erc20Abi,
  functionName: "name",
});
console.log("Token name:", name);  // "Wrapped AVAX"

// Read with arguments
const balance = await client.readContract({
  address: "0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7",
  abi: erc20Abi,
  functionName: "balanceOf",
  args: ["0xSOME_ADDRESS" as `0x${string}`],
});

// Multicall — batch multiple reads in one RPC call
const results = await client.multicall({
  contracts: [
    { address: "0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7", abi: erc20Abi, functionName: "name" },
    { address: "0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7", abi: erc20Abi, functionName: "symbol" },
    { address: "0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7", abi: erc20Abi, functionName: "totalSupply" },
  ],
});
console.log("Multicall results:", results);
// [{result: "Wrapped AVAX"}, {result: "WAVAX"}, {result: 1234567n}]
```

### Step 5 — Wallet Client (Write Operations)

```typescript
import { createWalletClient, http, parseEther, parseUnits } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { avalancheFuji } from "viem/chains";

const account = privateKeyToAccount(process.env.PRIVATE_KEY as `0x${string}`);

const walletClient = createWalletClient({
  account,
  chain: avalancheFuji,
  transport: http("https://api.avax-test.network/ext/bc/C/rpc"),
});

// Send AVAX
const txHash = await walletClient.sendTransaction({
  to: "0xRECIPIENT" as `0x${string}`,
  value: parseEther("0.1"),  // 0.1 AVAX
});
console.log("TX:", txHash);

// Write to a contract
const erc20Abi = parseAbi([
  "function transfer(address to, uint256 amount) returns (bool)",
  "function approve(address spender, uint256 amount) returns (bool)",
]);

const transferHash = await walletClient.writeContract({
  address: "0xTOKEN_ADDRESS" as `0x${string}`,
  abi: erc20Abi,
  functionName: "transfer",
  args: [
    "0xRECIPIENT" as `0x${string}`,
    parseUnits("100", 18),  // 100 tokens with 18 decimals
  ],
});

// Wait for confirmation
const publicClient = createPublicClient({
  chain: avalancheFuji,
  transport: http("https://api.avax-test.network/ext/bc/C/rpc"),
});

const receipt = await publicClient.waitForTransactionReceipt({
  hash: transferHash,
});
console.log("Status:", receipt.status);  // "success" or "reverted"
console.log("Gas used:", receipt.gasUsed);
```

### Step 6 — Watch Events

```typescript
import { createPublicClient, http, parseAbi, parseAbiItem } from "viem";
import { avalanche } from "viem/chains";

const client = createPublicClient({
  chain: avalanche,
  transport: http("https://api.avax.network/ext/bc/C/rpc"),
});

// Watch for Transfer events
const unwatch = client.watchContractEvent({
  address: "0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7",  // WAVAX
  abi: parseAbi(["event Transfer(address indexed from, address indexed to, uint256 value)"]),
  eventName: "Transfer",
  onLogs: (logs) => {
    logs.forEach((log) => {
      console.log("Transfer:", {
        from: log.args.from,
        to: log.args.to,
        value: Number(log.args.value) / 1e18,
      });
    });
  },
});

// Stop watching after 60 seconds
setTimeout(unwatch, 60_000);

// Get historical events
const logs = await client.getLogs({
  address: "0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7",
  event: parseAbiItem("event Transfer(address indexed from, address indexed to, uint256 value)"),
  fromBlock: BigInt(50000000),
  toBlock: "latest",
});
console.log("Transfer events:", logs.length);
```

### Step 7 — Simulate Before Writing

```typescript
// Simulate a transaction before sending (catches reverts)
const { request } = await publicClient.simulateContract({
  address: "0xTOKEN_ADDRESS" as `0x${string}`,
  abi: erc20Abi,
  functionName: "transfer",
  args: ["0xRECIPIENT" as `0x${string}`, parseUnits("100", 18)],
  account: account.address,
});

// If simulation passes, execute
const hash = await walletClient.writeContract(request);
```

## Network config

| Chain | Chain ID | viem import |
|---|---|---|
| Avalanche | 43114 | `import { avalanche } from "viem/chains"` |
| Avalanche Fuji | 43113 | `import { avalancheFuji } from "viem/chains"` |

## Key concepts

**PublicClient** — Read-only client. No private key needed. Used for getBalance, readContract, getLogs.

**WalletClient** — Write client. Requires account (private key or injected wallet). Used for sendTransaction, writeContract.

**BigInt** — viem uses JavaScript BigInt for all numbers. Use `n` suffix: `100n`, or `BigInt("100")`. Don't mix with regular numbers.

**parseEther / parseUnits** — Convert human-readable to wei: `parseEther("1.5")` = 1500000000000000000n. `parseUnits("100", 6)` = 100000000n (for USDC with 6 decimals).

**simulateContract** — Dry-run a write operation. Returns the `request` object to pass directly to `writeContract`. Always simulate before expensive writes.

## Common errors

| Error | Cause | Fix |
|---|---|---|
| `Chain ID mismatch` | WalletClient chain doesn't match RPC | Ensure chain param matches RPC URL chain |
| `TypeError: Cannot mix BigInt and other types` | Mixing BigInt with number | Always use BigInt: `parseEther("1")` not `1e18` |
| `ContractFunctionExecutionError` | Contract call reverted | Check args, ensure account has permission/balance |
| `Nonce too low` | Pending transaction with same nonce | Wait for pending tx or manually set nonce |
| `Gas too low` | estimateGas returned too little | Add buffer: multiply estimate by 1.2 |

## Next skills

- `wagmi` — React hooks wrapping viem for frontend dApps
- `evm-hardhat` — contract development that generates ABIs for viem
- `evm-wallet-integration` — connecting MetaMask/Core via viem
