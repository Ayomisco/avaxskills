---
name: "get-testnet-avax"
version: "1.0.0"
spec: "agentskills@1.0"
license: "Apache-2.0"
tier: 0
description: "Get testnet AVAX from the Fuji faucet and manage test tokens for development."
trigger: |
  Use when: user needs testnet AVAX for Fuji, faucet is rate-limited, user has zero AVAX on Fuji, or asks how to get test tokens for Avalanche development.
  Do NOT use for: mainnet AVAX acquisition, ERC-20 test tokens (deploy your own), or staking.
last_updated: "2026-05-01"
avalanche_networks: [fuji]
related_skills:
  - wallet-setup
  - first-contract
  - evm-hardhat
---

## Overview

Fuji testnet AVAX is free and required for all test transactions on Fuji C-Chain. The primary source is the official Ava Labs faucet at faucet.avax.network, which gives 2 AVAX per day per address. For development requiring more, the Discord faucet bot and community resources provide additional options.

## When to fetch

Fetch when a user has a Fuji wallet address but zero or insufficient AVAX balance, or when they're getting "insufficient funds" errors on Fuji.

## Core Workflow

### Method 1 — Official Faucet (Primary)

1. Go to https://faucet.avax.network
2. Select network: **Fuji (C-Chain)**
3. Paste your wallet address (0x... format)
4. Complete the CAPTCHA
5. Click "Request 2 AVAX"
6. Wait 10-30 seconds

**Limits:**
- 2 AVAX per request
- 1 request per 24 hours per address
- 1 request per 24 hours per IP address

**Check receipt:**
After requesting, click the transaction link or go to https://subnets-test.avax.network/c-chain and paste your address to see the incoming transfer.

### Method 2 — Discord Faucet Bot

If the web faucet is rate-limited:

1. Join https://discord.gg/avalanche
2. Go to the `#faucet` channel
3. Type: `!faucet <your-address>`
   ```
   !faucet 0x1234567890abcdef...
   ```
4. Bot responds with transaction hash
5. Rate limit: 24 hours per Discord account

**Note:** You need a verified Discord account (phone number or older account).

### Method 3 — Generate Multiple Dev Wallets

For development that needs more AVAX than the faucet allows:

```bash
# Using cast (Foundry)
cast wallet new  # generates random address + private key

# Or in Node.js
node -e "const ethers = require('ethers'); const w = ethers.Wallet.createRandom(); console.log('Address:', w.address, '\nKey:', w.privateKey)"
```

Generate 5 wallets, request from faucet for each, then consolidate:

```bash
# Transfer AVAX between accounts using cast
cast send --private-key $SECONDARY_KEY \
  --rpc-url https://api.avax-test.network/ext/bc/C/rpc \
  $MAIN_ADDRESS \
  --value 1.9ether
```

### Method 4 — Check Balance

```bash
# Using cast
cast balance 0xYOURWALLET --rpc-url https://api.avax-test.network/ext/bc/C/rpc --ether

# Using curl
curl -X POST https://api.avax-test.network/ext/bc/C/rpc \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_getBalance","params":["0xYOURWALLET","latest"],"id":1}'
# Result in hex wei — divide by 1e18 for AVAX
```

### Getting Testnet ERC-20 Tokens

For testing DeFi or token contracts, deploy your own:

```solidity
// TestToken.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract TestToken is ERC20 {
    constructor() ERC20("Test USDC", "tUSDC") {
        _mint(msg.sender, 1_000_000 * 10**18);
    }
    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}
```

```bash
npx hardhat run scripts/deployToken.ts --network fuji
```

## Key concepts

**Testnet AVAX has no value** — Fuji AVAX is worthless by design. It cannot be bridged to mainnet. Never confuse addresses between Fuji and mainnet.

**24-hour cooldown** — Both web and Discord faucets enforce 24-hour per-address limits. Plan ahead — get AVAX before starting development sessions.

**Gas cost on Fuji** — Each transaction costs ~0.001-0.01 AVAX. 2 AVAX covers hundreds of transactions. For heavy testing, 10 AVAX is comfortable.

**P-Chain vs C-Chain faucet** — The faucet sends to C-Chain by default. Select "Fuji (C-Chain)" — not P-Chain — for smart contract development.

## Common errors

| Error | Cause | Fix |
|---|---|---|
| "You've already requested from the faucet" | 24h limit hit | Wait 24h, use Discord faucet, or use different address |
| Faucet TX sent but no AVAX | Wrong network in MetaMask | Ensure MetaMask is on Fuji, not Ethereum mainnet |
| "Insufficient funds for gas" after getting AVAX | Transaction needs more than available | 2 AVAX should be plenty; check gas price setting |
| Balance shows 0 after faucet | Still on Ethereum in MetaMask | Switch to "Avalanche Fuji Testnet" in MetaMask |
| Faucet site down | Maintenance | Try later or use Discord bot |

## Next skills

- `first-contract` — now that you have AVAX, deploy a contract
- `evm-hardhat` — professional development workflow
- `wallet-setup` — if wallet not yet configured for Fuji
