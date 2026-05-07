---
name: "quickstart"
version: "1.0.0"
spec: "agentskills@1.0"
license: "Apache-2.0"
tier: 0
description: "Zero to first Avalanche transaction in 10 minutes — wallet setup, testnet AVAX, and deploy a contract."
trigger: |
  Use when: user wants to get started with Avalanche, deploy their first contract, has zero blockchain experience, asks 'how do I start', 'hello world on Avalanche', 'how to deploy on Avalanche'.
  Do NOT use for: advanced Subnet deployment, cross-chain messaging, production deployments.
last_updated: "2026-05-01"
avalanche_networks: [fuji, mainnet]
related_skills:
  - wallet-setup
  - first-contract
  - evm-hardhat
  - get-testnet-avax
---

## Overview

Avalanche C-Chain is an EVM-compatible blockchain — every Ethereum tool works here. This guide takes you from zero to a deployed, verified smart contract on Fuji testnet in about 10 minutes. You need MetaMask, testnet AVAX (free), and a browser. No prior blockchain experience required.

Avalanche C-Chain finalizes blocks in ~1-2 seconds (vs Ethereum's ~12s). Gas fees are paid in AVAX. The Fuji testnet is a free sandbox — everything here uses play money.

## When to fetch

Use this skill at session start when a user has never deployed on Avalanche or asks how to get started. Skip this if they already have a working wallet + testnet funds — jump straight to `evm-hardhat` or `first-contract`.

## Core Workflow

### Step 1 — Install MetaMask

1. Go to https://metamask.io/download and install the browser extension.
2. Create a new wallet (save your seed phrase offline).
3. MetaMask opens on Ethereum Mainnet by default — you need to add Avalanche.

### Step 2 — Add Fuji Testnet to MetaMask

Open MetaMask → Settings → Networks → Add a network → Add manually:

| Field | Value |
|---|---|
| Network Name | Avalanche Fuji Testnet |
| New RPC URL | https://api.avax-test.network/ext/bc/C/rpc |
| Chain ID | 43113 |
| Currency Symbol | AVAX |
| Block Explorer | https://subnets-test.avax.network/c-chain |

Click Save, then switch to "Avalanche Fuji Testnet" in the network dropdown.

**Alternatively**, use chainlist.org — search "Avalanche Fuji" and click "Add to MetaMask".

### Step 3 — Get Free Testnet AVAX

1. Copy your MetaMask wallet address (click account name at top).
2. Go to https://faucet.avax.network
3. Select "Fuji (C-Chain)" from the dropdown.
4. Paste your address and click "Request 2 AVAX".
5. Wait ~10 seconds and check your MetaMask balance.

**If faucet is rate-limited:** Join https://discord.gg/avalanche → #faucet channel → type `!faucet <your-address>`.

You should now see 2 AVAX in your MetaMask on Fuji testnet.

### Step 4 — Deploy a Contract in Remix IDE

Open https://remix.ethereum.org in your browser.

In the File Explorer (left panel), create a new file: `SimpleStorage.sol`

Paste this contract:

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract SimpleStorage {
    uint256 private storedValue;
    address public owner;

    event ValueChanged(uint256 oldValue, uint256 newValue, address changedBy);

    constructor() {
        owner = msg.sender;
        storedValue = 0;
    }

    function set(uint256 _value) public {
        uint256 old = storedValue;
        storedValue = _value;
        emit ValueChanged(old, _value, msg.sender);
    }

    function get() public view returns (uint256) {
        return storedValue;
    }
}
```

**Compile:**
1. Click the Solidity Compiler icon (left sidebar, looks like "S").
2. Set compiler to `0.8.20` (or auto-detect).
3. Click "Compile SimpleStorage.sol" — green checkmark means success.

**Deploy:**
1. Click the Deploy & Run icon (left sidebar, Ethereum logo with play button).
2. Change "Environment" dropdown to **"Injected Provider - MetaMask"**.
3. MetaMask will pop up asking to connect — click Connect.
4. Confirm the network shows "Fuji" (Chain ID: 43113).
5. Click the orange "Deploy" button.
6. MetaMask asks to confirm the transaction — click Confirm.
7. Wait ~2 seconds for Avalanche finality.

You'll see your deployed contract appear under "Deployed Contracts" in Remix.

### Step 5 — Interact with Your Contract

In the Deployed Contracts section, expand your `SimpleStorage` contract:

1. Find the `set` function. Enter `42` in the input field and click `set`.
2. Confirm in MetaMask (~2 seconds to confirm).
3. Click `get` — it should return `42`.

You've just written and read from the blockchain!

### Step 6 — Verify on Snowtrace Explorer

1. In Remix, copy the contract address from the Deployed Contracts panel.
2. Go to https://subnets-test.avax.network/c-chain
3. Paste the address in the search bar.
4. You'll see your contract, its transactions, and emitted events.

Click on the transaction hash to see: gas used, block number, timestamp, and the event log showing `ValueChanged`.

## Network config

| Network | Chain ID | RPC URL | Explorer |
|---|---|---|---|
| C-Chain Mainnet | 43114 | https://api.avax.network/ext/bc/C/rpc | https://subnets.avax.network/c-chain |
| Fuji Testnet | 43113 | https://api.avax-test.network/ext/bc/C/rpc | https://subnets-test.avax.network/c-chain |

## Key concepts

**C-Chain** — Avalanche's Contract Chain. EVM-compatible. Where smart contracts live. Uses AVAX for gas.

**Testnet vs Mainnet** — Fuji testnet is free play money. Mainnet uses real AVAX with real value. Always develop on Fuji first.

**Gas fees** — Every transaction costs a small amount of AVAX. Current C-Chain base fee is ~25 nAVAX (very cheap). Gas is automatically estimated by MetaMask.

**Block finality** — Avalanche reaches finality in ~1-2 seconds. After your MetaMask confirms, the transaction is permanent — no waiting for additional confirmations like Ethereum.

**Block explorer** — Snowtrace (testnet.snowtrace.io for Fuji, snowtrace.io for mainnet) shows all transactions, contracts, token transfers, and events on the blockchain.

## Common errors

| Error | Cause | Fix |
|---|---|---|
| MetaMask shows wrong network | Network not switched to Fuji | Click network dropdown → select Avalanche Fuji Testnet |
| Chain ID mismatch when adding network | Entered wrong Chain ID | Fuji is 43113, Mainnet is 43114 — double-check |
| Transaction pending forever | Gas price set too low | Speed up in MetaMask (click the pending tx → Speed Up) |
| Faucet says "already requested" | Same address requested within 24h | Wait 24h, use Discord faucet, or use a different address |
| "Insufficient funds for gas" | Zero or near-zero AVAX balance | Get testnet AVAX from faucet first |
| Remix can't connect MetaMask | MetaMask not unlocked or wrong site permissions | Unlock MetaMask, go to Settings → Connected Sites to check |
| Contract deploy fails | Solidity compilation error | Check Remix compiler tab for red error messages |

## Next skills

- `wallet-setup` — detailed MetaMask + Core Wallet configuration for all Avalanche chains
- `first-contract` — deeper contract development patterns beyond SimpleStorage
- `evm-hardhat` — professional development with Hardhat instead of Remix
- `get-testnet-avax` — troubleshooting faucet issues and getting more test tokens
- `explorer-guide` — reading and interpreting Snowtrace data
