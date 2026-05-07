---
name: "ai-agent-patterns"
version: "1.0.0"
spec: "agentskills@1.0"
license: "Apache-2.0"
tier: 3
description: "Build on-chain AI agents on Avalanche — x402 payment flows, memory patterns, tool use, and multi-step workflows."
trigger: |
  Use when: user wants to build AI agents that interact with Avalanche blockchain, implement on-chain memory for AI, create agents that pay for services with AVAX, or build multi-agent systems on Avalanche.
  Do NOT use for: pure LLM chatbots with no blockchain interaction, off-chain only AI pipelines.
last_updated: "2026-05-01"
avalanche_networks: [fuji, mainnet]
related_skills:
  - x402-integration
  - orchestration
  - warp-messaging
---

## Overview

On-chain AI agents combine LLM reasoning with blockchain transactions. On Avalanche, agents can autonomously pay for services via x402, store memory on-chain, execute multi-step DeFi strategies, and coordinate with other agents via cross-chain messaging. Avalanche's low fees (~$0.001/tx) and 2-second finality make it the ideal platform for agent micropayments.

## When to fetch

Fetch when building any AI system that needs autonomous blockchain interactions, on-chain state persistence, or agent-to-agent payments.

## Core Workflow

### Step 1 — Agent Architecture

```
┌─────────────────────────────────────────────┐
│              AI Agent                        │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│  │  LLM     │  │  Memory  │  │  Wallet  │  │
│  │ (Claude/ │  │ Manager  │  │ Manager  │  │
│  │  GPT-4)  │  │          │  │          │  │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  │
│       │              │              │        │
│  ┌────▼──────────────▼──────────────▼────┐  │
│  │           Tool Executor               │  │
│  └──────────────────┬────────────────────┘  │
└─────────────────────┼───────────────────────┘
                      │
        ┌─────────────┼─────────────┐
        ▼             ▼             ▼
  Avalanche C-Chain  x402 APIs  Other Agents
  (transactions,     (paid data,  (multi-agent
   read state)       computation) coordination)
```

### Step 2 — Agent Skeleton (TypeScript)

