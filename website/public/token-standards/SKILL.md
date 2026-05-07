---
name: "token-standards"
version: "1.0.0"
spec: "agentskills@1.0"
license: "Apache-2.0"
tier: 3
description: "Choose the right token standard on Avalanche — ERC-20, ERC-1400, ERC-3643, and ERC-3525 with Howey Test guidance."
trigger: |
  Use when: user needs to choose a token standard, asks about ERC-1400 vs ERC-3643, needs Howey Test guidance for their token, or wants to understand semi-fungible tokens (ERC-3525).
  Do NOT use for: NFT-only questions (use ERC-721), simple fungible tokens with no compliance requirements (use ERC-20).
last_updated: "2026-05-01"
avalanche_networks: [fuji, mainnet]
related_skills:
  - rwa-tokenization
  - revenue-sharing-tokens
  - security
---

## Overview

Token standard selection has legal and technical implications. Choose wrong and you either over-engineer (unnecessary compliance cost) or under-engineer (regulatory exposure). This skill provides a decision framework and implementation guide for each major standard relevant to Avalanche projects.

## When to fetch

Fetch at project design stage when the user is deciding what kind of token to build, especially for RWA or securities-adjacent projects.

## Core Workflow

### Decision Tree

```
Is your token backed by a real-world asset or promises profit?
│
├── NO → Simple utility/governance
│         Use ERC-20 with optional ERC-20Votes (governance)
│
└── YES → Run Howey Test:
           1. Investment of money?              YES/NO
           2. In a common enterprise?           YES/NO
           3. Expectation of profits?           YES/NO
           4. From efforts of others?           YES/NO
           │
           └── ALL 4 YES → Likely a SECURITY
               │
               ├── Traditional security (shares, bonds)
               │   → Use ERC-1400
               │
               ├── DeFi-compatible security (tokenized fund)
               │   → Use ERC-3643 (T-REX)
               │
               └── Tranched/semi-fungible (bond coupons, real estate shares)
                   → Use ERC-3525
```

### Howey Test Checklist

The SEC uses this 4-part test to determine if something is a security:

| Element | YES = likely security | NO = probably not |
|---|---|---|
| Investment of money | Users pay to acquire tokens | Free distribution only |
| Common enterprise | Token value tied to issuer's pooled funds | Standalone utility |
| Expectation of profits | Token marketed as investment, revenue share, staking yield | Purely consumptive |
| Efforts of others | Value depends on issuer's ongoing work | Fully decentralized protocol |

**Danger zone examples:**
- "Token holders receive 30% of protocol revenue" → Revenue share = profit expectation ✓
- "Our team will develop the platform which increases token value" → Efforts of others ✓
- "Buy tokens now at presale price before listing" → Investment of money ✓

**If 3 or 4 are YES:** consult a securities lawyer and use ERC-1400 or ERC-3643.

### ERC-20 — Utility / Governance Tokens

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Votes.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";

// Governance token with voting (ERC-20 + ERC-20Votes)
contract GovernanceToken is ERC20, ERC20Permit, ERC20Votes {
    constructor() ERC20("Governance Token", "GOV") ERC20Permit("Governance Token") {
        _mint(msg.sender, 100_000_000 * 10**18);
    }

    // Required overrides for ERC20Votes
    function _update(address from, address to, uint256 value)
        internal override(ERC20, ERC20Votes)
    { super._update(from, to, value); }

    function nonces(address owner)
        public view override(ERC20Permit, Nonces)
        returns (uint256)
    { return super.nonces(owner); }
}
```

**When to use ERC-20:** Access tokens, in-game currency, protocol governance, wrapped assets, stablecoins.

### ERC-1400 — Traditional Securities

Full ERC-1400 is complex. Key interface elements:

```solidity
// Minimal ERC-1400 interface
interface IERC1400 {
    // Partitioned balances (like share classes)
    function balanceOfByPartition(bytes32 partition, address tokenHolder) external view returns (uint256);
    function partitionsOf(address tokenHolder) external view returns (bytes32[] memory);
    function totalSupplyByPartition(bytes32 partition) external view returns (uint256);

    // Partitioned transfers
    function transferByPartition(bytes32 partition, address to, uint256 value, bytes calldata data) external returns (bytes32);
    function operatorTransferByPartition(bytes32 partition, address from, address to, uint256 value, bytes calldata data, bytes calldata operatorData) external returns (bytes32);

    // Controllers (force transfer)
    function controllerTransfer(address from, address to, uint256 value, bytes calldata data, bytes calldata operatorData) external;
    function isControllable() external view returns (bool);
    function isIssuable() external view returns (bool);

    // ERC-1066 transfer validity check
    function canTransferByPartition(address from, address to, bytes32 partition, uint256 value, bytes calldata data) external view returns (bytes1, bytes32, bytes32);

