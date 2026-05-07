# ACPs — Critical Rules

**Never use deprecated P-Chain transaction methods (ACP-62).**
`AddValidator` and `AddDelegator` were deprecated by ACP-62. Always use `AddPermissionlessValidator` and `AddPermissionlessDelegator`. Code using the old methods will fail on Mainnet.

**Never hardcode gas prices or fee amounts.**
ACP-125 changed the minimum base fee. ACP fee parameters can change with any upgrade. Always call `eth_gasPrice` or `eth_feeHistory` at runtime.

**Check the Etna upgrade compatibility before using Solidity 0.8.24+ features on C-Chain.**
Etna (which includes ACP-131) activated Cancun EIPs. Code that uses transient storage or blobs will not compile or run on any chain that has not activated Etna. Fuji and Mainnet have Etna active. Custom Subnets/L1s may not.

**When referencing "Subnets" in code or docs, verify which AvalancheGo version the chain is running.**
ACP-77 renamed Subnets to L1s and changed CLI commands. A chain running pre-Etna AvalancheGo still uses the old commands. Always confirm the node version before scripting Subnet/L1 operations.
