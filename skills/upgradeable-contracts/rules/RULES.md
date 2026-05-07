# Upgradeable Contracts Rules

## Must-Follow
- Always use OpenZeppelin Upgrades plugin for proxy deployments — never implement proxy patterns manually
- Always initialize upgradeable contracts with `initialize()` function — no constructors
- Always use `_gap` storage arrays in upgradeable contracts to reserve storage slots for future versions
- Always run `npx hardhat run --network <x> scripts/upgrade.ts` not manual storage manipulation

## Never Do
- Never change the order of existing storage variables in an upgrade — causes storage collision
- Never add new storage variables before existing ones in an upgrade
- Never skip `upgradeToAndCall` access control — anyone must not be able to upgrade
- Never deploy upgradeable contracts without multisig or timelock on the proxy admin

## Always Check
- Run `@openzeppelin/hardhat-upgrades` storage layout check before every upgrade
- Verify `implementation()` address changed after upgrade
- Test upgraded contract behavior against all existing test cases
