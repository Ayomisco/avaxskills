# Critical Security Rules — Avalanche Contracts

These rules are non-negotiable. Violations block mainnet deployment.

## Rule 1: Never use tx.origin for authentication

`tx.origin` returns the original EOA that initiated the transaction. A malicious contract can trick a user into calling it, then relay the call to your contract — and `tx.origin` will be the victim's address.

**Blocked pattern:**
```solidity
require(tx.origin == owner, "Not owner"); // NEVER
```

**Required pattern:**
```solidity
require(msg.sender == owner, "Not owner"); // Always msg.sender
```

## Rule 2: Always check msg.sender in cross-chain message handlers

Any function that processes cross-chain messages (Teleporter/Warp) must verify the caller is the Teleporter messenger contract, the source chain ID is whitelisted, and the origin sender address is trusted.

**Required pattern:**
```solidity
function receiveTeleporterMessage(
    bytes32 sourceBlockchainID,
    address originSenderAddress,
    bytes calldata message
) external override {
    require(msg.sender == TELEPORTER_MESSENGER, "Not Teleporter");
    require(allowedSourceChains[sourceBlockchainID], "Chain not allowed");
    require(trustedSenders[sourceBlockchainID] == originSenderAddress, "Untrusted sender");
    // process...
}
```

## Rule 3: Never set gas limit below 8,000,000 on Subnet-EVM

Subnet-EVM's default gas target is configurable, but setting `gasLimit` below 8M in genesis can cause valid transactions (e.g., contract deployments) to fail silently or revert. Some Avalanche precompile calls also consume significant gas.

**In genesis.json:**
```json
{
  "config": {
    "chainId": 12345,
    "gasLimit": "0x7A1200"
  }
}
```
Minimum recommended: `0x7A1200` (8,000,000). Standard: `0xE4E1C0` (15,000,000).

## Rule 4: Use OpenZeppelin ReentrancyGuard on all external state-changing functions

Any function that: (a) changes state AND (b) makes an external call (including ERC-20 transfers) must use `nonReentrant` or follow strict CEI ordering. Do not rely on CEI alone if the function is complex.

**Required:**
```solidity
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract Vault is ReentrancyGuard {
    function withdraw(uint256 amount) external nonReentrant {
        // Effects before interactions
        balances[msg.sender] -= amount;
        token.safeTransfer(msg.sender, amount);
    }
}
```

## Rule 5: Never trust cross-chain messages without validating source chain and sender

Warp/Teleporter proves a message came from a specific Subnet (by validator signatures), but it does NOT prove the sending contract is legitimate. You must maintain an on-chain whitelist of:
- Allowed source `bytes32 blockchainID`
- Allowed origin contract `address` on that chain

**Pattern:**
```solidity
mapping(bytes32 => address) public trustedRemoteContracts;

function receiveTeleporterMessage(
    bytes32 sourceBlockchainID,
    address originSenderAddress,
    bytes calldata message
) external override {
    require(msg.sender == TELEPORTER_MESSENGER, "Not Teleporter");
    require(
        trustedRemoteContracts[sourceBlockchainID] == originSenderAddress,
        "Untrusted remote"
    );
    _handle(message);
}
```
