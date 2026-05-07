# Subnet Governance Rules

## Must-Follow
- Always use timelock on governance contracts — no instant execution of sensitive changes
- Always require a quorum that is realistic given token distribution — too high quorum = governance gridlock
- Always emit events for every governance action (proposal, vote, execution)
- Use OpenZeppelin Governor as the base — battle-tested and audited

## Never Do
- Never give admin EOA the ability to bypass governance votes for protocol changes
- Never set quorum so low that a small token holder can pass proposals unilaterally
- Never skip vote delay — miners/validators can manipulate instant-vote proposals
- Never make governance changes irreversible without an escape hatch for critical bugs

## Always Check
- Test governance flow end-to-end: propose → vote → timelock → execute
- Verify quorum calculation handles token delegation correctly
- Confirm timelock duration is sufficient for community review (minimum 48 hours)
