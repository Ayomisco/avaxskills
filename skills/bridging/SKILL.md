---
name: "bridging"
version: "1.0.0"
spec: "agentskills@1.0"
license: "Apache-2.0"
tier: 3
description: "Bridge assets to and from Avalanche — native bridge, Wormhole, LayerZero, and Warp-based bridges."
trigger: |
  Use when: user wants to bridge tokens to/from Avalanche, use cross-chain asset transfers, integrate Wormhole or LayerZero on Avalanche, or build Subnet-to-Subnet token bridges.
  Do NOT use for: cross-chain messaging without token transfer (use warp-messaging), C-Chain DeFi without bridging.
last_updated: "2026-05-01"
avalanche_networks: [fuji, mainnet]
related_skills:
  - warp-messaging
  - contract-addresses
  - defi-primitives
---

## Overview

Bridging on Avalanche spans three tiers: (1) native Avalanche Bridge (Ethereum ↔ C-Chain), (2) third-party bridges (Wormhole, LayerZero, deBridge for multi-chain), and (3) Warp-native bridges for Subnet-to-Subnet transfers without trust assumptions. Each has different trade-offs in speed, cost, and trust.

## When to fetch

Fetch when a user needs to move tokens between Avalanche and another chain, or build cross-chain asset functionality.

## Core Workflow

### Option 1 — Official Avalanche Bridge (ETH ↔ C-Chain)

**URL:** https://bridge.avax.network

Supports: ETH, USDC, WBTC, LINK, DAI, USDT, and more. Uses a multisig federation model.

**Programmatic usage (not recommended for contracts):** The Avalanche Bridge uses off-chain attestation and isn't directly callable from contracts. Use Wormhole or LayerZero for contract-to-contract bridging.

**Bridged assets on Avalanche (`.e` suffix):**
- USDC.e: `0xA7D7079b0FEaD91F3e65f86E8915Cb59c1a4C664`
- USDT.e: `0xc7198437980c041c805A1EDcbA50c1Ce5db95118`
- WETH.e: `0x49D5c2BdFfac6CE2BFdB6640F4F80f226bc10bAB`
- DAI.e: `0xd586E7F844cEa2F87f50152665BCbc2C279D8d70`

**Native Circle USDC** (no .e, better): `0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E`

### Option 2 — Wormhole (Multi-chain)

Wormhole is deployed on Avalanche and supports 20+ chains. Uses a guardian network of 19 validators.

**Token Bridge on Avalanche Mainnet:** `0x0e082F06FF657D94310cB8cE8B0D9a04541d8052`

> Note: The Core Bridge (relayer) and Token Bridge are separate contracts with different addresses.
> Always verify current addresses from the Wormhole SDK before deploying:
> `npm install @wormhole-foundation/sdk` → `wormhole("Avalanche").config.contracts`

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IWormholeTokenBridge {
    function transferTokens(
        address token,
        uint256 amount,
        uint16 recipientChain,
        bytes32 recipient,
        uint256 arbiterFee,
        uint32 nonce
    ) external payable returns (uint64 sequence);

    function redeemTransferWithPayload(bytes memory encodedVm) external returns (bytes memory);

    function parseTransferWithPayload(bytes memory encoded)
        external pure returns (TransferWithPayload memory transfer);
}

struct TransferWithPayload {
    uint8 payloadID;
    uint256 amount;
    bytes32 tokenAddress;
    uint16 tokenChain;
    bytes32 to;
    uint16 toChain;
    bytes32 fromAddress;
    bytes payload;
}

contract WormholeBridgeUser {
    // Token Bridge address — verify against Wormhole SDK before use
    IWormholeTokenBridge constant TOKEN_BRIDGE = IWormholeTokenBridge(0x0e082F06FF657D94310cB8cE8B0D9a04541d8052);

    // Chain IDs (Wormhole's own numbering system)
    uint16 constant WORMHOLE_AVAX = 6;
    uint16 constant WORMHOLE_ETH = 2;
    uint16 constant WORMHOLE_POLYGON = 5;
    uint16 constant WORMHOLE_BNB = 4;

    // Bridge USDC from Avalanche to Ethereum
    function bridgeToEthereum(address token, uint256 amount, address ethRecipient) external payable {
        IERC20(token).transferFrom(msg.sender, address(this), amount);
        IERC20(token).approve(address(TOKEN_BRIDGE), amount);

        // Convert Ethereum address to bytes32
        bytes32 recipient = bytes32(uint256(uint160(ethRecipient)));

        TOKEN_BRIDGE.transferTokens{value: msg.value}(
            token,
            amount,
            WORMHOLE_ETH,      // Destination chain
            recipient,
            0,                  // No arbiter fee
            uint32(block.timestamp)  // Nonce
        );
    }
}

