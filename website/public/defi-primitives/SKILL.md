---
name: "defi-primitives"
version: "1.0.0"
spec: "agentskills@1.0"
license: "Apache-2.0"
tier: 3
description: "Core DeFi on Avalanche C-Chain — AMMs, lending vaults, yield strategies with Trader Joe, BENQI, and Aave."
trigger: |
  Use when: user wants to integrate with Avalanche DeFi (Trader Joe swaps, BENQI lending, Aave on Avalanche), read DeFi prices via RPC, or build yield strategies on Avalanche.
  Do NOT use for: Ethereum DeFi (different addresses), custom Subnet DeFi (deploy your own), token creation (use token-standards).
last_updated: "2026-05-01"
avalanche_networks: [mainnet]
related_skills:
  - contract-addresses
  - token-standards
  - bridging
---

## Overview

Avalanche C-Chain hosts a mature DeFi ecosystem. Trader Joe is the dominant DEX (Liquidity Book AMM), BENQI and Aave are the main lending protocols, and GMX handles perpetuals. This skill covers contract interactions for swaps, lending, and yield — with real ABIs and addresses.

## When to fetch

Fetch when a user needs to integrate Avalanche DeFi protocols into a smart contract or script.

## Core Workflow

### Trader Joe — Swapping Tokens

**Router address (v2.1):** `0xE3Ffc583dC176575eEA7FD9dF2A7c65F7E23f4C`

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IJoeRouter {
    function swapExactAVAXForTokens(
        uint amountOutMin,
        address[] calldata path,
        address to,
        uint deadline
    ) external payable returns (uint[] memory amounts);

    function swapExactTokensForAVAX(
        uint amountIn,
        uint amountOutMin,
        address[] calldata path,
        address to,
        uint deadline
    ) external returns (uint[] memory amounts);

    function swapExactTokensForTokens(
        uint amountIn,
        uint amountOutMin,
        address[] calldata path,
        address to,
        uint deadline
    ) external returns (uint[] memory amounts);

    function getAmountsOut(uint amountIn, address[] calldata path)
        external view returns (uint[] memory amounts);
}

contract TraderJoeIntegration {
    IJoeRouter constant ROUTER = IJoeRouter(0xE3Ffc583dC176575eEA7FD9dF2A7c65F7E23f4C);
    address constant WAVAX = 0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7;
    address constant USDC = 0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E;

    // Swap AVAX for USDC
    function swapAVAXForUSDC(uint256 minUSDC) external payable returns (uint256) {
        address[] memory path = new address[](2);
        path[0] = WAVAX;
        path[1] = USDC;

        uint[] memory amounts = ROUTER.swapExactAVAXForTokens{value: msg.value}(
            minUSDC,
            path,
            msg.sender,
            block.timestamp + 300  // 5 minute deadline
        );
        return amounts[1];  // USDC received
    }

    // Get price: how much USDC for 1 AVAX?
    function getAVAXPrice() external view returns (uint256 usdcPerAvax) {
        address[] memory path = new address[](2);
        path[0] = WAVAX;
        path[1] = USDC;
        uint[] memory amounts = ROUTER.getAmountsOut(1 ether, path);
        return amounts[1];  // In USDC (6 decimals)
    }

    // Swap tokens for tokens
    function swapTokens(
        address tokenIn, address tokenOut,
        uint256 amountIn, uint256 minOut
    ) external {
        IERC20(tokenIn).transferFrom(msg.sender, address(this), amountIn);
        IERC20(tokenIn).approve(address(ROUTER), amountIn);

        address[] memory path = new address[](3);
        path[0] = tokenIn;
        path[1] = WAVAX;  // Route through WAVAX for best liquidity
        path[2] = tokenOut;

        ROUTER.swapExactTokensForTokens(amountIn, minOut, path, msg.sender, block.timestamp + 300);
    }
}

