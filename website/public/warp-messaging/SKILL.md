---
name: "warp-messaging"
version: "1.0.0"
spec: "agentskills@1.0"
license: "Apache-2.0"
tier: 2
description: "Send and receive cross-chain messages on Avalanche using Warp Messaging and the Teleporter protocol."
trigger: |
  Use when: user wants to send messages between chains on Avalanche, implement cross-chain functionality, use Teleporter, bridge data between Subnets, or asks about Avalanche Warp Messaging (AWM).
  Do NOT use for: C-Chain to Ethereum bridging (use bridging skill), token transfers without message passing, or single-chain contracts.
last_updated: "2026-05-01"
avalanche_networks: [fuji, mainnet]
related_skills:
  - teleporter
  - bridging
  - cross-subnet-dapp
  - subnet-deployment
  - contract-addresses
---

## Overview

Avalanche Warp Messaging (AWM) is a native cross-chain messaging protocol built into Avalanche consensus. Unlike bridges that rely on multisigs, AWM messages are signed by the destination chain's validators themselves — eliminating bridge trust assumptions. Teleporter is the production-ready smart contract protocol built on top of AWM.

This skill covers the complete cross-chain messaging flow: send a message from Chain A, receive and process it on Chain B. The Teleporter Messenger contract handles message routing, fee payment, and delivery guarantees.

**Teleporter Messenger (same address on all EVM chains):**
`0x253b2784c75e510dD0fF1da844684a1aC0aa5fcf`

## When to fetch

Fetch this skill when implementing any cross-chain functionality between Avalanche chains. Teleporter works between C-Chain and Subnets, and between any two Subnets.

## Core Workflow

### Step 1 — Understanding the Architecture

```
Chain A (Source)                        Chain B (Destination)
┌──────────────────┐                   ┌──────────────────────┐
│  YourSender.sol  │                   │  YourReceiver.sol    │
│  ↓               │                   │  ↑                   │
│  ITeleporter     │ ←──AWM message──→ │  ITeleporter         │
│  Messenger       │                   │  Messenger           │
│  (0x253b...)     │                   │  (0x253b...)         │
│  ↓               │                   │  ↓                   │
│  WarpMessenger   │                   │  WarpMessenger       │
│  Precompile      │                   │  Precompile          │
│  (0x02...0005)   │                   │  (0x02...0005)       │
└──────────────────┘                   └──────────────────────┘
```

**Message flow:**
1. Your contract calls `ITeleporterMessenger.sendCrossChainMessage()`
2. Teleporter emits a Warp message via the WarpMessenger precompile
3. Validators on the destination chain sign the message
4. A relayer submits the signed message to the destination chain's Teleporter
5. Teleporter calls `receiveTeleporterMessage()` on your receiver contract

### Step 2 — Install Teleporter Contracts

```bash
forge install ava-labs/teleporter
# or
npm install @avalabs/teleporter-contracts
```

Or copy the interfaces directly:

```solidity
// ITeleporterMessenger.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

struct TeleporterMessageInput {
    bytes32 destinationBlockchainID;
    address destinationAddress;
    TeleporterFeeInfo feeInfo;
    uint256 requiredGasLimit;
    address[] allowedRelayerAddresses;
    bytes message;
}

struct TeleporterFeeInfo {
    address feeTokenAddress;
    uint256 amount;
}

struct TeleporterMessage {
    uint256 messageNonce;
    address originSenderAddress;
    bytes32 destinationBlockchainID;
    address destinationAddress;
    uint256 requiredGasLimit;
    address[] allowedRelayerAddresses;
    TeleporterMessageReceipt[] receipts;
    bytes message;
}

struct TeleporterMessageReceipt {
    uint256 receivedMessageNonce;
    address relayerRewardAddress;
}

interface ITeleporterMessenger {
    event SendCrossChainMessage(
        bytes32 indexed messageID,
        bytes32 indexed destinationBlockchainID,
        TeleporterMessage message,
        TeleporterFeeInfo feeInfo
    );

    event ReceiveCrossChainMessage(
        bytes32 indexed messageID,
        bytes32 indexed originBlockchainID,
        address indexed deliverer,
        address rewardRedeemer,
        TeleporterMessage message
    );

    function sendCrossChainMessage(
        TeleporterMessageInput calldata messageInput
    ) external returns (bytes32 messageID);

    function receiveCrossChainMessage(
        uint32 messageIndex,
        address relayerRewardAddress
    ) external;

    function getMessageHash(
        bytes32 blockchainID,
        uint256 messageNonce
    ) external view returns (bytes32);

    function messageReceived(bytes32 messageID) external view returns (bool);
}
```

