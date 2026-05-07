---
name: "x402-integration"
version: "1.0.0"
spec: "agentskills@1.0"
license: "Apache-2.0"
tier: 3
description: "Implement x402 HTTP payment protocol for AI agent micropayments on Avalanche — server middleware and agent client."
trigger: |
  Use when: user wants to implement pay-per-request API monetization, AI agent micropayments, HTTP 402 payment flows, or machine-to-machine payments on Avalanche.
  Do NOT use for: human-facing payment UIs, subscription billing, or ERC-20 token transfers without the HTTP 402 flow.
last_updated: "2026-05-01"
avalanche_networks: [fuji, mainnet]
related_skills:
  - ai-agent-patterns
  - orchestration
  - why-avalanche
  - hackathon-bounties
---

## Overview

x402 is an HTTP-native payment protocol that uses the HTTP `402 Payment Required` status code to gate API endpoints behind on-chain micropayments. An AI agent or client hits an endpoint, gets a 402 with payment requirements, pays on-chain (Avalanche C-Chain), includes the payment proof in a retry request, and the server verifies before serving the response. No subscriptions, no API keys — pure pay-per-use.

This is ideal for AI agent workflows where agents need to autonomously pay for data, computation, or services without human intervention. Avalanche's low fees (~$0.001 per transaction) make micropayments economically viable.

## When to fetch

Fetch this skill when building monetized AI agent APIs, pay-per-request services, or machine-to-machine payment flows. This is a top hackathon track for Avalanche (infraBUIDL + AI agents).

## Core Workflow

### Step 1 — Protocol Overview

```
Agent/Client                              API Server
    │                                          │
    │──── GET /api/premium-data ──────────────►│
    │                                          │
    │◄─── 402 Payment Required ────────────────│
    │     {                                    │
    │       "x402Version": 1,                  │
    │       "accepts": [{                      │
    │         "scheme": "exact",               │
    │         "network": "avalanche-mainnet",  │
    │         "maxAmountRequired": "1000000",  │ ← 1 USDC (6 decimals)
    │         "resource": "/api/premium-data", │
    │         "description": "Premium data",   │
    │         "mimeType": "application/json",  │
    │         "payTo": "0xServerWallet...",    │
    │         "requiredDeadlineSeconds": 300,  │
    │         "asset": "0xB97EF...",           │ ← USDC on Avalanche
    │         "extra": {}                      │
    │       }]                                 │
    │     }                                    │
    │                                          │
    │ [Agent pays on Avalanche C-Chain]        │
    │                                          │
    │──── GET /api/premium-data ──────────────►│
    │     X-PAYMENT: <encoded payment proof>   │
    │                                          │
    │◄─── 200 OK + Response Data ──────────────│
```

### Step 2 — Server Middleware (Node.js/Express)

```bash
npm install express viem @coinbase/x402 dotenv
# Types
npm install --save-dev @types/express typescript ts-node
```

**Server with x402 middleware:**