interface IERC20 {
    function transferFrom(address, address, uint256) external returns (bool);
    function approve(address, uint256) external returns (bool);
}
```

### BENQI — Lending and Borrowing

**Comptroller:** `0x486Af39519B4Dc9a7fCcd318217Be7c18eA05B8c`

```solidity
interface IBenqiToken {
    // Supply (mint qiToken)
    function mint(uint256 mintAmount) external returns (uint256);
    function mint() external payable;  // For qiAVAX

    // Withdraw (redeem underlying)
    function redeem(uint256 redeemTokens) external returns (uint256);
    function redeemUnderlying(uint256 redeemAmount) external returns (uint256);

    // Borrow
    function borrow(uint256 borrowAmount) external returns (uint256);
    function repayBorrow(uint256 repayAmount) external returns (uint256);

    // View
    function balanceOf(address owner) external view returns (uint256);
    function balanceOfUnderlying(address owner) external returns (uint256);
    function borrowBalanceCurrent(address account) external returns (uint256);
    function supplyRatePerTimestamp() external view returns (uint256);
    function borrowRatePerTimestamp() external view returns (uint256);
    function exchangeRateCurrent() external returns (uint256);
}

interface IBenqiComptroller {
    function enterMarkets(address[] calldata qiTokens) external returns (uint256[] memory);
    function exitMarket(address qiToken) external returns (uint256);
    function getAccountLiquidity(address account) external view returns (uint, uint, uint);
    function claimReward(uint8 rewardType, address holder) external;
}

contract BenqiStrategy {
    IBenqiComptroller constant COMPTROLLER = IBenqiComptroller(0x486Af39519B4Dc9a7fCcd318217Be7c18eA05B8c);
    address constant QI_AVAX = 0x5C0401e81Bc07Ca70fAD469b451682c0d747Ef1c;
    address constant QI_USDC = 0xBEb5d47A3f720Ec0a390d04b4d41ED7d9688bC7F;
    address constant USDC = 0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E;

    // Supply AVAX as collateral
    function supplyAVAX() external payable {
        IBenqiToken(QI_AVAX).mint{value: msg.value}();
    }

    // Supply USDC
    function supplyUSDC(uint256 amount) external {
        IERC20(USDC).transferFrom(msg.sender, address(this), amount);
        IERC20(USDC).approve(QI_USDC, amount);
        IBenqiToken(QI_USDC).mint(amount);
    }

    // Enter markets to use as collateral, then borrow
    function enterAndBorrow(uint256 usdcToBorrow) external {
        address[] memory markets = new address[](1);
        markets[0] = QI_AVAX;
        COMPTROLLER.enterMarkets(markets);  // Use qiAVAX as collateral

        // Check available liquidity before borrowing
        (uint error, uint liquidity, uint shortfall) = COMPTROLLER.getAccountLiquidity(address(this));
        require(error == 0 && shortfall == 0, "Undercollateralized");
        require(liquidity >= usdcToBorrow, "Insufficient collateral");

        IBenqiToken(QI_USDC).borrow(usdcToBorrow);
    }

    // Claim QI rewards
    function claimQI() external {
        COMPTROLLER.claimReward(1, address(this));  // 1 = QI token rewards
    }
}

interface IERC20 {
    function transferFrom(address, address, uint256) external returns (bool);
    function approve(address, uint256) external returns (bool);
}
```

### Aave v3 — Supply and Borrow

**Pool:** `0x794a61358D6845594F94dc1DB02A252b5b4814aD`

```solidity
interface IAavePool {
    function supply(address asset, uint256 amount, address onBehalfOf, uint16 referralCode) external;
    function withdraw(address asset, uint256 amount, address to) external returns (uint256);
    function borrow(address asset, uint256 amount, uint256 interestRateMode, uint16 referralCode, address onBehalfOf) external;
    function repay(address asset, uint256 amount, uint256 interestRateMode, address onBehalfOf) external returns (uint256);
    function getUserAccountData(address user) external view returns (
        uint256 totalCollateralBase,
        uint256 totalDebtBase,
        uint256 availableBorrowsBase,
        uint256 currentLiquidationThreshold,
        uint256 ltv,
        uint256 healthFactor
    );
}

