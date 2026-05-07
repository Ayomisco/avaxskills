---
name: "revenue-sharing-tokens"
version: "1.0.0"
spec: "agentskills@1.0"
license: "Apache-2.0"
tier: 3
description: "Build revenue-sharing tokens on Avalanche — dividend distribution, protocol fee sharing, streaming payments, royalty splitters, and ERC-20 with claim mechanics."
trigger: |
  Use when: user wants to distribute revenue to token holders, build profit-sharing tokens, implement protocol fee distribution, create royalty split contracts, or ask about dividend-paying tokens on Avalanche.
last_updated: "2026-05-07"
avalanche_networks: [c-chain, custom-l1]
related_skills:
  - token-standards
  - defi-primitives
  - evm-hardhat
  - evm-foundry
  - rwa-tokenization
---

## Overview

Revenue-sharing tokens automatically distribute income — protocol fees, sales revenue, royalties — to token holders. On Avalanche C-Chain, you get 1-2s finality and low gas costs, making micro-distributions economically viable.

**Key patterns:**
1. **Snapshot + Claim** — record balances at a point in time, holders claim proportionally (most gas-efficient)
2. **Continuous Accumulator** — per-token accumulated rewards, claim anytime (Synthetix staking pattern)
3. **Streaming** — real-time token streaming using ERC-1620 style (Sablier/Superfluid pattern)
4. **Splitter** — immediately split incoming payments across fixed addresses (0xSplits pattern)

## When to fetch

Fetch when someone asks about distributing revenue/fees to token holders, dividend tokens, profit-sharing mechanisms, royalty splitters, or protocol fee distribution.

## Pattern 1 — Continuous Accumulator (Recommended)

This is the most gas-efficient pattern for protocols with ongoing revenue. Based on the "rewards per token" accumulator used by Compound, Synthetix, and Uniswap V3.

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/// @title RevenueShareToken
/// @notice ERC-20 token that distributes AVAX revenue proportionally to holders
contract RevenueShareToken is ERC20, ReentrancyGuard {
    // Accumulated rewards per token (scaled by 1e18 to avoid precision loss)
    uint256 public rewardsPerToken;
    // Total AVAX distributed lifetime
    uint256 public totalDistributed;

    // Per-holder: rewards already accounted for (prevents double-claiming)
    mapping(address => uint256) private _rewardsPerTokenPaid;
    // Pending claimable AVAX per holder
    mapping(address => uint256) private _pendingRewards;

    event RevenueReceived(address indexed from, uint256 amount);
    event RewardsClaimed(address indexed holder, uint256 amount);

    constructor(string memory name, string memory symbol) ERC20(name, symbol) {}

    // ── Revenue intake ──────────────────────────────────────────────────────

    /// @notice Receive AVAX revenue (from protocol fees, sales, etc.)
    receive() external payable {
        _distributeRevenue(msg.value);
    }

    function depositRevenue() external payable {
        _distributeRevenue(msg.value);
    }

    function _distributeRevenue(uint256 amount) internal {
        require(totalSupply() > 0, "no token supply");
        // Scale by 1e18: rewardsPerToken accumulates AVAX per whole token
        rewardsPerToken += (amount * 1e18) / totalSupply();
        totalDistributed += amount;
        emit RevenueReceived(msg.sender, amount);
    }

    // ── Claiming ─────────────────────────────────────────────────────────────

    /// @notice Claim all pending AVAX rewards
    function claimRewards() external nonReentrant {
        _updateRewards(msg.sender);
        uint256 pending = _pendingRewards[msg.sender];
        require(pending > 0, "nothing to claim");
        _pendingRewards[msg.sender] = 0;
        (bool ok, ) = msg.sender.call{value: pending}("");
        require(ok, "transfer failed");
        emit RewardsClaimed(msg.sender, pending);
    }

    /// @notice Check pending rewards for an address
    function pendingRewards(address holder) external view returns (uint256) {
        uint256 pending = _pendingRewards[holder];
        uint256 unpaid = rewardsPerToken - _rewardsPerTokenPaid[holder];
        pending += (balanceOf(holder) * unpaid) / 1e18;
        return pending;
    }

    // ── Snapshot rewards on transfer ─────────────────────────────────────────

    function _update(address from, address to, uint256 amount) internal override {
        // Snapshot before transfer to preserve earned rewards
        if (from != address(0)) _updateRewards(from);
        if (to != address(0)) _updateRewards(to);
        super._update(from, to, amount);
    }

    function _updateRewards(address holder) internal {
        uint256 unpaid = rewardsPerToken - _rewardsPerTokenPaid[holder];
        _pendingRewards[holder] += (balanceOf(holder) * unpaid) / 1e18;
        _rewardsPerTokenPaid[holder] = rewardsPerToken;
    }
}
```

**Usage:**
```solidity
// Mint tokens to stakeholders
token.mint(alice, 600 ether);   // 60% share
token.mint(bob, 400 ether);     // 40% share

