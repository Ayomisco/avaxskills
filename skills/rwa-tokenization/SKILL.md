---
name: "rwa-tokenization"
version: "1.0.0"
spec: "agentskills@1.0"
license: "Apache-2.0"
tier: 3
description: "Tokenize real world assets on Avalanche — compliance-aware token design, KYC hooks, partition models, and Subnet isolation."
trigger: |
  Use when: user wants to tokenize real-world assets (real estate, bonds, invoices, carbon credits), design compliance-aware token contracts, implement KYC/transfer restrictions, or use a Subnet for regulatory isolation.
  Do NOT use for: simple ERC-20 tokens with no compliance requirements, NFT collections without real asset backing.
last_updated: "2026-05-01"
avalanche_networks: [fuji, mainnet]
related_skills:
  - token-standards
  - kyc-aml-integration
  - security
  - subnet-deployment
---

## Overview

Real World Asset (RWA) tokenization represents off-chain assets on-chain. For securities and regulated assets, compliance is not optional — you need transfer restrictions, investor whitelists, reporting, and often regulatory approval. Avalanche's precompile AllowList and dedicated Subnets provide the infrastructure to enforce compliance at the protocol level.

## When to fetch

Fetch when building any token that represents an off-chain asset with regulatory requirements. Also relevant for DeFi protocols using RWA collateral.

## Core Workflow

### Step 1 — Choose Token Standard

| Standard | Best For | Complexity |
|---|---|---|
| ERC-20 + allowlist | Simple utility tokens with KYC | Low |
| ERC-1400 | Traditional securities, partitioned shares | High |
| ERC-3643 (T-REX) | DeFi-compatible securities with on-chain identity | Medium |
| ERC-3525 | Semi-fungible (tranches, coupon bonds) | Medium |

For most RWA projects: **ERC-3643** (most ecosystem adoption) or **ERC-1400** (most standards compliance).

### Step 2 — ERC-20 with Compliance Hooks (Simplest)

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

/**
 * @title ComplianceToken
 * @notice ERC-20 with KYC whitelist and transfer restrictions.
 * Suitable for: simple tokenized assets with small investor sets.
 */
contract ComplianceToken is ERC20, AccessControl {
    bytes32 public constant COMPLIANCE_ROLE = keccak256("COMPLIANCE_ROLE");
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

    // KYC whitelist
    mapping(address => bool) public isVerified;
    // Accredited investor status (for Rule 506(c) US offerings)
    mapping(address => bool) public isAccredited;
    // Transfer lock (lock-up periods)
    mapping(address => uint256) public transferUnlockTime;
    
    // Regulatory metadata
    string public jurisdiction;
    string public assetDescription;
    string public regulatoryBasis;  // e.g., "Reg D 506(c)", "Reg S"

    event InvestorVerified(address indexed investor, bool accredited);
    event InvestorRevoked(address indexed investor);
    event TransferRestricted(address indexed from, address indexed to, string reason);

    constructor(
        string memory name,
        string memory symbol,
        string memory _jurisdiction,
        string memory _assetDescription,
        address complianceOfficer
    ) ERC20(name, symbol) {
        jurisdiction = _jurisdiction;
        assetDescription = _assetDescription;
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(COMPLIANCE_ROLE, complianceOfficer);
        _grantRole(MINTER_ROLE, msg.sender);
    }

    // Compliance officer adds verified investors
    function addVerifiedInvestor(address investor, bool accredited, uint256 lockupDays) 
        external onlyRole(COMPLIANCE_ROLE) 
    {
        isVerified[investor] = true;
        isAccredited[investor] = accredited;
        if (lockupDays > 0) {
            transferUnlockTime[investor] = block.timestamp + lockupDays * 1 days;
        }
        emit InvestorVerified(investor, accredited);
    }

    function revokeInvestor(address investor) external onlyRole(COMPLIANCE_ROLE) {
        isVerified[investor] = false;
        emit InvestorRevoked(investor);
    }

    // Mint to verified investors only
    function mint(address to, uint256 amount) external onlyRole(MINTER_ROLE) {
        require(isVerified[to], "Recipient not verified");
        _mint(to, amount);
    }

    // Transfer restriction hook
    function _update(address from, address to, uint256 value) internal override {
        if (from != address(0) && to != address(0)) {
            // Sender must be verified (or zero address for minting)
            require(isVerified[from], "Sender not verified");
            // Recipient must be verified
            require(isVerified[to], "Recipient not verified");
            // Check lockup period
            require(block.timestamp >= transferUnlockTime[from], "Transfer locked");
        }
        super._update(from, to, value);
    }

    function decimals() public pure override returns (uint8) {
        return 6;  // Like USDC — appropriate for many assets
    }
}
```

### Step 3 — ERC-1400 Partitioned Security Token

```solidity
// Simplified ERC-1400 implementation
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title SecurityToken (ERC-1400 simplified)
 * @notice Partitioned token for securities. Each partition represents 
 * a share class, bond tranche, or other division.
 */