### Step 3 — Sender Contract

Deploy this on Chain A (source):

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./ITeleporterMessenger.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract CrossChainSender {
    ITeleporterMessenger public immutable teleporterMessenger;
    
    // Teleporter Messenger address — same on all EVM chains
    address public constant TELEPORTER_MESSENGER_ADDRESS = 
        0x253b2784c75e510dD0fF1da844684a1aC0aa5fcf;

    event MessageSent(
        bytes32 indexed messageID,
        bytes32 indexed destinationChainID,
        address indexed destinationAddress,
        bytes message
    );

    constructor() {
        teleporterMessenger = ITeleporterMessenger(TELEPORTER_MESSENGER_ADDRESS);
    }

    /**
     * @notice Send a string message to another chain.
     * @param destinationChainID The blockchain ID of the destination chain.
     *        Get this from: avalanche subnet describe mySubnet | grep "Blockchain ID"
     * @param destinationAddress The receiver contract address on the destination chain.
     * @param message The string message to send.
     * @param requiredGasLimit Gas limit for the receive call on destination.
     */
    function sendMessage(
        bytes32 destinationChainID,
        address destinationAddress,
        string calldata message,
        uint256 requiredGasLimit
    ) external returns (bytes32 messageID) {
        // No fee = relayer is altruistic (fine for testnet, use fee for mainnet)
        TeleporterMessageInput memory input = TeleporterMessageInput({
            destinationBlockchainID: destinationChainID,
            destinationAddress: destinationAddress,
            feeInfo: TeleporterFeeInfo({
                feeTokenAddress: address(0),
                amount: 0
            }),
            requiredGasLimit: requiredGasLimit,
            allowedRelayerAddresses: new address[](0), // empty = any relayer
            message: abi.encode(message)
        });

        messageID = teleporterMessenger.sendCrossChainMessage(input);
        emit MessageSent(messageID, destinationChainID, destinationAddress, abi.encode(message));
    }

    /**
     * @notice Send a message with a fee to incentivize relayers.
     * @param feeToken ERC20 token address to pay relayer fee.
     * @param feeAmount Amount of fee tokens to pay.
     */
    function sendMessageWithFee(
        bytes32 destinationChainID,
        address destinationAddress,
        string calldata message,
        uint256 requiredGasLimit,
        address feeToken,
        uint256 feeAmount
    ) external returns (bytes32 messageID) {
        // Approve Teleporter to spend fee tokens
        IERC20(feeToken).transferFrom(msg.sender, address(this), feeAmount);
        IERC20(feeToken).approve(TELEPORTER_MESSENGER_ADDRESS, feeAmount);

        TeleporterMessageInput memory input = TeleporterMessageInput({
            destinationBlockchainID: destinationChainID,
            destinationAddress: destinationAddress,
            feeInfo: TeleporterFeeInfo({
                feeTokenAddress: feeToken,
                amount: feeAmount
            }),
            requiredGasLimit: requiredGasLimit,
            allowedRelayerAddresses: new address[](0),
            message: abi.encode(message)
        });

        messageID = teleporterMessenger.sendCrossChainMessage(input);
    }
}
```

### Step 4 — Receiver Contract

Deploy this on Chain B (destination):

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./ITeleporterMessenger.sol";

contract CrossChainReceiver {
    ITeleporterMessenger public immutable teleporterMessenger;
    
    address public constant TELEPORTER_MESSENGER_ADDRESS = 
        0x253b2784c75e510dD0fF1da844684a1aC0aa5fcf;

    // Store received messages
    struct ReceivedMessage {
        bytes32 sourceChainID;
        address senderAddress;
        string message;
        uint256 timestamp;
    }

    ReceivedMessage[] public messages;
    string public latestMessage;

    event MessageReceived(
        bytes32 indexed sourceChainID,
        address indexed senderAddress,
        string message
    );

    modifier onlyTeleporter() {
        require(
            msg.sender == TELEPORTER_MESSENGER_ADDRESS,
            "Caller is not Teleporter Messenger"
        );
        _;
    }

    constructor() {
        teleporterMessenger = ITeleporterMessenger(TELEPORTER_MESSENGER_ADDRESS);
    }

    /**
     * @notice Called by Teleporter Messenger when a message arrives.
     * This is the entry point — must match this exact signature.
     */
    function receiveTeleporterMessage(
        bytes32 sourceBlockchainID,
        address originSenderAddress,
        bytes calldata message
    ) external onlyTeleporter {
        string memory decodedMessage = abi.decode(message, (string));
        
        messages.push(ReceivedMessage({
            sourceChainID: sourceBlockchainID,
            senderAddress: originSenderAddress,
            message: decodedMessage,
            timestamp: block.timestamp
        }));
        
        latestMessage = decodedMessage;
        
        emit MessageReceived(sourceBlockchainID, originSenderAddress, decodedMessage);
    }

    function getMessageCount() external view returns (uint256) {
        return messages.length;
    }

    function getMessage(uint256 index) external view returns (ReceivedMessage memory) {
        return messages[index];
    }
}
```

