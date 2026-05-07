---
name: "testing"
version: "1.0.0"
spec: "agentskills@1.0"
license: "Apache-2.0"
tier: 4
description: "Unit, fuzz, and fork testing for Avalanche contracts — Hardhat and Foundry patterns with local Subnet test environment."
trigger: |
  Use when: writing tests for Solidity contracts, setting up a test suite, running fork tests against Fuji or Mainnet, testing cross-chain message flows, or debugging failing tests.
  Do NOT use for: frontend testing, backend API testing, performance load testing.
last_updated: "2026-05-01"
avalanche_networks: [fuji, mainnet]
related_skills:
  - audit
  - qa
  - evm-hardhat
  - evm-foundry
---

## Overview

Testing Avalanche contracts requires both standard EVM test tooling and Avalanche-specific patterns: fork testing against live Subnets, mocking Warp/Teleporter messages, and testing precompile interactions. This skill covers Hardhat and Foundry setups, fuzz testing, fork testing, and local Subnet simulation.

## When to fetch

Fetch when setting up a test suite from scratch, adding fuzz or invariant tests, writing fork tests against Fuji/Mainnet, or when a contract touches precompiles, Teleporter, or cross-chain flows that need end-to-end test coverage.

## Core Workflow

### Hardhat Setup

1. **Install and configure**
   ```bash
   npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox
   npx hardhat init

   # Add Avalanche networks to hardhat.config.ts
   ```

   ```typescript
   // hardhat.config.ts
   import { HardhatUserConfig } from "hardhat/config";
   import "@nomicfoundation/hardhat-toolbox";

   const config: HardhatUserConfig = {
     solidity: "0.8.24",
     networks: {
       fuji: {
         url: "https://api.avax-test.network/ext/bc/C/rpc",
         chainId: 43113,
         accounts: [process.env.PRIVATE_KEY!],
       },
       mainnet: {
         url: "https://api.avax.network/ext/bc/C/rpc",
         chainId: 43114,
         accounts: [process.env.PRIVATE_KEY!],
       },
       hardhat: {
         forking: {
           url: "https://api.avax-test.network/ext/bc/C/rpc",
           blockNumber: 35000000, // Pin block for reproducibility
         },
       },
     },
   };
   export default config;
   ```

2. **Basic unit test**
   ```typescript
   // test/MyToken.test.ts
   import { expect } from "chai";
   import { ethers } from "hardhat";
   import { MyToken } from "../typechain-types";

   describe("MyToken", () => {
     let token: MyToken;
     let owner: string;
     let user: string;

     beforeEach(async () => {
       const [ownerSigner, userSigner] = await ethers.getSigners();
       owner = ownerSigner.address;
       user = userSigner.address;

       const Factory = await ethers.getContractFactory("MyToken");
       token = await Factory.deploy(ethers.parseEther("1000000"));
     });

     it("mints initial supply to owner", async () => {
       expect(await token.balanceOf(owner)).to.equal(ethers.parseEther("1000000"));
     });

     it("reverts transfer when balance insufficient", async () => {
       await expect(
         token.transfer(user, ethers.parseEther("999999999"))
       ).to.be.revertedWith("ERC20: transfer amount exceeds balance");
     });

     it("emits Transfer event on success", async () => {
       await expect(token.transfer(user, ethers.parseEther("100")))
         .to.emit(token, "Transfer")
         .withArgs(owner, user, ethers.parseEther("100"));
     });
   });
   ```

3. **Fork test against Fuji**
   ```typescript
   // test/fork/FujiFork.test.ts
   import { ethers, network } from "hardhat";

   describe("Fuji Fork Tests", () => {
     before(async () => {
       await network.provider.request({
         method: "hardhat_reset",
         params: [{
           forking: {
             jsonRpcUrl: "https://api.avax-test.network/ext/bc/C/rpc",
             blockNumber: 35000000, // Always pin
           },
         }],
       });
     });

     it("reads live contract state from Fuji", async () => {
       const WAVAX = "0xd00ae08403B9bbb9124bB305C09058E32C39A48c";
       const wavax = await ethers.getContractAt("IERC20", WAVAX);
       const supply = await wavax.totalSupply();
       expect(supply).to.be.gt(0);
     });
   });
   ```

### Foundry Setup

4. **Install and init**
   ```bash
   curl -L https://foundry.paradigm.xyz | bash
   foundryup
   forge init my-project
   cd my-project

   # Install OpenZeppelin
   forge install OpenZeppelin/openzeppelin-contracts

   # foundry.toml
   ```

   ```toml
   # foundry.toml
   [profile.default]
   src = "src"
   out = "out"
   libs = ["lib"]
   solc = "0.8.24"

   [profile.default.fuzz]
   runs = 10000
   seed = "0x1234"

   [rpc_endpoints]
   fuji = "https://api.avax-test.network/ext/bc/C/rpc"
   mainnet = "https://api.avax.network/ext/bc/C/rpc"
   ```

5. **Foundry unit test**
   ```solidity
   // test/MyToken.t.sol
   pragma solidity ^0.8.24;

   import "forge-std/Test.sol";
   import "../src/MyToken.sol";

   contract MyTokenTest is Test {
       MyToken token;
       address owner = address(this);
       address user = address(0xBEEF);

       function setUp() public {
           token = new MyToken(1_000_000 ether);
       }

       function test_InitialSupply() public {
           assertEq(token.balanceOf(owner), 1_000_000 ether);
       }

       function test_RevertWhen_InsufficientBalance() public {
           vm.expectRevert();
           token.transfer(user, 999_999_999 ether);
       }

       function test_EmitsTransferEvent() public {
           vm.expectEmit(true, true, false, true);
           emit MyToken.Transfer(owner, user, 100 ether);
           token.transfer(user, 100 ether);
       }
   }
   ```

