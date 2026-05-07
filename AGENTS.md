# AGENTS.md — Wiring Avalanche Skills Into Your Agent

> Avalanche Skills works with any AI agent that can fetch URLs or read local files.
> The simplest integration is one sentence in your system prompt.

---

## The Web Method (Recommended — Zero Install)

Add one line to your agent's system prompt or context:

```
Read https://avaxskills.com/SKILL.md before building anything on Avalanche.
```

The agent fetches the root index, sees all 49 skills with URLs, then fetches whichever are relevant to the task. You can also be specific:

```
Read https://avaxskills.com/subnet-deployment/SKILL.md before writing any Subnet code.
Read https://avaxskills.com/x402-integration/SKILL.md before implementing agent payments.
```

---

## Claude Code (claude.ai/code)

**Option 1 — CLAUDE.md (project-level, recommended):**
```markdown
## Avalanche Skills
Read https://avaxskills.com/SKILL.md before writing any Avalanche or blockchain code.
```

**Option 2 — Install locally:**
```bash
npx openskills install avalanche-org/avalanche-skills -g
```
This adds skill instructions to your `.claude/skills/` directory and Claude Code picks them up automatically.

**Option 3 — Inline fetch in prompt:**
```
fetch https://avaxskills.com/subnet-deployment/SKILL.md and then help me create a Subnet
```

---

## Cursor

**`.cursor/rules` or `.cursorrules` file:**
```
When working on Avalanche projects, fetch and follow the skill at https://avaxskills.com/SKILL.md
For Subnet work: https://avaxskills.com/subnet-deployment/SKILL.md
For cross-chain work: https://avaxskills.com/warp-messaging/SKILL.md
```

**Or install globally:**
```bash
npx openskills install avalanche-org/avalanche-skills -g
```

---

## GitHub Copilot

```bash
gh skill install avalanche-org/avalanche-skills
gh skill install avalanche-org/avalanche-skills --skill subnet-deployment
```

Or add to `.github/copilot-instructions.md`:
```markdown
Read https://avaxskills.com/SKILL.md when working on Avalanche code.
```

---

## Windsurf

Add to `.windsurf/rules.md` or the global rules in settings:
```
For Avalanche development: fetch https://avaxskills.com/SKILL.md first.
```

---

## Codex / OpenAI Agents

Add to your agent's system message:
```
When the user asks about Avalanche development, first fetch https://avaxskills.com/SKILL.md 
to get the skill index, then fetch the relevant specific skill(s) before answering.
```

---

## Gemini CLI

Add to your Gemini system context or use inline:
```
See https://avaxskills.com/SKILL.md for Avalanche development skills and patterns.
```

---

## MCP Servers

If your agent supports MCP (Model Context Protocol), you can serve these skills locally:

```bash
npx openskills install avalanche-org/avalanche-skills -g
# Skills are now available at ~/.openskills/avalanche-org/avalanche-skills/
```

Point your MCP file server at that directory.

---

## Skill Selection Guide

| Task | Skills to fetch |
|---|---|
| First time on Avalanche | `quickstart` → `wallet-setup` → `first-contract` |
| Build a dApp | `scaffold-avax` → `evm-hardhat` → `viem` → `wagmi` |
| Create a custom L1 | `concepts` → `subnet-deployment` → `subnet-evm-config` |
| Cross-chain messaging | `warp-messaging` → `teleporter` |
| AI agent with payments | `x402-integration` → `ai-agent-patterns` |
| Tokenize a real asset | `rwa-tokenization` → `token-standards` → `kyc-aml-integration` |
| Hackathon | `hackathon-bounties` → `quickstart` → relevant skill |
| Security review | `security` → `audit` → `testing` |
| Mainnet launch | `qa` → `security` → `contract-verification` |
| Apply for grants | `grant-playbook` |

---

## Auto-Discovery

Agents that support `llms.txt` discovery will find this package automatically:
- URL: `https://avaxskills.com/llms.txt`
- Sitemap: `https://avaxskills.com/sitemap.xml`
- API: `https://avaxskills.com/api/skills.json`