    // Documents
    function getDocument(bytes32 name) external view returns (string memory, bytes32);
    function setDocument(bytes32 name, string calldata uri, bytes32 documentHash) external;
}
```

**When to use ERC-1400:** Traditional securities (tokenized equity, debt), regulated offerings under Reg D/Reg S, when you need formal partition semantics, jurisdictions requiring specific token standards.

### ERC-3643 (T-REX) — DeFi-Compatible Securities

T-REX is ERC-1400 compatible but adds a modular compliance framework:

```solidity
// T-REX identity registry interface
interface IIdentityRegistry {
    function registerIdentity(address userAddress, IIdentity identity, uint16 country) external;
    function deleteIdentity(address userAddress) external;
    function isVerified(address userAddress) external view returns (bool);
    function identity(address userAddress) external view returns (IIdentity);
    function investorCountry(address userAddress) external view returns (uint16);
}

interface ICompliance {
    function canTransfer(address from, address to, uint256 amount) external view returns (bool);
    function transferred(address from, address to, uint256 amount) external;
    function created(address to, uint256 amount) external;
    function destroyed(address from, uint256 amount) external;
}

// T-REX Token interface
interface IERC3643 is IERC20 {
    function setCompliance(address _compliance) external;
    function setIdentityRegistry(address _identityRegistry) external;
    function forcedTransfer(address from, address to, uint256 amount) external returns (bool);
    function freeze(address addr) external;
    function unfreeze(address addr) external;
    function batchMint(address[] calldata toList, uint256[] calldata amounts) external;
}
```

**T-REX modules** (pluggable compliance):
- CountryRestrictModule — block transfers to/from specific jurisdictions
- MaxBalanceModule — limit position sizes
- TimeTransferLimitsModule — rate-limit transfers
- SupplyLimitModule — hard cap on supply

Reference implementation: https://github.com/TokenySolutions/T-REX

**When to use ERC-3643:** Security tokens that need DeFi composability, modular compliance that can be upgraded, large investor sets (thousands of addresses).

### ERC-3525 — Semi-Fungible Tokens

Semi-fungible: tokens in the same "slot" are fungible with each other but not with tokens in different slots.

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IERC3525 is IERC721 {
    function valueDecimals() external view returns (uint8);
    function valueOf(uint256 tokenId) external view returns (uint256);
    function slotOf(uint256 tokenId) external view returns (uint256);
    function approve(address to, uint256 tokenId, uint256 value) external;
    function allowance(uint256 tokenId, address operator) external view returns (uint256);
    function transferValue(uint256 fromTokenId, uint256 toTokenId, uint256 value) external;
    function transferValue(uint256 fromTokenId, address to, uint256 value) external returns (uint256 newTokenId);
}

// Example: Bond token where each slot = maturity date
// Token 1: slot=2025, value=1000 (1000 USDC worth of bonds maturing in 2025)
// Token 2: slot=2025, value=500  (can be merged with Token 1, same maturity)
// Token 3: slot=2026, value=1000 (different slot = different maturity, not fungible with 1/2)
```

**When to use ERC-3525:** Bond tranches with different maturities, real estate fractional ownership with different properties, carbon credits with different vintages.

### Token Standard Comparison

| | ERC-20 | ERC-1400 | ERC-3643 | ERC-3525 |
|---|---|---|---|---|
| DeFi compatible | Full | Limited | Good | Limited |
| Compliance | Optional | Built-in | Modular | Optional |
| Partitions | No | Yes | Partial | Slots |
| Force transfer | No | Yes | Yes | No |
| Complexity | Low | High | Medium | Medium |
| Audited libs | OpenZeppelin | polymath-core | T-REX | solv-protocol |
| Best for | Utility | Securities | DeFi securities | Tranched assets |

### Avalanche-Specific Notes

**Gas costs per standard on C-Chain:**
- ERC-20 transfer: ~65,000 gas (~$0.003 at current prices)
- ERC-1400 transfer (with compliance): ~120,000-200,000 gas
- ERC-3643 transfer (with checks): ~150,000-250,000 gas
- ERC-3525 transfer: ~80,000-150,000 gas

**Subnet recommendation for securities:** Use a private Subnet with TxAllowList to enforce KYC at the protocol level. Securities on public C-Chain require pure contract-level enforcement.

## Key concepts

**Partitions** — Sub-divisions within a token where tokens in different partitions have different rights. Like A vs B shares in corporate finance.

**Forced transfer** — The ability of a controller (regulator, court order) to move tokens without the holder's consent. Required for securities regulation compliance.

**Howey Test** — SEC's framework for determining if something is a security. Named after SEC v. W.J. Howey Co. (1946). All four elements must be present.

**DeFi composability trade-off** — ERC-1400 and ERC-3643 add transfer restrictions that may break standard DEX integrations. Test carefully with AMM protocols.

## Common errors

| Error | Cause | Fix |
|---|---|---|
| AMM rejects token | Transfer restriction in _update hook | Add DEX contract to whitelist, or use operator override |
| Partition transfer fails | Wrong partition specified | Check `partitionsOf(address)` to see available partitions |
| Compliance module reverts | Country restriction | Check `isVerified()` and investor jurisdiction |
| Force transfer unauthorized | Not in controllers list | Add controller address before attempting force transfer |

## Next skills

- `rwa-tokenization` — full RWA design patterns including Subnet isolation
- `revenue-sharing-tokens` — distribute profits to token holders
- `security` — audit checklist for token contracts
