---
name: "contract-addresses"
version: "1.0.0"
spec: "agentskills@1.0"
license: "Apache-2.0"
tier: 2
description: "All Avalanche system contracts — precompiles, WAVAX, Teleporter, DEX routers, and lending protocols on Mainnet and Fuji."
trigger: |
  Use when: user needs a contract address on Avalanche C-Chain (WAVAX, Teleporter, Trader Joe, BENQI, Aave, precompiles), or asks 'what is the address of X on Avalanche'.
  Do NOT use for: custom Subnet addresses (those are set at genesis), Ethereum mainnet addresses.
last_updated: "2026-05-01"
avalanche_networks: [fuji, mainnet]
related_skills:
  - precompiles
  - defi-primitives
  - gas
---

## Overview

A complete address reference for Avalanche C-Chain. Precompile addresses are the same on every Subnet-EVM chain. DeFi protocol addresses are mainnet-specific. Always verify addresses from official sources before using in production.

## When to fetch

Fetch whenever a user needs a specific contract address on Avalanche. This is a reference skill — no workflow, just addresses.

## System Precompiles (Same on ALL Subnet-EVM chains)

| Precompile | Address | Function |
|---|---|---|
| ContractDeployerAllowList | 0x0200000000000000000000000000000000000000 | Restrict contract deployment |
| NativeMinter | 0x0200000000000000000000000000000000000001 | Mint native gas token |
| TxAllowList | 0x0200000000000000000000000000000000000002 | Restrict transaction senders |
| FeeManager | 0x0200000000000000000000000000000000000003 | Dynamic fee adjustment |
| RewardManager | 0x0200000000000000000000000000000000000004 | Validator reward config |
| WarpMessenger | 0x0200000000000000000000000000000000000005 | Cross-chain Warp messaging |

Note: Precompiles only exist if enabled in genesis. Calling a disabled precompile reverts.

## C-Chain Mainnet (Chain ID: 43114)

### Native and Wrapped Tokens

| Token | Address | Notes |
|---|---|---|
| AVAX | native | Pay gas with this |
| WAVAX | 0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7 | Wrapped AVAX (ERC-20) |
| USDC | 0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E | Circle native USDC |
| USDC.e | 0xA7D7079b0FEaD91F3e65f86E8915Cb59c1a4C664 | Bridged USDC (old) |
| USDT.e | 0xc7198437980c041c805A1EDcbA50c1Ce5db95118 | Bridged Tether |
| DAI.e | 0xd586E7F844cEa2F87f50152665BCbc2C279D8d70 | Bridged DAI |
| WETH.e | 0x49D5c2BdFfac6CE2BFdB6640F4F80f226bc10bAB | Bridged WETH |
| BTC.b | 0x152b9d0FdC40C096757F570A51E494bd4b943E50 | Bridged Bitcoin |
| JOE | 0x6e84a6216eA6dACC71eE8E6b0a5B7322EEbC0fDd | Trader Joe token |

### Cross-Chain / Teleporter

| Contract | Address | Notes |
|---|---|---|
| Teleporter Messenger | 0x253b2784c75e510dD0fF1da844684a1aC0aa5fcf | Same on all EVM chains |
| Teleporter Registry | 0x7C43605E14F391720e1b37E49C78C4b03A488d98 | Registry of Teleporter versions |

### DEX — Trader Joe

| Contract | Address |
|---|---|
| Router v2.1 | 0xE3Ffc583dC176575eEA7FD9dF2A7c65F7E23f4C |
| Router v2.2 | 0xb4315e873dBcf96Ffd0acd8EA43f689D8c20fB30 |
| Factory v1 | 0x9Ad6C38BE94206cA50bb0d90783181662f0Cfa10 |
| LBFactory (LB) | 0x8e42f2F4101563bF679975178e880FD87d3eFd4e |
| LBRouter | 0xb4315e873dBcf96Ffd0acd8EA43f689D8c20fB30 |
| JOE/AVAX Pair | 0x454E67025631C065d3cFAD6d71E6892f74487a15 |
| USDC/AVAX Pair | 0xf4003F4efBE8691B60249E6afbD307aBE7758adb |

### Lending — BENQI

| Contract | Address |
|---|---|
| Comptroller | 0x486Af39519B4Dc9a7fCcd318217Be7c18eA05B8c |
| QiAVAX (qiAVAX) | 0x5C0401e81Bc07Ca70fAD469b451682c0d747Ef1c |
| QiUSDC | 0xBEb5d47A3f720Ec0a390d04b4d41ED7d9688bC7F |
| QiUSDT | 0xd8fcDa6ec4Bdc547C0827B8804e89aCd817d56EF |
| QiETH | 0x334AD834Cd4481BB02d09615E7c11a00579A7909 |
| QiBTC | 0xe194c4c5aC32a3C9ffDb358d9Bfd523a0B6d1568 |
| QiLink | 0x4e9f683A27a6BdAD3FC2764003759277e93696e6 |
| BENQI token (QI) | 0x8729438EB15e2C8B576fCc6AeCdA6A148776C0F5 |

