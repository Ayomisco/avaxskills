---
name: "teleporter"
version: "1.0.0"
spec: "agentskills@1.0"
license: "Apache-2.0"
tier: 2
description: "Deep dive into the Teleporter Solidity library — message receipts, retry logic, fee handling, and local test setup."
trigger: |
  Use when: user needs deep Teleporter internals, message retry patterns, fee token approval, receipt handling, or setting up local Teleporter tests. For basic send/receive, use warp-messaging instead.
  Do NOT use for: first-time Warp/Teleporter setup (use warp-messaging), X-Chain/P-Chain operations.
last_updated: "2026-05-01"
avalanche_networks: [fuji, mainnet]
related_skills:
  - warp-messaging
  - bridging
  - testing
---

## Overview

Teleporter is the production cross-chain messaging protocol built on Avalanche Warp. The ITeleporterMessenger contract (deployed at `0x253b2784c75e510dD0fF1da844684a1aC0aa5fcf` on all EVM chains) handles routing, fee management, duplicate prevention via message nonces, and delivery receipts. This skill covers the full message lifecycle, retry patterns, fee token flows, and running Teleporter locally.

Teleporter GitHub: https://github.com/ava-labs/teleporter

## When to fetch

Fetch after `warp-messaging` when the user needs production-grade patterns: retrying failed messages, using fee tokens to incentivize relayers, tracking receipt confirmations, or testing locally.

## Core Workflow

### Full ITeleporterMessenger Interface

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// Complete Teleporter message input
struct TeleporterMessageInput {
    bytes32 destinationBlockchainID;   // Target chain's blockchain ID
    address destinationAddress;         // Contract to call on target chain
    TeleporterFeeInfo feeInfo;         // Fee to pay relayer
    uint256 requiredGasLimit;          // Gas for receiveTeleporterMessage call
    address[] allowedRelayerAddresses; // Empty = any relayer; specific = whitelist
    bytes message;                     // ABI-encoded payload
}

struct TeleporterFeeInfo {
    address feeTokenAddress;   // ERC-20 token for fee (address(0) = no fee)
    uint256 amount;            // Fee amount in token units
}

struct TeleporterMessage {
    uint256 messageNonce;              // Unique per source chain
    address originSenderAddress;       // msg.sender of sendCrossChainMessage
    bytes32 destinationBlockchainID;
    address destinationAddress;
    uint256 requiredGasLimit;
    address[] allowedRelayerAddresses;
    TeleporterMessageReceipt[] receipts; // Receipt requests from destination
    bytes message;
}

struct TeleporterMessageReceipt {
    uint256 receivedMessageNonce;  // Nonce of message whose receipt is requested
    address relayerRewardAddress;  // Where to send relayer reward
}

interface ITeleporterMessenger {
    // Events
    event SendCrossChainMessage(
        bytes32 indexed messageID,
        bytes32 indexed destinationBlockchainID,
        TeleporterMessage message,
        TeleporterFeeInfo feeInfo
    );

    event AddFeeAmount(
        bytes32 indexed messageID,
        TeleporterFeeInfo updatedFeeInfo
    );

    event ReceiveCrossChainMessage(
        bytes32 indexed messageID,
        bytes32 indexed originBlockchainID,
        address indexed deliverer,
        address rewardRedeemer,
        TeleporterMessage message
    );

    event MessageExecutionFailed(
        bytes32 indexed messageID,
        bytes32 indexed originBlockchainID,
        TeleporterMessage message
    );

    event MessageExecuted(bytes32 indexed messageID, bytes32 indexed originBlockchainID);

    event RelayerRewardsRedeemed(address indexed redeemer, address indexed asset, uint256 amount);

    // Core functions
    function sendCrossChainMessage(
        TeleporterMessageInput calldata messageInput
    ) external returns (bytes32 messageID);

    function receiveCrossChainMessage(
        uint32 messageIndex,
        address relayerRewardAddress
    ) external;

    // Fee management
    function addFeeAmount(
        bytes32 destinationBlockchainID,
        uint256 messageNonce,
        address feeContractAddress,
        uint256 additionalFeeAmount
    ) external;

    function redeemRelayerRewards(address feeAsset) external;

    // Message retry
    function retryMessageExecution(
        bytes32 originBlockchainID,
        TeleporterMessage calldata message
    ) external;

    // Queries
    function getMessageHash(
        bytes32 blockchainID,
        uint256 messageNonce
    ) external view returns (bytes32);

    function messageReceived(bytes32 messageID) external view returns (bool);

