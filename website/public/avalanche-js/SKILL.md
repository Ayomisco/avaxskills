---
name: "avalanche-js"
version: "1.0.0"
spec: "agentskills@1.0"
license: "Apache-2.0"
tier: 1
description: "Use avalanchejs SDK for P-Chain and X-Chain — native AVAX transfers, staking queries, asset creation."
trigger: |
  Use when: user needs to interact with P-Chain (staking, validators) or X-Chain (AVAX native transfers) programmatically, or needs the avalanchejs SDK for multi-chain Avalanche operations.
  Do NOT use for: C-Chain EVM operations (use viem/ethers.js), CLI-based validator management (use Avalanche CLI).
last_updated: "2026-05-01"
avalanche_networks: [fuji, mainnet]
related_skills:
  - avalanche-rpc
  - validator-management
  - viem
---

## Overview

The `@avalabs/avalanchejs` SDK provides TypeScript access to Avalanche's P-Chain (validator/staking operations) and X-Chain (native AVAX asset transfers). Unlike viem/ethers.js which only cover the EVM C-Chain, avalanchejs handles the full Avalanche multi-chain architecture including BIP44 address derivation, CB58 encoding, and atomic transactions.

## When to fetch

Fetch when users need programmatic access to staking, validator queries, or X-Chain AVAX transfers. For C-Chain EVM operations, use `viem` instead.

## Core Workflow

### Step 1 — Install

```bash
npm install @avalabs/avalanchejs
# or
yarn add @avalabs/avalanchejs
```

### Step 2 — Connect to Avalanche

```typescript
import { Avalanche, BinTools, BN, Buffer } from "@avalabs/avalanchejs";

// Connect to mainnet
const avalanche = new Avalanche(
  "api.avax.network",   // host
  443,                   // port
  "https",               // protocol
  1,                     // networkID (1=mainnet, 5=fuji)
);

// Connect to Fuji
const avalancheFuji = new Avalanche(
  "api.avax-test.network",
  443,
  "https",
  5,  // Fuji network ID
);

// Get chain APIs
const xchain = avalanche.XChain();   // X-Chain
const cchain = avalanche.CChain();   // C-Chain Avalanche API (not EVM)
const pchain = avalanche.PChain();   // P-Chain
const infoAPI = avalanche.Info();    // Node info
```

### Step 3 — Query Validators

```typescript
import { Avalanche } from "@avalabs/avalanchejs";

const avalanche = new Avalanche("api.avax.network", 443, "https", 1);
const pchain = avalanche.PChain();

// Get all current primary network validators
async function getValidators() {
  const validators = await pchain.getCurrentValidators();
  console.log("Total validators:", validators.validators.length);
  
  for (const v of validators.validators.slice(0, 5)) {
    console.log({
      nodeID: v.nodeID,
      stakeAmount: v.stakeAmount,
      startTime: new Date(parseInt(v.startTime) * 1000).toISOString(),
      endTime: new Date(parseInt(v.endTime) * 1000).toISOString(),
      uptime: v.uptime,
      rewardAddress: v.rewardOwner?.addresses,
    });
  }
}

getValidators();

// Get validators for a specific Subnet
async function getSubnetValidators(subnetID: string) {
  const validators = await pchain.getCurrentValidators(subnetID);
  return validators.validators;
}
```

### Step 4 — Get AVAX Balance on P-Chain and X-Chain

```typescript
import { Avalanche } from "@avalabs/avalanchejs";

const avalanche = new Avalanche("api.avax-test.network", 443, "https", 5);
const pchain = avalanche.PChain();
const xchain = avalanche.XChain();

// P-Chain balance (for staking)
async function getPChainBalance(address: string) {
  // P-Chain address format: P-fuji1...
  const balance = await pchain.getBalance(address);
  console.log("Unlocked:", balance.unlocked);  // in nAVAX
  console.log("Locked staking:", balance.lockedStakeable);
  console.log("Locked not staking:", balance.lockedNotStakeable);
  
  const avax = parseInt(balance.unlocked) / 1e9;
  console.log(`${avax} AVAX available on P-Chain`);
}

// X-Chain balance
async function getXChainBalance(address: string) {
  // X-Chain address format: X-fuji1...
  // AVAX asset ID on Fuji
  const avaxAssetID = await xchain.getAVAXAssetID();
  const balance = await xchain.getBalance(address, avaxAssetID);
  console.log("X-Chain AVAX balance:", parseInt(balance.balance) / 1e9, "AVAX");
}
```

### Step 5 — Key and Address Management

```typescript
import { Avalanche } from "@avalabs/avalanchejs";
import { KeyChain } from "@avalabs/avalanchejs/dist/apis/platformvm";

const avalanche = new Avalanche("api.avax-test.network", 443, "https", 5);
const pchain = avalanche.PChain();
const xchain = avalanche.XChain();

// Import from private key (hex)
async function importKey(privateKeyHex: string) {
  const pKeyBuf = Buffer.from(privateKeyHex, "hex");
  
  const xKeyChain = xchain.keyChain();
  const xKey = xKeyChain.importKey(pKeyBuf);
  const xAddress = xKey.getAddressString();
  console.log("X-Chain address:", xAddress); // X-fuji1...
  
  const pKeyChain = pchain.keyChain();
  const pKey = pKeyChain.importKey(pKeyBuf);
  const pAddress = pKey.getAddressString();
  console.log("P-Chain address:", pAddress); // P-fuji1...
  
  return { xAddress, pAddress };
}

// Note: C-Chain address is the standard Ethereum hex address
// Derived with BIP44 path m/44'/9000'/0'/0/0
```