contract AaveIntegration {
    IAavePool constant AAVE = IAavePool(0x794a61358D6845594F94dc1DB02A252b5b4814aD);
    address constant USDC = 0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E;
    address constant WETH = 0x49D5c2BdFfac6CE2BFdB6640F4F80f226bc10bAB;

    // Supply USDC to Aave (earn interest)
    function supplyUSDC(uint256 amount) external {
        IERC20(USDC).transferFrom(msg.sender, address(this), amount);
        IERC20(USDC).approve(address(AAVE), amount);
        AAVE.supply(USDC, amount, msg.sender, 0);
        // Caller receives aUSDC tokens representing their deposit
    }

    // Check health factor (1e18 = 1.0 — liquidation threshold)
    function getHealthFactor(address user) external view returns (uint256) {
        (,,,,,uint256 healthFactor) = AAVE.getUserAccountData(user);
        return healthFactor;  // > 1e18 = safe, < 1e18 = can be liquidated
    }

    // Borrow USDC against WETH collateral
    function borrowUSDC(uint256 amount) external {
        AAVE.borrow(
            USDC,
            amount,
            2,   // 2 = variable rate, 1 = stable rate
            0,   // referral code
            msg.sender
        );
    }
}

interface IERC20 {
    function transferFrom(address, address, uint256) external returns (bool);
    function approve(address, uint256) external returns (bool);
}
```

### Reading Price from Chainlink

```solidity
interface AggregatorV3Interface {
    function latestRoundData() external view returns (
        uint80 roundId, int256 answer, uint256 startedAt, uint256 updatedAt, uint80 answeredInRound
    );
    function decimals() external view returns (uint8);
}

contract PriceReader {
    // AVAX/USD price feed on Avalanche mainnet
    AggregatorV3Interface constant AVAX_USD = 
        AggregatorV3Interface(0x0A77230d17318075983913bC2145DB16C7366156);

    function getAVAXPrice() external view returns (uint256 price, uint256 updatedAt) {
        (, int256 answer, , uint256 timestamp, ) = AVAX_USD.latestRoundData();
        require(answer > 0, "Invalid price");
        require(timestamp > block.timestamp - 3600, "Stale price");  // Max 1 hour old
        return (uint256(answer), timestamp);
        // answer is in 8 decimals: 4000000000 = $40.00
    }
}
```

## Key concepts

**Liquidity routing** — For best swap rates, route through WAVAX: TokenA → WAVAX → TokenB. Direct pair may not exist.

**Health factor (Aave)** — Ratio of collateral value to debt. Below 1.0 = liquidatable. Keep above 1.5 for safety.

**qiToken exchange rate** — BENQI qiTokens appreciate over time. 1000 qiUSDC today is worth more USDC next year as interest accrues.

**Variable vs stable rate (Aave)** — Variable rates fluctuate with market. Stable rates are fixed short-term but can be rebalanced. Variable is standard.

**Deadline in swaps** — Always set a realistic deadline (block.timestamp + 300) to prevent griefing via delayed execution.

## Common errors

| Error | Cause | Fix |
|---|---|---|
| Swap reverts: "INSUFFICIENT_OUTPUT_AMOUNT" | Slippage exceeded minAmountOut | Increase slippage tolerance or use getAmountsOut first |
| BENQI borrow fails | Insufficient collateral | enterMarkets first, check getAccountLiquidity |
| Aave supply fails | Missing token approval | Call `IERC20.approve(AAVE_POOL, amount)` first |
| Stale price error | Chainlink oracle not updated | Check updatedAt vs block.timestamp |

## Next skills

- `contract-addresses` — all DeFi contract addresses
- `token-standards` — token types for DeFi integration
- `bridging` — bridge assets to use in Avalanche DeFi