    function getFeeInfo(
        bytes32 blockchainID,
        uint256 messageNonce
    ) external view returns (address feeAsset, uint256 feeAmount);

    function getRelayerRewardAddress(bytes32 messageID) external view returns (address);

    function checkRelayerRewardAmount(
        address relayer,
        address feeAsset
    ) external view returns (uint256);
}
```

### Message ID Construction

```solidity
// Message IDs are deterministic — computed before sending
function computeMessageID(
    bytes32 sourceBlockchainID,
    uint256 messageNonce
) public pure returns (bytes32) {
    return keccak256(abi.encodePacked(sourceBlockchainID, messageNonce));
}
```

### Advanced Sender with Receipt Tracking

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./ITeleporterMessenger.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract AdvancedCrossChainSender is Ownable {
    ITeleporterMessenger public constant TELEPORTER =
        ITeleporterMessenger(0x253b2784c75e510dD0fF1da844684a1aC0aa5fcf);

    // Track sent messages
    mapping(bytes32 => bool) public messageSent;
    mapping(bytes32 => uint256) public messageTimestamp;
    
    event MessageSentWithID(bytes32 indexed messageID, bytes32 destinationChain);

    constructor() Ownable(msg.sender) {}

    function sendWithFee(
        bytes32 destinationChain,
        address destinationAddress,
        bytes calldata payload,
        address feeToken,
        uint256 feeAmount,
        uint256 gasLimit
    ) external returns (bytes32 messageID) {
        // Pull fee tokens from caller
        IERC20(feeToken).transferFrom(msg.sender, address(this), feeAmount);
        IERC20(feeToken).approve(address(TELEPORTER), feeAmount);

        messageID = TELEPORTER.sendCrossChainMessage(
            TeleporterMessageInput({
                destinationBlockchainID: destinationChain,
                destinationAddress: destinationAddress,
                feeInfo: TeleporterFeeInfo({
                    feeTokenAddress: feeToken,
                    amount: feeAmount
                }),
                requiredGasLimit: gasLimit,
                allowedRelayerAddresses: new address[](0),
                message: payload
            })
        );

        messageSent[messageID] = true;
        messageTimestamp[messageID] = block.timestamp;
        emit MessageSentWithID(messageID, destinationChain);
    }

    // Increase fee if message is stuck (relayer needs more incentive)
    function increaseFee(
        bytes32 destinationChain,
        uint256 messageNonce,
        address feeToken,
        uint256 additionalAmount
    ) external onlyOwner {
        IERC20(feeToken).transferFrom(msg.sender, address(this), additionalAmount);
        IERC20(feeToken).approve(address(TELEPORTER), additionalAmount);
        
        TELEPORTER.addFeeAmount(
            destinationChain,
            messageNonce,
            feeToken,
            additionalAmount
        );
    }

    // Check if message was delivered
    function isDelivered(bytes32 messageID) external view returns (bool) {
        return TELEPORTER.messageReceived(messageID);
    }
}
```

### Receiver with Retry Support

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./ITeleporterMessenger.sol";

contract RetryableReceiver {
    ITeleporterMessenger public constant TELEPORTER =
        ITeleporterMessenger(0x253b2784c75e510dD0fF1da844684a1aC0aa5fcf);

    // Failed messages that can be retried
    mapping(bytes32 => bytes) public failedMessages;
    mapping(bytes32 => bool) public processed;
    
    event MessageProcessed(bytes32 indexed messageID, bytes32 indexed sourceChain);
    event MessageFailed(bytes32 indexed messageID, string reason);

    modifier onlyTeleporter() {
        require(msg.sender == address(TELEPORTER), "Only Teleporter");
        _;
    }

    // Main entry point called by Teleporter
    function receiveTeleporterMessage(
        bytes32 sourceBlockchainID,
        address originSenderAddress,
        bytes calldata message
    ) external onlyTeleporter {
        bytes32 messageID = keccak256(abi.encodePacked(sourceBlockchainID, originSenderAddress, message));
        
        // Decode and process
        (bool success, string memory reason) = _processMessage(sourceBlockchainID, originSenderAddress, message);
        
        if (success) {
            processed[messageID] = true;
            emit MessageProcessed(messageID, sourceBlockchainID);
        } else {
            // Store for manual retry
            failedMessages[messageID] = message;
            emit MessageFailed(messageID, reason);
            // DO NOT revert — reverting causes Teleporter to mark as failed
            // Store failure and allow manual retry instead
        }
    }

    function _processMessage(
        bytes32 sourceChain,
        address sender,
        bytes calldata message
    ) internal returns (bool success, string memory reason) {
        try this._executeMessage(sourceChain, sender, message) {
            return (true, "");
        } catch Error(string memory err) {
            return (false, err);
        } catch {
            return (false, "Unknown error");
        }
    }

    function _executeMessage(
        bytes32 sourceChain,
        address sender,
        bytes calldata message
    ) external {
        require(msg.sender == address(this), "Internal only");
        // Actual business logic here
        (uint256 value, address recipient) = abi.decode(message, (uint256, address));
        // ... process
    }

    // Manual retry for failed messages
    function retryFailedMessage(
        bytes32 messageID,
        bytes32 originBlockchainID,
        TeleporterMessage calldata originalMessage
    ) external {
        TELEPORTER.retryMessageExecution(originBlockchainID, originalMessage);
    }
}
```

### Local Test Setup with Teleporter

```bash
# Clone teleporter repo for local testing
git clone https://github.com/ava-labs/teleporter
cd teleporter

