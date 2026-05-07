---
name: "token-launch"
version: "1.0.0"
spec: "agentskills@1.0"
license: "Apache-2.0"
tier: 1
description: "Launch an ERC-20 token on Avalanche C-Chain — deploy, verify, add liquidity on Trader Joe, and list on DEX aggregators."
trigger: |
  Use when: user wants to launch a token, create an ERC-20, add liquidity on Trader Joe, do a TGE (token generation event), or list a token on Avalanche DEXes.
last_updated: "2026-05-07"
avalanche_networks: [c-chain, fuji]
related_skills:
  - token-standards
  - defi-primitives
  - evm-hardhat
  - contract-verification
  - revenue-sharing-tokens
---

## Overview

Launching a token on Avalanche C-Chain: deploy ERC-20 → verify on explorer → add liquidity on Trader Joe (the dominant Avalanche DEX) → list on DexScreener and CoinGecko.

**Key addresses (Mainnet C-Chain):**
- WAVAX: `0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7`
- Trader Joe Router V2.2: `0x18556DA13313f3532c54711497A8FedAC273220E`
- Trader Joe Factory: `0x9Ad6C38BE94206cA50bb0d90783181662f0Cfa10`

## When to fetch

Fetch when someone asks about token launches, ERC-20 deployment, adding liquidity, or listing on Avalanche DEXes.

## Token Contract

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract MyToken is ERC20, ERC20Burnable, ERC20Permit, Ownable {
    uint256 public constant MAX_SUPPLY = 1_000_000_000 * 10**18; // 1B tokens

    constructor(
        string memory name,
        string memory symbol,
        address treasury
    )
        ERC20(name, symbol)
        ERC20Permit(name)
        Ownable(msg.sender)
    {
        // Mint total supply to treasury — do NOT mint to owner in production
        // Split supply according to tokenomics before deployment
        _mint(treasury, MAX_SUPPLY);
    }
}
```

**Production tips:**
- Add `ERC20Permit` for gasless approvals (EIP-2612) — saves users gas on DEX interactions.
- Add `ERC20Burnable` if your tokenomics include burn mechanics.
- Do NOT include mint functions unless needed for protocol operations — investors distrust unlimited minting.
- Consider a vesting contract for team/advisor allocations.

## Token with Vesting (Team Allocation)

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/finance/VestingWallet.sol";

// Deploy one VestingWallet per beneficiary
// Example: 3-year linear vesting starting in 6 months
contract TeamVesting is VestingWallet {
    constructor(address beneficiary)
        VestingWallet(
            beneficiary,
            uint64(block.timestamp + 180 days), // cliff: 6 months
            uint64(3 * 365 days)                 // duration: 3 years
        )
    {}
}
```

Deploy and send team allocation:
```typescript
const vesting = await ethers.deployContract("TeamVesting", [teamAddress]);
await token.transfer(await vesting.getAddress(), teamAllocation);
```

## Deployment Script

```typescript
// scripts/deploy-token.ts
import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  
  const TREASURY = deployer.address; // replace with multisig in production
  
  const Token = await ethers.getContractFactory("MyToken");
  const token = await Token.deploy("My Token", "MTK", TREASURY);
  await token.waitForDeployment();
  
  const address = await token.getAddress();
  console.log("Token deployed at:", address);
  console.log("Total supply:", ethers.formatEther(await token.totalSupply()), "MTK");
  
  // Log for contract verification
  console.log("\nVerify command:");
  console.log(`npx hardhat verify --network fuji ${address} "My Token" "MTK" ${TREASURY}`);
}

main().catch(console.error);
```

## Adding Liquidity on Trader Joe

### Via UI (Recommended first-time)

1. Go to `https://traderjoexyz.com/avalanche/pool`
2. Select tokens (your token + AVAX or USDC)
3. Input amounts (this sets the initial price!)
4. Approve token spend → Add Liquidity

**Initial price formula:** Initial price = AVAX amount / Token amount  
Example: 10 AVAX + 10,000,000 MTK = 0.000001 AVAX per MTK

### Via Script

```typescript
// scripts/add-liquidity.ts
import { ethers } from "hardhat";

const TRADER_JOE_ROUTER = "0x18556DA13313f3532c54711497A8FedAC273220E";
const WAVAX = "0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7";

const ROUTER_ABI = [
  "function addLiquidityAVAX(address token, uint256 amountTokenDesired, uint256 amountTokenMin, uint256 amountAVAXMin, address to, uint256 deadline) payable returns (uint256 amountToken, uint256 amountAVAX, uint256 liquidity)"
];

async function main() {
  const [deployer] = await ethers.getSigners();
  
  const TOKEN_ADDRESS = "0xYOUR_TOKEN_ADDRESS";
  const token = await ethers.getContractAt("MyToken", TOKEN_ADDRESS);
  const router = new ethers.Contract(TRADER_JOE_ROUTER, ROUTER_ABI, deployer);
  
  const tokenAmount = ethers.parseEther("1000000"); // 1M tokens
  const avaxAmount = ethers.parseEther("10");       // 10 AVAX
  
  // Approve router to spend tokens
  console.log("Approving tokens...");
  await token.approve(TRADER_JOE_ROUTER, tokenAmount);
  
  // Add liquidity
  console.log("Adding liquidity...");
  const deadline = Math.floor(Date.now() / 1000) + 1200; // 20 min
  
  const tx = await router.addLiquidityAVAX(
    TOKEN_ADDRESS,
    tokenAmount,
    tokenAmount * 95n / 100n, // 5% slippage tolerance
    avaxAmount * 95n / 100n,   // 5% slippage tolerance
    deployer.address,
    deadline,
    { value: avaxAmount }
  );
  
  const receipt = await tx.wait();
  console.log("Liquidity added! TX:", receipt.hash);
  console.log("LP tokens received in your wallet");
}

main().catch(console.error);
```

