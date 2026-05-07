# EVM Hardhat References

## Official Documentation
- Hardhat Docs: https://hardhat.org/docs
- Hardhat Toolbox: https://hardhat.org/hardhat-runner/plugins/nomicfoundation-hardhat-toolbox
- Hardhat Gas Reporter: https://github.com/cgewecke/hardhat-gas-reporter
- OpenZeppelin Contracts: https://docs.openzeppelin.com/contracts

## Avalanche-Specific
- Avalanche C-Chain Mainnet RPC: https://api.avax.network/ext/bc/C/rpc
- Avalanche Fuji RPC: https://api.avax-test.network/ext/bc/C/rpc
- Snowtrace API Key: https://snowtrace.io/myapikey
- Contract Verification Docs: https://docs.avax.network/dapps/smart-contracts-ethereum

## Hardhat Config Template for Avalanche
```typescript
// hardhat.config.ts
import "@nomicfoundation/hardhat-toolbox";
import { HardhatUserConfig } from "hardhat/config";
import * as dotenv from "dotenv";
dotenv.config();

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.20",
    settings: { optimizer: { enabled: true, runs: 200 } }
  },
  networks: {
    avalanche: {
      url: "https://api.avax.network/ext/bc/C/rpc",
      chainId: 43114,
      accounts: [process.env.PRIVATE_KEY!]
    },
    fuji: {
      url: "https://api.avax-test.network/ext/bc/C/rpc",
      chainId: 43113,
      accounts: [process.env.PRIVATE_KEY!]
    }
  },
  etherscan: {
    apiKey: {
      avalanche: process.env.SNOWTRACE_API_KEY!,
      avalancheFujiTestnet: process.env.SNOWTRACE_API_KEY!
    },
    customChains: [
      {
        network: "avalanche",
        chainId: 43114,
        urls: {
          apiURL: "https://api.snowtrace.io/api",
          browserURL: "https://subnets.avax.network/c-chain"
        }
      },
      {
        network: "avalancheFujiTestnet",
        chainId: 43113,
        urls: {
          apiURL: "https://api-testnet.snowtrace.io/api",
          browserURL: "https://subnets-test.avax.network/c-chain"
        }
      }
    ]
  }
};

export default config;
```

## GitHub Repos
- Hardhat: https://github.com/NomicFoundation/hardhat
- OpenZeppelin Contracts: https://github.com/OpenZeppelin/openzeppelin-contracts
- Avalanche Starter Kit: https://github.com/ava-labs/avalanche-starter-kit
