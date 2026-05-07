# Revenue Sharing Tokens Rules

## Must-Follow
- Always use ERC-20 + ERC-2981 or custom dividend distribution — never send AVAX in transfer loops
- Always use a "points accumulation" pattern (e.g., OpenZeppelin PaymentSplitter or similar) — push payments fail
- Always handle the zero-holders edge case — dividing by 0 holders causes revert
- Always emit events for every distribution for auditability

## Never Do
- Never loop over all holders to distribute revenue — unbounded loops hit block gas limit
- Never calculate revenue share during token transfers — too expensive and error-prone
- Never allow dust amounts to accumulate without a claim threshold
- Never distribute to address(0) — burn tokens are excluded from revenue share

## Always Check
- Test with maximum realistic holder count to verify gas stays within block limit
- Verify precision math uses proper fixed-point arithmetic — Solidity truncates integer division
- Confirm revenue source (fees, royalties) is routed to the distribution contract before launch
