# Custom VM Rules

## Must-Follow
- Always implement the full `vm.VM` interface — missing methods cause node panics
- Always use AvalancheGo's versioning — your VM must declare compatible AvalancheGo version
- Always test custom VM on a local AvalancheGo network before Fuji
- Always handle state persistence correctly — VM state must survive node restarts

## Never Do
- Never use Avalanche CLI (`avalanche vm`) — it is deprecated; use Platform CLI and AvalancheGo directly
- Never modify AvalancheGo core — extend via plugin interface only
- Never skip consensus parameter validation — incorrect parameters cause chain stalls

## Always Check
- Verify your VM binary is loadable by AvalancheGo before registering on chain
- Test state sync and bootstrapping from scratch
- Confirm chain config file is correct format for your VM type
