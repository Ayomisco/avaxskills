---
name: "avalanche-l1-economics"
version: "1.0.0"
spec: "agentskills@1.0"
license: "Apache-2.0"
tier: 2
description: "Design Avalanche L1 token economics — gas token design, validator incentives, fee structures, P-Chain costs, and sustainable L1 economy models."
trigger: |
  Use when: user wants to design tokenomics for an Avalanche L1, understand L1 validator costs, set fee structures, design a gas token, plan validator incentives, or calculate costs for running an Avalanche L1.
last_updated: "2026-05-07"
avalanche_networks: [fuji, mainnet, custom-l1]
related_skills:
  - subnet-deployment
  - platform-cli
  - validator-management
  - subnet-evm-config
  - precompiles
  - token-standards
---

## Overview

An Avalanche L1's economic model has three layers:
1. **P-Chain costs** — real AVAX burned to maintain validator slots
2. **Gas token** — native token of your L1 (can be AVAX or any custom token)
3. **Validator incentives** — how you attract and retain validators

Getting the economics right determines whether your L1 is sustainable and trustworthy.

## When to fetch

Fetch when someone is designing tokenomics for an Avalanche L1, asking about validator costs, designing fee structures, or planning the economic model for a custom chain.

## P-Chain Costs (Real AVAX Required)

These are the non-negotiable AVAX costs that go to the Avalanche Primary Network:

| Cost | Amount | Notes |
|---|---|---|
| Subnet creation | ~0.001 AVAX | One-time |
| Blockchain creation | ~0.001 AVAX | One-time per chain |
| L1 validator slot | **1.33 AVAX/month** | Per validator, burned to P-Chain |
| Primary Network validator | **2,000 AVAX stake** | Per Primary Network validator (for full node) |

**L1 validator slot calculation:**
```
Monthly cost = 1.33 AVAX × number_of_validators
Annual cost = 1.33 × 12 × validators = 15.96 AVAX per validator per year
```

**At $30/AVAX:** 5 validators = ~$24/month or ~$287/year  
**At $100/AVAX:** 5 validators = ~$80/month or ~$957/year  

**Important:** L1 validators do NOT need to stake AVAX — they only need to fund their P-Chain balance for the continuous 1.33 AVAX/month slot fee. This is fundamentally different from Primary Network validators.

## Gas Token Design

### Option A: Custom Native Token (Most Common)

Your L1's native gas token. All transaction fees are paid in this token.

**Genesis allocation strategy:**
```json
{
  "alloc": {
    "TREASURY_ADDRESS":   { "balance": "0x152D02C7E14AF6800000" },
    "TEAM_VESTING":       { "balance": "0x108B2A2C28029094000" },
    "VALIDATOR_REWARDS":  { "balance": "0x6C6B935B8BBD40000000" },
    "LIQUIDITY_POOL":     { "balance": "0x295BE96E64066972000000" }
  }
}
```

**Token supply allocation template (1B total):**
| Allocation | % | Amount | Notes |
|---|---|---|---|
| Community/Ecosystem | 40% | 400M | Grants, developer incentives |
| Validator rewards | 25% | 250M | Block rewards pool |
| Treasury | 20% | 200M | Protocol operations |
| Team/Advisors | 10% | 100M | 3yr vesting, 6mo cliff |
| Initial liquidity | 5% | 50M | DEX liquidity on C-Chain |

### Option B: AVAX as Gas Token

Your chain uses native AVAX for gas. Simpler but validators need AVAX to pay gas.

In genesis:
```json
{
  "config": {
    "feeConfig": {
      "minBaseFee": 25000000000
    }
  },
  "alloc": {
    "VALIDATOR_ADDRESS": { "balance": "0x1BC16D674EC80000" }
  }
}
```

**Trade-off:** Users and validators must acquire AVAX, which is an external dependency.

### Option C: Gasless (Zero Fees)

Your L1 charges no gas fees. Fees are abstracted or covered by the dApp.

