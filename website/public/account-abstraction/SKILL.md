---
name: "account-abstraction"
version: "1.0.0"
spec: "agentskills@1.0"
license: "Apache-2.0"
tier: 5
description: "ERC-4337 account abstraction on Avalanche — bundlers, paymasters, smart accounts, and Avalanche-specific patterns."
trigger: |
  Use when: implementing gasless transactions, building smart accounts, integrating ERC-4337 bundlers on Avalanche, setting up a paymaster, or creating embedded wallets.
  Do NOT use for: standard EOA wallets, non-AA smart contracts, backend key management.
last_updated: "2026-05-01"
avalanche_networks: [fuji, mainnet]
related_skills:
  - evm-wallet-integration
  - security
  - gas
---

## Overview

ERC-4337 account abstraction on Avalanche enables gasless transactions, programmable transaction logic, batch operations, and social recovery without protocol changes. Avalanche's fast finality (1-2s) makes the AA UX significantly better than on Ethereum L1. This skill covers bundlers available on Avalanche, paymaster setup, and sending UserOperations from TypeScript.

## When to fetch

Fetch when building a consumer dApp that needs gasless onboarding, when implementing batch transactions, when adding social recovery to a wallet, or when designing agent wallets with programmable signing policies.

## Core Workflow

### ERC-4337 Flow on Avalanche

```
User signs UserOperation
        ↓
Bundler (Stackup/Pimlico/Biconomy)
        ↓
EntryPoint Contract (0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789)
        ↓
Smart Account Contract (Safe/Kernel/SimpleAccount)
        ↓ (if gasless)
Paymaster Contract
        ↓
Transaction executes on Avalanche C-Chain (~1-2s finality)
```

### Available Bundlers on Avalanche

| Bundler | Avalanche Support | Docs |
|---|---|---|
| Pimlico | C-Chain + Fuji | https://docs.pimlico.io |
| Stackup | C-Chain | https://docs.stackup.sh |
| Biconomy | C-Chain | https://docs.biconomy.io |
| Alchemy AA | C-Chain | https://docs.alchemy.com/reference/aa-sdk-overview |
| ZeroDev | C-Chain (Kernel) | https://docs.zerodev.app |

### EntryPoint Contract

The canonical ERC-4337 EntryPoint is deployed at the same address on all EVM chains including Avalanche:

```
EntryPoint v0.7: 0x0000000071727De22E5E9d8BAf0edAc6f37da032
EntryPoint v0.6: 0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789
```

### TypeScript: Send a UserOperation with Pimlico

1. **Install**

   ```bash
   npm install permissionless viem
   ```

