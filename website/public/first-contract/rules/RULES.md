# First Contract Rules

## Must-Follow
- Always deploy to Fuji first — never to mainnet as your first deployment
- Always get testnet AVAX from `https://faucet.avax.network` before testing
- Always verify the contract on the explorer after deployment
- Use OpenZeppelin base contracts — don't implement ERC standards from scratch

## Never Do
- Never deploy with a private key that holds real mainnet AVAX during development
- Never skip the compilation step — always compile fresh before deployment
- Never use `pragma solidity ^0.8.0` without understanding what version you're actually using

## Always Check
- Confirm contract compiled without warnings before deploying
- Verify deployment transaction on `https://subnets-test.avax.network/c-chain`
- Fuji RPC: `https://api.avax-test.network/ext/bc/C/rpc`, Chain ID: 43113
