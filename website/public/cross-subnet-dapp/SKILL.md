---
name: "cross-subnet-dapp"
version: "1.0.0"
spec: "agentskills@1.0"
license: "Apache-2.0"
tier: 6
description: "Build dApps that span multiple Avalanche Subnets — state coordination, Warp messaging patterns, and unified UX."
trigger: |
  Use when: building an application that operates across multiple Avalanche Subnets, implementing cross-Subnet state synchronization, designing multi-chain UX for users bridging between Subnets, or using Teleporter for cross-Subnet function calls.
  Do NOT use for: single-chain dApps, non-Avalanche cross-chain bridges, L1-to-L2 bridges.
last_updated: "2026-05-01"
avalanche_networks: [fuji, mainnet]
related_skills:
  - warp-messaging
  - teleporter
  - subnet-deployment
---

## Overview

Cross-Subnet dApps use Avalanche Warp Messaging (AWM) and the Teleporter protocol to coordinate state across multiple Avalanche L1s. Unlike bridge-based cross-chain apps, Warp messaging is native to Avalanche — signed by the source Subnet's validator set, not a third-party oracle. This skill covers multi-Subnet architecture patterns, Teleporter integration, finality coordination, and unified wallet UX.

## When to fetch

Fetch when designing an application that needs to operate across two or more Avalanche Subnets (e.g., a token on one Subnet, governance on another, execution on a third), or when implementing cross-Subnet token transfers using ICTT.

## Core Workflow

### Architecture Patterns

**Pattern 1: Hub-and-Spoke**
```
C-Chain (Hub)          Subnet A               Subnet B
┌──────────┐          ┌──────────┐           ┌──────────┐
│  Liquidity│ ◄──────► │  Gaming  │ ◄───────► │ Rewards  │
│  Pool    │  Teleporter│  Logic   │ Teleporter│ Tracker  │
└──────────┘          └──────────┘           └──────────┘
```

**Pattern 2: Peer-to-Peer**
```
Subnet A ◄──────────────────────────────► Subnet B
(Source Chain)         Warp/Teleporter    (Destination Chain)
```

**Pattern 3: State Sync**
```
Primary chain (authoritative state)
      │
      ├── Subnet A (read replica + local execution)
      └── Subnet B (read replica + local execution)
```

### Teleporter Setup on Both Chains

1. **Teleporter addresses**

   Teleporter Messenger is deployed at the same address on all Subnet-EVM chains:
   ```
   TeleporterMessenger: 0x253b2784c75e510dD0fF1da844684a1aC0aa5fcf
   ```

   ```bash
   # Verify Teleporter is deployed on your Subnet
   cast code 0x253b2784c75e510dD0fF1da844684a1aC0aa5fcf \
     --rpc-url https://your-subnet-rpc.com/ext/bc/SubnetEVM/rpc
   # Should return bytecode — not "0x"
   ```

