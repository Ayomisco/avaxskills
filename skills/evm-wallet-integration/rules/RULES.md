# EVM Wallet Integration Rules

## Must-Follow
- Always handle wallet connection errors gracefully — show user-friendly messages
- Always prompt users to switch to the correct Avalanche network if wrong chain is detected
- Always use `eth_requestAccounts` for initial connection — never assume wallet is connected
- Always listen for `accountsChanged` and `chainChanged` events from the provider

## Never Do
- Never sign transactions without user confirmation — never auto-sign on behalf of users
- Never cache user addresses without re-validating on reconnect
- Never skip network validation before sending transactions — wrong chain = lost funds

## Always Check
- Verify chain ID before every transaction (`eth_chainId`)
- Handle `user rejected request` (code 4001) without showing an error crash screen
- Test with MetaMask AND Core Wallet — behavior can differ between wallets
