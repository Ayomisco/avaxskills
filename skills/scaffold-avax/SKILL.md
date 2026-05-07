---
name: "scaffold-avax"
version: "1.0.0"
spec: "agentskills@1.0"
license: "Apache-2.0"
tier: 1
description: "Scaffold an Avalanche dApp from templates using Scaffold-ETH 2 adapted for Avalanche."
trigger: |
  Use when: user wants to scaffold a full-stack Avalanche dApp quickly, use Scaffold-ETH 2 on Avalanche, or set up a Next.js + Hardhat monorepo for Avalanche development.
  Do NOT use for: backend-only or CLI tool development, pure smart contract projects without a frontend.
last_updated: "2026-05-01"
avalanche_networks: [fuji, mainnet]
related_skills:
  - evm-hardhat
  - viem
  - wagmi
  - evm-wallet-integration
---

## Overview

Scaffold-ETH 2 is a full-stack dApp starter that works on Avalanche with minimal configuration. It includes: Next.js 14 frontend, Hardhat backend, wagmi/viem hooks, RainbowKit wallet connection, and a component library for contract interaction. You get contract debugging UI, real-time event watching, and hot-reload — all pointing at Avalanche.

## When to fetch

Fetch when a user wants to build a full dApp (frontend + smart contract) for Avalanche and wants to start from a working template rather than wiring everything manually.

## Core Workflow

### Step 1 — Create Project

```bash
npx create-eth@latest my-avax-app
# Prompts:
# ? What solidity framework do you want to use? Hardhat
# ? Install packages? Yes

cd my-avax-app
```

Project structure:
```
my-avax-app/
├── packages/
│   ├── hardhat/          # Smart contracts
│   │   ├── contracts/
│   │   ├── deploy/
│   │   └── hardhat.config.ts
│   └── nextjs/           # Frontend
│       ├── app/
│       ├── components/
│       └── scaffold.config.ts
└── package.json
```

### Step 2 — Configure for Avalanche

Edit `packages/nextjs/scaffold.config.ts`:

```typescript
import { defineChain } from "viem";
import * as chains from "viem/chains";
import { type ScaffoldConfig } from "~~/types/scaffold-eth";

// Define Fuji if not in viem/chains
const avalancheFuji = defineChain({
  id: 43113,
  name: "Avalanche Fuji Testnet",
  nativeCurrency: { name: "Avalanche", symbol: "AVAX", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://api.avax-test.network/ext/bc/C/rpc"] },
  },
  blockExplorers: {
    default: { name: "Snowtrace", url: "https://subnets-test.avax.network/c-chain" },
  },
  testnet: true,
});

const scaffoldConfig = {
  targetNetworks: [chains.avalanche, avalancheFuji],
  pollingInterval: 3000,          // 3s — safe for Avalanche's 2s blocks
  alchemyApiKey: "oKxs-...",      // not needed for Avalanche, but required by config
  walletConnectProjectId: "YOUR_PROJECT_ID",  // get from cloud.walletconnect.com
  onlyLocalBurnerWallet: false,   // false = allow MetaMask, Core Wallet
  walletAutoConnect: true,
} satisfies ScaffoldConfig;

export default scaffoldConfig;
```

Edit `packages/hardhat/hardhat.config.ts` to add Avalanche networks:

```typescript
const config: HardhatUserConfig = {
  networks: {
    fuji: {
      url: "https://api.avax-test.network/ext/bc/C/rpc",
      chainId: 43113,
      accounts: [deployerPrivateKey],
    },
    avalanche: {
      url: "https://api.avax.network/ext/bc/C/rpc",
      chainId: 43114,
      accounts: [deployerPrivateKey],
    },
  },
  // ... rest of config
};
```

### Step 3 — Write and Deploy a Contract

Edit `packages/hardhat/contracts/YourContract.sol`:

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract YourContract {
    address public immutable owner;
    string public greeting;
    bool public premium;
    uint256 public totalCounter;
    mapping(address => uint256) public userGreetingCounter;

    event GreetingChange(address indexed greetingSetter, string newGreeting, bool premium, uint256 value);

    constructor(address _owner) {
        owner = _owner;
        greeting = "Building Avalanche!";
    }

    function setGreeting(string memory _newGreeting, bool _premium) public payable {
        if (_premium) {
            require(msg.value > 0, "Send AVAX to set premium greeting");
        }
        greeting = _newGreeting;
        premium = _premium;
        totalCounter++;
        userGreetingCounter[msg.sender]++;
        emit GreetingChange(msg.sender, _newGreeting, _premium, msg.value);
    }

    function withdraw() public {
        require(msg.sender == owner, "Not owner");
        (bool success, ) = owner.call{value: address(this).balance}("");
        require(success, "Withdraw failed");
    }

    receive() external payable {}
}
```

Deploy:
```bash
# Deploy to local Hardhat node (development)
yarn deploy

