---
name: "data-feeds-oracles"
version: "1.0.0"
spec: "agentskills@1.0"
license: "Apache-2.0"
tier: 1
description: "Integrate price feeds and oracle data into Avalanche smart contracts — Chainlink Data Feeds, Pyth Network, Chainlink VRF for randomness, and building oracle-aware DeFi."
trigger: |
  Use when: user wants price feeds on Avalanche, integrate Chainlink, use Pyth oracles, get off-chain data on-chain, implement price-based contract logic, or use randomness in contracts.
last_updated: "2026-05-07"
avalanche_networks: [c-chain, fuji]
related_skills:
  - defi-primitives
  - evm-hardhat
  - evm-foundry
  - security
---

## Overview

Two main oracle providers on Avalanche C-Chain:
1. **Chainlink** — industry-standard push oracles, updated every heartbeat or when price deviates by threshold. Use for production DeFi.
2. **Pyth Network** — pull-based oracles with sub-second updates. Lower latency but you pay a small fee per update.

For randomness: **Chainlink VRF** (Verifiable Random Function).

## When to fetch

Fetch when someone needs price data in a smart contract, randomness, or any off-chain data on Avalanche.

## Chainlink Data Feeds

### Deployed Feed Addresses (Avalanche C-Chain)

| Feed | Mainnet | Fuji |
|---|---|---|
| AVAX/USD | `0x0A77230d17318075983913bC2145DB16C7366156` | `0x5498BB86BC934c8D34FDA08E81D444153d0D06aD` |
| BTC/USD | `0x2779D32d5166BAaa2B2b658333bA7e6Ec0C65743` | `0x31CF013A08c6Ac228C94551d535d5BAfE19c602a` |
| ETH/USD | `0x976B3D034E162d8bD72D6b9C989d545b839003b0` | `0x86d67c3D38D2bCeE722E601025C25a575021c6EA` |
| USDC/USD | `0xF096872672F44d6EBA71527d2combined46E7A93` | — |

Full list: `https://docs.chain.link/data-feeds/price-feeds/addresses?network=avalanche`

### Reading a Chainlink Price Feed

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";

contract PriceConsumer {
    AggregatorV3Interface public immutable priceFeed;

    // AVAX/USD feed on mainnet: 0x0A77230d17318075983913bC2145DB16C7366156
    constructor(address feedAddress) {
        priceFeed = AggregatorV3Interface(feedAddress);
    }

    /// @notice Get the latest price
    /// @return price in USD with 8 decimals (e.g. 3500_00000000 = $35.00)
    function getLatestPrice() public view returns (int256 price) {
        (
            uint80 roundId,
            int256 answer,
            uint256 startedAt,
            uint256 updatedAt,
            uint80 answeredInRound
        ) = priceFeed.latestRoundData();

        // Stale price protection (heartbeat is typically 1 hour or 0.5% deviation)
        require(updatedAt >= block.timestamp - 3600, "stale price");
        require(answer > 0, "invalid price");

        return answer; // 8 decimals
    }

    /// @notice Get price as 18-decimal value (WAD)
    function getPriceWad() external view returns (uint256) {
        int256 price = getLatestPrice();
        return uint256(price) * 1e10; // 8 decimals → 18 decimals
    }

    function decimals() external view returns (uint8) {
        return priceFeed.decimals(); // usually 8
    }
}
```

### Multi-Feed Contract

```solidity
contract MultiOracle {
    mapping(string => address) public feeds;

    constructor() {
        // Avalanche mainnet Chainlink feeds
        feeds["AVAX/USD"] = 0x0A77230d17318075983913bC2145DB16C7366156;
        feeds["BTC/USD"]  = 0x2779D32d5166BAaa2B2b658333bA7e6Ec0C65743;
        feeds["ETH/USD"]  = 0x976B3D034E162d8bD72D6b9C989d545b839003b0;
    }

    function getPrice(string memory pair) external view returns (int256, uint8) {
        address feed = feeds[pair];
        require(feed != address(0), "feed not found");
        AggregatorV3Interface oracle = AggregatorV3Interface(feed);
        (, int256 price, , uint256 updatedAt, ) = oracle.latestRoundData();
        require(block.timestamp - updatedAt <= 3600, "stale");
        return (price, oracle.decimals());
    }
}
```

## Pyth Network (Pull Oracle)

Pyth is a pull-based oracle — you submit a signed price update on-chain when you need it, paying a small fee. Better for high-frequency use cases.

**Pyth Contract (Avalanche C-Chain):** `0x4305FB66699C3B2702D4d05CF36551390A4c1dDa`
**Pyth Contract (Fuji):** `0xff1a0f4744e8582DF1aE09D5611b887B6a12925C`

### Price IDs (Pyth)

| Asset | Price ID |
|---|---|
| AVAX/USD | `0x93da3352f9f1d105fdfe4971cfa80e9dd777bfc5d0f683ebb6e1294b92137bb7c` |
| BTC/USD | `0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43` |
| ETH/USD | `0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace` |

Full list: `https://pyth.network/developers/price-feed-ids`

