# Warp Messaging References

## Official Documentation
- Teleporter (ICM) Docs: https://docs.avax.network/cross-chain/teleporter/overview
- Teleporter GitHub: https://github.com/ava-labs/teleporter
- Warp Messaging Docs: https://docs.avax.network/cross-chain/avalanche-warp-messaging/overview
- ICM Contracts npm: https://www.npmjs.com/package/@avalabs/icm-contracts

## Key Contract Addresses
- TeleporterMessenger (all chains): `0x253b2784c75e510dD0fF1da844684a1aC0aa5fcf`
- TeleporterRegistry Mainnet: `0x7C43605E14F391720e1b37E49C78C4b03A488d98`
- TeleporterRegistry Fuji: `0xF86Cb19Ad8405AEFa7d09C778215D2Cb6eBfB228`
- Warp Precompile: `0x0200000000000000000000000000000000000005`

## Interface Reference
```solidity
// ITeleporterReceiver — implement on destination contracts
interface ITeleporterReceiver {
    function receiveTeleporterMessage(
        bytes32 sourceBlockchainID,
        address originSenderAddress,
        bytes calldata message
    ) external;
}

// ITeleporterMessenger — call to send messages
interface ITeleporterMessenger {
    function sendCrossChainMessage(
        TeleporterMessageInput calldata messageInput
    ) external returns (bytes32 messageID);
}

struct TeleporterMessageInput {
    bytes32 destinationBlockchainID;
    address destinationAddress;
    TeleporterFeeInfo feeInfo;
    uint256 requiredGasLimit;
    address[] allowedRelayerAddresses;
    bytes message;
}
```

## GitHub Repos
- Teleporter: https://github.com/ava-labs/teleporter
- ICM Services (Relayer): https://github.com/ava-labs/icm-services
- Teleporter Starter Kit: https://github.com/ava-labs/teleporter-starter-kit
