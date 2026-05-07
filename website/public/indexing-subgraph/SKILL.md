---
name: "indexing-subgraph"
version: "1.0.0"
spec: "agentskills@1.0"
license: "Apache-2.0"
tier: 6
description: "Index Avalanche smart contracts with The Graph — subgraph deployment on Avalanche and custom indexer alternatives."
trigger: |
  Use when: indexing smart contract events on Avalanche, building a subgraph for C-Chain or a Subnet, querying on-chain data via GraphQL, or choosing between The Graph and a custom indexer.
  Do NOT use for: reading live contract state (use RPC calls), off-chain data indexing, non-EVM chains.
last_updated: "2026-05-01"
avalanche_networks: [fuji, mainnet]
related_skills:
  - avacloud-indexing
  - avalanche-rpc
---

## Overview

The Graph supports Avalanche C-Chain for indexing smart contract events into queryable GraphQL APIs. Subgraphs are the standard approach for dApp analytics, leaderboards, and efficient historical queries. For Subnets or high-performance requirements, custom indexers (avacloud-indexing, Subsquid, Envio) are alternatives. This skill covers the full subgraph development cycle from schema to deployment.

## When to fetch

Fetch when you need to query historical on-chain data (past events, aggregated stats, user histories) in your dApp, when building an analytics dashboard, or when `eth_getLogs` queries are too slow or hitting rate limits.

## Core Workflow

1. **Install Graph CLI**

   ```bash
   npm install -g @graphprotocol/graph-cli

   # Verify
   graph --version
   ```

2. **Initialize a subgraph from contract ABI**

   ```bash
   graph init \
     --studio \
     --protocol ethereum \
     --from-contract 0xYourContractAddress \
     --network avalanche \
     --contract-name MyProtocol \
     --index-events \
     my-subgraph

   cd my-subgraph
   ```

   Supported network names for `--network`:
   - `avalanche` (C-Chain Mainnet)
   - `avalanche-fuji` (Fuji Testnet)

3. **subgraph.yaml — the manifest**

   ```yaml
   # subgraph.yaml
   specVersion: 0.0.5
   schema:
     file: ./schema.graphql
   dataSources:
     - kind: ethereum
       name: MyProtocol
       network: avalanche   # Use "avalanche-fuji" for Fuji
       source:
         address: "0xYourContractAddress"
         abi: MyProtocol
         startBlock: 30000000  # Block when contract was deployed — required!
       mapping:
         kind: ethereum/events
         apiVersion: 0.0.7
         language: wasm/assemblyscript
         entities:
           - Deposit
           - Withdrawal
           - User
         abis:
           - name: MyProtocol
             file: ./abis/MyProtocol.json
         eventHandlers:
           - event: Deposit(indexed address,uint256)
             handler: handleDeposit
           - event: Withdrawal(indexed address,uint256)
             handler: handleWithdrawal
           - event: Transfer(indexed address,indexed address,uint256)
             handler: handleTransfer
         file: ./src/my-protocol.ts
   ```

   For multiple contracts:
   ```yaml
   dataSources:
     - kind: ethereum
       name: TokenContract
       network: avalanche
       source:
         address: "0xToken..."
         abi: ERC20
         startBlock: 30000000
       # ...
     - kind: ethereum
       name: VaultContract
       network: avalanche
       source:
         address: "0xVault..."
         abi: Vault
         startBlock: 30000000
       # ...
   ```

4. **schema.graphql**

   ```graphql
   # schema.graphql
   type User @entity {
     id: Bytes!                    # wallet address
     totalDeposited: BigInt!
     totalWithdrawn: BigInt!
     deposits: [Deposit!]! @derivedFrom(field: "user")
     lastActivityBlock: BigInt!
   }

   type Deposit @entity {
     id: Bytes!                    # tx hash + log index
     user: User!
     amount: BigInt!
     blockNumber: BigInt!
     blockTimestamp: BigInt!
     transactionHash: Bytes!
   }

   type Withdrawal @entity {
     id: Bytes!
     user: User!
     amount: BigInt!
     blockNumber: BigInt!
     blockTimestamp: BigInt!
     transactionHash: Bytes!
   }

   type Protocol @entity {
     id: Bytes!                    # Use "protocol" as singleton ID
     totalDeposits: BigInt!
     totalUsers: BigInt!
     totalVolume: BigInt!
   }
   ```

