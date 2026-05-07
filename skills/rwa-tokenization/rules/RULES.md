# RWA Tokenization Rules

## Must-Follow
- Always implement transfer restrictions for regulated assets — ERC-1400 or custom allowlist
- Always integrate KYC/AML checks before allowing token transfers
- Always tie off-chain legal documentation to on-chain token via verifiable hash
- Always use compliant custody or escrow for backing assets

## Never Do
- Never tokenize real assets without legal counsel — securities regulations vary by jurisdiction
- Never allow permissionless transfers of securities tokens — regulatory violation
- Never store asset ownership documentation on-chain in full — store hash + off-chain URI only
- Never launch RWA token without compliance review in target markets

## Always Check
- Confirm token qualifies as utility vs security under applicable law before architecture decisions
- Verify custodian is regulated and insured for the asset type
- Test KYC gate enforces on all transfer methods including `transferFrom` and batch operations
