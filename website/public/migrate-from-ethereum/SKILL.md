---
name: "migrate-from-ethereum"
version: "1.0.0"
spec: "agentskills@1.0"
license: "Apache-2.0"
tier: 1
description: "Migrate an existing Ethereum project to Avalanche C-Chain — what changes, what stays the same, config updates, tooling differences, and Avalanche-specific optimizations."
trigger: |
  Use when: user is porting an Ethereum project to Avalanche, migrating from Ethereum mainnet, asking what's different on Avalanche vs Ethereum, or rebuilding an Ethereum dApp on Avalanche.
last_updated: "2026-05-07"
avalanche_networks: [c-chain, fuji]
related_skills:
  - quickstart
  - evm-hardhat
  - evm-foundry
  - concepts
  - avalanche-rpc
  - why-avalanche
---

## Overview

Avalanche C-Chain is a fully EVM-compatible chain. If it works on Ethereum, it almost certainly works on Avalanche with **only config changes** — no contract code changes required.

**Key differences:**
- Chain ID: 43114 (mainnet), 43113 (Fuji testnet)
- Gas token: AVAX (not ETH)
- Block time: ~2 seconds (vs ~12s Ethereum)
- Finality: ~1-2 seconds (vs ~12 minutes for Ethereum probabilistic finality)
- Gas price: Significantly lower (fractions of a cent per transaction)

## When to fetch

Fetch whenever a developer asks about moving their Ethereum project to Avalanche, or asks "what's different on Avalanche vs Ethereum?"

## What Changes

### 1. Network Config

**Hardhat:**
```typescript
// Before (Ethereum)
networks: {
  mainnet: {
    url: `https://mainnet.infura.io/v3/${INFURA_KEY}`,
    chainId: 1,
    accounts: [PRIVATE_KEY]
  },
  goerli: {
    url: `https://goerli.infura.io/v3/${INFURA_KEY}`,
    chainId: 5,
    accounts: [PRIVATE_KEY]
  }
}

// After (Avalanche)
networks: {
  avalanche: {
    url: "https://api.avax.network/ext/bc/C/rpc",
    chainId: 43114,
    accounts: [PRIVATE_KEY]
  },
  fuji: {
    url: "https://api.avax-test.network/ext/bc/C/rpc",
    chainId: 43113,
    accounts: [PRIVATE_KEY]
  }
}
```

**Foundry (`foundry.toml`):**
```toml
# Before (Ethereum)
[rpc_endpoints]
mainnet = "https://eth-mainnet.g.alchemy.com/v2/${ALCHEMY_KEY}"
goerli = "https://eth-goerli.g.alchemy.com/v2/${ALCHEMY_KEY}"

# After (Avalanche)
[rpc_endpoints]
avalanche = "https://api.avax.network/ext/bc/C/rpc"
fuji = "https://api.avax-test.network/ext/bc/C/rpc"
```

**Viem/Wagmi:**
```typescript
// Before (Ethereum)
import { mainnet, goerli } from "viem/chains";
const client = createPublicClient({ chain: mainnet, transport: http() });

// After (Avalanche)
import { avalanche, avalancheFuji } from "viem/chains";
const client = createPublicClient({
  chain: avalanche,
  transport: http("https://api.avax.network/ext/bc/C/rpc")
});
```

### 2. Contract Verification

**Before (Ethereum — Etherscan):**
```bash
npx hardhat verify --network mainnet CONTRACT_ADDRESS "Constructor" "Args"
```

**After (Avalanche — Routescan via Snowtrace API):**
```bash
npx hardhat verify --network avalanche CONTRACT_ADDRESS "Constructor" "Args"
```

Add to `hardhat.config.ts`:
```typescript
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
```

Get free API key: `https://snowtrace.io/myapikey` (login with wallet)

### 3. Explorer URLs

| Purpose | Ethereum | Avalanche |
|---|---|---|
| Mainnet | https://etherscan.io | https://subnets.avax.network/c-chain |
| Testnet | https://goerli.etherscan.io | https://subnets-test.avax.network/c-chain |
| View TX | /tx/0x... | /tx/0x... |
| View address | /address/0x... | /address/0x... |

### 4. Faucet

- Ethereum Goerli: `https://goerlifaucet.com`
- Avalanche Fuji: `https://faucet.avax.network` (2 AVAX/day)

### 5. Gas Estimates

Block time is 2s not 12s — adjust timeouts and polling:
```typescript
// viem: reduce polling interval
const client = createPublicClient({
  chain: avalanche,
  transport: http(),
  pollingInterval: 2_000  // 2 seconds (matches block time)
});

// ethers.js v6: adjust gas estimation
const feeData = await provider.getFeeData();
// minBaseFee on Avalanche is 25 gwei by default
```

### 6. Native Token (AVAX vs ETH)

All places that reference ETH amounts now use AVAX. The unit is the same (1 AVAX = 1e18 wei), only the token name changes.

```typescript
// ethers.js (same API, different amounts make sense)
const avaxBalance = await provider.getBalance(address);
const avaxFormatted = ethers.formatEther(avaxBalance); // still works

// viem
const balance = await client.getBalance({ address });
// balance is in wei (nAVAX), same as ETH
```