```typescript
import Anthropic from "@anthropic-ai/sdk";
import { createWalletClient, createPublicClient, http, parseEther, formatEther } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { avalancheFuji } from "viem/chains";

const FUJI_RPC = "https://api.avax-test.network/ext/bc/C/rpc";

class AvalancheAgent {
  private llm: Anthropic;
  private account;
  private walletClient;
  private publicClient;
  private memory: AgentMemory;

  constructor(privateKey: `0x${string}`) {
    this.llm = new Anthropic();
    this.account = privateKeyToAccount(privateKey);
    this.walletClient = createWalletClient({
      account: this.account,
      chain: avalancheFuji,
      transport: http(FUJI_RPC),
    });
    this.publicClient = createPublicClient({
      chain: avalancheFuji,
      transport: http(FUJI_RPC),
    });
    this.memory = new AgentMemory();
  }

  // Define tools the LLM can call
  private tools: Anthropic.Tool[] = [
    {
      name: "get_avax_balance",
      description: "Get AVAX balance for any address",
      input_schema: {
        type: "object" as const,
        properties: {
          address: { type: "string", description: "Ethereum address (0x...)" },
        },
        required: ["address"],
      },
    },
    {
      name: "send_avax",
      description: "Send AVAX to an address",
      input_schema: {
        type: "object" as const,
        properties: {
          to: { type: "string", description: "Recipient address" },
          amount: { type: "string", description: "Amount in AVAX (e.g., '0.1')" },
        },
        required: ["to", "amount"],
      },
    },
    {
      name: "read_contract",
      description: "Call a read-only function on a smart contract",
      input_schema: {
        type: "object" as const,
        properties: {
          address: { type: "string" },
          functionName: { type: "string" },
          args: { type: "array", items: { type: "string" } },
        },
        required: ["address", "functionName"],
      },
    },
    {
      name: "fetch_paid_data",
      description: "Fetch data from an x402-protected API endpoint",
      input_schema: {
        type: "object" as const,
        properties: {
          url: { type: "string", description: "API endpoint URL" },
        },
        required: ["url"],
      },
    },
    {
      name: "store_memory",
      description: "Store a key-value pair in agent memory",
      input_schema: {
        type: "object" as const,
        properties: {
          key: { type: "string" },
          value: { type: "string" },
        },
        required: ["key", "value"],
      },
    },
  ];

  private async executeTool(name: string, input: Record<string, unknown>): Promise<string> {
    switch (name) {
      case "get_avax_balance": {
        const balance = await this.publicClient.getBalance({
          address: input.address as `0x${string}`,
        });
        return `${formatEther(balance)} AVAX`;
      }

      case "send_avax": {
        const hash = await this.walletClient.sendTransaction({
          to: input.to as `0x${string}`,
          value: parseEther(input.amount as string),
        });
        const receipt = await this.publicClient.waitForTransactionReceipt({ hash });
        return `Transaction sent: ${hash}. Status: ${receipt.status}`;
      }

      case "read_contract": {
        // Simplified — in production, include ABI lookup
        return `Contract read: implement with specific ABI`;
      }

      case "fetch_paid_data": {
        // Use x402 client
        const response = await fetch(input.url as string);
        if (response.status === 402) {
          return `Payment required at ${input.url}. Use x402 client to pay.`;
        }
        const data = await response.json();
        return JSON.stringify(data);
      }

      case "store_memory": {
        await this.memory.set(input.key as string, input.value as string);
        return `Stored: ${input.key} = ${input.value}`;
      }

      default:
        return `Unknown tool: ${name}`;
    }
  }

  async run(task: string): Promise<string> {
    console.log(`Agent starting task: ${task}`);
    const messages: Anthropic.MessageParam[] = [
      { role: "user", content: task },
    ];

    // Agentic loop
    while (true) {
      const response = await this.llm.messages.create({
        model: "claude-opus-4-5",
        max_tokens: 4096,
        tools: this.tools,
        messages,
        system: `You are an autonomous AI agent operating on Avalanche blockchain. 
                 Your wallet address is: ${this.account.address}.
                 Current time: ${new Date().toISOString()}.
                 Execute tasks efficiently, verifying results after each action.`,
      });

      // Check if done
      if (response.stop_reason === "end_turn") {
        const finalText = response.content
          .filter((b): b is Anthropic.TextBlock => b.type === "text")
          .map((b) => b.text)
          .join("");
        return finalText;
      }

      // Execute tool calls
      const toolUseBlocks = response.content.filter(
        (b): b is Anthropic.ToolUseBlock => b.type === "tool_use"
      );

      if (toolUseBlocks.length === 0) break;

      // Add assistant response to messages
      messages.push({ role: "assistant", content: response.content });

      // Execute tools and collect results
      const toolResults: Anthropic.ToolResultBlockParam[] = await Promise.all(
        toolUseBlocks.map(async (toolUse) => {
          console.log(`Executing tool: ${toolUse.name}`, toolUse.input);
          const result = await this.executeTool(
            toolUse.name,
            toolUse.input as Record<string, unknown>
          );
          console.log(`Tool result: ${result}`);
          return {
            type: "tool_result" as const,
            tool_use_id: toolUse.id,
            content: result,
          };
        })
      );

      messages.push({ role: "user", content: toolResults });
    }

    return "Task completed";
  }
}
```

### Step 3 — On-Chain Memory

```solidity
// AgentMemory.sol — Store agent state on-chain
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract AgentMemory {
    mapping(address => mapping(string => bytes)) private memory;
    mapping(address => string[]) private keys;
    mapping(address => mapping(string => uint256)) private timestamps;

    event MemorySet(address indexed agent, string key, uint256 timestamp);

    function set(string calldata key, bytes calldata value) external {
        if (memory[msg.sender][key].length == 0) {
            keys[msg.sender].push(key);
        }
        memory[msg.sender][key] = value;
        timestamps[msg.sender][key] = block.timestamp;
        emit MemorySet(msg.sender, key, block.timestamp);
    }

    function get(address agent, string calldata key) external view returns (bytes memory) {
        return memory[agent][key];
    }

    function getKeys(address agent) external view returns (string[] memory) {
        return keys[agent];
    }

    function getTimestamp(address agent, string calldata key) external view returns (uint256) {
        return timestamps[agent][key];
    }
}
```

**TypeScript memory manager (using contract + IPFS for large data):**

