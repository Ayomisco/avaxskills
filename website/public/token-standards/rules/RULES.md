# Token Standards Rules

## Must-Follow
- Always use OpenZeppelin implementations as the base for ERC-20, ERC-721, ERC-1155
- Always emit the required Transfer/Approval events — wallets and explorers depend on them
- Always implement `supportsInterface` for ERC-721 and ERC-1155 — required for marketplace compatibility
- Use SafeERC20 wrapper when calling external ERC-20 tokens — some tokens don't return bool on transfer

## Never Do
- Never implement ERC standards from scratch — use audited OpenZeppelin
- Never override `transfer` / `transferFrom` in ways that break the standard interface
- Never use `uint8` for token amounts — always `uint256` per ERC-20 spec

## Always Check
- Verify decimals are appropriate: 18 for fungible (ERC-20), 0 for NFTs (ERC-721/1155)
- Test `transferFrom` requires prior `approve` call — don't assume direct transfer works
- Confirm `totalSupply()` and `balanceOf()` match expectations after mint/burn