2. **Cross-Subnet function call contract**

   ```solidity
   // contracts/CrossSubnetCaller.sol — on Source Subnet
   // SPDX-License-Identifier: Apache-2.0
   pragma solidity ^0.8.24;

   import "@teleporter/ITeleporterMessenger.sol";
   import "@teleporter/ITeleporterReceiver.sol";

   contract CrossSubnetCaller {
       ITeleporterMessenger public immutable teleporter;

       // Destination Subnet's blockchain ID (from P-Chain)
       bytes32 public immutable destinationChainID;
       address public immutable destinationContract;

       event MessageSent(bytes32 indexed messageID, bytes payload);

       constructor(
           address _teleporter,
           bytes32 _destChainID,
           address _destContract
       ) {
           teleporter = ITeleporterMessenger(_teleporter);
           destinationChainID = _destChainID;
           destinationContract = _destContract;
       }

       function callRemote(bytes calldata payload) external payable returns (bytes32 messageID) {
           messageID = teleporter.sendCrossChainMessage{value: msg.value}(
               TeleporterMessageInput({
                   destinationBlockchainID: destinationChainID,
                   destinationAddress: destinationContract,
                   feeInfo: TeleporterFeeInfo({
                       feeTokenAddress: address(0), // Pay in native token
                       amount: msg.value,
                   }),
                   requiredGasLimit: 100_000,
                   allowedRelayerAddresses: new address[](0), // Any relayer
                   message: payload,
               })
           );
           emit MessageSent(messageID, payload);
       }
   }
   ```

   ```solidity
   // contracts/CrossSubnetReceiver.sol — on Destination Subnet
   pragma solidity ^0.8.24;

   import "@teleporter/ITeleporterMessenger.sol";
   import "@teleporter/ITeleporterReceiver.sol";
   import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

   contract CrossSubnetReceiver is ITeleporterReceiver, ReentrancyGuard {
       address public immutable TELEPORTER;
       bytes32 public immutable ALLOWED_SOURCE_CHAIN;
       address public immutable ALLOWED_SENDER;

       mapping(bytes32 => bool) public processedMessages;

       event MessageReceived(bytes32 indexed sourceChain, address indexed sender, bytes payload);

       constructor(address _teleporter, bytes32 _sourceChain, address _sender) {
           TELEPORTER = _teleporter;
           ALLOWED_SOURCE_CHAIN = _sourceChain;
           ALLOWED_SENDER = _sender;
       }

       function receiveTeleporterMessage(
           bytes32 sourceBlockchainID,
           address originSenderAddress,
           bytes calldata message
       ) external override nonReentrant {
           // Trust validation — all three checks required
           require(msg.sender == TELEPORTER, "Not Teleporter");
           require(sourceBlockchainID == ALLOWED_SOURCE_CHAIN, "Wrong source chain");
           require(originSenderAddress == ALLOWED_SENDER, "Wrong sender");

           // Decode and process
           (address user, uint256 amount) = abi.decode(message, (address, uint256));
           _processMessage(user, amount);

           emit MessageReceived(sourceBlockchainID, originSenderAddress, message);
       }

       function _processMessage(address user, uint256 amount) internal {
           // Your cross-chain logic here
       }
   }
   ```

### ICTT (Interchain Token Transfer)

3. **Bridge tokens between Subnets**

   ```bash
   # Install ICTT contracts
   forge install ava-labs/avalanche-interchain-token-transfer

   # Deploy on source chain (C-Chain)
   forge script script/DeployTokenHome.s.sol \
     --rpc-url https://api.avax-test.network/ext/bc/C/rpc \
     --broadcast

   # Deploy on destination chain (your Subnet)
   forge script script/DeployTokenRemote.s.sol \
     --rpc-url https://your-subnet-rpc.com/ext/bc/SubnetEVM/rpc \
     --broadcast
   ```

   ```solidity
   // Interact with ICTT bridge from frontend
   // Source chain: approve + send to TokenHome
   IERC20(tokenAddress).approve(TOKEN_HOME_ADDRESS, amount);
   ITokenHome(TOKEN_HOME_ADDRESS).send(
       SendTokensInput({
           destinationBlockchainID: SUBNET_CHAIN_ID,
           destinationTokenTransferrerAddress: TOKEN_REMOTE_ADDRESS,
           recipient: userAddress,
           primaryFeeTokenAddress: address(0),
           primaryFee: 0,
           secondaryFee: 0,
           requiredGasLimit: 250_000,
           multiHopFallback: address(0),
       }),
       amount
   );
   ```

### Handle Finality Across Subnets