```typescript
// server.ts
import express from "express";
import { createPublicClient, http, parseUnits, getAddress } from "viem";
import { avalanche } from "viem/chains";
import * as dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(express.json());

const publicClient = createPublicClient({
  chain: avalanche,
  transport: http("https://api.avax.network/ext/bc/C/rpc"),
});

// USDC on Avalanche C-Chain Mainnet
const USDC_ADDRESS = "0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E";
// For Fuji testnet, use a test ERC20 you deploy yourself

interface PaymentRequirement {
  scheme: "exact";
  network: "avalanche-mainnet" | "avalanche-testnet";
  maxAmountRequired: string;
  resource: string;
  description: string;
  mimeType: string;
  payTo: string;
  requiredDeadlineSeconds: number;
  asset: string;
  extra?: Record<string, unknown>;
}

interface X402PaymentHeader {
  x402Version: number;
  scheme: string;
  network: string;
  payload: {
    signature: string;
    authorization: {
      from: string;
      to: string;
      value: string;
      validAfter: string;
      validBefore: string;
      nonce: string;
    };
  };
}

// x402 payment middleware factory
function requirePayment(
  amountUSDC: number,
  description: string
) {
  const SERVER_WALLET = process.env.SERVER_WALLET_ADDRESS!;
  const amountInUnits = parseUnits(amountUSDC.toString(), 6).toString(); // USDC has 6 decimals

  return async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const paymentHeader = req.headers["x-payment"];

    // No payment header → return 402
    if (!paymentHeader) {
      const paymentRequirement: { x402Version: number; accepts: PaymentRequirement[] } = {
        x402Version: 1,
        accepts: [
          {
            scheme: "exact",
            network: "avalanche-mainnet",
            maxAmountRequired: amountInUnits,
            resource: req.path,
            description,
            mimeType: "application/json",
            payTo: SERVER_WALLET,
            requiredDeadlineSeconds: 300,
            asset: USDC_ADDRESS,
            extra: {},
          },
        ],
      };
      return res.status(402).json(paymentRequirement);
    }

    // Verify payment
    try {
      const payment: X402PaymentHeader = JSON.parse(
        Buffer.from(paymentHeader as string, "base64").toString("utf-8")
      );

      const isValid = await verifyPayment(payment, SERVER_WALLET, amountInUnits);
      if (!isValid) {
        return res.status(402).json({ error: "Invalid or insufficient payment" });
      }

      next();
    } catch (error) {
      return res.status(400).json({ error: "Malformed payment header" });
    }
  };
}

// Verify USDC transferWithAuthorization on-chain
async function verifyPayment(
  payment: X402PaymentHeader,
  expectedTo: string,
  minAmount: string
): Promise<boolean> {
  const { authorization, signature } = payment.payload;

  // Verify the signature is valid for a USDC transferWithAuthorization
  // USDC uses EIP-3009 transferWithAuthorization
  const EIP3009_ABI = [
    {
      inputs: [
        { name: "from", type: "address" },
        { name: "to", type: "address" },
        { name: "value", type: "uint256" },
        { name: "validAfter", type: "uint256" },
        { name: "validBefore", type: "uint256" },
        { name: "nonce", type: "bytes32" },
        { name: "v", type: "uint8" },
        { name: "r", type: "bytes32" },
        { name: "s", type: "bytes32" },
      ],
      name: "transferWithAuthorization",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function",
    },
  ] as const;

  // Check authorization parameters
  const now = Math.floor(Date.now() / 1000);
  if (parseInt(authorization.validBefore) < now) return false; // expired
  if (parseInt(authorization.validAfter) > now) return false; // not yet valid
  if (getAddress(authorization.to) !== getAddress(expectedTo)) return false;
  if (BigInt(authorization.value) < BigInt(minAmount)) return false;

  // In production: simulate the transferWithAuthorization call to verify signature
  // and that the authorization hasn't been used yet
  return true;
}

// Protected route — costs 0.01 USDC
app.get(
  "/api/premium-data",
  requirePayment(0.01, "Access to premium market data"),
  async (req, res) => {
    res.json({
      data: {
        avaxPrice: 38.5,
        timestamp: Date.now(),
        source: "premium-oracle",
      },
    });
  }
);

// Free route — no payment needed
app.get("/api/free-data", (req, res) => {
  res.json({ message: "This is free", timestamp: Date.now() });
});

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok", version: "1.0.0" });
});

app.listen(3000, () => {
  console.log("x402 server running on port 3000");
  console.log("Server wallet:", process.env.SERVER_WALLET_ADDRESS);
});
```

### Step 3 — Agent Client Implementation

```typescript
// agent-client.ts
import { createWalletClient, createPublicClient, http, parseUnits } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { avalanche } from "viem/chains";
import * as dotenv from "dotenv";

dotenv.config();

const USDC_ADDRESS = "0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E";

class x402AgentClient {
  private walletClient;
  private publicClient;
  private account;

  constructor(privateKey: `0x${string}`) {
    this.account = privateKeyToAccount(privateKey);
    this.walletClient = createWalletClient({
      account: this.account,
      chain: avalanche,
      transport: http("https://api.avax.network/ext/bc/C/rpc"),
    });
    this.publicClient = createPublicClient({
      chain: avalanche,
      transport: http("https://api.avax.network/ext/bc/C/rpc"),
    });
  }

  async fetch(url: string, options: RequestInit = {}): Promise<Response> {
    // First attempt — no payment
    let response = await fetch(url, options);

    if (response.status !== 402) {
      return response;
    }

    // Got 402 — parse payment requirements
    const paymentRequirements = await response.json();
    console.log("Payment required:", paymentRequirements);

    const requirement = paymentRequirements.accepts[0];

    // Create EIP-3009 authorization (USDC transferWithAuthorization)
    const paymentHeader = await this.createPaymentAuthorization(requirement);

    // Retry with payment header
    response = await fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        "X-PAYMENT": paymentHeader,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Payment verification failed: ${response.status}`);
    }

    return response;
  }

  private async createPaymentAuthorization(
    requirement: {
      payTo: string;
      maxAmountRequired: string;
      asset: string;
      requiredDeadlineSeconds: number;
    }
  ): Promise<string> {
    const validAfter = Math.floor(Date.now() / 1000) - 10; // slight past buffer
    const validBefore = Math.floor(Date.now() / 1000) + requirement.requiredDeadlineSeconds;
    const nonce = `0x${Array.from(crypto.getRandomValues(new Uint8Array(32)))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("")}`;

    // Sign EIP-3009 transferWithAuthorization
    // USDC domain for EIP-712
    const domain = {
      name: "USD Coin",
      version: "2",
      chainId: 43114, // Avalanche mainnet
      verifyingContract: USDC_ADDRESS as `0x${string}`,
    } as const;

    const types = {
      TransferWithAuthorization: [
        { name: "from", type: "address" },
        { name: "to", type: "address" },
        { name: "value", type: "uint256" },
        { name: "validAfter", type: "uint256" },
        { name: "validBefore", type: "uint256" },
        { name: "nonce", type: "bytes32" },
      ],
    } as const;

    const message = {
      from: this.account.address,
      to: requirement.payTo as `0x${string}`,
      value: BigInt(requirement.maxAmountRequired),
      validAfter: BigInt(validAfter),
      validBefore: BigInt(validBefore),
      nonce: nonce as `0x${string}`,
    } as const;

    const signature = await this.walletClient.signTypedData({
      domain,
      types,
      primaryType: "TransferWithAuthorization",
      message,
    });

    const paymentPayload = {
      x402Version: 1,
      scheme: "exact",
      network: "avalanche-mainnet",
      payload: {
        signature,
        authorization: {
          from: this.account.address,
          to: requirement.payTo,
          value: requirement.maxAmountRequired,
          validAfter: validAfter.toString(),
          validBefore: validBefore.toString(),
          nonce,
        },
      },
    };

    return Buffer.from(JSON.stringify(paymentPayload)).toString("base64");
  }

  async getUSDCBalance(): Promise<bigint> {
    const ERC20_ABI = [
      {
        inputs: [{ name: "account", type: "address" }],
        name: "balanceOf",
        outputs: [{ name: "", type: "uint256" }],
        stateMutability: "view",
        type: "function",
      },
    ] as const;

    return await this.publicClient.readContract({
      address: USDC_ADDRESS as `0x${string}`,
      abi: ERC20_ABI,
      functionName: "balanceOf",
      args: [this.account.address],
    });
  }
}