interface IERC20 {
    function transferFrom(address, address, uint256) external returns (bool);
    function approve(address, uint256) external returns (bool);
}
```

**Wormhole Relayer (automatic delivery):**

```typescript
import { ethers } from "ethers";

const WORMHOLE_RELAYER_AVAX = "0xA3cF45939bD6260BCFe3D66bc73d60f19e49a8BB";

const relayerAbi = [
  "function sendPayloadToEvm(uint16 targetChain, address targetAddress, bytes memory payload, uint256 receiverValue, uint256 gasLimit) external payable returns (uint64 sequence)",
  "function quoteEVMDeliveryPrice(uint16 targetChain, uint256 receiverValue, uint256 gasLimit) external view returns (uint256 nativePriceQuote, uint256)",
];

async function sendCrossChainPayload(targetChain: number, targetAddress: string, payload: string) {
  const provider = new ethers.JsonRpcProvider("https://api.avax.network/ext/bc/C/rpc");
  const signer = new ethers.Wallet(process.env.PRIVATE_KEY!, provider);
  const relayer = new ethers.Contract(WORMHOLE_RELAYER_AVAX, relayerAbi, signer);

  // Get delivery cost
  const [cost] = await relayer.quoteEVMDeliveryPrice(targetChain, 0, 200000);

  const tx = await relayer.sendPayloadToEvm(
    targetChain,  // 2=Ethereum, 6=Avalanche, 5=Polygon
    targetAddress,
    ethers.toUtf8Bytes(payload),
    0,
    200000,
    { value: cost }
  );

  const receipt = await tx.wait();
  console.log("Wormhole message sent:", receipt.hash);
}
```

### Option 3 — LayerZero on Avalanche

LayerZero's endpoint on Avalanche: `0x3c2269811836af69497E5F486A85D7316753cf62`

```solidity
interface ILayerZeroEndpoint {
    function send(
        uint16 _dstChainId,
        bytes calldata _destination,
        bytes calldata _payload,
        address payable _refundAddress,
        address _zroPaymentAddress,
        bytes calldata _adapterParams
    ) external payable;

    function estimateFees(
        uint16 _dstChainId,
        address _userApplication,
        bytes calldata _payload,
        bool _payInZRO,
        bytes calldata _adapterParam
    ) external view returns (uint nativeFee, uint zroFee);
}

contract LayerZeroSender {
    ILayerZeroEndpoint constant ENDPOINT = 
        ILayerZeroEndpoint(0x3c2269811836af69497E5F486A85D7316753cf62);

    // LayerZero chain IDs (different from EVM chain IDs)
    uint16 constant LZ_AVAX = 106;
    uint16 constant LZ_ETHEREUM = 101;
    uint16 constant LZ_POLYGON = 109;

    function estimateFee(uint16 dstChain, bytes calldata payload) external view returns (uint256) {
        (uint256 nativeFee, ) = ENDPOINT.estimateFees(dstChain, address(this), payload, false, bytes(""));
        return nativeFee;
    }

    function sendMessage(uint16 dstChain, address dstAddress, bytes calldata payload) external payable {
        bytes memory destination = abi.encodePacked(dstAddress, address(this));
        ENDPOINT.send{value: msg.value}(
            dstChain,
            destination,
            payload,
            payable(msg.sender),
            address(0),
            bytes("")
        );
    }

    // Receive cross-chain message
    function lzReceive(uint16 _srcChainId, bytes calldata _srcAddress, uint64 _nonce, bytes calldata _payload) external {
        require(msg.sender == address(ENDPOINT), "Only endpoint");
        // Process received payload
    }
}
```

### Option 4 — Warp Native Bridge (Subnet-to-Subnet)

For Avalanche Subnet-to-Subnet bridges, use Teleporter for trustless bridging without external validators.

```solidity
// Simplified wrapped token bridge using Teleporter
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./ITeleporterMessenger.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