### Step 5 — Get the Destination Chain's Blockchain ID

The `destinationBlockchainID` is the **bytes32-encoded** form of the Blockchain ID:

```bash
# Get blockchain ID from Avalanche CLI
avalanche subnet describe mySubnet

# Get C-Chain blockchain ID on Fuji:
curl -X POST https://api.avax-test.network/ext/info \
  -H 'Content-Type: application/json' \
  -d '{"jsonrpc":"2.0","id":1,"method":"info.getBlockchainID","params":{"alias":"C"}}'
# Returns: "blockchainID": "yH8D7ThNJkxmtkuv2jgBa4P1Rn3Qpr4pPr7QYNfcdoS6k6HWp"

# Convert CB58 to bytes32 using cast:
cast --to-bytes32 $(echo -n "yH8D7ThNJkxmtkuv2jgBa4P1Rn3Qpr4pPr7QYNfcdoS6k6HWp" | base64 -d | xxd -p -c 1000)
```

Or use the Teleporter Registry to look up chain IDs:
```solidity
// On-chain: get the blockchain ID of the current chain
bytes32 myChainID = WarpMessenger(0x0200000000000000000000000000000000000005)
    .getBlockchainID();
```

### Step 6 — Deploy and Test on Fuji

```bash
# Deploy sender to C-Chain Fuji
npx hardhat run scripts/deploySender.ts --network fuji

# Deploy receiver to your Subnet on Fuji
npx hardhat run scripts/deployReceiver.ts --network mySubnet

# Send a test message
npx hardhat run scripts/sendMessage.ts --network fuji
```

Send message script (`scripts/sendMessage.ts`):

```typescript
import { ethers } from "hardhat";

async function main() {
    const SENDER_ADDRESS = "0x..."; // deployed sender on C-Chain
    const RECEIVER_ADDRESS = "0x..."; // deployed receiver on Subnet
    // Fuji C-Chain Blockchain ID (bytes32):
    const DESTINATION_CHAIN_ID = "0x31f08b6..."; // your Subnet's blockchain ID as bytes32
    
    const sender = await ethers.getContractAt("CrossChainSender", SENDER_ADDRESS);
    
    const tx = await sender.sendMessage(
        DESTINATION_CHAIN_ID,
        RECEIVER_ADDRESS,
        "Hello from C-Chain!",
        100000 // gas limit for receive call
    );
    
    const receipt = await tx.wait();
    console.log("Message sent! TX:", receipt?.hash);
    console.log("Check destination chain for delivery (30-60 seconds on Fuji)");
}

main();
```

