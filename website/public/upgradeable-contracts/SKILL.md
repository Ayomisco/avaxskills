---
name: "upgradeable-contracts"
version: "1.0.0"
spec: "agentskills@1.0"
license: "Apache-2.0"
tier: 6
description: "Implement upgradeable contracts on Avalanche — UUPS, Transparent Proxy, and Beacon proxy patterns with OpenZeppelin."
trigger: |
  Use when: implementing upgradeable smart contracts, choosing between UUPS and Transparent Proxy, deploying with hardhat-upgrades plugin, managing upgrade authority, or fixing bugs in deployed contracts.
  Do NOT use for: non-upgradeable contracts, immutable protocol design choices.
last_updated: "2026-05-01"
avalanche_networks: [fuji, mainnet]
related_skills:
  - security
  - audit
  - testing
---

## Overview

Upgradeable contracts on Avalanche follow the same proxy patterns as Ethereum EVM but require careful planning of storage layouts, access control, and upgrade governance. This skill covers UUPS, TransparentUpgradeableProxy, and Beacon proxies, including the hardhat-upgrades plugin workflow and common pitfalls that cause silent storage corruption.

## When to fetch

Fetch when designing a contract system that may need bug fixes or feature additions post-deployment, when implementing the upgrade flow for an already-deployed proxy, or when auditing an upgradeable contract system.

## Core Workflow

### Choose Your Pattern

| Pattern | Gas (deploy) | Gas (call) | Admin complexity | Best for |
|---|---|---|---|---|
| UUPS | Lower | Lowest | Upgrade logic in implementation | Most contracts |
| Transparent Proxy | Higher | Slightly higher | ProxyAdmin contract | When you want strict admin separation |
| Beacon | Medium | Medium | Beacon contract | Multiple identical proxy instances |

**Rule of thumb**: Use UUPS for most projects. Use Transparent Proxy if you want the ProxyAdmin pattern enforced by OpenZeppelin tooling. Use Beacon when you have 10+ proxy instances sharing one implementation.

### UUPS Pattern

1. **Install**

   ```bash
   npm install --save-dev @openzeppelin/hardhat-upgrades
   npm install @openzeppelin/contracts-upgradeable
   ```

2. **UUPS implementation contract**

   ```solidity
   // contracts/MyProtocolV1.sol
   // SPDX-License-Identifier: Apache-2.0
   pragma solidity ^0.8.24;

   import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
   import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
   import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
   import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";

   /// @custom:oz-upgrades-from MyProtocolV1
   contract MyProtocolV1 is
       Initializable,
       OwnableUpgradeable,
       UUPSUpgradeable,
       ReentrancyGuardUpgradeable
   {
       // STORAGE LAYOUT — NEVER change order of existing vars in upgrades
       uint256 public totalDeposits;
       mapping(address => uint256) public balances;
       // Add new variables ONLY at the end

       /// @custom:oz-upgrades-unsafe-allow constructor
       constructor() {
           _disableInitializers(); // Prevent direct implementation calls
       }

       // Use initialize() instead of constructor
       function initialize(address owner) public initializer {
           __Ownable_init(owner);
           __UUPSUpgradeable_init();
           __ReentrancyGuard_init();
       }

       function deposit() external payable nonReentrant {
           balances[msg.sender] += msg.value;
           totalDeposits += msg.value;
       }

       function withdraw(uint256 amount) external nonReentrant {
           require(balances[msg.sender] >= amount, "Insufficient");
           balances[msg.sender] -= amount;
           (bool ok,) = msg.sender.call{value: amount}("");
           require(ok, "Transfer failed");
       }

       // Required by UUPSUpgradeable — controls who can upgrade
       function _authorizeUpgrade(address newImplementation)
           internal
           override
           onlyOwner
       {}
   }
   ```

3. **V2 with a new feature**

   ```solidity
   // contracts/MyProtocolV2.sol
   pragma solidity ^0.8.24;

   import "./MyProtocolV1.sol";

   /// @custom:oz-upgrades-from MyProtocolV1
   contract MyProtocolV2 is MyProtocolV1 {
       // NEW storage MUST go after all V1 storage — never insert in between
       uint256 public feeBps;
       mapping(address => uint256) public claimedRewards; // New in V2

       // New initializer for V2 fields (call only during upgrade, not re-deploy)
       function initializeV2(uint256 _feeBps) public reinitializer(2) {
           feeBps = _feeBps;
       }

       // Override with fee logic
       function deposit() external payable override nonReentrant {
           uint256 fee = (msg.value * feeBps) / 10000;
           uint256 net = msg.value - fee;
           balances[msg.sender] += net;
           totalDeposits += net;
       }
   }
   ```

4. **Deploy with hardhat-upgrades**

   ```typescript
   // scripts/deploy.ts
   import { ethers, upgrades } from "hardhat";

   async function main() {
     const [deployer] = await ethers.getSigners();
     console.log("Deploying as:", deployer.address);

     const MyProtocol = await ethers.getContractFactory("MyProtocolV1");

     // Deploys proxy + implementation + ProxyAdmin automatically
     const proxy = await upgrades.deployProxy(MyProtocol, [deployer.address], {
       initializer: "initialize",
       kind: "uups",
     });
     await proxy.waitForDeployment();

     const proxyAddress = await proxy.getAddress();
     const implAddress = await upgrades.erc1967.getImplementationAddress(proxyAddress);

     console.log("Proxy deployed to:", proxyAddress);
     console.log("Implementation:", implAddress);

     // Save addresses for future upgrades
   }

   main().catch(console.error);
   ```