6. **Fuzz testing**
   ```solidity
   // test/Fuzz.t.sol
   pragma solidity ^0.8.24;

   import "forge-std/Test.sol";
   import "../src/MyVault.sol";

   contract VaultFuzzTest is Test {
       MyVault vault;

       function setUp() public {
           vault = new MyVault();
           vm.deal(address(vault), 100 ether);
       }

       // Foundry runs this with random `amount` values
       function testFuzz_WithdrawNeverExceedsBalance(uint256 amount) public {
           amount = bound(amount, 0, address(vault).balance);
           uint256 before = address(vault).balance;
           vault.withdraw(amount);
           assertLe(address(vault).balance, before);
       }

       // Invariant: vault balance always >= sum of user claims
       function invariant_SolvencyMaintained() public {
           assertGe(
               address(vault).balance,
               vault.totalUserClaims()
           );
       }
   }
   ```

7. **Fork test with Foundry**
   ```solidity
   // test/FujiFork.t.sol
   pragma solidity ^0.8.24;

   import "forge-std/Test.sol";

   contract FujiForkTest is Test {
       uint256 fujiFork;

       function setUp() public {
           // Always pin block number — non-deterministic forks are unreliable
           fujiFork = vm.createFork("fuji", 35_000_000);
           vm.selectFork(fujiFork);
       }

       function test_FujiChainId() public {
           assertEq(block.chainid, 43113);
       }

       function test_ReadLiveState() public {
           address WAVAX = 0xd00ae08403B9bbb9124bB305C09058E32C39A48c;
           (bool ok, bytes memory data) = WAVAX.staticcall(
               abi.encodeWithSignature("totalSupply()")
           );
           assertTrue(ok);
           uint256 supply = abi.decode(data, (uint256));
           assertGt(supply, 0);
       }
   }
   ```

8. **Testing Teleporter message receipt (mock)**
   ```solidity
   // test/mocks/MockTeleporter.sol
   pragma solidity ^0.8.24;

   interface ITeleporterReceiver {
       function receiveTeleporterMessage(
           bytes32 sourceBlockchainID,
           address originSenderAddress,
           bytes calldata message
       ) external;
   }

   contract MockTeleporter {
       function deliverMessage(
           address receiver,
           bytes32 sourceChain,
           address sender,
           bytes calldata payload
       ) external {
           ITeleporterReceiver(receiver).receiveTeleporterMessage(
               sourceChain, sender, payload
           );
       }
   }
   ```

   ```solidity
   // test/CrossChain.t.sol
   contract CrossChainTest is Test {
       MockTeleporter teleporter;
       MyCrossChainContract receiver;
       bytes32 constant SOURCE_CHAIN = bytes32(uint256(1));
       address constant TRUSTED = address(0xABC);

       function setUp() public {
           teleporter = new MockTeleporter();
           receiver = new MyCrossChainContract(address(teleporter), SOURCE_CHAIN, TRUSTED);
       }

       function test_AcceptsMessageFromTrustedSender() public {
           bytes memory payload = abi.encode(uint256(42));
           vm.prank(address(teleporter));
           receiver.receiveTeleporterMessage(SOURCE_CHAIN, TRUSTED, payload);
           assertEq(receiver.lastValue(), 42);
       }

       function test_RejectsUntrustedSender() public {
           vm.prank(address(teleporter));
           vm.expectRevert("Untrusted sender");
           receiver.receiveTeleporterMessage(SOURCE_CHAIN, address(0xDEAD), "");
       }
   }
   ```

9. **Run tests**
   ```bash
   # Hardhat
   npx hardhat test
   npx hardhat test --network fuji       # on Fuji
   npx hardhat coverage                  # coverage report

   # Foundry
   forge test -vvv                       # verbose
   forge test --match-test testFuzz -vv  # fuzz only
   forge coverage                        # coverage
   forge test --fork-url fuji            # fork Fuji inline
   ```

## Key concepts

**vm.warp**: Foundry cheatcode to set `block.timestamp`. Never hardcode timestamp values in tests — time-dependent tests become flaky. Use `vm.warp(block.timestamp + 1 days)`.

**Pinned Fork Block**: Fork tests must specify a `blockNumber`. Without pinning, the fork uses the latest block, making tests non-deterministic as chain state changes.

**Fuzz Bounds**: Use `bound(input, min, max)` in fuzz tests to restrict random inputs to valid ranges, preventing vacuous failures from out-of-range values.

**Invariant Testing**: Foundry's invariant tests call a set of functions randomly in sequence and check your invariant after each call. Far more powerful than unit tests for catching subtle state corruption.

**MockTeleporter**: There is no local Teleporter in a test environment. Mock it by deploying a contract that calls `receiveTeleporterMessage` directly, simulating delivery.

## Common errors

| Error | Cause | Fix |
|---|---|---|
| `fork block not found` | RPC doesn't support the block number | Use a more recent pinned block |
| Fuzz test fails on `amount = 0` | Not bounding fuzz inputs | Use `bound(amount, 1, max)` |
| `vm.warp` has no effect | Calling after block-dependent code | Call `vm.warp` in `setUp` before contract deployment |
| `hardhat_reset` breaks other tests | Fork reset affects all tests | Use `beforeEach` reset or `snapshot/revert` |
| `receiveMessage` reverts in test | Not pranking as Teleporter address | Add `vm.prank(teleporterAddress)` before the call |

## Next skills

- `audit` — run structured audit after tests pass
- `qa` — pre-launch quality gates including test coverage thresholds
- `evm-hardhat` — Hardhat project setup and configuration
- `evm-foundry` — Foundry project setup, scripts, and deployment