```json
{
  "config": {
    "feeConfig": {
      "minBaseFee": 0,
      "targetGas": 15000000,
      "gasLimit": 30000000
    }
  }
}
```

**Trade-off:** No spam protection without alternative mechanism. Consider ContractDeployer allowlist or NativeMinter with allowlisted deployers.

## Fee Configuration (SubnetEVM)

```json
{
  "feeConfig": {
    "gasLimit": 12000000,        // Max gas per block
    "minBaseFee": 25000000000,   // Min fee: 25 gwei
    "targetGas": 15000000,       // Target utilization per 10s window
    "baseFeeChangeDenominator": 36,  // How fast base fee adjusts
    "minBlockGasCost": 0,        // Min additional block cost
    "maxBlockGasCost": 1000000,  // Max additional block cost
    "targetBlockRate": 2,        // Target: 1 block every 2 seconds
    "blockGasCostStep": 200000   // Block gas cost adjustment step
  }
}
```

**Fee tuning:**
- **High throughput:** Increase `gasLimit` to 30M+ and `targetGas` accordingly
- **Low latency:** Keep `targetBlockRate: 2` (2 second blocks)
- **Spam prevention:** Keep `minBaseFee` at 25 gwei or higher
- **Free for users:** Set `minBaseFee: 0` and use allowlist precompiles

### Dynamic Fee Manager

Use the FeeManager precompile to adjust fees after deployment:

```solidity
// Address: 0x0200000000000000000000000000000000000003
interface IFeeManager {
    function setFeeConfig(
        uint256 gasLimit,
        uint256 targetBlockRate,
        uint256 minBaseFee,
        uint256 targetGas,
        uint256 baseFeeChangeDenominator,
        uint256 minBlockGasCost,
        uint256 maxBlockGasCost,
        uint256 blockGasCostStep
    ) external;
}

// Adjust fee to zero during launch promotion
IFeeManager(0x0200000000000000000000000000000000000003)
    .setFeeConfig(12000000, 2, 0, 15000000, 36, 0, 0, 0);
```

## Validator Incentive Models

### Model 1: Token Inflation Rewards

Validators earn newly minted tokens. Standard PoS model.

```solidity
// Using NativeMinterPrecompile to emit block rewards
// Address: 0x0200000000000000000000000000000000000001
interface INativeMinter {
    function mintNativeCoin(address addr, uint256 amount) external;
}

contract BlockRewardsManager {
    INativeMinter constant MINTER = INativeMinter(0x0200000000000000000000000000000000000001);
    uint256 public rewardPerBlock = 10 ether; // 10 tokens per block
    mapping(address => bool) public validators;

    // Called by validator or governance at each epoch
    function distributeReward(address validator) external onlyGovernance {
        require(validators[validator], "not a validator");
        MINTER.mintNativeCoin(validator, rewardPerBlock);
    }
}
```

### Model 2: Fee Revenue Sharing

Validators receive a share of transaction fees. No inflation.

```solidity
// Configure FeeManager to send portion to validator pool
// Then validators withdraw proportionally per epoch
contract FeeDistributor {
    mapping(address => uint256) public validatorShares;
    uint256 public totalShares;

    receive() external payable {} // Receives fees from fee collector

    function distributeEpochFees() external {
        uint256 total = address(this).balance;
        // Distribute proportionally based on shares
        for (address v : validators) {
            uint256 amount = total * validatorShares[v] / totalShares;
            payable(v).transfer(amount);
        }
    }
}
```

### Model 3: Staking Rewards (NativeTokenStakingManager)

Use ACP-77 `NativeTokenStakingManager` for permissionless staking:

```solidity
// Validators stake your L1's native token
// Rewards come from staking contract's reward pool
// Uses @avalabs/icm-contracts NativeTokenStakingManager
```

See `validator-management` skill for full ACP-77 staking implementation.

### Model 4: Application-Layer Revenue

