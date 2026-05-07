import { AvaxLogo } from "../src/components/AvaxLogo";
import { CopyButton } from "../src/components/CopyButton";

const BASE = "https://avaxskills.com";

const AGENT_PROMPT = `Read ${BASE}/SKILL.md before building on Avalanche.`;

const SKILLS = [
  // TIER 0 — Beginner Onramp
  {
    tier: 0,
    label: "TIER 0 — Beginner Onramp",
    items: [
      { name: "Quickstart", slug: "quickstart", desc: "Zero to first Avalanche transaction in 10 minutes." },
      { name: "Wallet Setup", slug: "wallet-setup", desc: "MetaMask + Core Wallet for C-Chain and Subnets." },
      { name: "Get Testnet AVAX", slug: "get-testnet-avax", desc: "Fuji faucet, limits, troubleshooting." },
      { name: "First Contract", slug: "first-contract", desc: "Deploy Hello World on C-Chain with Remix." },
      { name: "Explorer Guide", slug: "explorer-guide", desc: "Read Snowtrace and C/P/X-Chain explorers." },
      { name: "Local Dev Environment", slug: "local-dev-environment", desc: "Full local Avalanche setup for development." },
    ],
  },
  // TIER 1 — EVM Core
  {
    tier: 1,
    label: "TIER 1 — EVM Core",
    items: [
      { name: "Hardhat", slug: "evm-hardhat", desc: "Compile, test, deploy, verify on Avalanche." },
      { name: "Foundry", slug: "evm-foundry", desc: "forge.toml, cast, fuzz testing, broadcast." },
      { name: "Scaffold Avax", slug: "scaffold-avax", desc: "Scaffold dApps from React/Next.js templates." },
      { name: "Contract Verification", slug: "contract-verification", desc: "Verify on Snowtrace, Routescan, Blockscout." },
      { name: "Avalanche RPC", slug: "avalanche-rpc", desc: "C/P/X-Chain RPC — balances, blocks, txs." },
      { name: "avalanchejs SDK", slug: "avalanche-js", desc: "P-Chain, X-Chain, staking, asset creation." },
      { name: "viem", slug: "viem", desc: "TypeScript client — wallet, public, contracts." },
      { name: "wagmi", slug: "wagmi", desc: "React hooks — connect, read, write." },
      { name: "Platform CLI", slug: "platform-cli", desc: "P-Chain ops: staking, subnets, transfers." },
      { name: "Migrate from Ethereum", slug: "migrate-from-ethereum", desc: "Port Ethereum dApps to Avalanche." },
      { name: "NFT Basics", slug: "nft-basics", desc: "ERC-721 and ERC-1155 on C-Chain." },
      { name: "Token Launch", slug: "token-launch", desc: "Launch an ERC-20 token end-to-end." },
      { name: "Data Feeds & Oracles", slug: "data-feeds-oracles", desc: "Chainlink and Pyth price feeds." },
      { name: "Avalanche SDK", slug: "avalanche-sdk", desc: "New TypeScript SDK for Avalanche." },
    ],
  },
  // TIER 2 — Avalanche Unique
  {
    tier: 2,
    label: "TIER 2 — Avalanche Unique",
    items: [
      { name: "Node Setup", slug: "node-setup", desc: "Install, configure, sync AvalancheGo." },
      { name: "Subnet Deployment", slug: "subnet-deployment", desc: "Genesis to mainnet — end-to-end L1 creation.", featured: true },
      { name: "Subnet-EVM Config", slug: "subnet-evm-config", desc: "Precompiles, gas limits, genesis design." },
      { name: "Warp Messaging", slug: "warp-messaging", desc: "Cross-chain via Teleporter — send/receive.", featured: true },
      { name: "Teleporter", slug: "teleporter", desc: "Deep dive — receipts, retry, fees." },
      { name: "Interchain Token Transfer", slug: "avalanche-ictt", desc: "Move tokens across L1s with ICTT." },
      { name: "Custom VM", slug: "custom-vm", desc: "Build and deploy custom virtual machines." },
      { name: "AvaCloud Indexing", slug: "avacloud-indexing", desc: "Data API, webhooks, event streaming." },
      { name: "Validator Management", slug: "validator-management", desc: "Add/remove validators, staking, uptime." },
      { name: "Contract Addresses", slug: "contract-addresses", desc: "All precompiles, WAVAX, Teleporter addresses." },
      { name: "Gas & Fees", slug: "gas", desc: "Dynamic fees, base fee, priority fee, estimation." },
      { name: "Precompiles", slug: "precompiles", desc: "NativeMinter, FeeManager, Warp, AllowList." },
      { name: "Avalanche L1 Economics", slug: "avalanche-l1-economics", desc: "Tokenomics design for custom L1s." },
      { name: "tmpnet", slug: "tmpnet", desc: "Temporary local networks for testing." },
      { name: "Blueprints", slug: "blueprints", desc: "Pre-configured L1 templates for gaming, DeFi, enterprise." },
      { name: "Avalanche Deploy", slug: "avalanche-deploy", desc: "Cloud playbooks for L1s and validators." },
    ],
  },
  // TIER 3 — Ecosystem Intelligence
  {
    tier: 3,
    label: "TIER 3 — Ecosystem Intelligence",
    items: [
      { name: "Hackathon Bounties", slug: "hackathon-bounties", desc: "Live bounties, winner patterns, DoraHacks.", featured: true },
      { name: "x402 Integration", slug: "x402-integration", desc: "AI agent micropayments — x402 on AVAX.", featured: true },
      { name: "DeFi Primitives", slug: "defi-primitives", desc: "AMMs, lending, yield — Trader Joe, BENQI, Aave." },
      { name: "Bridging", slug: "bridging", desc: "Native bridge, Wormhole, LayerZero, Warp." },
      { name: "AI Agent Patterns", slug: "ai-agent-patterns", desc: "On-chain AI agent architectures on Avalanche." },
      { name: "Performance Optimization", slug: "performance-optimization", desc: "Sub-second finality, gas opt, parallel execution." },
      { name: "RWA Tokenization", slug: "rwa-tokenization", desc: "Real world assets — compliance, KYC hooks.", featured: true },
      { name: "Token Standards", slug: "token-standards", desc: "ERC-20/1400/3643/3525 — when to use each." },
      { name: "Revenue Sharing Tokens", slug: "revenue-sharing-tokens", desc: "Split contracts, streaming, royalties." },
      { name: "Core Wallet", slug: "core-wallet", desc: "Core Wallet detection, signing, Subnet switching." },
      { name: "Event-Driven Backend", slug: "event-driven-backend", desc: "Backend patterns triggered by on-chain events." },
      { name: "AVAX Stablecoins", slug: "avax-stablecoins", desc: "USDC, USDT, EURC on C-Chain." },
    ],
  },
  // TIER 4 — Quality & Process
  {
    tier: 4,
    label: "TIER 4 — Quality & Process",
    items: [
      { name: "Security", slug: "security", desc: "Defensive Solidity, Subnet security, Warp trust." },
      { name: "Testing", slug: "testing", desc: "Unit, fuzz, fork testing — Hardhat + Foundry." },
      { name: "Audit", slug: "audit", desc: "Audit prompts and Avalanche-specific checklists." },
      { name: "QA", slug: "qa", desc: "Pre-launch checklist — Fuji to Mainnet gates." },
      { name: "Frontend UX", slug: "frontend-ux", desc: "dApp UX rules — chain switch, errors, wallet." },
      { name: "Orchestration", slug: "orchestration", desc: "Multi-agent coordination patterns." },
      { name: "KYC / AML", slug: "kyc-aml-integration", desc: "Synaps, Fractal, on-chain identity." },
      { name: "Wallet Integration", slug: "evm-wallet-integration", desc: "Reown AppKit, Dynamic, custom wagmi." },
    ],
  },
  // TIER 5 — Positioning
  {
    tier: 5,
    label: "TIER 5 — Positioning",
    items: [
      { name: "Why Avalanche", slug: "why-avalanche", desc: "Benchmarks, Subnet cases, EVM story." },
      { name: "Concepts", slug: "concepts", desc: "C/P/X-Chain, Snow consensus, Subnet vs L2." },
      { name: "Grant Playbook", slug: "grant-playbook", desc: "infraBUIDL(AI), Retro9000, Codebase grants." },
      { name: "Account Abstraction", slug: "account-abstraction", desc: "ERC-4337 — bundlers, paymasters, smart accounts." },
      { name: "ACPs", slug: "acps", desc: "Avalanche Community Proposals — track and align." },
    ],
  },
  // TIER 6 — Advanced Pro
  {
    tier: 6,
    label: "TIER 6 — Advanced Pro",
    items: [
      { name: "Upgradeable Contracts", slug: "upgradeable-contracts", desc: "UUPS, Transparent, Beacon proxy patterns." },
      { name: "Cross-Subnet dApp", slug: "cross-subnet-dapp", desc: "Apps spanning multiple Subnets via Warp." },
      { name: "Subnet Governance", slug: "subnet-governance", desc: "On-chain governance for custom L1s." },
      { name: "Indexing & Subgraphs", slug: "indexing-subgraph", desc: "The Graph + custom indexers on Avalanche." },
      { name: "Safe Multisig", slug: "safe-multisig", desc: "Gnosis Safe on Avalanche — treasury, DAO, access." },
      { name: "Validator Manager", slug: "validator-manager-contract", desc: "ValidatorManager contract (ACP-99)." },
    ],
  },
];