### Pyth Integration

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@pythnetwork/pyth-sdk-solidity/IPyth.sol";
import "@pythnetwork/pyth-sdk-solidity/PythStructs.sol";

contract PythPriceConsumer {
    IPyth public immutable pyth;
    bytes32 public immutable priceId;

    constructor(address pythAddress, bytes32 _priceId) {
        pyth = IPyth(pythAddress);
        priceId = _priceId;
    }

    /// @notice Update price and use it in a single transaction
    /// @param priceUpdateData Signed price data from Pyth API
    function updateAndUsePrice(bytes[] calldata priceUpdateData)
        external payable
    {
        // Pay the update fee (usually very small, <$0.001)
        uint256 fee = pyth.getUpdateFee(priceUpdateData);
        require(msg.value >= fee, "insufficient fee");

        // Submit price update
        pyth.updatePriceFeeds{value: fee}(priceUpdateData);

        // Now use the fresh price
        PythStructs.Price memory price = pyth.getPriceNoOlderThan(
            priceId,
            60 // max 60 seconds old
        );

        // price.price is the price with price.expo exponent
        // e.g., price = 3500_00000000, expo = -8 → $35.00
        int256 usdPrice = price.price;
        int32 expo = price.expo;

        // Convert to 18-decimal WAD: price * 10^(18 + expo)
        // For expo = -8: price * 10^10
    }

    /// @notice Get price update data from Pyth off-chain API (call before tx)
    /// @dev Frontend call: fetch("https://hermes.pyth.network/v2/updates/price/latest?ids[]=PRICE_ID")
    function getPrice() external view returns (int256, int32, uint256) {
        PythStructs.Price memory p = pyth.getPriceUnsafe(priceId);
        return (p.price, p.expo, p.publishTime);
    }
}
```

**Off-chain data fetch (frontend/backend):**
```typescript
// Get price update data before calling contract
const response = await fetch(
  `https://hermes.pyth.network/v2/updates/price/latest?ids[]=${PRICE_ID}`
);
const data = await response.json();
const priceUpdateData = data.binary.data.map((d: string) => `0x${d}`);