# Deploy to Fuji testnet
yarn deploy --network fuji
```

The Scaffold-ETH deploy scripts auto-generate TypeScript types and update the frontend's contract address config.

### Step 4 — Run the Full Stack

```bash
# Terminal 1: Start local Hardhat node
yarn chain

# Terminal 2: Deploy contracts
yarn deploy

# Terminal 3: Start Next.js frontend
yarn start
```

Open http://localhost:3000 — you'll see:
- Wallet connect button (MetaMask/Core/RainbowKit)
- Contract debug UI (automatically generated from ABI)
- Read/Write functions
- Event log stream

### Step 5 — Use Scaffold-ETH Hooks

The frontend includes custom wagmi hooks. In `packages/nextjs/app/page.tsx`:

```typescript
"use client";
import { useScaffoldReadContract, useScaffoldWriteContract, useScaffoldWatchContractEvent } from "~~/hooks/scaffold-eth";

export default function Home() {
  // Read contract state
  const { data: greeting } = useScaffoldReadContract({
    contractName: "YourContract",
    functionName: "greeting",
  });

  const { data: totalCounter } = useScaffoldReadContract({
    contractName: "YourContract",
    functionName: "totalCounter",
  });

  // Write to contract
  const { writeContractAsync, isPending } = useScaffoldWriteContract({
    contractName: "YourContract",
  });

  // Watch events
  useScaffoldWatchContractEvent({
    contractName: "YourContract",
    eventName: "GreetingChange",
    onLogs: (logs) => {
      logs.forEach((log) => {
        console.log("New greeting:", log.args.newGreeting);
      });
    },
  });

  const handleSetGreeting = async () => {
    await writeContractAsync({
      functionName: "setGreeting",
      args: ["Hello Avalanche!", false],
    });
  };

  return (
    <div>
      <p>Current greeting: {greeting}</p>
      <p>Total greetings: {totalCounter?.toString()}</p>
      <button onClick={handleSetGreeting} disabled={isPending}>
        {isPending ? "Setting..." : "Set Greeting"}
      </button>
    </div>
  );
}
```

### Step 6 — Key Differences from Ethereum Scaffolds

1. **No Alchemy needed** — Use public Avalanche RPCs directly
2. **Faster block polling** — Reduce from 5000ms to 3000ms for 2s block time
3. **AVAX symbol** — Override currency display in config
4. **Core Wallet support** — Add `window.avalanche` detection (see `core-wallet` skill)
5. **Gas estimation** — Avalanche fees are much lower; default gas limits from ethers.js work fine

## Key concepts

**Scaffold-ETH 2** — Opinionated monorepo with Hardhat + Next.js + wagmi pre-wired. Fastest path to a working dApp.

**Auto-generated UI** — The `/debug` page reads your contract ABI and generates an interactive UI automatically. Useful for testing without building a custom UI first.

**useScaffoldReadContract** — Thin wrapper over `useReadContract` (wagmi) that auto-resolves contract address by name from your deployment files.

**Burner wallet** — Scaffold-ETH includes a throwaway wallet for local development. Disable with `onlyLocalBurnerWallet: false` for production.

## Common errors

| Error | Cause | Fix |
|---|---|---|
| Chain not supported in UI | Avalanche not in targetNetworks | Add `chains.avalanche` to `targetNetworks` in scaffold.config.ts |
| "WalletConnect project ID required" | Missing config | Get free project ID at cloud.walletconnect.com |
| Deploy script fails on Fuji | Missing DEPLOYER_PRIVATE_KEY | Add to `packages/hardhat/.env` |
| Frontend shows wrong network | targetNetworks mismatch | Ensure fuji is in targetNetworks AND MetaMask is on Fuji |

## Next skills

- `evm-hardhat` — deeper Hardhat configuration
- `wagmi` — wagmi hooks for custom frontends
- `viem` — low-level chain interactions
- `evm-wallet-integration` — wallet connection patterns