// Distribute revenue (e.g., from protocol fee collector)
token.depositRevenue{value: 1 ether}();

// Alice claims 0.6 AVAX
token.claimRewards(); // from alice's address

// Check pending
uint256 bobPending = token.pendingRewards(bob); // 0.4 AVAX
```

## Pattern 2 — ERC-20 Revenue Share with ERC-20 Rewards

Use this when distributing an ERC-20 token (e.g., USDC, WAVAX) instead of native AVAX:

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract ERC20RevenueToken is ERC20, ReentrancyGuard {
    using SafeERC20 for IERC20;

    IERC20 public immutable rewardToken; // e.g. WAVAX or USDC
    uint256 public rewardsPerToken;

    mapping(address => uint256) private _rewardsPerTokenPaid;
    mapping(address => uint256) private _pending;

    constructor(
        string memory name,
        string memory symbol,
        address _rewardToken
    ) ERC20(name, symbol) {
        rewardToken = IERC20(_rewardToken);
    }

    function distributeRewards(uint256 amount) external {
        require(totalSupply() > 0, "no supply");
        rewardToken.safeTransferFrom(msg.sender, address(this), amount);
        rewardsPerToken += (amount * 1e18) / totalSupply();
    }

    function claim() external nonReentrant {
        _update_rewards(msg.sender);
        uint256 pending = _pending[msg.sender];
        require(pending > 0, "nothing to claim");
        _pending[msg.sender] = 0;
        rewardToken.safeTransfer(msg.sender, pending);
    }

    function pendingRewards(address holder) public view returns (uint256) {
        uint256 unpaid = rewardsPerToken - _rewardsPerTokenPaid[holder];
        return _pending[holder] + (balanceOf(holder) * unpaid) / 1e18;
    }

    function _update(address from, address to, uint256 amount) internal override {
        if (from != address(0)) _update_rewards(from);
        if (to != address(0)) _update_rewards(to);
        super._update(from, to, amount);
    }

    function _update_rewards(address holder) internal {
        uint256 unpaid = rewardsPerToken - _rewardsPerTokenPaid[holder];
        _pending[holder] += (balanceOf(holder) * unpaid) / 1e18;
        _rewardsPerTokenPaid[holder] = rewardsPerToken;
    }
}
```

## Pattern 3 — Payment Splitter (Fixed Shares)

Immediately splits incoming payments across fixed recipients. Useful for protocol treasury splits, team allocations, or royalty distribution:

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/finance/PaymentSplitter.sol";

// OpenZeppelin PaymentSplitter handles AVAX + ERC-20 splitting

// Deploy with fixed payees and shares:
// payees = [alice, bob, treasury]
// shares = [50, 30, 20]   (relative shares)
contract ProtocolSplitter is PaymentSplitter {
    constructor(address[] memory payees, uint256[] memory shares)
        PaymentSplitter(payees, shares) {}
}
```

**Usage:**
```typescript
import { ethers } from "hardhat";

const payees = [alice.address, bob.address, treasury.address];
const shares = [50, 30, 20];

const splitter = await ethers.deployContract("ProtocolSplitter", [payees, shares]);

// Send protocol fees to splitter
await owner.sendTransaction({ to: splitter.address, value: ethers.parseEther("1.0") });

// Each payee can release their share
await splitter.connect(alice).release(alice.address);
await splitter.connect(bob).release(bob.address);

// For ERC-20 (e.g. WAVAX):
await splitter.connect(alice)["release(address,address)"](wavaxAddress, alice.address);
```

## Pattern 4 — Streaming Payments (Sablier V2)

For continuous, real-time streaming of revenue:

```bash
npm install @sablier/v2-core
```

```solidity
import "@sablier/v2-core/src/interfaces/ISablierV2LockupLinear.sol";