The L1 is fee-free; revenue comes from applications built on it:
- Protocol fees from DeFi (swap fees, lending origination)
- NFT marketplace royalties
- Subscription contracts
- Bridge fees

## Sustainable L1 Economics: Calculation Template

```
Monthly P-Chain cost = 1.33 AVAX × validators
Monthly validator infrastructure = $50-200/node (cloud)
Monthly total = P-Chain AVAX cost + infra

Break-even: your L1 needs enough activity to cover costs via fees or treasury allocation

Example (5 validators at $30/AVAX):
  P-Chain: 5 × 1.33 × $30 = $199.50/month
  Infra: 5 × $100 = $500/month
  Total: ~$700/month to break even
  
At 25 gwei base fee, ~28M gas/month = break even
```

## Tokenomics Anti-Patterns to Avoid

- **Unlimited inflation with no burn:** Token value erodes unless utility drives demand
- **Validators subsidizing forever from treasury:** Treasury runs out — need fee revenue or staking
- **Zero fees with no spam protection:** Bots will fill blocks
- **All initial allocation to team:** Community won't trust or use the chain
- **No liquidity for gas token:** Users can't acquire gas tokens = no users

## Economic Launch Playbook

1. **Pre-launch:** Deploy on Fuji, run validators for 2+ weeks, test fee configs
2. **Genesis:** Allocate sufficient validator rewards pool (24+ months runway)
3. **Launch:** Start with low but non-zero fees, bootstrap 5+ validators
4. **Liquidity:** Bridge initial gas token supply to C-Chain, add DEX liquidity
5. **Incentives:** Developer grants, user acquisition campaign
6. **Governance:** Transition to on-chain governance for fee changes within 6 months

## Key Contracts

| Contract | Address | Purpose |
|---|---|---|
| NativeMinter Precompile | `0x0200000000000000000000000000000000000001` | Mint native gas token |
| FeeManager Precompile | `0x0200000000000000000000000000000000000003` | Update fee config |
| ContractDeployer Allowlist | `0x0200000000000000000000000000000000000000` | Gate who can deploy |
| Warp Messenger | `0x0200000000000000000000000000000000000005` | Cross-chain messages |

## Core Workflow

1. Define token utility and supply (native gas token vs. wrapped ERC-20)
2. Calculate validator cost: `num_validators × 1.33 AVAX/month` on P-Chain
3. Configure gas price via Fee Manager precompile — set `minBaseFee` and `targetGas`
4. Design reward distribution: protocol fee → treasury → buyback → validators
5. Model break-even point: required tx volume to sustain validator costs
6. Test tokenomics on Fuji before mainnet launch

## Key concepts

| Concept | Description |
|---|---|
| Validator slot cost | 1.33 AVAX/month per validator on P-Chain (ACP-77) |
| Gas token | The token used to pay transaction fees on your L1 (can be any ERC-20) |
| Fee Manager | Precompile at `0x020...3` allowing dynamic `minBaseFee` changes |
| Treasury address | Receives protocol fees — set in genesis or fee manager config |
| Break-even TPS | Transactions/sec needed to cover validator and infra costs |
| Revenue diversification | Protocol fees, NFT royalties, DEX fees, premium features |

## Common errors

| Error | Cause | Fix |
|---|---|---|
| Validators drop out | Insufficient P-Chain balance | Top up: `platform l1 add-balance --validation-id ID --balance AVAX` |
| No gas token on launch | Forgot to pre-fund genesis accounts | Add balances to `alloc` in genesis.json |
| Fee too high, no adoption | `minBaseFee` set too high | Lower via Fee Manager: `setMinFeePerGas(newFee)` |
| Treasury not receiving fees | FeeRecipient not set | Set `feeRecipient` in genesis or via Fee Manager |

## Next skills

- `subnet-deployment` — deploy the L1
- `subnet-evm-config` — deep genesis and precompile configuration
- `validator-management` — ACP-77 validator operations
- `precompiles` — NativeMinter, FeeManager in depth
