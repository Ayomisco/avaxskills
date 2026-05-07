---
name: "first-contract"
version: "1.0.0"
spec: "agentskills@1.0"
license: "Apache-2.0"
tier: 0
description: "Deploy your first Solidity smart contract on Avalanche C-Chain using Remix IDE."
trigger: |
  Use when: user wants to write and deploy their first Solidity contract on Avalanche, asks about Remix IDE, needs a working contract example to start from, or has never deployed a contract before.
  Do NOT use for: Hardhat/Foundry workflows, complex multi-contract systems, upgradeable contracts, production deployments.
last_updated: "2026-05-01"
avalanche_networks: [fuji, mainnet]
related_skills:
  - quickstart
  - evm-hardhat
  - contract-verification
  - explorer-guide
---

## Overview

Remix IDE is a browser-based Solidity editor that requires zero local installation. It connects directly to MetaMask and can deploy to any EVM chain, including Avalanche. This skill covers writing real Solidity patterns (not just hello world), compiling, deploying to Fuji testnet, interacting with deployed contracts, and reading the output on Snowtrace.

Avalanche C-Chain is fully EVM-compatible — every Solidity feature and opcode works identically to Ethereum. The only differences are faster finality (~2s vs ~12s) and much cheaper gas fees.

## When to fetch

Fetch this skill when a user needs to go from a Solidity file to a deployed contract without setting up a local dev environment. Once they're comfortable with this, direct them to `evm-hardhat` for professional workflows.

## Core Workflow

### Step 1 — Set up Remix IDE

1. Open https://remix.ethereum.org in any browser.
2. In the File Explorer (left panel), click the "+" icon to create a new file.
3. Name it `MyContract.sol`.
4. The IDE has three key panels: File Explorer (left), Editor (center), Terminal (bottom).

Useful Remix shortcuts:
- `Ctrl+S` — compile current file
- `Ctrl+Z` — undo
- Right-click on file → Rename/Delete

### Step 2 — Write Your Contract

**SimpleStorage (read/write state):**

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract SimpleStorage {
    uint256 private storedValue;
    address public owner;
    mapping(address => uint256) public userValues;

    event ValueSet(address indexed user, uint256 value);

    modifier onlyOwner() {
        require(msg.sender == owner, "Not the owner");
        _;
    }

    constructor(uint256 _initialValue) {
        owner = msg.sender;
        storedValue = _initialValue;
    }

    function set(uint256 _value) public {
        storedValue = _value;
        userValues[msg.sender] = _value;
        emit ValueSet(msg.sender, _value);
    }

    function get() public view returns (uint256) {
        return storedValue;
    }

    function getUserValue(address _user) public view returns (uint256) {
        return userValues[_user];
    }
}
```

**Counter contract (simpler, good for testing):**

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract Counter {
    uint256 public count;

    event Incremented(address indexed by, uint256 newCount);

    function increment() public {
        count++;
        emit Incremented(msg.sender, count);
    }

    function decrement() public {
        require(count > 0, "Count cannot go below zero");
        count--;
    }

    function reset() public {
        count = 0;
    }
}
```

