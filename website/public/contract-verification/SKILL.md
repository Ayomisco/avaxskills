---
name: "contract-verification"
version: "1.0.0"
spec: "agentskills@1.0"
license: "Apache-2.0"
tier: 1
description: "Verify Solidity contracts on Snowtrace, Routescan, Blockscout, and Sourcify using API and CLI."
trigger: |
  Use when: user needs to verify a contract on Snowtrace, get source code visible on block explorer, configure hardhat-verify for Avalanche, or use forge verify-contract.
  Do NOT use for: contract development, deployment scripts (that's evm-hardhat/evm-foundry).
last_updated: "2026-05-01"
avalanche_networks: [fuji, mainnet]
related_skills:
  - evm-hardhat
  - evm-foundry
  - security
---

## Overview

Contract verification makes your source code readable on Snowtrace, enabling users to read your code, use the interactive ABI, and trust your contract. Verification is done by submitting source + compilation settings to an explorer API that recompiles and compares bytecode. This skill covers all four methods: Hardhat plugin, Foundry CLI, Sourcify, and manual web UI.

## When to fetch

Fetch after any deployment to Fuji or mainnet when the user wants their contract source visible on Snowtrace.

## Core Workflow

### Method 1 — Hardhat Verify Plugin (Most Common)

Install:
```bash
npm install --save-dev @nomicfoundation/hardhat-verify
```

Add to `hardhat.config.ts`:
```typescript
import "@nomicfoundation/hardhat-verify";

const config: HardhatUserConfig = {
  etherscan: {
    apiKey: {
      avalanche: process.env.SNOWTRACE_API_KEY!,
      avalancheFujiTestnet: process.env.SNOWTRACE_API_KEY!,
    },
    customChains: [
      {
        network: "avalanche",
        chainId: 43114,
        urls: {
          apiURL: "https://api.snowtrace.io/api",
          browserURL: "https://subnets.avax.network/c-chain",
        },
      },
      {
        network: "avalancheFujiTestnet",
        chainId: 43113,
        urls: {
          apiURL: "https://api-testnet.snowtrace.io/api",
          browserURL: "https://subnets-test.avax.network/c-chain",
        },
      },
    ],
  },
};
```

Get Snowtrace API key: https://subnets.avax.network/c-chain/myapikey (free, instant)

Verify on Fuji (no constructor args):
```bash
npx hardhat verify --network avalancheFujiTestnet 0xCONTRACT_ADDRESS
```

Verify on Fuji (with constructor args):
```bash
npx hardhat verify --network avalancheFujiTestnet 0xCONTRACT_ADDRESS "arg1" "arg2"
# String args in quotes, numbers without
npx hardhat verify --network avalancheFujiTestnet 0xCONTRACT_ADDRESS "0xOwnerAddress" 1000
```

Verify on mainnet:
```bash
npx hardhat verify --network avalanche 0xCONTRACT_ADDRESS "0xOwnerAddress"
```

For complex constructor args, use a separate args file:

```javascript
// verify-args.js
module.exports = [
  "0xOwnerAddress",
  1000,
  ["0xaddr1", "0xaddr2"],  // arrays work too
];
```

```bash
npx hardhat verify --network avalancheFujiTestnet --constructor-args verify-args.js 0xCONTRACT_ADDRESS
```

For libraries:
```bash
npx hardhat verify --network avalancheFujiTestnet \
  --libraries '{"contracts/MyLibrary.sol:MyLibrary":"0xLIB_ADDRESS"}' \
  0xCONTRACT_ADDRESS
```

### Method 2 — Foundry forge verify-contract

After deployment with `forge script --broadcast`:

```bash
# Fuji testnet
forge verify-contract \
  --chain-id 43113 \
  --rpc-url https://api.avax-test.network/ext/bc/C/rpc \
  --etherscan-api-key $SNOWTRACE_API_KEY \
  --verifier-url https://api-testnet.snowtrace.io/api \
  0xCONTRACT_ADDRESS \
  src/MyToken.sol:MyToken

# With constructor args (ABI-encoded)
forge verify-contract \
  --chain-id 43113 \
  --rpc-url https://api.avax-test.network/ext/bc/C/rpc \
  --etherscan-api-key $SNOWTRACE_API_KEY \
  --verifier-url https://api-testnet.snowtrace.io/api \
  --constructor-args $(cast abi-encode "constructor(address,uint256)" 0xOwner 1000) \
  0xCONTRACT_ADDRESS \
  src/MyToken.sol:MyToken

# Mainnet
forge verify-contract \
  --chain-id 43114 \
  --rpc-url https://api.avax.network/ext/bc/C/rpc \
  --etherscan-api-key $SNOWTRACE_API_KEY \
  --verifier-url https://api.snowtrace.io/api \
  0xCONTRACT_ADDRESS \
  src/MyToken.sol:MyToken
```

Or include in deploy script broadcast:
```bash
forge script script/Deploy.s.sol \
  --rpc-url fuji \
  --broadcast \
  --verify \
  --etherscan-api-key $SNOWTRACE_API_KEY \
  --verifier-url https://api-testnet.snowtrace.io/api \
  --private-key $PRIVATE_KEY
```

### Method 3 — Sourcify (No API Key Needed)

Sourcify is a decentralized verification registry. Snowtrace also shows Sourcify-verified contracts.

**Via Remix IDE (easiest):**
1. Open Remix → Plugins → search "Sourcify" → Activate
2. Compile your contract in Remix
3. Click Sourcify plugin → Connect to MetaMask → Verify

**Via CLI:**
```bash
npx @ethereum-sourcify/contract-verifier \
  --contract 0xCONTRACT_ADDRESS \
  --source src/MyToken.sol \
  --chain 43113
```

**Via Sourcify UI:** https://sourcify.dev → Enter address + upload source files

**Via API:**
```bash
curl -X POST https://sourcify.dev/server/verify \
  -F "address=0xCONTRACT_ADDRESS" \
  -F "chain=43113" \
  -F "files[]=@src/MyToken.sol" \
  -F "files[]=@node_modules/@openzeppelin/contracts/token/ERC20/ERC20.sol"
  # Include all imported files!
```

### Method 4 — Manual Web UI Verification

1. Go to https://subnets-test.avax.network/c-chain/address/0xCONTRACT_ADDRESS#code
2. Click "Verify and Publish"
3. Select:
   - Compiler type: "Solidity (Single file)" or "Solidity (Standard JSON Input)"
   - Compiler version: must match exactly (e.g., v0.8.20+commit.a1b79de6)
   - License: MIT (or your choice)
4. Paste source code
5. Set optimization: yes/no + runs (must match compilation settings)
6. Enter constructor args (ABI-encoded hex)
7. Submit

For projects with imports, use "Standard JSON Input":
```bash
# Generate Standard JSON with hardhat
npx hardhat clean && npx hardhat compile
cat artifacts/build-info/*.json | python3 -c "
import sys, json
data = json.load(sys.stdin)
print(json.dumps(data['input'], indent=2))
" > standard-input.json
```

### Checking Verification Status

```bash
# Check if already verified (returns ABI or error)
curl "https://api-testnet.snowtrace.io/api?module=contract&action=getabi&address=0xCONTRACT_ADDRESS&apikey=$SNOWTRACE_API_KEY"
```

If verified: returns JSON ABI
If not: `{"status":"0","message":"NOTOK","result":"Contract source code not verified"}`

## Key concepts

**Bytecode matching** — Verification recompiles your source and compares the output bytecode to what's on-chain. If they don't match (different compiler version, optimizer settings, etc.) verification fails.

**Standard JSON input** — Full specification of compiler settings including all source files. Most reliable verification method for complex projects.

**Sourcify vs Etherscan-compatible** — Snowtrace uses both. Sourcify is decentralized and doesn't need an API key. Etherscan API needs SNOWTRACE_API_KEY.

**Multi-file contracts** — If your contract imports OpenZeppelin or other libraries, the verifier needs all source files or uses flattening.

**Compiler version** — Must match exactly, including the commit hash. Check `artifacts/build-info/*.json` for the exact compiler version used.

## Common errors

| Error | Cause | Fix |
|---|---|---|
| "Bytecode does not match" | Compiler version or optimizer mismatch | Check compiler version + optimizer runs match exactly |
| "Already verified" | Contract previously verified | Check Snowtrace — it's probably already showing green ✓ |
| "Invalid API key" | Wrong or missing SNOWTRACE_API_KEY | Get free key at snowtrace.io/myapikey |
| Constructor args mismatch | Wrong ABI encoding | Use `cast abi-encode "constructor(...)" args` to get correct encoding |
| Flattened file verification fails | Import collision after flattening | Use Standard JSON Input method instead |
| "Contract not found" | Address is EOA not contract | Double-check contract address vs deployer address |

## Next skills

- `security` — security review before verification and mainnet deployment
- `evm-hardhat` — full Hardhat workflow including deploy+verify in one script
- `evm-foundry` — Foundry verification via forge script --verify