### Step 7 — Setting Up a Local Relayer

For Fuji, Ava Labs runs a public relayer. For mainnet or custom Subnets, you need your own:

```bash
# Install Teleporter relayer
git clone https://github.com/ava-labs/icm-services
cd icm-services
go build ./...

# Configure relayer (config.json)
cat > relayer-config.json << 'EOF'
{
  "log-level": "info",
  "network-id": "fuji",
  "p-chain-api": {
    "base-url": "https://api.avax-test.network",
    "query-parameters": {},
    "http-headers": null
  },
  "sources": [
    {
      "subnet-id": "11111111111111111111111111111111LpoYY",
      "blockchain-id": "yH8D7ThNJkxmtkuv2jgBa4P1Rn3Qpr4pPr7QYNfcdoS6k6HWp",
      "vm": "evm",
      "rpc-endpoint": {
        "base-url": "https://api.avax-test.network/ext/bc/C/rpc"
      }
    }
  ],
  "destinations": [
    {
      "subnet-id": "YOUR_SUBNET_ID",
      "blockchain-id": "YOUR_BLOCKCHAIN_ID",
      "vm": "evm",
      "rpc-endpoint": {
        "base-url": "YOUR_SUBNET_RPC"
      },
      "account-private-key": "YOUR_RELAYER_PRIVATE_KEY"
    }
  ]
}
EOF

./relayer --config relayer-config.json
```

## Network config

| Network | Chain ID | Teleporter Messenger | 
|---|---|---|
| C-Chain Mainnet | 43114 | 0x253b2784c75e510dD0fF1da844684a1aC0aa5fcf |
| Fuji Testnet | 43113 | 0x253b2784c75e510dD0fF1da844684a1aC0aa5fcf |
| Any Subnet | custom | 0x253b2784c75e510dD0fF1da844684a1aC0aa5fcf |

WarpMessenger Precompile (same everywhere): `0x0200000000000000000000000000000000000005`

## Key concepts

**Warp message** — A cryptographically signed message produced by BLS signature aggregation from the source chain's validators. Trustless — no multisig.

**Teleporter** — Smart contract layer on top of Warp. Handles message routing, fee incentives, duplicate prevention, and the `receiveTeleporterMessage` callback pattern.

**Blockchain ID** — CB58-encoded 32-byte identifier for a specific chain. Different from Chain ID (the EVM integer). Used in Warp messages.

**Relayer** — Off-chain process that watches for Warp events and delivers signed messages to the destination chain. Public relayers exist for C-Chain; custom Subnets need their own.

**requiredGasLimit** — Gas the relayer must provide for the receive call. Set too low = delivery fails. Typical: 100,000-500,000 gas.

## Common errors

| Error | Cause | Fix |
|---|---|---|
| `Caller is not Teleporter Messenger` | Direct call to receiveTeleporterMessage | Only Teleporter can call this; test via sending actual message |
| Message not delivered after 5+ minutes | No relayer for your Subnet | Run your own relayer or use Fuji public relayer for C-Chain |
| `insufficient fee` | Fee amount too low for relayer | Use WAVAX as fee token with amount > relayer's minimum |
| `wrong destination chain ID` | Bytes32 chain ID mismatch | Verify using `info.getBlockchainID` API call |
| `message already delivered` | Duplicate delivery attempt | Teleporter prevents duplicates; check `messageReceived()` |
| Transaction reverts in receiver | Logic error in receiveTeleporterMessage | Message is dropped; check event logs on destination |

## Next skills

- `teleporter` — deeper dive into Teleporter message receipts, retry logic, and fee management
- `bridging` — bridging tokens (not just messages) across chains
- `cross-subnet-dapp` — building a full dApp that spans multiple chains
- `warp-messaging` (precompile level) — direct WarpMessenger precompile interaction