# Install foundry dependencies
forge install

# Run local Avalanche network with Teleporter
./scripts/local/run_dual_fuji_subnet.sh
# This starts two Subnets and deploys Teleporter on both

# Or use the Avalanche CLI local network
avalanche network start
# Then deploy Teleporter manually to your Subnets
```

**Testing with Foundry fork:**

```solidity
// test/TeleporterTest.t.sol
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/CrossChainSender.sol";

contract TeleporterForkTest is Test {
    CrossChainSender sender;
    address constant TELEPORTER = 0x253b2784c75e510dD0fF1da844684a1aC0aa5fcf;
    
    // Fork Fuji to test with real Teleporter
    function setUp() public {
        vm.createSelectFork("https://api.avax-test.network/ext/bc/C/rpc");
        sender = new CrossChainSender();
    }
    
    function test_TeleporterExists() public view {
        uint256 codeSize;
        address t = TELEPORTER;
        assembly { codeSize := extcodesize(t) }
        assertGt(codeSize, 0, "Teleporter not deployed on Fuji");
    }
}
```

### Fee Strategy Guide

| Scenario | Fee Config | When to Use |
|---|---|---|
| Testnet / hackathon | `feeToken: address(0), amount: 0` | Ava Labs runs a relayer for free on Fuji |
| Production, infrequent | WAVAX, small amount (0.001 AVAX) | Low-volume cross-chain calls |
| Production, time-sensitive | WAVAX, generous amount (0.01+ AVAX) | Auctions, liquidations, price feeds |
| Private relayer | Whitelist relayer, any token | Enterprise / permissioned setups |

### Get Pending Relayer Rewards

```solidity
// Check how much fee a relayer has earned
uint256 rewards = TELEPORTER.checkRelayerRewardAmount(
    relayerAddress,
    feeTokenAddress  // WAVAX or your fee token
);
// Relayer calls this to collect:
// TELEPORTER.redeemRelayerRewards(feeTokenAddress);
```

## Key concepts

**Message nonce** — Auto-incremented per source chain. Combined with blockchain ID to produce unique message IDs. Guarantees exactly-once delivery.

**retryMessageExecution** — If `receiveTeleporterMessage` reverts, the message is marked failed. Call `retryMessageExecution` with the original message to retry. Useful when receiver had insufficient gas.

**allowedRelayerAddresses** — Empty array = any relayer can deliver. Provide specific addresses to restrict delivery to trusted relayers. Useful for permissioned systems.

**Receipt pattern** — Destination chain can include receipt requests in messages, confirming delivery back to source chain. Used for stateful cross-chain protocols.

**Fee redemption** — Fee is held by Teleporter until the relayer calls `redeemRelayerRewards`. Relayers may batch redemptions.

## Common errors

| Error | Cause | Fix |
|---|---|---|
| `MessageExecutionFailed` event | receiveTeleporterMessage reverted | Check receiver logic; call retryMessageExecution |
| Fee token not approved | Missing `approve()` call | Call `feeToken.approve(TELEPORTER_ADDRESS, amount)` before send |
| Message stuck (not delivered) | Insufficient fee for relayer | Call `addFeeAmount` to increase incentive |
| `message already received` | Duplicate delivery attempt | Check `messageReceived(messageID)` before retry |
| Wrong message nonce in retry | Using different nonce | Track nonce from SendCrossChainMessage event |

## Next skills

- `warp-messaging` — simpler send/receive pattern if you don't need advanced features
- `bridging` — token bridging protocols built on Teleporter
- `testing` — advanced test patterns for cross-chain contracts