const TIER_COLORS: Record<number, string> = {
  0: "#22c55e",
  1: "#3b82f6",
  2: "#E84142",
  3: "#a855f7",
  4: "#f59e0b",
  5: "#6b7280",
  6: "#1a1a1a",
};

export default function Home() {
  const totalSkills = SKILLS.reduce((acc, t) => acc + t.items.length, 0);

  return (
    <div className="min-h-screen bg-white text-[#0f0f0f]">
      {/* Header */}
      <header className="border-b border-[#e8e8e8] px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <AvaxLogo size={28} />
          <span
            className="text-xl font-bold tracking-tight"
            style={{ letterSpacing: "-0.02em" }}
          >
            <span style={{ color: "#E84142" }}>AVAX</span>
            <span>SKILLS</span>
          </span>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-12">
        {/* Hero */}
        <div className="mb-12">
          <div
            className="inline-block border border-[#e8e8e8] rounded-xl px-5 py-4 mb-8"
            style={{ background: "#fafafa" }}
          >
            <div className="flex items-center gap-3">
              <AvaxLogo size={40} />
              <span
                className="text-3xl font-bold tracking-tight"
                style={{ letterSpacing: "-0.03em" }}
              >
                <span style={{ color: "#E84142" }}>AVAX</span>
                <span>SKILLS</span>
              </span>
            </div>
          </div>

          <h1 className="text-2xl font-bold mb-3" style={{ letterSpacing: "-0.02em" }}>
            AVAXSKILLS
          </h1>
          <p className="text-[#6b6b6b] text-base mb-1">
            The missing layer between AI agents and Avalanche apps
          </p>
          <p className="text-[#6b6b6b] text-sm">
            Modular{" "}
            <code className="bg-[#f0f0f0] px-1.5 py-0.5 rounded text-xs font-mono text-[#0f0f0f]">
              SKILL.md
            </code>{" "}
            guides for{" "}
            <strong className="text-[#0f0f0f]">Avalanche</strong> — Subnets,
            Warp, x402, DeFi. Agents pull markdown over HTTPS;{" "}
            <strong>no install</strong>.
          </p>
        </div>

        {/* USE WITH AI AGENTS */}
        <div
          className="border border-[#e8e8e8] rounded-xl p-5 mb-8"
          style={{ background: "#fafafa" }}
        >
          <p className="text-xs font-semibold uppercase tracking-widest text-[#6b6b6b] mb-3">
            USE WITH AI AGENTS
          </p>
          <p className="text-sm text-[#333] mb-3">
            Copy this into Cursor, Claude Code, ChatGPT, Copilot, or any coding agent before you build on Avalanche:
          </p>
          <div className="relative">
            <div
              className="font-mono text-sm px-4 py-3 rounded-lg border border-[#e0e0e0] bg-white pr-16 break-all"
              style={{ color: "#0f0f0f" }}
            >
              {AGENT_PROMPT}
            </div>
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <CopyButton text={AGENT_PROMPT} />
            </div>
          </div>
        </div>

        {/* CTAs */}
        <div className="flex flex-wrap gap-3 mb-10">
          <a
            href={`${BASE}/SKILL.md`}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white transition-opacity hover:opacity-90"
            style={{ background: "#E84142" }}
            target="_blank"
            rel="noopener noreferrer"
          >
            Full index (SKILL.md) →
          </a>
          <a
            href={`${BASE}/quickstart/SKILL.md`}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold border border-[#e0e0e0] hover:border-[#E84142] hover:text-[#E84142] transition-colors"
            target="_blank"
            rel="noopener noreferrer"
          >
            Start with Quickstart →
          </a>
          <a
            href={`${BASE}/llms.txt`}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold border border-[#e0e0e0] hover:border-[#E84142] hover:text-[#E84142] transition-colors"
            target="_blank"
            rel="noopener noreferrer"
          >
            llms.txt
          </a>
        </div>

        <p className="text-sm text-[#6b6b6b] mb-10">
          Each skill is a standalone markdown file. Use{" "}
          <code className="bg-[#f0f0f0] px-1.5 py-0.5 rounded text-xs font-mono text-[#0f0f0f]">
            curl
          </code>{" "}
          or{" "}
          <code className="bg-[#f0f0f0] px-1.5 py-0.5 rounded text-xs font-mono text-[#0f0f0f]">
            fetch()
          </code>
          .
        </p>

        {/* HOW TO FETCH */}
        <section className="mb-10">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-[#6b6b6b] mb-3">
            HOW TO FETCH
          </h2>
          <div className="relative">
            <pre
              className="font-mono text-sm bg-[#0f0f0f] text-[#e8e8e8] px-5 py-4 rounded-xl overflow-x-auto"
              style={{ lineHeight: "1.7" }}
            >
              <code>{`curl -sSL ${BASE}/SKILL.md
curl -sSL ${BASE}/quickstart/SKILL.md
curl -sSL ${BASE}/subnet-deployment/SKILL.md
curl -sSL ${BASE}/x402-integration/SKILL.md`}</code>
            </pre>
          </div>
        </section>

        {/* AGENT API */}
        <section className="mb-12">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-[#6b6b6b] mb-3">
            AGENT API (JSON)
          </h2>
          <p className="text-sm text-[#6b6b6b] mb-3">
            Same{" "}
            <code className="bg-[#f0f0f0] px-1.5 py-0.5 rounded text-xs font-mono text-[#0f0f0f]">
              SKILL.md
            </code>{" "}
            files, structured for tools and agents —{" "}
            <a
              href={`${BASE}/api/skill?topic=subnet`}
              className="underline underline-offset-2"
              style={{ color: "#E84142" }}
            >
              /api/skill?topic=subnet
            </a>
            ,{" "}
            <a
              href={`${BASE}/api/search?q=warp`}
              className="underline underline-offset-2"
              style={{ color: "#E84142" }}
            >
              /api/search?q=warp
            </a>
            . Optional{" "}
            <code className="bg-[#f0f0f0] px-1.5 py-0.5 rounded text-xs font-mono text-[#0f0f0f]">
              format=markdown
            </code>
            ,{" "}
            <code className="bg-[#f0f0f0] px-1.5 py-0.5 rounded text-xs font-mono text-[#0f0f0f]">
              depth=2
            </code>{" "}
            for linked topics. CORS open.
          </p>
          <div className="flex gap-3">
            <a
              href={`${BASE}/api/skills.json`}
              className="text-sm underline underline-offset-2 transition-colors"
              style={{ color: "#E84142" }}
            >
              skills.json ({totalSkills} skills)
            </a>
          </div>
        </section>

        {/* SKILLS LIST */}
        <section className="mb-16">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-[#6b6b6b] mb-6">
            SKILLS
          </h2>
          <div className="space-y-8">
            {SKILLS.map((tier) => (
              <div key={tier.tier}>
                {/* Tier label */}
                <div className="flex items-center gap-2 mb-3">
                  <div
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ background: TIER_COLORS[tier.tier] }}
                  />
                  <span className="text-xs font-semibold uppercase tracking-widest text-[#6b6b6b]">
                    {tier.label}
                  </span>
                </div>

                {/* Skills */}
                <div className="border border-[#e8e8e8] rounded-xl overflow-hidden">
                  {tier.items.map((skill, i) => (
                    <a
                      key={skill.slug}
                      href={`${BASE}/${skill.slug}/SKILL.md`}
                      className={`flex items-start gap-4 px-5 py-3.5 hover:bg-[#fafafa] transition-colors group ${
                        i < tier.items.length - 1
                          ? "border-b border-[#e8e8e8]"
                          : ""
                      }`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span
                            className="text-sm font-semibold group-hover:underline"
                            style={{
                              color: skill.featured ? "#E84142" : "#0f0f0f",
                              textDecorationColor: "#E84142",
                            }}
                          >
                            {skill.name}
                          </span>
                          {skill.featured && (
                            <span
                              className="text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider"
                              style={{
                                background: "#fff0f0",
                                color: "#E84142",
                                border: "1px solid #ffd0d0",
                              }}
                            >
                              Phase 1
                            </span>
                          )}
                        </div>
                        <span className="text-sm text-[#6b6b6b]">
                          {skill.desc}
                        </span>
                      </div>
                      <span className="text-xs font-mono text-[#aaa] flex-shrink-0 mt-0.5 group-hover:text-[#E84142] transition-colors">
                        /{skill.slug}/SKILL.md
                      </span>
                    </a>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Network Reference */}
        <section className="mb-12">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-[#6b6b6b] mb-4">
            NETWORK REFERENCE
          </h2>
          <div className="border border-[#e8e8e8] rounded-xl overflow-hidden">
            {[
              {
                name: "C-Chain Mainnet",
                chainId: "43114",
                rpc: "https://api.avax.network/ext/bc/C/rpc",
                explorer: "snowtrace.io",
              },
              {
                name: "Fuji Testnet",
                chainId: "43113",
                rpc: "https://api.avax-test.network/ext/bc/C/rpc",
                explorer: "testnet.snowtrace.io",
              },
            ].map((net, i) => (
              <div
                key={net.name}
                className={`px-5 py-3.5 ${i === 0 ? "border-b border-[#e8e8e8]" : ""}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold mb-1">{net.name}</p>
                    <p className="text-xs font-mono text-[#6b6b6b]">{net.rpc}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs font-mono text-[#E84142]">
                      Chain ID: {net.chainId}
                    </p>
                    <a
                      href={`https://${net.explorer}`}
                      className="text-xs text-[#6b6b6b] hover:text-[#E84142] transition-colors"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {net.explorer}
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#e8e8e8] px-6 py-8">
        <div className="max-w-3xl mx-auto">
          {/* Links */}
          <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-[#6b6b6b] mb-6">
            <a
              href="https://build.avax.network"
              className="hover:text-[#E84142] transition-colors"
              target="_blank"
              rel="noopener noreferrer"
            >
              Avalanche Builder Hub
            </a>
            <a
              href="https://discord.gg/avalanche"
              className="hover:text-[#E84142] transition-colors"
              target="_blank"
              rel="noopener noreferrer"
            >
              Discord
            </a>
            <a
              href="https://x.com/ayomisco_s"
              className="hover:text-[#E84142] transition-colors"
              target="_blank"
              rel="noopener noreferrer"
            >
              @ayomisco_s on X
            </a>
            <a
              href="https://github.com/avalanche-org/avalanche-skills"
              className="hover:text-[#E84142] transition-colors"
              target="_blank"
              rel="noopener noreferrer"
            >
              GitHub
            </a>
            <a
              href="https://dorahacks.io/avalanche"
              className="hover:text-[#E84142] transition-colors"
              target="_blank"
              rel="noopener noreferrer"
            >
              DoraHacks
            </a>
            <a
              href="https://faucet.avax.network"
              className="hover:text-[#E84142] transition-colors"
              target="_blank"
              rel="noopener noreferrer"
            >
              Testnet faucet
            </a>
            <a
              href={`${BASE}/SKILL.md`}
              className="hover:text-[#E84142] transition-colors"
            >
              Skill index (markdown)
            </a>
            <a
              href={`${BASE}/llms.txt`}
              className="hover:text-[#E84142] transition-colors"
            >
              llms.txt
            </a>
          </div>

          {/* Bottom row */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-[#aaa]">
              Apache-2.0 · Open source — PRs welcome. Verify chain IDs, RPCs, and
              contract addresses against{" "}
              <a
                href="https://build.avax.network/docs"
                className="underline hover:text-[#E84142]"
                target="_blank"
                rel="noopener noreferrer"
              >
                build.avax.network/docs
              </a>{" "}
              before production.
            </p>
            <div className="flex items-center gap-4 text-xs text-[#aaa]">
              <a
                href={`${BASE}/robots.txt`}
                className="hover:text-[#E84142] transition-colors"
              >
                robots.txt
              </a>
              <span>·</span>
              <a
                href={`${BASE}/sitemap.xml`}
                className="hover:text-[#E84142] transition-colors"
              >
                sitemap.xml
              </a>
            </div>
          </div>

          {/* Share prompt */}
          <div className="mt-5 pt-5 border-t border-[#f0f0f0] flex flex-wrap gap-x-5 gap-y-2 text-xs">
            <a
              href="https://twitter.com/intent/tweet?text=Read%20https%3A%2F%2Favaxskills.com%2FSKILL.md%20before%20building%20on%20Avalanche.%0A%0AThe%20best%20AI%20agent%20skills%20package%20for%20%40avalancheavax%20%E2%9D%84%EF%B8%8F"
              className="font-semibold hover:text-[#E84142] transition-colors"
              style={{ color: "#E84142" }}
              target="_blank"
              rel="noopener noreferrer"
            >
              Share agent prompt on X
            </a>
            <span className="text-[#ddd]">·</span>
            <a
              href="https://github.com/avalanche-org/avalanche-skills"
              className="hover:text-[#E84142] transition-colors text-[#6b6b6b]"
              target="_blank"
              rel="noopener noreferrer"
            >
              Star & explore on GitHub
            </a>
            <span className="text-[#ddd]">·</span>
            <a
              href="https://github.com/avalanche-org/avalanche-skills/pulls"
              className="hover:text-[#E84142] transition-colors text-[#6b6b6b]"
              target="_blank"
              rel="noopener noreferrer"
            >
              Contribute via PR (edit SKILL.md)
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