2. **Setup clients**

   ```typescript
   // aa/client.ts
   import { createPublicClient, createWalletClient, http } from "viem";
   import { avalanche, avalancheFuji } from "viem/chains";
   import { createSmartAccountClient } from "permissionless";
   import { createPimlicoClient } from "permissionless/clients/pimlico";
   import { toSimpleSmartAccount } from "permissionless/accounts";
   import { privateKeyToAccount } from "viem/accounts";

   const chain = avalanche; // or avalancheFuji for testnet
   const PIMLICO_API_KEY = process.env.PIMLICO_API_KEY!;

   const pimlicoUrl = `https://api.pimlico.io/v2/${chain.id}/rpc?apikey=${PIMLICO_API_KEY}`;

   const publicClient = createPublicClient({
     chain,
     transport: http("https://api.avax.network/ext/bc/C/rpc"),
   });

   const pimlicoClient = createPimlicoClient({
     chain,
     transport: http(pimlicoUrl),
   });

   // Signer (owner of the smart account)
   const signer = privateKeyToAccount(process.env.PRIVATE_KEY as `0x${string}`);

   // Create a SimpleAccount
   const smartAccount = await toSimpleSmartAccount({
     client: publicClient,
     owner: signer,
     entryPoint: {
       address: "0x0000000071727De22E5E9d8BAf0edAc6f37da032",
       version: "0.7",
     },
   });

   console.log("Smart account address:", smartAccount.address);
   ```

3. **Send a gasless UserOperation (with paymaster)**

   ```typescript
   // aa/gasless-tx.ts
   import { createSmartAccountClient } from "permissionless";

   const smartAccountClient = createSmartAccountClient({
     account: smartAccount,
     chain,
     bundlerTransport: http(pimlicoUrl),
     paymaster: pimlicoClient, // Pimlico sponsors gas
     paymasterContext: {
       sponsorshipPolicyId: process.env.PIMLICO_POLICY_ID, // Your paymaster policy
     },
   });

   // Send a transaction — no AVAX needed in user wallet
   const txHash = await smartAccountClient.sendTransaction({
     to: "0xRecipientAddress",
     value: 0n,
     data: "0x", // Or encoded function call
   });

   console.log("UserOp hash:", txHash);
   // Confirm — Avalanche finalizes in ~1-2s
   const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });
   console.log("Confirmed in block:", receipt.blockNumber);
   ```

4. **Batch multiple transactions in one UserOp**

   ```typescript
   // Execute multiple calls atomically in a single UserOperation
   const batchTxHash = await smartAccountClient.sendTransactions({
     transactions: [
       {
         to: TOKEN_ADDRESS,
         data: encodeFunctionData({
           abi: ERC20_ABI,
           functionName: "approve",
           args: [SPENDER, MAX_UINT256],
         }),
       },
       {
         to: PROTOCOL_ADDRESS,
         data: encodeFunctionData({
           abi: PROTOCOL_ABI,
           functionName: "deposit",
           args: [AMOUNT],
         }),
       },
     ],
   });
   ```

5. **Deploy a paymaster contract (self-hosted)**

   ```solidity
   // contracts/VerifyingPaymaster.sol
   // SPDX-License-Identifier: Apache-2.0
   pragma solidity ^0.8.24;

   import "@account-abstraction/contracts/core/BasePaymaster.sol";
   import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

   contract VerifyingPaymaster is BasePaymaster {
       using ECDSA for bytes32;

       address public immutable verifyingSigner;

       constructor(IEntryPoint _entryPoint, address _signer)
           BasePaymaster(_entryPoint)
       {
           verifyingSigner = _signer;
       }

       function _validatePaymasterUserOp(
           PackedUserOperation calldata userOp,
           bytes32 userOpHash,
           uint256 maxCost
       ) internal view override returns (bytes memory context, uint256 validationData) {
           // Decode paymaster data — expect a signature from verifyingSigner
           (uint48 validUntil, uint48 validAfter, bytes calldata signature) =
               abi.decode(userOp.paymasterAndData[20:], (uint48, uint48, bytes));

           bytes32 hash = keccak256(abi.encode(
               userOp.sender,
               userOp.nonce,
               validUntil,
               validAfter,
               block.chainid
           )).toEthSignedMessageHash();

           require(
               hash.recover(signature) == verifyingSigner,
               "Invalid paymaster signature"
           );

           return ("", _packValidationData(false, validUntil, validAfter));
       }

       function _postOp(PostOpMode mode, bytes calldata context, uint256 actualGasCost, uint256 actualUserOpFeePerGas)
           internal override {}
   }
   ```

   ```bash
   # Deploy paymaster to Fuji
   forge script script/DeployPaymaster.s.sol \
     --rpc-url https://api.avax-test.network/ext/bc/C/rpc \
     --broadcast

   # Fund paymaster
   cast send $PAYMASTER_ADDRESS \
     "deposit()" \
     --value 1ether \
     --rpc-url https://api.avax-test.network/ext/bc/C/rpc
   ```

6. **Safe smart account on Avalanche**

   ```typescript
   // Use Safe as smart account (higher security, multisig support)
   import { toSafeSmartAccount } from "permissionless/accounts";

   const safeAccount = await toSafeSmartAccount({
     client: publicClient,
     owners: [signer],
     threshold: 1n,
     entryPoint: {
       address: "0x0000000071727De22E5E9d8BAf0edAc6f37da032",
       version: "0.7",
     },
     version: "1.4.1",
   });
   ```

## Network config

| Network | Chain ID | EntryPoint v0.7 | Explorer |
|---|---|---|---|
| C-Chain Mainnet | 43114 | 0x0000000071727De22E5E9d8BAf0edAc6f37da032 | https://subnets.avax.network/c-chain |
| Fuji Testnet | 43113 | 0x0000000071727De22E5E9d8BAf0edAc6f37da032 | https://subnets-test.avax.network/c-chain |

## Key concepts

**UserOperation**: An ERC-4337 pseudo-transaction signed by the user. It includes calldata, gas limits, paymaster data, and a signature. The bundler submits it to the EntryPoint.

**Bundler**: An off-chain service that collects UserOperations, simulates them, and submits them on-chain via the EntryPoint. Bundlers earn fees from UserOp gas payments.

**Paymaster**: A contract that pays gas on behalf of users. Can be sponsored (free for user) or use ERC-20 tokens for gas payment.

**Smart Account**: A contract account that executes UserOperations. Has programmable signing rules, batch support, and upgrade paths. Key implementations: SimpleAccount, Safe, Kernel (ZeroDev), Biconomy SmartAccount.

**Avalanche Advantage**: 1-2s finality means the AA round-trip (sign → bundle → confirm) is 3-5 seconds total — comparable to a normal Ethereum L2 without the 7-day finality risk. This makes AA UX practical for consumer apps.

## Common errors

| Error | Cause | Fix |
|---|---|---|
| `AA21 didn't pay prefund` | Smart account has no AVAX and no paymaster | Add paymaster or fund the smart account |
| `AA25 invalid account nonce` | Race condition in parallel UserOps | Use sequential nonces; don't submit parallel UserOps without careful nonce management |
| Bundler returns `execution reverted` | Simulation failed on bundler side | Debug the calldata locally: `eth_call` the same transaction |
| `Paymaster validation failed` | Invalid or expired paymaster signature | Check signature generation, `validUntil` / `validAfter` timestamps |
| Smart account not deployed | First UserOp not including initCode | Include `factory` and `factoryData` in first UserOp or use `sendTransaction` which handles it |

## Next skills

- `evm-wallet-integration` — integrate smart accounts into your dApp UI
- `security` — audit smart account contracts and paymaster logic
- `gas` — optimize gas for UserOperations