contract SecurityToken {
    // Partitions represent share classes: "A", "B", "preferred", etc.
    bytes32 public constant DEFAULT_PARTITION = keccak256("default");
    bytes32 public constant PREFERRED_PARTITION = keccak256("preferred");
    bytes32 public constant COMMON_PARTITION = keccak256("common");

    mapping(address => mapping(bytes32 => uint256)) private _balanceOfByPartition;
    mapping(bytes32 => uint256) private _totalSupplyByPartition;

    // Controllers can force transfers (required for securities)
    address[] public controllers;
    mapping(address => bool) public isController;

    // Documents (on-chain reference to legal docs)
    struct Document {
        bytes32 docHash;    // Hash of the document
        string uri;         // IPFS URI or URL
        uint256 timestamp;
    }
    mapping(bytes32 => Document) public documents;

    event TransferByPartition(
        bytes32 indexed fromPartition,
        address operator,
        address indexed from,
        address indexed to,
        uint256 value,
        bytes data,
        bytes operatorData
    );

    event DocumentUpdated(bytes32 indexed name, string uri, bytes32 docHash);

    function balanceOfByPartition(bytes32 partition, address account) 
        external view returns (uint256) 
    {
        return _balanceOfByPartition[account][partition];
    }

    function transferByPartition(
        bytes32 partition,
        address to,
        uint256 value,
        bytes calldata data
    ) external returns (bytes32) {
        _transferByPartition(partition, msg.sender, msg.sender, to, value, data, "");
        return partition;
    }

    function _transferByPartition(
        bytes32 partition,
        address operator,
        address from,
        address to,
        uint256 value,
        bytes memory data,
        bytes memory operatorData
    ) internal {
        require(_balanceOfByPartition[from][partition] >= value, "Insufficient balance");
        // Add compliance checks here
        _balanceOfByPartition[from][partition] -= value;
        _balanceOfByPartition[to][partition] += value;
        emit TransferByPartition(partition, operator, from, to, value, data, operatorData);
    }

    // Controller can force transfer (regulatory requirement for securities)
    function controllerTransfer(
        address from, address to, uint256 value,
        bytes calldata data, bytes calldata operatorData
    ) external {
        require(isController[msg.sender], "Not controller");
        _transferByPartition(DEFAULT_PARTITION, msg.sender, from, to, value, data, operatorData);
    }

    // Link legal documents to the token
    function setDocument(bytes32 name, string calldata uri, bytes32 docHash) external {
        documents[name] = Document({ docHash: docHash, uri: uri, timestamp: block.timestamp });
        emit DocumentUpdated(name, uri, docHash);
    }
}
```

### Step 4 — Subnet with AllowList for Compliance Isolation

For maximum regulatory isolation, deploy your RWA token on a dedicated Subnet with the ContractDeployerAllowList and TxAllowList precompiles:

**Genesis with compliance precompiles:**
```json
{
  "config": {
    "chainId": 99001,
    "contractDeployerAllowListConfig": {
      "adminAddresses": ["0xREGULATOR_ADDRESS", "0xISSUER_ADDRESS"],
      "enabledAddresses": [],
      "blockTimestamp": 0
    },
    "transactionAllowListConfig": {
      "adminAddresses": ["0xREGULATOR_ADDRESS"],
      "enabledAddresses": ["0xISSUER_ADDRESS", "0xKYC_SYSTEM_ADDRESS"],
      "blockTimestamp": 0
    },
    "feeConfig": {
      "gasLimit": 8000000,
      "targetBlockRate": 2,
      "minBaseFee": 0
    }
  }
}
```

**KYC system contract that manages the TxAllowList:**
```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface ITxAllowList {
    function setEnabled(address addr) external;
    function setNone(address addr) external;
    function readAllowList(address addr) external view returns (uint256);
}

