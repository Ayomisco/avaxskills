# Testing Rules — Avalanche Contracts

These rules must be followed in all test suites for Avalanche smart contracts.

## Rule 1: Always test on Fuji before mainnet

Every contract function must be exercised on Fuji testnet with realistic conditions before any mainnet deployment. Local unit tests alone are not sufficient — Fuji reveals RPC latency, gas estimation differences, and precompile behavior that in-process tests miss.

**Required workflow:**
```bash
# 1. All tests pass locally
forge test --fork-url fuji -vvv

# 2. Deploy to Fuji
forge script script/Deploy.s.sol --rpc-url fuji --broadcast

# 3. Run integration tests against live Fuji deploy
npx hardhat test --network fuji

# Only then proceed to mainnet
```

## Rule 2: Fork tests must pin to a specific block number for reproducibility

Fork tests that use the latest block produce non-deterministic results — chain state changes between runs, making CI flaky. Always specify a `blockNumber`.

**Hardhat:**
```typescript
networks: {
  hardhat: {
    forking: {
      url: "https://api.avax-test.network/ext/bc/C/rpc",
      blockNumber: 35000000, // REQUIRED — never omit this
    },
  },
},
```

**Foundry:**
```solidity
function setUp() public {
    // REQUIRED: always include block number
    uint256 fork = vm.createFork("fuji", 35_000_000);
    vm.selectFork(fork);
}
```

**Never:**
```solidity
uint256 fork = vm.createFork("fuji"); // No block — non-deterministic
```

## Rule 3: Never use block.timestamp as a fixed value in tests — use vm.warp

`block.timestamp` in tests reflects when the test runs, making time-sensitive logic impossible to test deterministically. Use `vm.warp` to control time explicitly.

**Wrong:**
```solidity
function test_Expired() public {
    // This breaks if run at different times
    assertGt(block.timestamp, vestingStart + 365 days);
}
```

**Correct:**
```solidity
function test_VestingUnlocksAfterOneYear() public {
    uint256 start = block.timestamp;
    vm.warp(start + 365 days + 1); // Explicitly advance time
    assertTrue(vesting.isUnlocked());
}

function test_VestingLockedBeforeExpiry() public {
    // No warp = test at current time, which is before vesting end
    assertFalse(vesting.isUnlocked());
}
```

## Rule 4: Test the unhappy path — what happens if transfer fails, oracle returns 0, or message delivery fails

Every external integration point must have a test for failure mode. Contracts that only test the happy path ship with unhandled failure cases.

**Required unhappy path tests:**

```solidity
// Token transfer failure
function test_RevertWhen_TokenTransferFails() public {
    // Use a mock token that returns false
    MockFailToken failToken = new MockFailToken();
    vm.expectRevert("SafeERC20: ERC20 operation did not succeed");
    vault.deposit(address(failToken), 100 ether);
}

// Oracle returns 0
function test_RevertWhen_OraclePriceIsZero() public {
    mockOracle.setPrice(0);
    vm.expectRevert("Invalid oracle price");
    protocol.getCollateralValue(address(token));
}

// Oracle is stale
function test_RevertWhen_OracleIsStale() public {
    mockOracle.setUpdatedAt(block.timestamp - 2 hours);
    vm.expectRevert("Oracle price stale");
    protocol.getCollateralValue(address(token));
}

// Cross-chain message delivery fails / reverts
function test_HandleFailedMessageDelivery() public {
    // Simulate Teleporter calling with a malformed payload
    vm.prank(address(teleporter));
    vm.expectRevert();
    receiver.receiveTeleporterMessage(SOURCE_CHAIN, TRUSTED, abi.encode("bad"));
}

// Reentrancy attempt
function test_RejectReentrantWithdraw() public {
    ReentrantAttacker attacker = new ReentrantAttacker(vault);
    vm.deal(address(attacker), 1 ether);
    vm.expectRevert("ReentrancyGuard: reentrant call");
    attacker.attack{value: 1 ether}();
}
```
