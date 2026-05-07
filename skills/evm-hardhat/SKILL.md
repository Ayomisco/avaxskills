---
name: "evm-hardhat"
version: "1.0.0"
spec: "agentskills@1.0"
license: "Apache-2.0"
tier: 1
description: "Set up and use Hardhat for Avalanche C-Chain and custom Subnets — compile, test, deploy, verify."
trigger: |
  Use when: user wants to set up Hardhat for Avalanche, configure hardhat.config.ts for Fuji/mainnet, write deploy scripts, run tests against Avalanche, or use Hardhat Ignition. Also triggers on 'how to deploy with Hardhat on Avalanche'.
  Do NOT use for: Foundry/Forge workflows, Remix IDE, non-EVM chains.
last_updated: "2026-05-01"
avalanche_networks: [fuji, mainnet]
related_skills:
  - evm-foundry
  - contract-verification
  - testing
  - first-contract
---

## Overview

Hardhat is the most widely-used Ethereum development framework and works identically on Avalanche C-Chain. This skill covers the full workflow: project setup, hardhat.config.ts with Avalanche networks, writing and running tests, deploying with scripts or Hardhat Ignition, and verifying contracts on Snowtrace. Avalanche's EVM compatibility means every Hardhat plugin and pattern from Ethereum works here unchanged.

## When to fetch

Fetch this skill whenever a user is setting up a new Avalanche project with Hardhat or configuring Avalanche networks in an existing Hardhat project. This is the most common professional development path for Avalanche.

## Core Workflow

### Step 1 — Initialize Project

```bash
mkdir my-avalanche-project && cd my-avalanche-project
npm init -y
npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox typescript ts-node @types/node
npx hardhat init
# Select: "Create a TypeScript project"
# Accept defaults for .gitignore and dependencies
```

This creates: `hardhat.config.ts`, `contracts/`, `test/`, `scripts/`, `ignition/`.

### Step 2 — Configure hardhat.config.ts

Replace the generated config with this complete Avalanche config:

```typescript
import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@nomicfoundation/hardhat-verify";
import * as dotenv from "dotenv";

dotenv.config();

const PRIVATE_KEY = process.env.PRIVATE_KEY || "0x" + "0".repeat(64);
const SNOWTRACE_API_KEY = process.env.SNOWTRACE_API_KEY || "";

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
      evmVersion: "paris",
    },
  },
  networks: {
    // Local Hardhat node
    hardhat: {
      chainId: 31337,
    },
    // Avalanche Fuji Testnet
    fuji: {
      url: "https://api.avax-test.network/ext/bc/C/rpc",
      chainId: 43113,
      accounts: [PRIVATE_KEY],
      gasPrice: 25000000000, // 25 gwei, auto works too
    },
    // Avalanche C-Chain Mainnet
    mainnet: {
      url: "https://api.avax.network/ext/bc/C/rpc",
      chainId: 43114,
      accounts: [PRIVATE_KEY],
    },
    // Example custom Subnet (replace with your Subnet RPC)
    mySubnet: {
      url: process.env.SUBNET_RPC_URL || "http://127.0.0.1:9650/ext/bc/YOUR_CHAIN_ID/rpc",
      chainId: parseInt(process.env.SUBNET_CHAIN_ID || "99999"),
      accounts: [PRIVATE_KEY],
    },
  },
  etherscan: {
    apiKey: {
      // Snowtrace requires an API key — get free at snowtrace.io/myapikey
      avalanche: SNOWTRACE_API_KEY,
      avalancheFujiTestnet: SNOWTRACE_API_KEY,
    },
    customChains: [
      {
        network: "avalancheFujiTestnet",
        chainId: 43113,
        urls: {
          apiURL: "https://api-testnet.snowtrace.io/api",
          browserURL: "https://subnets-test.avax.network/c-chain",
        },
      },
      {
        network: "avalanche",
        chainId: 43114,
        urls: {
          apiURL: "https://api.snowtrace.io/api",
          browserURL: "https://subnets.avax.network/c-chain",
        },
      },
    ],
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
};

export default config;
```

