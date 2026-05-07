# Avalanche L1 Economics Rules

## Must-Follow
- Budget 1.33 AVAX/month/validator for P-Chain slot fees — fund at least 12 months upfront
- Always test fee configuration on Fuji before setting on mainnet — fees affect all users
- Design token allocation with at least 24 months of validator rewards runway
- Use NativeMinter precompile for any token minting — never mint in constructor for large supplies

## Never Do
- Never set minBaseFee = 0 without alternative spam protection (allowlist, rate limiting)
- Never allocate >20% to team without vesting — ecosystem will not trust the chain
- Never assume L1 validators need to stake AVAX — they only need P-Chain balance for slot fees
- Never launch without confirmed liquidity for gas token on C-Chain DEX

## Always Check
- Calculate total P-Chain cost for 1 year before committing to validator set size
- Verify gas token is bridgeable to C-Chain for liquidity
- Confirm treasury allocation can sustain operations for 18+ months before fee revenue is sufficient