4. **Wait for cross-chain confirmation in TypeScript**

   ```typescript
   // utils/crosschain.ts
   import { createPublicClient, http } from "viem";

   interface CrossChainTxStatus {
     sourceTxHash: string;
     messageID: string;
     destinationTxHash: string | null;
     status: "pending" | "delivered" | "failed";
   }

   async function waitForCrossChainDelivery(
     sourceChainClient: ReturnType<typeof createPublicClient>,
     destChainClient: ReturnType<typeof createPublicClient>,
     sourceTxHash: `0x${string}`,
     receiverAddress: `0x${string}`,
     timeoutMs = 60_000
   ): Promise<CrossChainTxStatus> {
     // 1. Wait for source tx finality (1-2s on Avalanche)
     const sourceReceipt = await sourceChainClient.waitForTransactionReceipt({
       hash: sourceTxHash,
       timeout: 10_000,
     });

     if (sourceReceipt.status !== "success") {
       return { sourceTxHash, messageID: "", destinationTxHash: null, status: "failed" };
     }

     // 2. Extract message ID from logs
     const messageID = extractMessageID(sourceReceipt.logs);

     // 3. Poll destination chain for delivery (relayer delivers within seconds)
     const startTime = Date.now();
     while (Date.now() - startTime < timeoutMs) {
       const logs = await destChainClient.getLogs({
         address: receiverAddress,
         event: {
           type: "event",
           name: "MessageReceived",
           inputs: [
             { name: "sourceChain", type: "bytes32", indexed: true },
             { name: "sender", type: "address", indexed: true },
             { name: "payload", type: "bytes", indexed: false },
           ],
         },
         fromBlock: "latest",
       });

       if (logs.length > 0) {
         return {
           sourceTxHash,
           messageID,
           destinationTxHash: logs[0].transactionHash,
           status: "delivered",
         };
       }

       await new Promise((r) => setTimeout(r, 2000)); // Poll every 2s
     }

     return { sourceTxHash, messageID, destinationTxHash: null, status: "failed" };
   }
   ```

### Wallet UX for Multi-Subnet

5. **Handle Subnet switching in React**

   ```tsx
   // components/SubnetSelector.tsx
   import { useChainId, useSwitchChain } from "wagmi";

   const SUBNETS = [
     { id: 43114, name: "Avalanche C-Chain", rpc: "https://api.avax.network/ext/bc/C/rpc" },
     { id: 12345, name: "My Subnet", rpc: "https://my-subnet.com/rpc" },
   ];

   export function SubnetSelector({ requiredChainId }: { requiredChainId: number }) {
     const chainId = useChainId();
     const { switchChain, isPending } = useSwitchChain();
     const target = SUBNETS.find((s) => s.id === requiredChainId);

     if (chainId === requiredChainId) return null;

     return (
       <div className="alert alert-warning">
         <p>This action requires switching to <strong>{target?.name}</strong></p>
         <button
           onClick={() => switchChain({ chainId: requiredChainId })}
           disabled={isPending}
         >
           {isPending ? "Switching..." : `Switch to ${target?.name}`}
         </button>
       </div>
     );
   }
   ```

## Key concepts

**Blockchain ID vs Chain ID**: Every Avalanche Subnet has two identifiers. The EVM `chainId` (used in MetaMask, transactions) and the `blockchainID` (a `bytes32` on the P-Chain, used in Warp/Teleporter). They are different. Get the blockchainID from the P-Chain.

**Warp vs Teleporter**: Warp is the low-level validator-signed messaging protocol. Teleporter is a higher-level contract protocol built on Warp that handles ordering, fee payment, and relayer coordination. Use Teleporter for almost all use cases.

**Relayer**: An off-chain service that listens for Teleporter messages on the source chain, fetches the Warp signature aggregate, and delivers the message on the destination chain. Avalanche runs a public relayer; production apps should run their own.

**Message Finality**: A cross-chain Teleporter message is final on the destination when the delivery transaction is confirmed. Total latency is typically 3-10 seconds (source finality + relayer + destination finality).

**ICTT**: Interchain Token Transfer — the canonical cross-Subnet token bridge built on Teleporter. Use it instead of building custom bridge logic.

## Common errors

| Error | Cause | Fix |
|---|---|---|
| Message never delivered | Relayer not running or no fee | Check relayer status; add fee to `sendCrossChainMessage` |
| `Not Teleporter` revert | `receiveTeleporterMessage` called by wrong address | Verify `TELEPORTER` constant is correct for target chain |
| Wrong blockchainID | Confused EVM chainId with Avalanche blockchainID | Query P-Chain API for `blockchainID`: `platform.getBlockchainID` |
| Cross-chain message reverts silently | Destination handler reverts, relayer stops retrying | Add error handling in handler; check relayer retry policy |
| User confused by chain switching | No UX prompt for chain switch | Add `SubnetSelector` component before cross-chain actions |

## Next skills

- `warp-messaging` — deep dive into AWM message format and validator signing
- `teleporter` — Teleporter protocol contracts and relayer configuration
- `subnet-deployment` — deploy the Subnets your dApp spans