**Coin (minimal ERC-20-like token):**

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract MyCoin {
    string public name = "MyCoin";
    string public symbol = "MYC";
    uint256 public totalSupply;
    mapping(address => uint256) public balanceOf;

    event Transfer(address indexed from, address indexed to, uint256 value);

    constructor(uint256 _initialSupply) {
        totalSupply = _initialSupply;
        balanceOf[msg.sender] = _initialSupply;
    }

    function transfer(address _to, uint256 _amount) public returns (bool) {
        require(balanceOf[msg.sender] >= _amount, "Insufficient balance");
        balanceOf[msg.sender] -= _amount;
        balanceOf[_to] += _amount;
        emit Transfer(msg.sender, _to, _amount);
        return true;
    }
}
```

### Step 3 — Compile the Contract

1. Click the **Solidity Compiler** icon in the left sidebar (the "S" icon).
2. Set Compiler Version to `0.8.20` (or click "Auto compile").
3. Leave EVM version as "default" (paris or cancun — both work on Avalanche).
4. Click **"Compile MyContract.sol"**.
5. Green checkmark = success. Red X = errors shown below.

**ABI and bytecode** are generated automatically. You can view them in the compiler output — click "ABI" or "Bytecode" to copy them.

### Step 4 — Connect MetaMask to Fuji

Before deploying:
1. Make sure MetaMask has Fuji testnet added (Chain ID 43113, RPC https://api.avax-test.network/ext/bc/C/rpc).
2. Make sure you have testnet AVAX (get from https://faucet.avax.network).

In Remix:
1. Click the **Deploy & Run** icon (Ethereum logo with play button).
2. In the "Environment" dropdown, select **"Injected Provider - MetaMask"**.
3. MetaMask pops up — click "Connect" to allow Remix access.
4. You should see:
   - Account: your MetaMask address
   - Balance: your AVAX balance
   - Network: Custom (43113) — confirming Fuji is connected

### Step 5 — Deploy the Contract

For `SimpleStorage` which takes a constructor argument:

1. In the "Deploy" section, you'll see a field next to the Deploy button.
2. Enter the initial value: `100`
3. Click the orange **Deploy** button.
4. MetaMask opens a confirmation — review gas fee and click **Confirm**.
5. Watch the Remix terminal for the transaction hash.
6. After ~2 seconds, Avalanche finalizes the block.

The deployed contract appears under **"Deployed Contracts"** at the bottom left.

For `Counter` (no constructor args): just click Deploy directly.

### Step 6 — Interact with the Deployed Contract

Expand the deployed contract in the "Deployed Contracts" section:

**Reading state (free, no gas):**
- Click `get` button → returns current stored value
- Click `owner` → returns your address
- Click `count` → returns counter value

**Writing state (costs gas):**
1. Enter a value in the `set` input field (e.g., `42`).
2. Click the `set` button.
3. Confirm in MetaMask.
4. After confirmation, click `get` to verify the value changed.

**Calling with parameters:**
- `getUserValue`: Enter an address like `0x1234...` in the input and click the button.

**Sending ETH/AVAX with transaction:**
If a function is `payable`, enter the value in the "Value" field (at the top of Deploy panel) before clicking the function.

### Step 7 — Read on Snowtrace

1. Copy your contract address from the Deployed Contracts panel in Remix.
2. Open https://subnets-test.avax.network/c-chain
3. Paste the address in the search bar.

On the contract page you'll see:
- **Transactions tab** — every call to your contract
- **Internal Transactions tab** — sub-calls between contracts
- **Events tab** — all emitted events (e.g., `ValueSet`)
- **Contract tab** — unverified bytecode (see `contract-verification` skill to fix this)

Click a transaction hash to see full details: block number, gas used, input data decoded (if verified), output values.

### Step 8 — Verify the Contract on Snowtrace (Quick Method)

In Remix, install the **Sourcify Plugin**:
1. Click the Plugin Manager icon (left sidebar).
2. Search "Sourcify" and activate it.
3. Click the Sourcify icon → Connect to MetaMask → Verify.

This submits your source to Sourcify.io and Snowtrace will show it as "verified". The Contract tab on Snowtrace will now show your readable source code and an interactive ABI.

## Network config

| Network | Chain ID | RPC URL | Explorer |
|---|---|---|---|
| C-Chain Mainnet | 43114 | https://api.avax.network/ext/bc/C/rpc | https://subnets.avax.network/c-chain |
| Fuji Testnet | 43113 | https://api.avax-test.network/ext/bc/C/rpc | https://subnets-test.avax.network/c-chain |

## Key concepts

**Solidity visibility modifiers** — `public` (callable by anyone), `private` (only this contract), `internal` (this + child contracts), `external` (only from outside). View/pure functions don't cost gas when called off-chain.

**Events** — Emitted as logs stored in the transaction receipt. Much cheaper than storage. Useful for off-chain indexing. Always `emit EventName(params)` after state changes.

**Modifiers** — Reusable access control. `require(condition, "message")` reverts the transaction if false. Pattern: define modifier, use `_;` as placeholder for function body.

**Constructor** — Runs once at deployment. Sets initial state. Takes arguments passed at deploy time.

**ABI (Application Binary Interface)** — JSON definition of contract functions and events. Required by frontends and other contracts to call your contract correctly.

## Common errors

| Error | Cause | Fix |
|---|---|---|
| MetaMask not showing in Environment dropdown | MetaMask not installed or page needs refresh | Refresh Remix page after installing MetaMask |
| "Wrong network" warning in Remix | MetaMask on Ethereum, not Fuji | Switch MetaMask to Avalanche Fuji Testnet |
| "Insufficient funds for intrinsic transaction cost" | Zero AVAX balance | Get testnet AVAX from faucet.avax.network |
| Compilation error: "Source file requires different compiler version" | pragma mismatch | Change compiler version to match pragma (e.g., 0.8.20) |
| Transaction reverts | require() condition failed | Check the revert reason in Remix terminal output |
| Contract doesn't appear under Deployed Contracts | Transaction failed | Check MetaMask activity — look for failed transaction |
| "Gas estimation failed" | Contract logic error or wrong parameters | Review inputs; try increasing gas limit manually in MetaMask |

## Next skills

- `evm-hardhat` — professional Hardhat workflow for Avalanche (recommended after this)
- `contract-verification` — full verification via Hardhat/Foundry, not just Sourcify
- `explorer-guide` — understanding everything on Snowtrace
- `evm-foundry` — Foundry alternative to Hardhat
