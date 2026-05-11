---
name: "nft-basics"
version: "1.0.0"
spec: "agentskills@1.0"
license: "Apache-2.0"
tier: 1
description: "Deploy NFTs on Avalanche — ERC-721 and ERC-1155 contracts, IPFS metadata, minting, royalties (EIP-2981), and connecting to marketplaces."
trigger: |
  Use when: user wants to create NFTs, deploy an NFT collection, build an NFT marketplace, set up NFT metadata on IPFS, or implement NFT royalties on Avalanche.
last_updated: "2026-05-07"
avalanche_networks: [c-chain, fuji, custom-l1]
related_skills:
  - token-standards
  - evm-hardhat
  - evm-foundry
  - contract-verification
  - rwa-tokenization
---

## Overview

Deploying NFTs on Avalanche C-Chain gives you 1-2s finality and gas costs orders of magnitude lower than Ethereum mainnet. The standards are identical: ERC-721 for unique tokens, ERC-1155 for multi-editions. Marketplaces like Joepegs, OpenSea (via Polygon bridge), and custom solutions all support Avalanche.

## When to fetch

Fetch when someone wants to create an NFT collection, deploy ERC-721/1155, set up NFT metadata, implement royalties, or connect an NFT to a marketplace.

## ERC-721 — Unique NFTs

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Royalty.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract AvalancheNFT is ERC721URIStorage, ERC721Royalty, Ownable {
    uint256 private _nextTokenId;

    uint256 public maxSupply;
    uint256 public mintPrice;
    bool public publicMintOpen;

    event NFTMinted(address indexed to, uint256 indexed tokenId, string tokenURI);

    constructor(
        string memory name,
        string memory symbol,
        uint256 _maxSupply,
        uint256 _mintPrice,
        address royaltyReceiver,
        uint96 royaltyBps // 500 = 5%
    ) ERC721(name, symbol) Ownable(msg.sender) {
        maxSupply = _maxSupply;
        mintPrice = _mintPrice;
        // EIP-2981 royalties: paid on secondary sales
        _setDefaultRoyalty(royaltyReceiver, royaltyBps);
    }

    function mint(address to, string memory uri) external payable returns (uint256) {
        require(publicMintOpen || msg.sender == owner(), "minting closed");
        require(msg.value >= mintPrice, "insufficient payment");
        require(_nextTokenId < maxSupply, "sold out");

        uint256 newId = _nextTokenId++;
        _safeMint(to, newId);
        _setTokenURI(newId, uri);

        emit NFTMinted(to, newId, uri);
        return newId;
    }

    function setPublicMint(bool open) external onlyOwner {
        publicMintOpen = open;
    }

    function withdraw() external onlyOwner {
        (bool ok, ) = owner().call{value: address(this).balance}("");
        require(ok, "withdraw failed");
    }

    // Required overrides for multiple inheritance
    function tokenURI(uint256 tokenId)
        public view override(ERC721, ERC721URIStorage) returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId)
        public view override(ERC721URIStorage, ERC721Royalty) returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
```

## ERC-1155 — Multi-Edition NFTs

Use ERC-1155 for collections with multiple copies of each item (e.g., game items, editions):

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Supply.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract GameItems is ERC1155Supply, Ownable {
    // Token IDs
    uint256 public constant SWORD = 1;
    uint256 public constant SHIELD = 2;
    uint256 public constant POTION = 3;

    mapping(uint256 => uint256) public maxSupply;
    mapping(uint256 => uint256) public price;

    constructor() ERC1155("https://api.mygame.com/metadata/{id}.json") Ownable(msg.sender) {
        maxSupply[SWORD] = 1000;
        maxSupply[SHIELD] = 2000;
        maxSupply[POTION] = 100000;
        price[SWORD] = 0.1 ether;
        price[SHIELD] = 0.05 ether;
        price[POTION] = 0.001 ether;
    }

    function mint(uint256 id, uint256 amount) external payable {
        require(msg.value >= price[id] * amount, "insufficient payment");
        require(totalSupply(id) + amount <= maxSupply[id], "exceeds max supply");
        _mint(msg.sender, id, amount, "");
    }

    function mintBatch(uint256[] memory ids, uint256[] memory amounts) external payable {
        // Calculate total price
        uint256 total;
        for (uint i = 0; i < ids.length; i++) {
            total += price[ids[i]] * amounts[i];
            require(totalSupply(ids[i]) + amounts[i] <= maxSupply[ids[i]], "exceeds max supply");
        }
        require(msg.value >= total, "insufficient payment");
        _mintBatch(msg.sender, ids, amounts, "");
    }

    function setURI(string memory newuri) external onlyOwner {
        _setURI(newuri);
    }
}
```

## NFT Metadata (IPFS)

### Metadata JSON Standard

```json
{
  "name": "Avalanche Dragon #42",
  "description": "A legendary dragon forged in the Avalanche mountains.",
  "image": "ipfs://QmXxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx/42.png",
  "external_url": "https://myproject.com/nft/42",
  "attributes": [
    { "trait_type": "Element", "value": "Fire" },
    { "trait_type": "Rarity", "value": "Legendary" },
    { "trait_type": "Power", "value": 9500, "display_type": "number" },
    { "trait_type": "Generation", "value": 1, "display_type": "number" }
  ]
}
```

### Upload to IPFS (NFT.Storage)

