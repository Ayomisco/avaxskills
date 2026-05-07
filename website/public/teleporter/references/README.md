# Teleporter References

## Official Documentation
- Teleporter Overview: https://docs.avax.network/cross-chain/teleporter/overview
- Teleporter GitHub: https://github.com/ava-labs/teleporter
- ICM Contracts: https://github.com/ava-labs/icm-contracts
- npm: https://www.npmjs.com/package/@avalabs/icm-contracts

## Deployed Addresses
- TeleporterMessenger (universal): `0x253b2784c75e510dD0fF1da844684a1aC0aa5fcf`
- TeleporterRegistry Mainnet C-Chain: `0x7C43605E14F391720e1b37E49C78C4b03A488d98`
- TeleporterRegistry Fuji: `0xF86Cb19Ad8405AEFa7d09C778215D2Cb6eBfB228`

## Install
```bash
npm install @avalabs/icm-contracts
# or
forge install ava-labs/icm-contracts
```

## Quick Contract Template
```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@avalabs/icm-contracts/contracts/teleporter/ITeleporterMessenger.sol";
import "@avalabs/icm-contracts/contracts/teleporter/ITeleporterReceiver.sol";

contract MyApp is ITeleporterReceiver {
    ITeleporterMessenger constant TELEPORTER =
        ITeleporterMessenger(0x253b2784c75e510dD0fF1da844684a1aC0aa5fcf);

    function sendMessage(
        bytes32 destinationChainID,
        address destinationContract,
        bytes memory data
    ) external {
        TELEPORTER.sendCrossChainMessage(
            TeleporterMessageInput({
                destinationBlockchainID: destinationChainID,
                destinationAddress: destinationContract,
                feeInfo: TeleporterFeeInfo({ feeTokenAddress: address(0), amount: 0 }),
                requiredGasLimit: 300_000,
                allowedRelayerAddresses: new address[](0),
                message: data
            })
        );
    }

    function receiveTeleporterMessage(
        bytes32 sourceBlockchainID,
        address originSenderAddress,
        bytes calldata message
    ) external override {
        require(msg.sender == address(TELEPORTER), "only teleporter");
        // handle message
    }
}
```

## GitHub Repos
- Teleporter: https://github.com/ava-labs/teleporter
- ICM Services (Relayer): https://github.com/ava-labs/icm-services
- Teleporter Starter Kit: https://github.com/ava-labs/teleporter-starter-kit
