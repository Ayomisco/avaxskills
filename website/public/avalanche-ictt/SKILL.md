---
name: "avalanche-ictt"
version: "1.0.0"
spec: "agentskills@1.0"
license: "Apache-2.0"
tier: 2
description: "Deploy and use the Interchain Token Transfer (ICTT) protocol to move ERC-20 tokens across Avalanche L1s and C-Chain."
trigger: |
  Use when: deploying cross-chain token bridges on Avalanche, moving ERC-20 tokens between L1s, setting up TokenHome/TokenRemote contracts, using ICTT, interchain token transfers, bridging tokens between subnets or C-Chain
  Do NOT use for: raw Warp message passing, NFT bridging, non-Avalanche bridges, CCIP, LayerZero
last_updated: "2026-05-07"
avalanche_networks: [fuji, mainnet]
related_skills:
  - warp-messaging
  - teleporter
  - subnet-deployment
  - bridging
  - contract-addresses
---

## Overview

Avalanche Interchain Token Transfer (ICTT) is the official ERC-20 cross-L1 bridge protocol from Ava Labs. It sits on top of Warp/Teleporter and provides a safe, audited token bridge abstraction. You deploy a **TokenHome** on the source chain (where the canonical token lives) and a **TokenRemote** on every destination chain. The home tracks total collateral; remotes mint/burn synthetic copies.

GitHub: https://github.com/ava-labs/avalanche-interchain-token-transfer  
Docs: https://build.avax.network/docs/cross-chain/awm/deep-dive

## When to fetch

Fetch this skill when:
- A user wants to bridge an ERC-20 token between Avalanche L1s or between an L1 and C-Chain
- A user asks about TokenHome, TokenRemote, or ICTT contracts
- A user wants to add collateral and send tokens cross-chain via Teleporter
- A user runs `avalanche interchain tokenTransfer deploy`

## Core Workflow

### 1. Prerequisites

```bash
# Install Avalanche CLI (includes ICTT tooling)
curl -sSfL https://raw.githubusercontent.com/ava-labs/avalanche-cli/main/scripts/install.sh | sh

# Clone ICTT repo for contract source
git clone https://github.com/ava-labs/avalanche-interchain-token-transfer
cd avalanche-interchain-token-transfer
npm install
```

### 2. Deploy TokenHome on source chain (C-Chain or custom L1)

TokenHome holds the collateral (real tokens). Deploy it on the chain where your canonical ERC-20 lives.

```solidity
// Constructor params:
// teleporterRegistryAddress — Teleporter Registry on the home chain
// teleporterManager         — address that can pause Teleporter (use your Safe multisig)
// tokenAddress              — your ERC-20 contract address
// tokenDecimals             — token decimals (e.g. 18)

constructor(
    address teleporterRegistryAddress,
    address teleporterManager,
    address tokenAddress,
    uint8 tokenDecimals
)
```

**Teleporter Messenger on C-Chain (Fuji & Mainnet):**  
`0x253b2784c75e510dD0fF1da844684a1aC0aa5fcf`

**Teleporter Registry on C-Chain Fuji:**  
`0xF86Cb19Ad8405AEFa7d09C778215D2Cb6eBfB228`

**Teleporter Registry on C-Chain Mainnet:**  
`0x7C43605E14F391720e1b37E49C78C4b03A488d98`

```bash
# Via CLI (interactive):
avalanche interchain tokenTransfer deploy \
  --home-blockchain c-chain \
  --token-address <YOUR_ERC20_ADDRESS>
```

### 3. Deploy TokenRemote on destination chain

TokenRemote mints synthetic tokens on the destination. It must know the home chain's blockchain ID and TokenHome address.

```solidity
// Constructor params:
// teleporterRegistryAddress — Teleporter Registry on the REMOTE chain
// teleporterManager         — admin address (use multisig)
// homeBlockchainID          — bytes32 blockchain ID of the home chain
// homeTokenTransferrerAddress — address of TokenHome on home chain
// tokenDecimals             — decimals of the home token

constructor(
    address teleporterRegistryAddress,
    address teleporterManager,
    bytes32 homeBlockchainID,
    address homeTokenTransferrerAddress,
    uint8 tokenDecimals
)
```

```bash
# Get blockchain ID (bytes32) for C-Chain Fuji:
# 0x7fc93d85c6d62be589a6dad4f05e6ab9df7e9a0af4a6e05e6c0e3a4e12d7a6b (example — always verify)

# Via CLI:
avalanche interchain tokenTransfer deploy \
  --remote-blockchain <YOUR_L1_NAME> \
  --home-blockchain c-chain \
  --token-address <YOUR_ERC20_ADDRESS>
```