### Step 6 — Transfer AVAX on X-Chain

```typescript
import { Avalanche, BN } from "@avalabs/avalanchejs";

const avalanche = new Avalanche("api.avax-test.network", 443, "https", 5);
const xchain = avalanche.XChain();

async function sendAVAXOnXChain(
  fromPrivateKey: string,
  toAddress: string,      // X-fuji1...
  amountAVAX: number
) {
  const keyChain = xchain.keyChain();
  keyChain.importKey(Buffer.from(fromPrivateKey, "hex"));
  const fromAddress = keyChain.getAddresses()[0];
  
  const avaxAssetID = await xchain.getAVAXAssetID();
  const fee = xchain.getDefaultTxFee();
  const amountNAVAX = new BN(amountAVAX * 1e9);  // Convert AVAX to nAVAX
  
  // Get UTXOs
  const { utxos } = await xchain.getUTXOs([xchain.addressFromBuffer(fromAddress)]);
  
  // Build base TX
  const unsignedTx = await xchain.buildBaseTx(
    utxos,
    amountNAVAX,
    avaxAssetID,
    [toAddress],
    [xchain.addressFromBuffer(fromAddress)],  // change address
    [xchain.addressFromBuffer(fromAddress)],  // from address
    undefined,
    undefined,
    fee,
  );
  
  const signedTx = unsignedTx.sign(keyChain);
  const txID = await xchain.issueTx(signedTx);
  console.log("TX ID:", txID);
  
  return txID;
}
```

### Step 7 — Query Network Info

```typescript
import { Avalanche } from "@avalabs/avalanchejs";

const avalanche = new Avalanche("api.avax.network", 443, "https", 1);
const infoAPI = avalanche.Info();

async function getNetworkInfo() {
  const networkID = await infoAPI.getNetworkID();
  const networkName = await infoAPI.getNetworkName();
  const nodeVersion = await infoAPI.getNodeVersion();
  const nodeID = await infoAPI.getNodeID();
  
  console.log({ networkID, networkName, nodeVersion, nodeID });
}

// Get blockchain ID
async function getBlockchainID() {
  const cChainID = await infoAPI.getBlockchainID("C");
  console.log("C-Chain blockchain ID:", cChainID);
}
```

### Step 8 — Get All Subnets

```typescript
import { Avalanche } from "@avalabs/avalanchejs";

const avalanche = new Avalanche("api.avax.network", 443, "https", 1);
const pchain = avalanche.PChain();

async function listSubnets() {
  const subnets = await pchain.getSubnets();
  for (const subnet of subnets) {
    console.log({
      id: subnet.id,
      controlKeys: subnet.controlKeys,
      threshold: subnet.threshold,
    });
  }
}
```

## Network config

| Network | Host | Port | Protocol | Network ID |
|---|---|---|---|---|
| Mainnet | api.avax.network | 443 | https | 1 |
| Fuji | api.avax-test.network | 443 | https | 5 |
| Local | 127.0.0.1 | 9650 | http | 12345 (local) |

## Key concepts

**BN (Big Number)** — All amounts in avalanchejs use `BN` (from bn.js) for precision. AVAX amounts are in nAVAX (nano-AVAX) = 10^9 per AVAX.

**CB58 encoding** — Avalanche-native base58check encoding used for addresses, asset IDs, and transaction IDs on P-Chain and X-Chain. Different from Ethereum hex.

**Address formats** — Same key, different formats: C-Chain uses 0x hex, P-Chain uses P-avax1..., X-Chain uses X-avax1.... All derived from same BIP44 path.

**UTXOs** — Unspent Transaction Outputs. X-Chain and P-Chain use UTXO model (like Bitcoin). C-Chain uses account model (like Ethereum).

**nAVAX** — The smallest unit. 1 AVAX = 1,000,000,000 nAVAX (10^9). Always use BN for calculations to avoid floating point errors.

## Common errors

| Error | Cause | Fix |
|---|---|---|
| `Wrong key format` | Private key not a Buffer | Convert hex string: `Buffer.from(hexKey, "hex")` |
| `Invalid address` for P/X chain | Using 0x hex address | Convert: `pchain.parseAddress("P-avax1...")` |
| Balance shows 0 but wallet has AVAX | Looking at wrong chain | Check C-Chain balance separately via eth_getBalance |
| `insufficient funds` for X-Chain TX | UTXOs don't cover amount + fee | Check balance includes fee: `amount + fee` |
| `UTXO not found` | Spent UTXO referenced | Refresh UTXOs before building TX |

## Next skills

- `avalanche-rpc` — raw RPC calls to same APIs
- `validator-management` — detailed staking and validator operations
- `viem` — C-Chain EVM operations with TypeScript