// Usage example
async function runAgent() {
  const client = new x402AgentClient(process.env.AGENT_PRIVATE_KEY as `0x${string}`);

  const usdcBalance = await client.getUSDCBalance();
  console.log("USDC Balance:", Number(usdcBalance) / 1e6, "USDC");

  // Agent autonomously pays and fetches data
  const response = await client.fetch("http://localhost:3000/api/premium-data");
  const data = await response.json();
  console.log("Received data:", data);
}

runAgent().catch(console.error);
```

### Step 4 — Fuji Testnet Setup

For testing, deploy a mock USDC on Fuji or use a test ERC20:

```solidity
// MockUSDC.sol — deploy this on Fuji for testing
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";

contract MockUSDC is ERC20Permit {
    constructor() ERC20("USD Coin", "USDC") ERC20Permit("USD Coin") {
        _mint(msg.sender, 1_000_000 * 10**6); // 1M USDC with 6 decimals
    }

    function decimals() public pure override returns (uint8) {
        return 6;
    }

    // Public mint for testing
    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}
```

Update server config for Fuji:
```typescript
const USDC_ADDRESS = process.env.MOCK_USDC_ADDRESS!; // your deployed MockUSDC
// Change network to "avalanche-testnet"
// Use Fuji RPC: https://api.avax-test.network/ext/bc/C/rpc
```

### Step 5 — Environment Variables

```bash
# .env
SERVER_WALLET_ADDRESS=0xYourServerWalletAddress
AGENT_PRIVATE_KEY=0xYourAgentPrivateKey
MOCK_USDC_ADDRESS=0xYourFujiMockUSDC  # testnet only
```

### Step 6 — Common Patterns

See `references/README.md` for tiered pricing examples, wallet funding checks, and multi-hop agent payment patterns.

## Network config
| Network | Chain ID | RPC | USDC Address |
|---|---|---|---|
| C-Chain Mainnet | 43114 | https://api.avax.network/ext/bc/C/rpc | 0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E |
| Fuji Testnet | 43113 | https://api.avax-test.network/ext/bc/C/rpc | Deploy MockUSDC |

## Key concepts

**HTTP 402** — "Payment Required" — a reserved HTTP status code finally getting a real use case. Server returns payment requirements, client pays, retries with proof.

**EIP-3009 (TransferWithAuthorization)** — USDC's meta-transaction standard. Allows signing a payment authorization offline without sending a transaction first. Server redeems it by calling `transferWithAuthorization` after verifying.

**EIP-712 typed signing** — Structured data signing that wallets display human-readably. Used to sign the payment authorization off-chain.

**Micropayment viability** — Avalanche C-Chain fees of ~$0.001 make payments as small as $0.001-$0.01 economically viable, unlike Ethereum where fees can exceed payment amount.

**Autonomous agent wallet** — Agent holds private key and autonomously approves and signs payments without human intervention. Critical for multi-step AI workflows.

## Common errors

| Error | Cause | Fix |
|---|---|---|
| `Payment verification failed: 402` | Signature invalid or amount too low | Check EIP-712 domain (chain ID, contract address) matches |
| `validBefore` in past | Clock skew between agent and server | Add more buffer to `requiredDeadlineSeconds` |
| `Malformed payment header` | Base64 encoding issue | Ensure proper Buffer.from().toString("base64") encoding |
| USDC `transferWithAuthorization` reverts | Nonce already used | Generate new nonce for each request |
| Agent has no USDC | Empty wallet | Fund agent wallet with USDC before starting |
| Server wallet address mismatch | Wrong `payTo` in requirement | Verify SERVER_WALLET_ADDRESS env var is set correctly |

## Next skills

- `ai-agent-patterns` — full AI agent architectures with on-chain memory and tool use
- `orchestration` — multi-agent coordination with x402 payments
- `hackathon-bounties` — x402 + AI agent is a winning hackathon combination