5. **AssemblyScript mappings**

   ```typescript
   // src/my-protocol.ts
   import { BigInt, Bytes } from "@graphprotocol/graph-ts";
   import { Deposit as DepositEvent, Withdrawal as WithdrawalEvent } from "../generated/MyProtocol/MyProtocol";
   import { User, Deposit, Withdrawal, Protocol } from "../generated/schema";

   function getOrCreateUser(address: Bytes): User {
     let user = User.load(address);
     if (!user) {
       user = new User(address);
       user.totalDeposited = BigInt.zero();
       user.totalWithdrawn = BigInt.zero();
       user.lastActivityBlock = BigInt.zero();
       user.save();

       // Update protocol user count
       let protocol = getOrCreateProtocol();
       protocol.totalUsers = protocol.totalUsers.plus(BigInt.fromI32(1));
       protocol.save();
     }
     return user;
   }

   function getOrCreateProtocol(): Protocol {
     let protocol = Protocol.load(Bytes.fromUTF8("protocol"));
     if (!protocol) {
       protocol = new Protocol(Bytes.fromUTF8("protocol"));
       protocol.totalDeposits = BigInt.zero();
       protocol.totalUsers = BigInt.zero();
       protocol.totalVolume = BigInt.zero();
       protocol.save();
     }
     return protocol;
   }

   export function handleDeposit(event: DepositEvent): void {
     let user = getOrCreateUser(event.params.user);
     user.totalDeposited = user.totalDeposited.plus(event.params.amount);
     user.lastActivityBlock = event.block.number;
     user.save();

     // Create deposit entity
     let depositId = event.transaction.hash.concatI32(event.logIndex.toI32());
     let deposit = new Deposit(depositId);
     deposit.user = user.id;
     deposit.amount = event.params.amount;
     deposit.blockNumber = event.block.number;
     deposit.blockTimestamp = event.block.timestamp;
     deposit.transactionHash = event.transaction.hash;
     deposit.save();

     // Update protocol stats
     let protocol = getOrCreateProtocol();
     protocol.totalDeposits = protocol.totalDeposits.plus(event.params.amount);
     protocol.totalVolume = protocol.totalVolume.plus(event.params.amount);
     protocol.save();
   }

   export function handleWithdrawal(event: WithdrawalEvent): void {
     let user = getOrCreateUser(event.params.user);
     user.totalWithdrawn = user.totalWithdrawn.plus(event.params.amount);
     user.lastActivityBlock = event.block.number;
     user.save();

     let withdrawalId = event.transaction.hash.concatI32(event.logIndex.toI32());
     let withdrawal = new Withdrawal(withdrawalId);
     withdrawal.user = user.id;
     withdrawal.amount = event.params.amount;
     withdrawal.blockNumber = event.block.number;
     withdrawal.blockTimestamp = event.block.timestamp;
     withdrawal.transactionHash = event.transaction.hash;
     withdrawal.save();
   }
   ```

6. **Build, authenticate, and deploy**

   ```bash
   # Generate types from ABI and schema
   graph codegen

   # Build (compiles AssemblyScript to WASM)
   graph build

   # Authenticate with The Graph Studio
   graph auth --studio <DEPLOY_KEY>
   # Get deploy key from: https://thegraph.com/studio/

   # Deploy to The Graph Studio (Hosted Service — Avalanche)
   graph deploy --studio my-subgraph-name

   # Deploy to Subgraph Studio (decentralized network — requires curation)
   graph deploy --product subgraph-studio my-subgraph-name
   ```

7. **Query your subgraph**

   ```typescript
   // In your dApp — query via GraphQL
   const SUBGRAPH_URL = "https://api.thegraph.com/subgraphs/name/your-org/my-subgraph";

   const query = `
     query GetUserDeposits($address: Bytes!, $skip: Int!) {
       user(id: $address) {
         totalDeposited
         totalWithdrawn
         deposits(first: 10, skip: $skip, orderBy: blockTimestamp, orderDirection: desc) {
           amount
           blockTimestamp
           transactionHash
         }
       }
       protocol(id: "protocol") {
         totalDeposits
         totalUsers
         totalVolume
       }
     }
   `;

   async function fetchUserData(address: string) {
     const response = await fetch(SUBGRAPH_URL, {
       method: "POST",
       headers: { "Content-Type": "application/json" },
       body: JSON.stringify({
         query,
         variables: { address: address.toLowerCase(), skip: 0 },
       }),
     });
     const { data } = await response.json();
     return data;
   }
   ```

8. **Custom indexer alternative (Envio)**

   For Subnets or high-performance needs where The Graph doesn't support your network:

   ```bash
   # Envio — fast indexer with TypeScript handlers
   npm install -g envio

   envio init
   # Choose: EVM, Avalanche, your Subnet RPC

   # envio.yaml
   # name: my-indexer
   # networks:
   #   - id: 12345
   #     rpc_config:
   #       url: https://my-subnet-rpc.com/ext/bc/SubnetEVM/rpc
   #     contracts:
   #       - name: MyProtocol
   #         abi_file_path: ./abis/MyProtocol.json
   #         address: "0x..."
   #         events:
   #           - event: Deposit(address indexed user, uint256 amount)

   envio dev    # Local development with HyperSync
   envio deploy # Deploy to hosted Envio
   ```

## Network config

| Network | Graph Network Name | Explorer |
|---|---|---|
| C-Chain Mainnet | `avalanche` | https://subnets.avax.network/c-chain |
| Fuji Testnet | `avalanche-fuji` | https://subnets-test.avax.network/c-chain |

## Key concepts

**startBlock**: Always set `startBlock` to the contract's deployment block. Without it, the indexer starts from block 0 and takes days to sync.

**Entity IDs**: Must be unique and deterministic. Use `txHash + logIndex` for event entities, contract address for contract entities, and a fixed string ("protocol") for singleton entities.

**AssemblyScript Limitations**: The mapping language is AssemblyScript (like TypeScript but strict). No `any`, no `null` (use `changetype` for nullable), no closures. Use `BigInt.fromI32()` for integer literals.

**Sync Lag**: Subgraphs are not real-time — they lag behind the chain head by seconds to minutes depending on indexer load. For live data, use RPC; for historical/aggregated data, use subgraph.

**Block Handler**: You can add `blockHandlers` to run code on every block. Use sparingly — it dramatically slows sync time.

## Common errors

| Error | Cause | Fix |
|---|---|---|
| Subgraph stuck at block X | Handler throws exception | Check indexer logs in Graph Studio; add null checks |
| `entity not found` | Loading entity that doesn't exist yet | Use `Entity.load(id)` and check for null before accessing fields |
| Handler skips events | Wrong event signature in yaml | Match exact Solidity signature including indexed keywords |
| Slow sync | No `startBlock` set | Add `startBlock` equal to contract deployment block |
| Types error in mapping | AssemblyScript strict typing | Use explicit conversions: `.toString()`, `.toBigInt()`, `Bytes.fromUTF8()` |

## Next skills

- `avacloud-indexing` — AvaCloud's managed indexer for Subnets
- `avalanche-rpc` — direct RPC queries as alternative to subgraph
