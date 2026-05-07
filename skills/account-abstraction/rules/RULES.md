# Account Abstraction Rules

## Must-Follow
- Always implement EIP-4337 EntryPoint interface — use the canonical EntryPoint `0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789`
- Always validate `userOp.sender` and nonces in `validateUserOp`
- Always return `SIG_VALIDATION_FAILED` (1) on signature failure, never revert
- Use Paymaster for gas sponsorship — never ask users to hold ETH/AVAX for first transactions

## Never Do
- Never store sensitive auth data (private keys, seeds) in the smart account contract
- Never skip replay protection (nonce validation)
- Never implement custom EntryPoint — use the canonical singleton
- Never assume `msg.sender` is the user — in AA, sender is EntryPoint

## Always Check
- Confirm target chain has EntryPoint deployed at canonical address
- Verify Paymaster has sufficient funds to cover sponsored transactions
- Test `validateUserOp` handles all failure modes gracefully