// Create a stream: send 100 WAVAX linearly over 30 days
ISablierV2LockupLinear.CreateWithTimestamps memory params = ISablierV2LockupLinear.CreateWithTimestamps({
    sender: address(this),
    recipient: beneficiary,
    totalAmount: 100e18,
    asset: WAVAX,
    cancelable: true,
    transferable: true,
    timestamps: ISablierV2LockupLinear.Timestamps({
        start: uint40(block.timestamp),
        cliff: 0,
        end: uint40(block.timestamp + 30 days)
    }),
    broker: ISablierV2LockupLinear.Broker({ account: address(0), fee: 0 })
});
uint256 streamId = sablier.createWithTimestamps(params);
```

Sablier V2 on Avalanche C-Chain: check `https://docs.sablier.com/contracts/v2/deployments`

## Deployment

```typescript
// scripts/deploy-revenue-token.ts
import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with:", deployer.address);

  // WAVAX on C-Chain mainnet
  const WAVAX = "0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7";

  const token = await ethers.deployContract("ERC20RevenueToken", [
    "Protocol Revenue Token",
    "PRT",
    WAVAX
  ]);
  await token.waitForDeployment();
  console.log("Token deployed at:", await token.getAddress());

  // Mint initial supply to founders/treasury
  const supply = ethers.parseEther("10000000"); // 10M tokens
  await token.mint(deployer.address, supply);
}

main().catch(console.error);
```

## Hardhat Config (Avalanche)

```typescript
// hardhat.config.ts
import "@nomicfoundation/hardhat-toolbox";

export default {
  solidity: "0.8.20",
  networks: {
    fuji: {
      url: "https://api.avax-test.network/ext/bc/C/rpc",
      chainId: 43113,
      accounts: [process.env.PRIVATE_KEY!]
    },
    avalanche: {
      url: "https://api.avax.network/ext/bc/C/rpc",
      chainId: 43114,
      accounts: [process.env.PRIVATE_KEY!]
    }
  }
};
```

## Security considerations

- **Precision:** Always scale by 1e18 minimum. For low-supply tokens, scale higher to avoid rounding to zero.
- **Reentrancy:** Always use `ReentrancyGuard` on claim functions that send ETH/AVAX.
- **Total supply = 0:** Guard `_distributeRevenue` against division by zero when `totalSupply() == 0`.
- **Transfer hooks:** Snapshot rewards BEFORE the `_update` call to ensure correct balance is used.
- **SafeERC20:** Always use `SafeERC20.safeTransfer` for ERC-20 reward tokens — some tokens don't return bool.
- **Overflow:** Solidity 0.8+ handles overflow natively; no SafeMath needed.

## Key addresses (Avalanche Mainnet C-Chain)

| Token | Address |
|---|---|
| WAVAX | `0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7` |
| USDC | `0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E` |
| USDT.e | `0xc7198437980c041c805A1EDcbA50c1Ce5db95118` |

## Core Workflow

1. Choose pattern: Continuous Accumulator (recommended), ERC-20 rewards, Payment Splitter, or Sablier streaming
2. Deploy staking/revenue contract; define fee collection point (swap fee, protocol fee, etc.)
3. Set up `rewardPerTokenStored` update on every stake/unstake/claim
4. Test distribution math: stake → accumulate rewards → claim → verify balances
5. Deploy to Fuji, run multi-account scenario tests
6. Deploy to mainnet, verify on Snowtrace, monitor `RewardClaimed` events

## Key concepts

| Concept | Description |
|---|---|
| `rewardPerTokenStored` | Accumulated reward per staked token — the core accumulator variable |
| `userRewardPerTokenPaid` | Snapshot of `rewardPerTokenStored` when user last interacted |
| Pending reward | `(stake × (rewardPerToken - userPaid)) / 1e18` |
| Payment Splitter | Fixed share distribution — simple but not dynamic |
| Sablier | Streaming payments over time — ideal for vesting or continuous payroll |
| ERC-20 rewards | Distribute a separate reward token (e.g., USDC) to stakers |

## Common errors

| Error | Cause | Fix |
|---|---|---|
| Rewards stuck / not distributed | Forgot to fund contract with reward token | Transfer reward tokens before or during deployment |
| Double-claim bug | Missing `userRewardPerTokenPaid` update | Always update snapshot before resetting rewards |
| Integer overflow in accumulator | Division before multiplication | Multiply by 1e18 before dividing: `(amount * 1e18) / totalStaked` |
| Reentrancy on claim | External call before state update | Use checks-effects-interactions or `nonReentrant` |

## Next skills

- `token-standards` — ERC-20 extensions, ERC-4626 vaults, ERC-1155
- `defi-primitives` — liquidity pools, staking, yield aggregation
- `rwa-tokenization` — real-world asset revenue distribution