// Pass to contract
const fee = await pythContract.getUpdateFee(priceUpdateData);
await myContract.updateAndUsePrice(priceUpdateData, { value: fee });
```

## Chainlink VRF (Verifiable Randomness)

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@chainlink/contracts/src/v0.8/vrf/VRFConsumerBaseV2.sol";
import "@chainlink/contracts/src/v0.8/interfaces/VRFCoordinatorV2Interface.sol";

// Fuji VRF Coordinator: 0x2eD832Ba664535e5886b75D64C46EB9a228C2610
// Mainnet VRF Coordinator: 0xd5D517aBE5cF79B7e95eC98dB0f0277788aFF634
contract RandomLottery is VRFConsumerBaseV2 {
    VRFCoordinatorV2Interface private immutable coordinator;

    uint64 private immutable subscriptionId;
    bytes32 private immutable keyHash;
    uint32 private constant CALLBACK_GAS_LIMIT = 100000;
    uint16 private constant CONFIRMATIONS = 3;

    mapping(uint256 => address) public requestIdToPlayer;
    mapping(address => uint256) public playerToResult;

    event RandomnessRequested(uint256 requestId, address player);
    event RandomnessReceived(uint256 requestId, uint256 randomWord);

    // Fuji Key Hash: 0x354d2f95da55398f44b7cff77da56283d9c6c829a4bdf1bbcaf2ad6a4d081f61
    constructor(
        address vrfCoordinator,
        uint64 _subscriptionId,
        bytes32 _keyHash
    ) VRFConsumerBaseV2(vrfCoordinator) {
        coordinator = VRFCoordinatorV2Interface(vrfCoordinator);
        subscriptionId = _subscriptionId;
        keyHash = _keyHash;
    }

    function requestRandom() external returns (uint256 requestId) {
        requestId = coordinator.requestRandomWords(
            keyHash,
            subscriptionId,
            CONFIRMATIONS,
            CALLBACK_GAS_LIMIT,
            1 // number of random words
        );
        requestIdToPlayer[requestId] = msg.sender;
        emit RandomnessRequested(requestId, msg.sender);
    }

    function fulfillRandomWords(uint256 requestId, uint256[] memory randomWords)
        internal override
    {
        address player = requestIdToPlayer[requestId];
        // Example: random number between 1-100
        playerToResult[player] = (randomWords[0] % 100) + 1;
        emit RandomnessReceived(requestId, randomWords[0]);
    }
}
```

Setup:
1. Create VRF subscription at `https://vrf.chain.link/avalanche`
2. Fund with LINK tokens
3. Add your contract as a consumer
4. Deploy with subscription ID and key hash

## Install

```bash
npm install @chainlink/contracts @pythnetwork/pyth-sdk-solidity
```

## Security Notes

- **Staleness check:** Always validate `updatedAt` against a maximum age (1 hour for Chainlink).
- **Price validity:** Check `answer > 0` — negative or zero prices indicate feed issues.
- **Aggregator round:** Check `answeredInRound >= roundId` to catch incomplete rounds.
- **Circuit breaker:** Pause your contract if oracle returns invalid data rather than using stale price.
- **Don't use Pyth `getPriceUnsafe` in production** — use `getPriceNoOlderThan(id, maxAge)`.

## Core Workflow

**Chainlink (push oracle):**
1. Find your feed address at `data.chain.link`
2. Import `AggregatorV3Interface`, call `latestRoundData()`
3. Validate: `answeredInRound >= roundId`, `updatedAt > 0`, `answer > 0`
4. Divide by `10 ** decimals()` to get human-readable price

**Pyth (pull oracle):**
1. Get signed price update from Pyth API: `https://hermes.pyth.network/api/latest_vaas`
2. Call `pyth.updatePriceFeeds{value: fee}(priceUpdateData)` on-chain
3. Call `pyth.getPriceNoOlderThan(priceId, maxAge)` to read price

## Key concepts

| Concept | Description |
|---|---|
| Push oracle | Oracle pushes price on-chain on a schedule (Chainlink) |
| Pull oracle | dApp pulls price update on-demand with signed VAA (Pyth) |
| `latestRoundData` | Chainlink function returning price + staleness metadata |
| Heartbeat | Maximum seconds between Chainlink price updates |
| Price ID | 32-byte identifier for a Pyth price feed |
| VAA | Verified Action Approval — Pyth's signed price attestation format |
| VRF | Verifiable Random Function — on-chain provably fair randomness |

## Common errors

| Error | Cause | Fix |
|---|---|---|
| Stale price used | Not checking `updatedAt` | Require `block.timestamp - updatedAt < heartbeat + buffer` |
| Division by zero | Oracle returns 0 | Require `answer > 0` before using price |
| Wrong decimals | Assuming 8 decimals | Always call `decimals()` — feeds vary |
| Pyth update reverts | Insufficient fee sent | Pre-calculate with `pyth.getUpdateFee(priceUpdateData)` |

## Next skills

- `defi-primitives` — building DeFi with price feeds (lending, perpetuals)
- `security` — oracle manipulation attacks and mitigations
- `evm-hardhat` — testing with mock oracles
