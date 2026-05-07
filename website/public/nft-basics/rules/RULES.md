# NFT Basics Rules

## Must-Follow
- Always use OpenZeppelin ERC-721 or ERC-1155 as the base — never implement from scratch
- Always implement `supportsInterface(bytes4)` — marketplaces use ERC-165 for detection
- Always store metadata URI pointing to immutable or IPFS storage — centralized servers can go down
- For ERC-1155, always implement batch minting and batch transfer for gas efficiency

## Never Do
- Never store image data on-chain — use IPFS (Pinata, NFT.Storage) or Arweave
- Never use sequential tokenIds predictably if rarity matters — use randomized reveal pattern
- Never skip access control on `mint` — public unrestricted minting is almost never correct
- Never assume `ownerOf` won't revert — it reverts for burned tokens

## Always Check
- Verify IPFS metadata follows OpenSea metadata standard (name, description, image, attributes)
- Test marketplace compatibility on Fuji/testnet using OpenSea Testnet before mainnet launch
- Confirm royalty is set via ERC-2981 `royaltyInfo` — most marketplaces check this standard
