# Subnet Deployment References

## Official Documentation
- Avalanche L1 Overview: https://docs.avax.network/avalanche-l1s
- Platform CLI Docs: https://build.avax.network
- L1 Toolbox: https://build.avax.network/tools/l1-toolbox
- Builder Console: https://build.avax.network/console/create-l1
- ACP-77 (L1 Validators): https://github.com/avalanche-foundation/ACPs/tree/main/ACPs/77-reinventing-subnets

## Platform CLI Install
```bash
curl -sSfL build.avax.network/install/platform-cli | sh
```

## Key Commands Reference
```bash
platform version
platform keys generate --name mykey
platform keys import --name mykey --private-key 0xKEY
platform wallet balance --key-name mykey --network fuji
platform transfer c-to-p --amount 0.5 --key-name mykey --network fuji
platform subnet create --key-name mykey --network fuji
platform chain create --subnet-id $ID --genesis genesis.json --name "Chain" --key-name mykey --network fuji
platform subnet convert-l1 --subnet-id $ID --chain-id $CID --manager $MGR --validators IP:9650 --validator-balance 1.0 --key-name mykey --network fuji
platform l1 register-validator --balance <avax> --pop <hex> --message <hex>
platform l1 add-balance --validation-id <id> --balance <avax>
platform node info --ip <address>
```

## ValidatorManager Contracts
- Package: `@avalabs/icm-contracts`
- PoAManager: permissioned validators
- NativeTokenStakingManager: permissionless PoS
- ERC20TokenStakingManager: permissionless with ERC-20

## Economics
- P-Chain validator slot: 1.33 AVAX/month
- Primary Network validator stake: 2,000 AVAX minimum
- Chain ID: check chainlist.org for conflicts

## GitHub Repos
- AvalancheGo: https://github.com/ava-labs/avalanchego
- Subnet-EVM: https://github.com/ava-labs/subnet-evm
- ICM Contracts (ValidatorManager): https://github.com/ava-labs/icm-contracts