### Lending — Aave v3

| Contract | Address |
|---|---|
| Pool (main entry) | 0x794a61358D6845594F94dc1DB02A252b5b4814aD |
| PoolAddressesProvider | 0xa97684ead0e402dC232d5A977953DF7ECBaB3CDb |
| UIPoolDataProvider | 0xDe66F3A09d1B8C50Bf0e489E0F5F36786C14D2d0 |
| WETHGateway | 0x6F143FE2F7B02424ad3CaD1593D6f36c0Aab69d7 |
| IncentivesController | 0x929EC64c34a17401F460460D4B9390518E5B473e |

### Derivatives — GMX

| Contract | Address |
|---|---|
| Router | 0x5F719c2F1095F7B9fc68a68e35B51194f4b6abe8 |
| Vault | 0x9ab2De34A33fB459b538c43f251eB825645e8595 |
| GLP Manager | 0xe1ae4d4b06A5Fe1fc288f6B4CD72f9F8323B107F |
| GLP (token) | 0x01234181085565ed162a948b6a5e88758CD7c7b8 |
| GMX (token) | 0x62edc0692BD897D2295872a9FFCac5425011c661 |

### Oracles — Chainlink

| Feed | Address |
|---|---|
| AVAX/USD | 0x0A77230d17318075983913bC2145DB16C7366156 |
| ETH/USD | 0x976B3D034E162d8bD72D6b9C989d545b839003b0 |
| BTC/USD | 0x2779D32d5166BAaa2B2b658333bA7e6Ec0C65743 |
| USDC/USD | 0xF096872672F44d6EBA71527d2277D2022E8d9E41 |
| LINK/USD | 0x49ccd9ca821EfEab2b98c60d60F7A63b0C9e3Ac6 |

## Fuji Testnet (Chain ID: 43113)

| Contract | Address | Notes |
|---|---|---|
| Teleporter Messenger | 0x253b2784c75e510dD0fF1da844684a1aC0aa5fcf | Same as mainnet |
| WAVAX (Fuji) | 0xd00ae08403B9bbb9124bB305C09058E32C39A48c | Test WAVAX |

Most mainnet DeFi protocols don't have Fuji deployments. For testing, deploy your own mock contracts.

## Useful ABI Fragments

**WAVAX (deposit/withdraw):**
```solidity
interface IWAVAX {
    function deposit() external payable;
    function withdraw(uint256 amount) external;
    function balanceOf(address) external view returns (uint256);
    function approve(address spender, uint256 amount) external returns (bool);
    function transfer(address to, uint256 amount) external returns (bool);
}
```

**Trader Joe Router v2.1:**
```solidity
interface IJoeRouter {
    function swapExactTokensForTokens(
        uint amountIn, uint amountOutMin,
        address[] calldata path, address to, uint deadline
    ) external returns (uint[] memory amounts);
    
    function swapExactAVAXForTokens(
        uint amountOutMin, address[] calldata path,
        address to, uint deadline
    ) external payable returns (uint[] memory amounts);
}
```

**Aave Pool:**
```solidity
interface IAavePool {
    function supply(address asset, uint256 amount, address onBehalfOf, uint16 referralCode) external;
    function withdraw(address asset, uint256 amount, address to) external returns (uint256);
    function borrow(address asset, uint256 amount, uint256 interestRateMode, uint16 referralCode, address onBehalfOf) external;
    function repay(address asset, uint256 amount, uint256 interestRateMode, address onBehalfOf) external returns (uint256);
}
```

## Key concepts

**Precompile addresses** — Fixed at 0x0200... — these are the same on every Subnet-EVM chain regardless of network. Only active if enabled in genesis.

**USDC vs USDC.e** — `0xB97EF9...` is native USDC (Circle's official cross-chain transfer protocol). `0xA7D707...` is bridged USDC from the old Avalanche Bridge. For new projects, use native USDC.

**Address checksum** — Ethereum addresses are checksummed (mixed case). `0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7` (checksummed) = `0xb31f66aa3c1e785363f0875a1b74e27b85fd66c7` (lowercase). Both work.

## Common errors

| Error | Cause | Fix |
|---|---|---|
| Precompile call reverts | Precompile not enabled in genesis | Enable in genesis or call admin to enable |
| "Contract not found" | Using mainnet address on Fuji | Fuji has different addresses for most DeFi |
| USDC.e vs USDC confusion | Using wrong USDC address | Use 0xB97EF9... for modern USDC, check bridge docs |

## Core Workflow

1. Identify the network (C-Chain mainnet 43114 / Fuji 43113 / custom Subnet)
2. Look up the address in this skill or the official Avalanche docs
3. Confirm address on the block explorer before hardcoding
4. For precompiles: address is deterministic — same on every Subnet-EVM chain
5. For DeFi contracts: mainnet and Fuji addresses differ — never copy-paste across networks

## Next skills

- `precompiles` — how to use each precompile in Solidity
- `defi-primitives` — patterns for using Trader Joe, BENQI, Aave
- `gas` — fee mechanics on C-Chain