5. **Upgrade to V2**

   ```typescript
   // scripts/upgrade.ts
   import { ethers, upgrades } from "hardhat";

   const PROXY_ADDRESS = "0x..."; // Your deployed proxy address

   async function main() {
     const MyProtocolV2 = await ethers.getContractFactory("MyProtocolV2");

     // Validates storage layout compatibility before upgrading
     const upgraded = await upgrades.upgradeProxy(PROXY_ADDRESS, MyProtocolV2, {
       kind: "uups",
       call: {
         fn: "initializeV2",
         args: [100], // 1% fee
       },
     });
     await upgraded.waitForDeployment();

     console.log("Upgraded proxy at:", await upgraded.getAddress());
     console.log(
       "New implementation:",
       await upgrades.erc1967.getImplementationAddress(await upgraded.getAddress())
     );
   }

   main().catch(console.error);
   ```

6. **Validate upgrade safety (CI check)**

   ```bash
   # Validate storage layout compatibility without deploying
   npx hardhat run scripts/validate-upgrade.ts

   # Or use the CLI
   npx oz-upgrades validate contracts/ \
     --contract MyProtocolV1 \
     --kind uups
   ```

   ```typescript
   // scripts/validate-upgrade.ts
   import { ethers, upgrades } from "hardhat";

   async function main() {
     const V1 = await ethers.getContractFactory("MyProtocolV1");
     const V2 = await ethers.getContractFactory("MyProtocolV2");

     // Throws if storage layout would break
     await upgrades.validateUpgrade(V1, V2, { kind: "uups" });
     console.log("Upgrade is safe");
   }

   main().catch(console.error);
   ```

7. **Transparent Proxy (alternative)**

   ```typescript
   // For Transparent Proxy — nearly identical API
   const proxy = await upgrades.deployProxy(MyProtocol, [deployer.address], {
     initializer: "initialize",
     kind: "transparent", // Change here
   });

   // ProxyAdmin is deployed automatically
   const adminAddress = await upgrades.erc1967.getAdminAddress(proxyAddress);
   console.log("ProxyAdmin:", adminAddress);
   ```

8. **Beacon Proxy (multiple instances)**

   ```typescript
   // Deploy beacon (points to implementation)
   const beacon = await upgrades.deployBeacon(MyProtocol);
   const beaconAddress = await beacon.getAddress();

   // Deploy multiple proxies sharing the same beacon
   const proxy1 = await upgrades.deployBeaconProxy(beaconAddress, MyProtocol, [deployer.address]);
   const proxy2 = await upgrades.deployBeaconProxy(beaconAddress, MyProtocol, [anotherOwner]);

   // Upgrade ALL proxies at once by upgrading the beacon
   const V2 = await ethers.getContractFactory("MyProtocolV2");
   await upgrades.upgradeBeacon(beaconAddress, V2);
   // Now proxy1, proxy2, and all others run V2 immediately
   ```

## Storage Layout Rules

**Golden rule: never change the order of existing storage variables across upgrades.**

```solidity
// V1 storage
uint256 public totalDeposits;           // slot 0
mapping(address => uint256) balances;   // slot 1

// V2 — CORRECT: append only
uint256 public totalDeposits;           // slot 0 — unchanged
mapping(address => uint256) balances;   // slot 1 — unchanged
uint256 public feeBps;                  // slot 2 — NEW, at end

// V2 — WRONG: inserts before existing — CORRUPTS STORAGE
uint256 public feeBps;                  // slot 0 — WAS totalDeposits
uint256 public totalDeposits;           // slot 1 — WAS balances mapping
mapping(address => uint256) balances;   // slot 2 — broken
```

**Use storage gaps for libraries**:
```solidity
// In base contracts used by upgradeable contracts
abstract contract MyBase is Initializable {
    uint256[50] private __gap; // Reserve 50 slots for future use
}
```

## Key concepts

**Proxy Pattern**: A proxy contract delegates all calls to an implementation contract. The proxy holds storage; the implementation holds logic. Upgrading = pointing the proxy at a new implementation.

**initializer vs constructor**: In upgradeable contracts, constructors run only on the implementation, not the proxy. Use `initialize()` with the `initializer` modifier for setup logic.

**_disableInitializers()**: Call this in the implementation's constructor to prevent someone from calling `initialize()` directly on the implementation (bypassing the proxy).

**UUPS advantage**: The upgrade function lives in the implementation. If you upgrade to a new implementation that lacks `_authorizeUpgrade`, you lose the ability to upgrade — so always test the upgrade path.

**ProxyAdmin**: In Transparent Proxy, all admin calls (upgrade) go through a ProxyAdmin contract. Regular users interact with the proxy transparently. This prevents function selector clashes.

## Common errors

| Error | Cause | Fix |
|---|---|---|
| `StorageLayoutIncompatible` | Added variable before existing ones | Move new variables to the end of storage |
| `Contract is not upgrade safe` | Using `selfdestruct` or `delegatecall` | Remove these or use `@custom:oz-upgrades-unsafe-allow` with caution |
| `Initializable: contract is already initialized` | Calling `initialize` twice | Use `reinitializer(N)` for V2+ initializers |
| Implementation takes over proxy storage | Called implementation directly | Use `_disableInitializers()` in constructor |
| Can't upgrade — no `_authorizeUpgrade` | Upgraded to impl without upgrade function | Always test upgrade path before deployment |

## Next skills

- `security` — audit upgradeable contracts for proxy-specific vulnerabilities
- `audit` — include storage layout review in audit scope
- `testing` — test upgrade migrations in fork tests
