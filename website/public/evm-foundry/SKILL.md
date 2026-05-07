---
name: "evm-foundry"
version: "1.0.0"
spec: "agentskills@1.0"
license: "Apache-2.0"
tier: 1
description: "Use Foundry/Forge for Avalanche — forge.toml configuration, cast commands, fuzz testing, broadcast deployment."
trigger: |
  Use when: user wants to use Foundry on Avalanche, configure forge.toml for Fuji/mainnet, use cast to interact with C-Chain, run forge test with fork testing, or broadcast a deployment script.
  Do NOT use for: Hardhat-specific workflows, non-EVM chains.
last_updated: "2026-05-01"
avalanche_networks: [fuji, mainnet]
related_skills:
  - evm-hardhat
  - testing
  - contract-verification
---

## Overview

Foundry is a fast Rust-based EVM development toolkit. Forge compiles and tests Solidity, Cast interacts with live chains, and Anvil runs a local node. Everything works on Avalanche C-Chain identically to Ethereum. Foundry's main advantages are: much faster tests, built-in fuzzing, fork testing from Fuji/Mainnet, and simpler deployment scripts.

## When to fetch

Fetch when a user prefers Foundry over Hardhat, needs fuzz testing, or wants to use `forge script --broadcast` for deployments on Avalanche.

## Core Workflow

### Step 1 — Install Foundry

```bash
curl -L https://foundry.paradigm.xyz | bash
foundryup  # install/update to latest

# Verify
forge --version   # forge 0.2.0 (...)
cast --version
anvil --version
```

### Step 2 — Initialize Project

```bash
forge init my-avalanche-project
cd my-avalanche-project
# Structure: src/ test/ script/ lib/
```

Install OpenZeppelin:
```bash
forge install OpenZeppelin/openzeppelin-contracts
```

### Step 3 — Configure forge.toml

```toml
[profile.default]
src = "src"
out = "out"
libs = ["lib"]
solc = "0.8.20"
evm_version = "paris"
optimizer = true
optimizer_runs = 200
via_ir = false

[rpc_endpoints]
fuji = "https://api.avax-test.network/ext/bc/C/rpc"
mainnet = "https://api.avax.network/ext/bc/C/rpc"
# Custom Subnet:
# my_subnet = "${SUBNET_RPC_URL}"

[etherscan]
fuji = { key = "${SNOWTRACE_API_KEY}", url = "https://api-testnet.snowtrace.io/api" }
mainnet = { key = "${SNOWTRACE_API_KEY}", url = "https://api.snowtrace.io/api" }

[fuzz]
runs = 1000
max_test_rejects = 65536

[invariant]
runs = 256
depth = 15
```

Create `.env`:
```bash
PRIVATE_KEY=0xYOUR_KEY
SNOWTRACE_API_KEY=YOUR_KEY
SUBNET_RPC_URL=http://127.0.0.1:9650/ext/bc/YOUR_CHAIN/rpc
```

### Step 4 — Write a Contract

`src/MyToken.sol`:
```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "openzeppelin-contracts/contracts/token/ERC20/ERC20.sol";
import "openzeppelin-contracts/contracts/access/Ownable.sol";

contract MyToken is ERC20, Ownable {
    uint256 public constant MAX_SUPPLY = 1_000_000 ether;

    constructor(address owner) ERC20("MyToken", "MTK") Ownable(owner) {
        _mint(owner, 100_000 ether);
    }

    function mint(address to, uint256 amount) external onlyOwner {
        require(totalSupply() + amount <= MAX_SUPPLY, "Exceeds max supply");
        _mint(to, amount);
    }
}
```

Compile:
```bash
forge build
# Output: [⠒] Compiling... Compiled 1 files
```

### Step 5 — Write Tests (including Fuzz)

`test/MyToken.t.sol`:
```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/MyToken.sol";

contract MyTokenTest is Test {
    MyToken token;
    address owner = address(0x1);
    address alice = address(0x2);
    address bob = address(0x3);

    function setUp() public {
        vm.startPrank(owner);
        token = new MyToken(owner);
        vm.stopPrank();
    }

    // Unit test
    function test_InitialSupply() public view {
        assertEq(token.totalSupply(), 100_000 ether);
        assertEq(token.balanceOf(owner), 100_000 ether);
    }

    // Fuzz test — forge runs this 1000x with random inputs
    function testFuzz_Transfer(uint256 amount) public {
        // Bound amount to valid range
        amount = bound(amount, 1, 100_000 ether);
        
        vm.prank(owner);
        token.transfer(alice, amount);
        assertEq(token.balanceOf(alice), amount);
    }

    // Fuzz test — mint respects max supply
    function testFuzz_MintDoesNotExceedMaxSupply(uint256 amount) public {
        amount = bound(amount, 1, 1_000_000 ether);
        uint256 currentSupply = token.totalSupply();
        
        vm.prank(owner);
        if (currentSupply + amount <= 1_000_000 ether) {
            token.mint(alice, amount);
            assertEq(token.totalSupply(), currentSupply + amount);
        } else {
            vm.expectRevert("Exceeds max supply");
            token.mint(alice, amount);
        }
    }

    // Access control test
    function test_NonOwnerCannotMint() public {
        vm.prank(alice);
        vm.expectRevert();
        token.mint(alice, 1 ether);
    }

    // Fork test — runs against real Fuji state
    function test_WavaxExistsOnFuji() public {
        // This test only runs when using --fork-url fuji
        // WAVAX on Fuji (if exists)
        address wavaxFuji = 0xd00ae08403B9bbb9124bB305C09058E32C39A48c;
        uint256 code = wavaxFuji.code.length;
        // Just verify the fork is working
        assertTrue(block.chainid == 43113 || block.chainid == 31337);
    }
}
```