```typescript
class AgentMemory {
  private contract: any;  // AgentMemory contract instance
  private cache: Map<string, string> = new Map();

  async set(key: string, value: string): Promise<void> {
    // Cache locally for fast reads
    this.cache.set(key, value);

    // Store hash on-chain for persistence across sessions
    // For small data (< 32 bytes): store directly
    // For large data: use IPFS, store CID on-chain
    if (value.length < 32) {
      await this.contract.set(key, Buffer.from(value));
    } else {
      // In production: upload to IPFS, store CID
      const cid = `ipfs-placeholder-${key}`;
      await this.contract.set(key, Buffer.from(cid));
    }
  }

  async get(key: string): Promise<string | null> {
    // Check local cache first
    if (this.cache.has(key)) return this.cache.get(key)!;

    // Fetch from chain
    const data = await this.contract.get(this.agentAddress, key);
    if (!data || data.length === 0) return null;

    const value = Buffer.from(data).toString();
    this.cache.set(key, value);
    return value;
  }
}
```

### Step 4 — Multi-Agent Coordination

```typescript
// Orchestrator agent that delegates to specialized agents
class OrchestratorAgent extends AvalancheAgent {
  private subAgents: Map<string, string> = new Map();  // name → address

  constructor(privateKey: `0x${string}`) {
    super(privateKey);
    // Register sub-agent addresses
    this.subAgents.set("market-analyst", "0xAGENT1_ADDRESS");
    this.subAgents.set("executor", "0xAGENT2_ADDRESS");
    this.subAgents.set("risk-checker", "0xAGENT3_ADDRESS");
  }

  // Send AVAX payment to sub-agent and get result
  async delegateTask(agentName: string, task: string, paymentAVAX: string): Promise<string> {
    const agentAddress = this.subAgents.get(agentName);
    if (!agentAddress) throw new Error(`Unknown agent: ${agentName}`);

    // Pay the sub-agent via blockchain
    const hash = await this.walletClient.sendTransaction({
      to: agentAddress as `0x${string}`,
      value: parseEther(paymentAVAX),
      data: ("0x" + Buffer.from(task).toString("hex")) as `0x${string}`,
    });

    console.log(`Paid ${paymentAVAX} AVAX to ${agentName}: ${hash}`);
    return hash;
  }
}
```

### Step 5 — DeFi Strategy Agent

```typescript
class DeFiAgent extends AvalancheAgent {
  async executeYieldStrategy(budget: string): Promise<void> {
    const result = await this.run(`
      You are a DeFi yield optimizer on Avalanche.
      Budget: ${budget} AVAX
      
      Tasks to complete:
      1. Check current AVAX balance at ${this.account.address}
      2. Check current AVAX/USDC price
      3. Decide optimal strategy:
         - If AVAX > $30: keep as AVAX for appreciation
         - If AVAX < $30: convert 50% to USDC for stability
      4. Report the decision and rationale
      
      Do NOT execute any transactions without explaining the reasoning first.
    `);

    console.log("Strategy decision:", result);
  }
}

// Usage
const agent = new DeFiAgent(process.env.AGENT_PRIVATE_KEY as `0x${string}`);
await agent.executeYieldStrategy("10");
```

## Key concepts

**Autonomous wallet** — Agent holds a private key and signs transactions independently. Fund separately from your main wallet. Use small balances to limit blast radius.

**Tool calling loop** — LLMs don't execute code; they request tool calls. The agent framework executes tools and feeds results back. Loop until `stop_reason === "end_turn"`.

**On-chain persistence** — Agent memory stored in contracts survives restarts and can be read by other agents or verified by humans. Gas cost: ~$0.01 per SSTORE.

**x402 + agents** — Agents paying for data and computation via x402 is the core value proposition. An agent can discover services, pay for them, and use the results autonomously.

**Minimum viable trust** — Only grant agent wallets the minimum permissions needed. Use separate wallets for testing vs production. Never give agents access to your main wallet.

## Common errors

| Error | Cause | Fix |
|---|---|---|
| Agent sends too many transactions | LLM in a loop | Add transaction count limit per session |
| Gas estimation fails | Contract call will revert | Agent should simulate before executing |
| Memory retrieval fails | Different wallet address used | Store memory indexed by agent address, not user address |
| x402 payment loop | Agent pays, server still rejects | Check payment amount and signature validity |

## Next skills

- `x402-integration` — implement x402 payments for the agent
- `orchestration` — multi-agent coordination patterns
- `warp-messaging` — cross-chain agent communication