// On Source Chain: Lock native token, send message
contract SourceBridge {
    ITeleporterMessenger constant TELEPORTER = 
        ITeleporterMessenger(0x253b2784c75e510dD0fF1da844684a1aC0aa5fcf);

    address public immutable sourceToken;
    bytes32 public immutable destinationChainID;
    address public immutable destinationBridge;

    event TokensBridged(address indexed from, address indexed to, uint256 amount, bytes32 messageID);

    constructor(address token, bytes32 dstChain, address dstBridge) {
        sourceToken = token;
        destinationChainID = dstChain;
        destinationBridge = dstBridge;
    }

    function bridge(uint256 amount, address recipient) external returns (bytes32 messageID) {
        // Lock tokens
        IERC20(sourceToken).transferFrom(msg.sender, address(this), amount);

        // Send message to destination
        bytes memory message = abi.encode(recipient, amount);
        messageID = TELEPORTER.sendCrossChainMessage(
            TeleporterMessageInput({
                destinationBlockchainID: destinationChainID,
                destinationAddress: destinationBridge,
                feeInfo: TeleporterFeeInfo({ feeTokenAddress: address(0), amount: 0 }),
                requiredGasLimit: 200000,
                allowedRelayerAddresses: new address[](0),
                message: message
            })
        );

        emit TokensBridged(msg.sender, recipient, amount, messageID);
    }
}

// On Destination Chain: Receive message, mint wrapped token
contract DestinationBridge is ERC20 {
    ITeleporterMessenger constant TELEPORTER = 
        ITeleporterMessenger(0x253b2784c75e510dD0fF1da844684a1aC0aa5fcf);
    bytes32 public immutable sourceChainID;
    address public immutable sourceBridge;

    constructor(bytes32 srcChain, address srcBridge) ERC20("Wrapped Token", "wTKN") {
        sourceChainID = srcChain;
        sourceBridge = srcBridge;
    }

    function receiveTeleporterMessage(
        bytes32 sourceBlockchainID,
        address originSenderAddress,
        bytes calldata message
    ) external {
        require(msg.sender == address(TELEPORTER), "Only Teleporter");
        require(sourceBlockchainID == sourceChainID, "Wrong source chain");
        require(originSenderAddress == sourceBridge, "Wrong source bridge");

        (address recipient, uint256 amount) = abi.decode(message, (address, uint256));
        _mint(recipient, amount);
    }
}
```

### Bridge Risk Considerations

| Bridge | Trust Model | Speed | Cost |
|---|---|---|---|
| Avalanche Bridge | Multisig (trusted) | ~20 min | Low |
| Wormhole | 19 guardians (trusted) | ~2 min | Medium |
| LayerZero | Oracle + relayer (trusted) | ~1-5 min | Medium |
| Warp (Teleporter) | Avalanche validators (trustless) | ~30 sec | Very low |

**Security checklist before using any bridge:**
- [ ] Is the bridge audited? Check their docs.
- [ ] How large is the multisig/guardian set?
- [ ] Is there a withdrawal delay / timelock?
- [ ] What's the maximum bridge TVL and insurance?
- [ ] Are there rate limits on withdrawals?

## Key concepts

**Bridged vs native tokens** — USDC.e is "bridged USDC" from Ethereum via Avalanche Bridge. Native USDC (0xB97EF9...) is issued directly by Circle on Avalanche. Native is preferred.

**Wormhole guardian network** — 19 nodes operated by reputable validators (Certus One, Everstake, etc). A message is valid when 13/19 sign it (quorum threshold).

**LayerZero oracle/relayer** — Oracle delivers block headers, relayer delivers transaction proofs. Can be decentralized with Chainlink as oracle.

**Warp bridges (trustless)** — Messages are signed by the Avalanche validators themselves. No separate multisig needed. Only works between Avalanche chains.

## Common errors

| Error | Cause | Fix |
|---|---|---|
| Bridge tx stuck | Insufficient fee for delivery | Add more AVAX as relayer fee |
| Wormhole VAA not available | Guardian network slow | Wait up to 5 minutes for VAA to be available |
| LayerZero message fails | Gas limit too low | Increase `_gasLimit` in send call |
| Token not recognized on destination | Token not registered on bridge | Use Wormhole token registration first |

## Next skills

- `warp-messaging` — trustless cross-chain messaging (basis for Warp bridges)
- `contract-addresses` — token addresses for bridges
- `defi-primitives` — use bridged tokens in DeFi
