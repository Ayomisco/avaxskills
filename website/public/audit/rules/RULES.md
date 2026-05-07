# Audit Rules

## Must-Follow
- Always audit before mainnet deployment — no exceptions for contracts holding value
- Always use a reputable firm: Trail of Bits, OpenZeppelin, Halborn, Cyfrin, or equivalent
- Always fix Critical and High findings before launch — Medium findings require documented risk acceptance
- Always publish the audit report — hidden audits signal bad faith to users

## Never Do
- Never deploy unaudited contracts that hold user funds
- Never dismiss findings as "theoretical" without proof they cannot be exploited
- Never start audit with incomplete code — scope creep delays and invalidates results
- Never skip re-audit after significant code changes post-audit

## Always Check
- Verify all findings are addressed or explicitly documented as accepted risk
- Confirm audit scope covered all contracts including inherited OpenZeppelin modifications
- Check audit date — code older than 6 months with no audit update is a red flag