contract KYCGateway {
    ITxAllowList constant TX_ALLOW_LIST = 
        ITxAllowList(0x0200000000000000000000000000000000000002);

    address public compliance;
    mapping(address => bytes32) public kycDataHash;  // Hash of KYC documents
    mapping(address => uint256) public kycExpiry;
    mapping(address => string) public investorJurisdiction;

    event InvestorOnboarded(address indexed investor, string jurisdiction, uint256 expiry);
    event InvestorOffboarded(address indexed investor, string reason);

    modifier onlyCompliance() {
        require(msg.sender == compliance, "Not compliance");
        _;
    }

    constructor(address _compliance) {
        compliance = _compliance;
    }

    function onboardInvestor(
        address investor,
        bytes32 kycHash,
        string calldata jurisdiction,
        uint256 validityDays
    ) external onlyCompliance {
        kycDataHash[investor] = kycHash;
        kycExpiry[investor] = block.timestamp + validityDays * 1 days;
        investorJurisdiction[investor] = jurisdiction;
        
        // Grant transaction permission on Subnet
        TX_ALLOW_LIST.setEnabled(investor);
        
        emit InvestorOnboarded(investor, jurisdiction, kycExpiry[investor]);
    }

    function offboardInvestor(address investor, string calldata reason) external onlyCompliance {
        kycDataHash[investor] = bytes32(0);
        kycExpiry[investor] = 0;
        
        // Revoke transaction permission
        TX_ALLOW_LIST.setNone(investor);
        
        emit InvestorOffboarded(investor, reason);
    }

    function isVerified(address investor) external view returns (bool) {
        return kycExpiry[investor] > block.timestamp;
    }
}
```

### Step 5 — Transfer Restriction Patterns

```solidity
// Transfer restriction manager
contract TransferRestrictions {
    enum RestrictionType {
        NONE,
        LOCK_UP,           // Time-based lock
        JURISDICTION,      // Geographic restriction
        ACCREDITED_ONLY,   // Must be accredited investor
        MAX_HOLDING        // Maximum position size
    }

    struct Restriction {
        RestrictionType restrictionType;
        uint256 lockupEnd;
        bytes32[] allowedJurisdictions;
        uint256 maxHolding;
    }

    mapping(address => Restriction) public restrictions;
    mapping(address => string) public investorJurisdiction;

    function canTransfer(
        address from,
        address to,
        uint256 amount
    ) external view returns (bool, bytes1, bytes32) {
        Restriction memory r = restrictions[to];

        // Check lockup
        if (r.restrictionType == RestrictionType.LOCK_UP) {
            if (block.timestamp < r.lockupEnd) {
                return (false, 0x55, "LOCK_UP");  // 0x55 = locked
            }
        }

        // Check max holding
        if (r.maxHolding > 0) {
            // Would implementing contract check balance + amount <= maxHolding
            return (true, 0x51, "OK");  // Simplified
        }

        return (true, 0x51, "OK");  // ERC-1400 success code
    }
}
```

### Step 6 — On-Chain Document Registry

```solidity
contract AssetDocumentRegistry {
    struct AssetDocument {
        string name;        // "Prospectus", "Title Deed", "Audit Report"
        string uri;         // IPFS CID or HTTPS URL
        bytes32 hash;       // SHA256 of document
        uint256 uploadedAt;
        address uploadedBy;
        bool current;       // Is this the current version?
    }

    mapping(address => AssetDocument[]) public assetDocuments;
    mapping(address => uint256) public currentDocumentIndex;

    event DocumentAdded(address indexed asset, uint256 indexed index, string name);

    function addDocument(
        address asset,
        string calldata name,
        string calldata uri,
        bytes32 hash
    ) external {
        assetDocuments[asset].push(AssetDocument({
            name: name,
            uri: uri,
            hash: hash,
            uploadedAt: block.timestamp,
            uploadedBy: msg.sender,
            current: true
        }));

        // Mark previous as not current
        uint256 idx = assetDocuments[asset].length - 1;
        if (idx > 0) {
            assetDocuments[asset][idx - 1].current = false;
        }

        emit DocumentAdded(asset, idx, name);
    }
}
```

## Key concepts

**ERC-1400 vs ERC-3643** — ERC-1400 is older, more complex, designed by the securities industry. ERC-3643 (T-REX) is newer, more DeFi-compatible, used by Tokeny and others. For new projects, prefer ERC-3643.

**Partition** — A sub-division of a token (like share classes in a company). In ERC-1400, partitions can have different rights, lock-up periods, or transfer restrictions independently.

**Controller transfer** — Required for securities: a regulator or court order may require forced transfers. Controllers can move tokens without owner's signature.

**Howey Test** — Four-part US test for whether something is a security: (1) investment of money, (2) in a common enterprise, (3) with expectation of profits, (4) from efforts of others. If your token passes all 4, it's likely a security — use ERC-1400 or ERC-3643.

**Jurisdiction isolation** — Using a dedicated Subnet with TxAllowList means non-KYC'd users literally cannot transact on the chain. Stronger than contract-level restrictions.

## Common errors

| Error | Cause | Fix |
|---|---|---|
| Transfer fails for valid investor | KYC expiry check | Ensure kycExpiry is correctly set and not expired |
| Wrong jurisdiction access | Investor not in allowedJurisdictions | Update restrictions mapping for cross-border transfers |
| Controller transfer reverts | Caller not in controllers array | Add controller address before force transfer |
| Document hash mismatch | Document modified after hash | Rehash and update registry |

## Next skills

- `token-standards` — overview of all token standards with guidance
- `security` — security audit patterns for RWA tokens
- `subnet-deployment` — deploy compliance-isolated Subnet