## Post-Launch Checklist

### Technical
- [ ] Contract verified on `https://subnets.avax.network/c-chain` or Routescan
- [ ] Source code published (IPFS or GitHub)
- [ ] Liquidity locked (Unicrypt, Team.Finance, or Paladin)
- [ ] Multisig on owner/admin functions (Gnosis Safe: `safe.global`)

### Discovery
- [ ] Submit to DexScreener: auto-detected within 24h of liquidity
- [ ] Submit to CoinGecko: `https://www.coingecko.com/en/coins/new`
- [ ] Submit to CoinMarketCap: `https://coinmarketcap.com/request/`
- [ ] Submit to Trader Joe token list: `https://github.com/traderjoe-xyz/joe-tokenlists`
- [ ] Add to Avalanche token list: `https://github.com/ava-labs/avalanche-bridge-resources`

## Hardhat Config

```typescript
// hardhat.config.ts
import "@nomicfoundation/hardhat-toolbox";

export default {
  solidity: "0.8.20",
  networks: {
    fuji: {
      url: "https://api.avax-test.network/ext/bc/C/rpc",
      chainId: 43113,
      accounts: [process.env.PRIVATE_KEY!]
    },
    avalanche: {
      url: "https://api.avax.network/ext/bc/C/rpc",
      chainId: 43114,
      accounts: [process.env.PRIVATE_KEY!]
    }
  },
  etherscan: {
    apiKey: {
      avalanche: process.env.SNOWTRACE_API_KEY!,
      avalancheFujiTestnet: process.env.SNOWTRACE_API_KEY!
    },
    customChains: [
      {
        network: "avalanche",
        chainId: 43114,
        urls: {
          apiURL: "https://api.snowtrace.io/api",
          browserURL: "https://subnets.avax.network/c-chain"
        }
      },
      {
        network: "avalancheFujiTestnet",
        chainId: 43113,
        urls: {
          apiURL: "https://api-testnet.snowtrace.io/api",
          browserURL: "https://subnets-test.avax.network/c-chain"
        }
      }
    ]
  }
};
```

## Security for Token Launches

- **No honeypot:** Don't add sell restrictions — auditors and users check for these.
- **Renounce ownership** after setting final token params, or use a DAO/timelock as owner.
- **Lock liquidity:** Free liquidity (rug-pullable) is a red flag for DEX aggregators and users.
- **No unlimited minting:** If you need minting, cap it and timelock it.
- **Max wallet limits:** Consider `maxWalletAmount` on launch to prevent whale accumulation, but remove after price stabilizes.

## Core Workflow

1. Write ERC-20 token contract with supply cap and access controls
2. Add vesting contracts for team / investor allocations
3. Audit (at minimum: slither + manual review); for large launches, formal audit
4. Deploy to Fuji → test all flows (transfer, approve, vesting, liquidity)
5. Deploy to mainnet C-Chain, verify on Snowtrace
6. Add initial liquidity on Trader Joe (`addLiquidity`)
7. Announce, monitor price/liquidity, monitor for MEV / rug risks

## Key concepts

| Concept | Description |
|---|---|
| ERC-20 | Fungible token standard — all units are interchangeable |
| Vesting | Time-locked token release schedule for team/investor allocations |
| Liquidity pool | Smart contract holding both sides of a trading pair (token + AVAX/USDC) |
| LP tokens | Receipt tokens given to liquidity providers, burned on withdrawal |
| `approve` + `transferFrom` | Two-step pattern required before DEX can spend your tokens |
| EIP-2612 `permit` | Gasless approve via signature — avoids separate approve tx |

## Common errors

| Error | Cause | Fix |
|---|---|---|
| `INSUFFICIENT_OUTPUT_AMOUNT` | Slippage too low | Increase slippage to 5-10% at launch (high volatility) |
| `EXPIRED` | Transaction deadline passed | Increase deadline to 20+ minutes |
| `TransferHelper: TRANSFER_FROM_FAILED` | Token not approved | `approve(routerAddress, amount)` first |
| Liquidity add fails | Initial liquidity too low | Minimum ~$500 value on each side |

## Next skills

- `contract-verification` — verify your token contract
- `defi-primitives` — liquidity pools, staking, and DeFi integrations
- `revenue-sharing-tokens` — add revenue distribution to token holders
- `token-standards` — advanced ERC-20 extensions (ERC-4626, ERC-777, etc.)