### 7. WETH → WAVAX

If your contracts use WETH:
- Ethereum mainnet WETH: `0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2`
- Avalanche mainnet WAVAX: `0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7`

Update any hardcoded WETH addresses.

### 8. Block Number / Timestamp

Block times differ: Ethereum ~12s, Avalanche ~2s.

```solidity
// If you use block number for timing:
// Ethereum: 1 day = ~7200 blocks
// Avalanche: 1 day = ~43200 blocks (2s blocks)

// Recommendation: use block.timestamp instead of block.number for time-based logic
require(block.timestamp >= unlockTime, "too early");
```

## What Stays the Same

✅ All Solidity code (ERC-20, ERC-721, ERC-1155, proxy patterns, etc.)
✅ OpenZeppelin contracts — all work unchanged
✅ Hardhat tests — `npx hardhat test` works identically
✅ Foundry tests — `forge test` works identically
✅ Ethers.js and viem APIs — same interface, different RPC URLs
✅ ABI encoding/decoding
✅ `create2` deployment addresses (if using same deployer)
✅ Gas token decimals (18 decimals, wei units)
✅ EIP standards (EIP-1559, EIP-712, EIP-2612, etc.)
✅ MetaMask and wallet interactions
✅ The Graph subgraphs (redeploy to Avalanche)
✅ Chainlink — deployed on Avalanche
✅ OpenZeppelin Defender — supports Avalanche

## Avalanche-Specific Opportunities

After migrating, consider enhancing with Avalanche's unique features:

**Lower costs → Enable new UX:**
```typescript
// Micro-transactions viable at Avalanche gas prices
// e.g., 0.001 AVAX per in-game action (~$0.001)
```

**2s finality → Better UX:**
```typescript
// Don't wait for 6 confirmations like on Ethereum
// 1-2 blocks is usually sufficient (finality is fast)
const receipt = await provider.waitForTransaction(txHash, 1); // 1 confirmation
```

**Custom L1 → Full chain control:**
If your dApp needs a custom gas token, allowlisted deployers, or high throughput, consider deploying your own Avalanche L1 (see `subnet-deployment` skill).

## Migration Checklist

- [ ] Update network configs (Hardhat/Foundry/Viem)
- [ ] Update `.env` with Fuji RPC + private key
- [ ] Replace WETH address with WAVAX if applicable
- [ ] Replace Etherscan API key with Snowtrace API key
- [ ] Update explorer URLs in docs/UI
- [ ] Update faucet links to `faucet.avax.network`
- [ ] Deploy to Fuji (testnet) first
- [ ] Verify contracts on Avalanche explorer
- [ ] Update frontend wallet config (chain ID 43114)
- [ ] Adjust block time assumptions if any

## Get Testnet AVAX

```bash
# Faucet: https://faucet.avax.network
# Or via Core Wallet: claim from the built-in faucet in the wallet

# Or via CLI:
# (Must have AVAX on Fuji first — get from faucet, then import to Platform CLI)
platform keys import --name testkey --private-key $PRIVATE_KEY
platform wallet balance --key-name testkey --network fuji
```

## Core Workflow

1. Audit existing contracts: search for `block.difficulty`, `tx.origin`, Chainlink feed addresses, bridge integrations
2. Update hardhat.config.ts: replace Ethereum networks with Avalanche C-Chain / Fuji
3. Update addresses: Chainlink feeds, WETH → WAVAX, USDC, bridge contracts
4. Update frontend: switch `chainId` checks, update RPC endpoints, update explorer links
5. Test on Fuji: deploy, run test suite, check gas costs (should be lower)
6. Deploy to mainnet: verify on Snowtrace, update docs

## Key concepts

| Concept | Description |
|---|---|
| EVM equivalence | Avalanche C-Chain is EVM-compatible — same Solidity, same tooling |
| `block.difficulty` deprecation | Avalanche does not expose randomness via `block.difficulty` — use Chainlink VRF |
| WAVAX | Wrapped AVAX at `0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7` — equivalent of WETH |
| Chain ID | Mainnet: 43114, Fuji: 43113 — update all `chainId` checks |
| Snowtrace | `https://subnets.avax.network/c-chain` — Avalanche block explorer |
| Gas savings | C-Chain gas is cheaper than Ethereum mainnet |

## Common errors

| Error | Cause | Fix |
|---|---|---|
| Wrong chain ID | Config still points to Ethereum | Update `chainId` in hardhat.config.ts and frontend |
| WETH address wrong | Copy-pasted Ethereum address | Use WAVAX: `0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7` |
| Chainlink feed not found | Ethereum feed address on Avalanche | Look up Avalanche feeds at `data.chain.link` |
| `block.difficulty` reverts | Feature not supported | Replace with Chainlink VRF for randomness |

## Next skills

- `evm-hardhat` — Hardhat config + test patterns on Avalanche
- `contract-verification` — verify contracts on Avalanche explorer
- `avalanche-rpc` — RPC endpoints and provider setup
- `why-avalanche` — understand Avalanche's advantages