```typescript
import { NFTStorage, File } from "nft.storage";

async function uploadMetadata(imagePath: string, name: string, attributes: any[]) {
  const client = new NFTStorage({ token: process.env.NFT_STORAGE_API_KEY! });

  const imageData = fs.readFileSync(imagePath);
  const imageFile = new File([imageData], "image.png", { type: "image/png" });

  const metadata = await client.store({
    name,
    description: `${name} — Minted on Avalanche`,
    image: imageFile,
    attributes
  });

  // Returns: ipfs://Qm.../metadata.json
  return metadata.url;
}
```

Alternatives: Pinata (`pinata.cloud`), web3.storage, Arweave (permanent storage).

### Batch Upload Script

```typescript
// scripts/upload-collection.ts
import { NFTStorage, File } from "nft.storage";
import * as fs from "fs";
import * as path from "path";

async function uploadCollection(imageDir: string, count: number) {
  const client = new NFTStorage({ token: process.env.NFT_STORAGE_API_KEY! });
  const uris: string[] = [];

  for (let i = 1; i <= count; i++) {
    const imagePath = path.join(imageDir, `${i}.png`);
    const imageFile = new File([fs.readFileSync(imagePath)], `${i}.png`, { type: "image/png" });
    
    const meta = await client.store({
      name: `My NFT #${i}`,
      description: "My Avalanche NFT Collection",
      image: imageFile,
      attributes: [{ trait_type: "Number", value: i }]
    });
    
    uris.push(meta.url);
    console.log(`Uploaded ${i}/${count}: ${meta.url}`);
  }

  fs.writeFileSync("uris.json", JSON.stringify(uris, null, 2));
  return uris;
}
```

## Deploy + Mint Script

```typescript
// scripts/deploy-nft.ts
import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying from:", deployer.address);

  const NFT = await ethers.getContractFactory("AvalancheNFT");
  const nft = await NFT.deploy(
    "Avalanche Dragons",           // name
    "AVXD",                        // symbol
    10000,                         // maxSupply
    ethers.parseEther("0.05"),     // mintPrice: 0.05 AVAX
    deployer.address,              // royaltyReceiver
    500                            // royaltyBps: 5%
  );
  await nft.waitForDeployment();
  const address = await nft.getAddress();
  console.log("NFT deployed at:", address);

  // Enable public minting
  await nft.setPublicMint(true);

  // Mint a test token
  const uri = "ipfs://QmXxx.../1.json";
  const tx = await nft.mint(deployer.address, uri, { value: ethers.parseEther("0.05") });
  await tx.wait();
  console.log("Minted token 1");

  // Verify on explorer
  console.log(`Explorer: https://subnets-test.avax.network/c-chain/address/${address}`);
}

main().catch(console.error);
```

## Hardhat Config

```typescript
// hardhat.config.ts
import "@nomicfoundation/hardhat-toolbox";

export default {
  solidity: {
    version: "0.8.20",
    settings: { optimizer: { enabled: true, runs: 200 } }
  },
  networks: {
    fuji: {
      url: "https://api.avax-test.network/ext/bc/C/rpc",
      chainId: 43113,
      accounts: [process.env.PRIVATE_KEY!]
    },
    avalanche: {
      url: "https://api.avax.network/ext/bc/C/rpc",
      chainId: 43114,
      accounts: [process.env.PRIVATE_KEY!]
    }
  }
};
```

## Marketplaces on Avalanche

| Marketplace | URL | Standard |
|---|---|---|
| Joepegs | https://joepegs.com | ERC-721, ERC-1155 |
| Element | https://element.market/avax | ERC-721, ERC-1155 |
| NFTrade | https://nftrade.com | ERC-721, ERC-1155 |

To list: deploy contract, verify on explorer, submit to marketplace via their listing page.

## Core Workflow

1. Write ERC-721 or ERC-1155 contract (inherit OpenZeppelin base)
2. Prepare off-chain metadata JSON and upload to IPFS (Pinata / NFT.Storage)
3. Set `_baseURI()` to point at your IPFS CID gateway URL
4. Deploy to Fuji, test `safeMint`, verify `tokenURI` returns correct metadata
5. Deploy to mainnet, verify on Snowtrace, list on Joepegs / Element

## Key concepts

| Concept | Description |
|---|---|
| ERC-721 | Non-fungible tokens — each token has a unique ID and owner |
| ERC-1155 | Semi-fungible — multiple copies per token ID, more gas-efficient for collections |
| `tokenURI` | Returns metadata URL for a given token ID |
| EIP-2981 | Royalty standard — `royaltyInfo(tokenId, salePrice)` returns `(receiver, amount)` |
| IPFS CID | Content-addressed identifier — metadata persists even if your server goes down |
| Element | Avalanche NFT marketplace at `element.market/avax` |

## Common errors

| Error | Cause | Fix |
|---|---|---|
| `sold out` | Token ID exceeds maxSupply | Check `_tokenIds.current() < maxSupply` |
| `insufficient payment` | Sent less AVAX than mintPrice | `msg.value >= mintPrice` check |
| Metadata not showing | Wrong IPFS URI format | Use `ipfs://Qm...` not `https://ipfs.io/ipfs/...` |
| `ERC721: invalid token ID` | Token doesn't exist | Only call `tokenURI` for minted tokens |
| Royalties not paid | Marketplace doesn't support EIP-2981 | Check marketplace supports EIP-2981 |

## Next skills

- `token-standards` — deeper ERC-721/1155/4626 knowledge
- `contract-verification` — verify your NFT contract on explorer
- `rwa-tokenization` — tokenizing real-world assets as NFTs