### 4. Register TokenRemote with TokenHome

After deploying TokenRemote, it must send a registration message to TokenHome via Teleporter. This step is mandatory before any token transfers.

```bash
# The CLI handles this automatically if you use the wizard.
# Manual: call registerWithHome() on the TokenRemote contract
# and fund the transaction with enough gas on the remote chain.
```

```solidity
// On TokenRemote — call this once after deployment:
function registerWithHome(TeleporterFeeInfo calldata feeInfo) external;

// feeInfo: { feeTokenAddress: address(0) for native, amount: 0 if Teleporter covers fees }
```

Wait for the Warp message to be relayed to TokenHome (~5–30 seconds on Fuji).

### 5. Add collateral to TokenHome

Before tokens can be bridged, TokenHome needs collateral equal to the amount you want to transfer. Approve then call `addCollateral`.

```solidity
// 1. Approve TokenHome to spend your ERC-20
IERC20(tokenAddress).approve(tokenHomeAddress, amount);

// 2. Add collateral
ITokenHome(tokenHomeAddress).addCollateral(
    remoteBlockchainID,   // bytes32 blockchain ID of the remote chain
    remoteTokenAddress,   // TokenRemote contract address
    amount                // collateral amount in token units
);
```

### 6. Transfer tokens to destination

```solidity
// Approve TokenHome to pull tokens from your wallet
IERC20(tokenAddress).approve(tokenHomeAddress, transferAmount);

// Call transferToDestination
ITokenHome(tokenHomeAddress).transferToDestination(
    remoteBlockchainID,
    remoteTokenAddress,
    recipient,            // address on the destination chain
    transferAmount,
    0,                    // primary fee (0 = no fee)
    0,                    // secondary fee
    ""                    // extra data (empty for standard transfer)
);
```

### 7. Receive on destination

The Teleporter relayer automatically delivers the Warp message to the destination. The TokenRemote contract mints tokens to the recipient address. No additional step is needed — the transfer is atomic from the user perspective once the Warp message is relayed.

## Network config

| Network | Teleporter Messenger | Teleporter Registry |
|---------|---------------------|---------------------|
| C-Chain Fuji | `0x253b2784c75e510dD0fF1da844684a1aC0aa5fcf` | `0xF86Cb19Ad8405AEFa7d09C778215D2Cb6eBfB228` |
| C-Chain Mainnet | `0x253b2784c75e510dD0fF1da844684a1aC0aa5fcf` | `0x7C43605E14F391720e1b37E49C78C4b03A488d98` |
| Custom L1 | Deploy fresh (via `avalanche teleporter deploy`) | Deploy fresh |

## Key concepts

- **TokenHome**: deployed once on the canonical (source) chain. Holds real tokens as collateral. One per token.
- **TokenRemote**: deployed on each destination chain. Mints/burns synthetic representations. Can have multiple remotes per home.
- **Collateral**: real tokens locked in TokenHome backing circulating supply on remotes. Always `collateral >= remote supply`.
- **Registration**: TokenRemote must call `registerWithHome()` before any transfer — this links it in the home's routing table.
- **Warp/Teleporter**: ICTT uses Teleporter (the EVM-level Warp abstraction) for cross-chain messaging. You do not interact with raw Warp messages.

## Common errors

| Error | Cause | Fix |
|-------|-------|-----|
| `TokenRemote not registered` | Skipped `registerWithHome()` step | Call `registerWithHome()` and wait for relay |
| `Insufficient collateral` | TokenHome collateral < transfer amount | Call `addCollateral()` with the required amount |
| `TransferToDestination reverted` | Token not approved to TokenHome | Call `approve(tokenHomeAddress, amount)` first |
| `InvalidTeleporterRegistryAddress` | Wrong registry address for the chain | Verify the registry address for your specific chain/network |
| Tokens not arriving on destination | Relayer not running or Teleporter misconfigured | Check Teleporter relayer status; ensure it watches both chains |

## Next skills

- **warp-messaging** — understand raw Warp if you need custom cross-chain messages beyond token transfers
- **teleporter** — Teleporter protocol details (ICTT uses this under the hood)
- **subnet-deployment** — deploy the L1 that will host your TokenRemote
- **validator-manager-contract** — on-chain validator management for the L1 receiving your bridge
- **safe-multisig** — use a Safe as `teleporterManager` on both TokenHome and TokenRemote