Create `.env` file (add to `.gitignore`!):

```bash
PRIVATE_KEY=0xYOUR_PRIVATE_KEY_HERE
SNOWTRACE_API_KEY=YOUR_SNOWTRACE_API_KEY
```

Install dotenv:
```bash
npm install dotenv
```

### Step 3 — Write a Contract

Create `contracts/MyToken.sol`:

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract MyToken is ERC20, Ownable {
    uint256 public constant MAX_SUPPLY = 1_000_000 * 10**18;

    constructor(address initialOwner)
        ERC20("MyToken", "MTK")
        Ownable(initialOwner)
    {
        _mint(initialOwner, 100_000 * 10**18);
    }

    function mint(address to, uint256 amount) public onlyOwner {
        require(totalSupply() + amount <= MAX_SUPPLY, "Exceeds max supply");
        _mint(to, amount);
    }
}
```

Install OpenZeppelin:
```bash
npm install @openzeppelin/contracts
```

Compile:
```bash
npx hardhat compile
```

Output: `Compiled 1 Solidity file successfully`

### Step 4 — Write Tests

Create `test/MyToken.test.ts`:

```typescript
import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";

describe("MyToken", function () {
  async function deployTokenFixture() {
    const [owner, alice, bob] = await ethers.getSigners();
    const MyToken = await ethers.getContractFactory("MyToken");
    const token = await MyToken.deploy(owner.address);
    await token.waitForDeployment();
    return { token, owner, alice, bob };
  }

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      const { token, owner } = await loadFixture(deployTokenFixture);
      expect(await token.owner()).to.equal(owner.address);
    });

    it("Should mint initial supply to owner", async function () {
      const { token, owner } = await loadFixture(deployTokenFixture);
      const balance = await token.balanceOf(owner.address);
      expect(balance).to.equal(ethers.parseEther("100000"));
    });
  });

  describe("Minting", function () {
    it("Owner can mint tokens", async function () {
      const { token, owner, alice } = await loadFixture(deployTokenFixture);
      await token.mint(alice.address, ethers.parseEther("1000"));
      expect(await token.balanceOf(alice.address)).to.equal(ethers.parseEther("1000"));
    });

    it("Non-owner cannot mint", async function () {
      const { token, alice } = await loadFixture(deployTokenFixture);
      await expect(
        token.connect(alice).mint(alice.address, ethers.parseEther("1000"))
      ).to.be.revertedWithCustomError(token, "OwnableUnauthorizedAccount");
    });
  });

  describe("Transfers", function () {
    it("Should transfer tokens correctly", async function () {
      const { token, owner, alice } = await loadFixture(deployTokenFixture);
      await token.transfer(alice.address, ethers.parseEther("500"));
      expect(await token.balanceOf(alice.address)).to.equal(ethers.parseEther("500"));
    });
  });
});
```

Run tests (on local Hardhat node — fast, free):
```bash
npx hardhat test
```

Run with gas reporter:
```bash
REPORT_GAS=true npx hardhat test
```

Run specific test file:
```bash
npx hardhat test test/MyToken.test.ts
```

### Step 5 — Deploy Script

Create `scripts/deploy.ts`:

```typescript
import { ethers, network } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  console.log("Network:", network.name, "(chain ID:", (await ethers.provider.getNetwork()).chainId.toString(), ")");
  console.log("Balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "AVAX");

  const MyToken = await ethers.getContractFactory("MyToken");
  console.log("Deploying MyToken...");

  const token = await MyToken.deploy(deployer.address);
  await token.waitForDeployment();

  const address = await token.getAddress();
  console.log("MyToken deployed to:", address);
  console.log("Explorer:", `https://subnets-test.avax.network/c-chain/address/${address}`);

  // Wait for a few blocks before verifying
  console.log("Waiting for 5 block confirmations...");
  const deployTx = token.deploymentTransaction();
  if (deployTx) await deployTx.wait(5);

  return address;
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
```

Deploy to Fuji:
```bash
npx hardhat run scripts/deploy.ts --network fuji
```

Deploy to mainnet:
```bash
npx hardhat run scripts/deploy.ts --network mainnet
```

### Step 6 — Hardhat Ignition (Modern Deployment)

Create `ignition/modules/MyToken.ts`:

```typescript
import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const MyTokenModule = buildModule("MyTokenModule", (m) => {
  const deployer = m.getAccount(0);
  const token = m.contract("MyToken", [deployer]);
  return { token };
});

export default MyTokenModule;
```

Deploy with Ignition:
```bash
npx hardhat ignition deploy ignition/modules/MyToken.ts --network fuji
```

Ignition tracks deployment state — re-running after failure resumes where it left off.

### Step 7 — Verify on Snowtrace

After deployment, verify:

```bash
npx hardhat verify --network fuji <CONTRACT_ADDRESS> <CONSTRUCTOR_ARG1>
# Example:
npx hardhat verify --network fuji 0x1234...abcd "0xYourDeployerAddress"
```

For no constructor args:
```bash
npx hardhat verify --network fuji 0x1234...abcd
```

For libraries:
```bash
npx hardhat verify --network fuji --libraries '{"SafeMath":"0xLibraryAddress"}' 0x1234...abcd
```

### Common Hardhat Commands Reference

```bash
npx hardhat compile          # Compile all contracts
npx hardhat test             # Run all tests
npx hardhat clean            # Clear cache and artifacts
npx hardhat node             # Start local Hardhat node
npx hardhat console --network fuji  # Interactive REPL on Fuji
npx hardhat accounts         # List available accounts
npx hardhat check            # Run solhint/slither if configured
```

## Network config

| Network | Chain ID | RPC URL | Explorer |
|---|---|---|---|
| C-Chain Mainnet | 43114 | https://api.avax.network/ext/bc/C/rpc | https://subnets.avax.network/c-chain |
| Fuji Testnet | 43113 | https://api.avax-test.network/ext/bc/C/rpc | https://subnets-test.avax.network/c-chain |

## Key concepts

**Hardhat network** — Local in-process EVM for testing. Fast, free, no real chain needed. `loadFixture()` resets state between tests for isolation.

**Hardhat Ignition** — Modern deployment system replacing `ethers.js` scripts. Tracks deployment state, handles failures gracefully, supports dry runs.

**hardhat-toolbox** — Meta-package that includes ethers.js v6, mocha, chai, hardhat-verify, gas reporter, coverage. One install covers most needs.

**Fixtures** — `loadFixture()` snapshots EVM state after setup and resets to that snapshot for each test, making tests fast and isolated.

**evmVersion** — Set to `paris` for maximum compatibility. Avalanche C-Chain supports up to `cancun` but `paris` avoids PUSH0 issues on some Subnets.

## Common errors

| Error | Cause | Fix |
|---|---|---|
| `Cannot find module 'hardhat'` | Missing installation | Run `npm install --save-dev hardhat` |
| `HardhatError: HH8: Invalid network...` | Network name mismatch in config | Check `--network` flag matches key in `networks` object |
| `Error: insufficient funds` | Private key account has no AVAX | Fund account from faucet.avax.network for Fuji |
| `ProviderError: max priority fee per gas higher than max fee per gas` | Gas config issue | Remove `gasPrice` and use `gas: "auto"` instead |
| `Invalid chain ID` | Wrong chainId in hardhat.config | Fuji=43113, Mainnet=43114 — verify with `chainId` field |
| Verification fails: `Bytecode does not match` | Compiler settings differ | Ensure optimizer settings match exactly between compile and verify |
| `TypeError: cannot read properties of undefined` | ethers v6 API change | Use `ethers.parseEther()` not `ethers.utils.parseEther()` in ethers v6 |

## Next skills

- `evm-foundry` — Foundry alternative (faster tests, built-in fuzzing)
- `contract-verification` — deep dive on all verification methods
- `testing` — advanced test patterns, coverage, fuzzing
- `subnet-evm-config` — configuring Hardhat for custom Subnets