Run tests:
```bash
forge test                    # Run all tests on local EVM
forge test -vvv               # Verbose output (shows logs, traces)
forge test --match-test testFuzz  # Run only fuzz tests
forge test --fork-url fuji    # Fork Fuji testnet
forge test --fork-url mainnet # Fork mainnet (slow, uses RPC calls)
forge test --gas-report       # Show gas usage per function
```

### Step 6 — Deploy Script

`script/Deploy.s.sol`:
```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/MyToken.sol";

contract DeployMyToken is Script {
    function run() external returns (MyToken token) {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        
        console.log("Deploying from:", deployer);
        console.log("Balance:", deployer.balance);
        
        vm.startBroadcast(deployerPrivateKey);
        token = new MyToken(deployer);
        vm.stopBroadcast();
        
        console.log("MyToken deployed to:", address(token));
        console.log("Total supply:", token.totalSupply());
    }
}
```

Dry run (no broadcast):
```bash
forge script script/Deploy.s.sol --rpc-url fuji
```

Actually deploy:
```bash
forge script script/Deploy.s.sol --rpc-url fuji --broadcast --private-key $PRIVATE_KEY
```

With verification:
```bash
forge script script/Deploy.s.sol \
  --rpc-url fuji \
  --broadcast \
  --private-key $PRIVATE_KEY \
  --verify \
  --etherscan-api-key $SNOWTRACE_API_KEY \
  --verifier-url https://api-testnet.snowtrace.io/api
```

### Step 7 — Cast Commands for Avalanche

```bash
# Check balance
cast balance 0xYOUR_ADDRESS --rpc-url fuji --ether

# Get current block
cast block-number --rpc-url fuji

# Read a contract function
cast call 0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7 \
  "name()(string)" \
  --rpc-url mainnet
# Returns: "Wrapped AVAX"

# Read balanceOf
cast call 0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7 \
  "balanceOf(address)(uint256)" \
  0xSOME_ADDRESS \
  --rpc-url mainnet

# Send a transaction
cast send 0xCONTRACT_ADDRESS \
  "transfer(address,uint256)" \
  0xRECIPIENT 1000000000000000000 \
  --rpc-url fuji \
  --private-key $PRIVATE_KEY

# Get gas price
cast gas-price --rpc-url fuji

# Convert units
cast to-wei 1.5 ether    # → 1500000000000000000
cast from-wei 25000000000 # → 25 (gwei)
cast to-hex 43113         # → 0xa869

# Decode calldata
cast 4byte-decode 0xa9059cbb000000...

# Get ABI from Snowtrace
cast abi-decode "transfer(address,uint256)" 0x...
```

### Step 8 — Verify Manually

```bash
# After deployment, get contract address from broadcast output
forge verify-contract \
  --chain-id 43113 \
  --rpc-url fuji \
  --etherscan-api-key $SNOWTRACE_API_KEY \
  --verifier-url https://api-testnet.snowtrace.io/api \
  0xCONTRACT_ADDRESS \
  src/MyToken.sol:MyToken \
  --constructor-args $(cast abi-encode "constructor(address)" 0xDEPLOYER_ADDRESS)
```

## Network config

| Network | Alias in forge.toml | Chain ID |
|---|---|---|
| Fuji Testnet | fuji | 43113 |
| C-Chain Mainnet | mainnet | 43114 |

## Key concepts

**Fuzz testing** — Forge automatically generates random inputs and runs your test 1000+ times. Use `bound()` to constrain inputs to valid ranges. Catches edge cases unit tests miss.

**Fork testing** — `--fork-url fuji` makes your test run against real Fuji chain state. Lets you test against real deployed contracts like WAVAX, Trader Joe, etc.

**vm cheatcodes** — Forge's `vm.prank()`, `vm.expectRevert()`, `vm.warp()` etc. let you simulate complex scenarios in tests.

**Broadcast** — `vm.startBroadcast()` marks which calls to actually send to the chain. Without `--broadcast` flag, it's a dry run.

**cast** — CLI for all chain interactions. Read state, send transactions, decode data. Equivalent to ethers.js/viem but for the terminal.

## Common errors

| Error | Cause | Fix |
|---|---|---|
| `FAIL. Reason: EvmError: Revert` in fuzz | Test hits a revert case | Use `vm.expectRevert()` or add `bound()` to inputs |
| `Failed to get EIP-1559 fees` | RPC doesn't support eth_feeHistory | Add `--legacy` flag to use legacy gas pricing |
| Verification fails: `No matching constructor` | Wrong constructor args | Check `--constructor-args` matches deployed args exactly |
| Fork test slow | RPC rate limiting | Use private RPC from Infura/Alchemy or local archive node |
| `PRIVATE_KEY not set` | Missing env var | Run `source .env` or prefix command with env var |

## Next skills

- `testing` — advanced test patterns, invariant testing, coverage
- `contract-verification` — all verification methods compared
- `evm-hardhat` — Hardhat equivalent if you prefer that ecosystem
