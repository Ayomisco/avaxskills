# Launch Rules — Avalanche dApp Mainnet

These rules are hard gates. No mainnet launch proceeds without all four being satisfied.

## Rule 1: Contract must be verified on Snowtrace before mainnet launch

Unverified contracts cannot be audited by users or third parties. Trust requires transparency.
All contracts — including proxies and their implementations — must have verified source code on Snowtrace.

**How to verify with Foundry:**
```bash
forge verify-contract \
  --chain-id 43114 \
  --etherscan-api-key $SNOWTRACE_API_KEY \
  --constructor-args $(cast abi-encode "constructor(address,uint256)" 0xABC 1000) \
  <DEPLOYED_ADDRESS> \
  src/MyContract.sol:MyContract
```

**Verify proxy + implementation separately:**
```bash
# Verify implementation
forge verify-contract --chain-id 43114 \
  $IMPLEMENTATION_ADDRESS src/MyContractV1.sol:MyContractV1

# Verify proxy (TransparentUpgradeableProxy)
forge verify-contract --chain-id 43114 \
  $PROXY_ADDRESS lib/openzeppelin-contracts/contracts/proxy/transparent/TransparentUpgradeableProxy.sol:TransparentUpgradeableProxy
```

**Check verification status:**
```bash
cast code $CONTRACT_ADDRESS --rpc-url https://api.avax.network/ext/bc/C/rpc
# If > "0x", contract exists. Check https://snowtrace.io/address/$CONTRACT_ADDRESS#code
```

## Rule 2: Admin keys must be multisig (Gnosis Safe) on mainnet

Any address that holds admin, owner, upgrader, or operator privileges on mainnet must be a Gnosis Safe. Single EOA admin keys are a critical vulnerability — one compromised key = total loss of protocol control.

**Set up Gnosis Safe on Avalanche:**
1. Go to https://safe.global and create a Safe on Avalanche C-Chain (chain ID 43114)
2. Minimum recommended: 3-of-5 signers
3. Signers must be on separate hardware wallets held by different team members

**Transfer ownership to Safe:**
```solidity
// After Safe is deployed and confirmed working:
myContract.transferOwnership(GNOSIS_SAFE_ADDRESS);

// Verify
require(myContract.owner() == GNOSIS_SAFE_ADDRESS, "Transfer failed");
```

**Verify in Foundry test:**
```solidity
function test_OwnerIsMultisig() public {
    address owner = myContract.owner();
    // Gnosis Safe has code — EOAs do not
    assertGt(owner.code.length, 0, "Owner must be a contract (multisig)");
}
```

## Rule 3: All precompile admin addresses must be multisig, not EOA

Subnet-EVM precompiles (ContractDeployerAllowList, TxAllowList, NativeMinterPrecompile, FeeManagerPrecompile, etc.) have admin addresses set in genesis or via admin calls. If those addresses are EOAs, a single key compromise gives an attacker the ability to:
- Enable arbitrary contract deployment
- Mint unlimited native tokens
- Change gas parameters

**In genesis.json — set to Safe address:**
```json
{
  "contractDeployerAllowListConfig": {
    "adminAddresses": ["0xGnosisSafeAddress"],
    "enabledAddresses": []
  },
  "nativeMinterConfig": {
    "adminAddresses": ["0xGnosisSafeAddress"],
    "enabledAddresses": []
  },
  "feeManagerConfig": {
    "adminAddresses": ["0xGnosisSafeAddress"]
  }
}
```

**Verify precompile admin programmatically:**
```solidity
IAllowList deployer = IAllowList(CONTRACT_DEPLOYER_ALLOW_LIST);
AllowListRole role = deployer.readAllowList(GNOSIS_SAFE_ADDRESS);
require(role == AllowListRole.Admin, "Precompile admin not set to Safe");

// Ensure EOA dev key is NOT admin
role = deployer.readAllowList(DEV_EOA);
require(role == AllowListRole.None, "Dev EOA must not be admin on mainnet");
```

## Rule 4: Emergency pause must be tested on Fuji

An untested pause is not a pause. The emergency pause mechanism must be exercised on Fuji — including triggering it, verifying it blocks all fund movement, and unpausing — before mainnet launch.

**Pause implementation (OpenZeppelin Pausable):**
```solidity
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

contract MyProtocol is Pausable, AccessControl {
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");

    function pause() external onlyRole(PAUSER_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(PAUSER_ROLE) {
        _unpause();
    }

    function deposit(uint256 amount) external whenNotPaused {
        // ...
    }

    // Also pause cross-chain receipt
    function receiveTeleporterMessage(...) external override whenNotPaused {
        // ...
    }
}
```

**Fuji test script:**
```bash
# 1. Deploy to Fuji
forge script script/Deploy.s.sol --rpc-url fuji --broadcast

# 2. Test pause — this must succeed
cast send $CONTRACT "pause()" --private-key $PAUSER_KEY --rpc-url fuji

# 3. Verify pause blocks deposits — this must revert
cast send $CONTRACT "deposit(uint256)" 1000 --private-key $USER_KEY --rpc-url fuji

# 4. Verify unpause works
cast send $CONTRACT "unpause()" --private-key $PAUSER_KEY --rpc-url fuji

# 5. Verify deposits work again after unpause
cast send $CONTRACT "deposit(uint256)" 1000 --private-key $USER_KEY --rpc-url fuji
```

**Checklist for pause test:**
- [ ] Pause tx confirmed on Fuji
- [ ] Deposit blocked after pause (tx reverted)
- [ ] Withdraw blocked after pause (tx reverted)
- [ ] Cross-chain message receipt blocked after pause
- [ ] Unpause tx confirmed
- [ ] Deposits working after unpause
- [ ] Pauser role held by multisig on mainnet (not dev EOA)
