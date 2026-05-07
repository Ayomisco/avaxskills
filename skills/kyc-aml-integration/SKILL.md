---
name: "kyc-aml-integration"
version: "1.0.0"
spec: "agentskills@1.0"
license: "Apache-2.0"
tier: 4
description: "Light KYC/AML integration for Avalanche dApps — Synaps, Fractal, Civic, on-chain identity, and privacy tradeoffs."
trigger: |
  Use when: adding KYC/AML compliance to an Avalanche dApp, implementing address allowlisting based on identity verification, integrating Synaps or Civic Pass, or designing compliant RWA tokenization.
  Do NOT use for: general user authentication, non-compliance identity, social login.
last_updated: "2026-05-01"
avalanche_networks: [fuji, mainnet]
related_skills:
  - rwa-tokenization
  - token-standards
  - security
---

## Overview

KYC/AML integration on Avalanche typically follows a hybrid model: off-chain identity verification (Synaps, Fractal, Civic) feeds into an on-chain allowlist that gates contract interactions. This skill covers the full flow from SDK integration and webhook handling to on-chain allowlist contracts, with explicit guidance on what to store on-chain vs off-chain.

## When to fetch

Fetch when building RWA platforms, regulated DeFi protocols, institutional trading venues, or any dApp that must restrict access to verified users. Also fetch when a compliance requirement requires address-level access control.

## Core Workflow

### On-Chain Allowlist Contract

1. **Deploy the allowlist**

   ```solidity
   // contracts/KYCAllowlist.sol
   // SPDX-License-Identifier: Apache-2.0
   pragma solidity ^0.8.24;

   import "@openzeppelin/contracts/access/AccessControl.sol";

   contract KYCAllowlist is AccessControl {
       bytes32 public constant COMPLIANCE_ROLE = keccak256("COMPLIANCE_ROLE");

       enum KYCStatus { None, Pending, Approved, Revoked }

       // Store only status and expiry — never PII on-chain
       mapping(address => KYCStatus) public kycStatus;
       mapping(address => uint256) public kycExpiry;  // Unix timestamp

       event AddressApproved(address indexed user, uint256 expiry);
       event AddressRevoked(address indexed user);

       constructor(address complianceAdmin) {
           _grantRole(DEFAULT_ADMIN_ROLE, complianceAdmin);
           _grantRole(COMPLIANCE_ROLE, complianceAdmin);
       }

       modifier onlyVerified() {
           require(isVerified(msg.sender), "KYC required");
           _;
       }

       function isVerified(address user) public view returns (bool) {
           return kycStatus[user] == KYCStatus.Approved
               && block.timestamp < kycExpiry[user];
       }

       // Called by compliance backend via webhook
       function approveAddress(address user, uint256 expiryTimestamp)
           external
           onlyRole(COMPLIANCE_ROLE)
       {
           require(expiryTimestamp > block.timestamp, "Expiry in past");
           kycStatus[user] = KYCStatus.Approved;
           kycExpiry[user] = expiryTimestamp;
           emit AddressApproved(user, expiryTimestamp);
       }

       function revokeAddress(address user) external onlyRole(COMPLIANCE_ROLE) {
           kycStatus[user] = KYCStatus.Revoked;
           emit AddressRevoked(user);
       }

       // Batch approve for efficiency
       function batchApprove(address[] calldata users, uint256 expiry)
           external
           onlyRole(COMPLIANCE_ROLE)
       {
           for (uint256 i = 0; i < users.length; i++) {
               kycStatus[users[i]] = KYCStatus.Approved;
               kycExpiry[users[i]] = expiry;
               emit AddressApproved(users[i], expiry);
           }
       }
   }
   ```

2. **Gate contract functions with allowlist**

   ```solidity
   // contracts/RestrictedToken.sol
   import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
   import "./KYCAllowlist.sol";

   contract RestrictedToken is ERC20 {
       KYCAllowlist public immutable allowlist;

       constructor(address _allowlist) ERC20("Restricted Token", "RTKN") {
           allowlist = KYCAllowlist(_allowlist);
       }

       function _beforeTokenTransfer(address from, address to, uint256) internal override {
           // Allow minting (from == address(0)) and burning (to == address(0))
           if (from != address(0)) require(allowlist.isVerified(from), "Sender not KYC");
           if (to != address(0)) require(allowlist.isVerified(to), "Recipient not KYC");
       }
   }
   ```

### Synaps Integration

3. **Synaps SDK — frontend flow**

   ```typescript
   // Install: npm install @synaps-io/verify.js
   import Synaps from "@synaps-io/verify.js";

   // 1. Create a session via your backend
   const response = await fetch("/api/kyc/synaps/session", {
     method: "POST",
     headers: { "Content-Type": "application/json" },
     body: JSON.stringify({ walletAddress: userAddress }),
   });
   const { sessionId } = await response.json();

   // 2. Initialize Synaps modal
   Synaps.init({
     sessionId,
     service: "individual",  // or "corporate"
     lang: "en",
     onFinish: () => {
       console.log("KYC submitted — await webhook confirmation");
       // Do NOT assume approved yet — wait for webhook
     },
   });

   Synaps.show();
   ```

4. **Synaps backend — session creation and webhook**

   ```typescript
   // pages/api/kyc/synaps/session.ts (Next.js)
   import type { NextApiRequest, NextApiResponse } from "next";

   export default async function handler(req: NextApiRequest, res: NextApiResponse) {
     const { walletAddress } = req.body;

     const synapsResponse = await fetch("https://api.synaps.io/v4/individual/session/init", {
       method: "POST",
       headers: {
         "Client-Id": process.env.SYNAPS_CLIENT_ID!,
         "Api-Key": process.env.SYNAPS_API_KEY!,
         "Content-Type": "application/json",
       },
       body: JSON.stringify({
         alias: walletAddress,  // Link session to wallet address
       }),
     });

     const data = await synapsResponse.json();
     res.json({ sessionId: data.session_id });
   }
   ```

   ```typescript
   // pages/api/kyc/synaps/webhook.ts
   import { createPublicClient, createWalletClient, http, parseEther } from "viem";
   import { avalanche } from "viem/chains";
   import { KYC_ALLOWLIST_ABI, KYC_ALLOWLIST_ADDRESS } from "../../constants";

   export default async function handler(req: NextApiRequest, res: NextApiResponse) {
     // Verify webhook signature
     const signature = req.headers["synaps-signature"];
     if (!verifySignature(req.body, signature, process.env.SYNAPS_WEBHOOK_SECRET!)) {
       return res.status(401).json({ error: "Invalid signature" });
     }

     const { session_id, status, alias: walletAddress } = req.body;

     if (status === "APPROVED") {
       // Update on-chain allowlist
       const walletClient = createWalletClient({
         chain: avalanche,
         account: complianceAccount,
         transport: http("https://api.avax.network/ext/bc/C/rpc"),
       });

       const oneYearFromNow = BigInt(Math.floor(Date.now() / 1000) + 365 * 24 * 3600);

       await walletClient.writeContract({
         address: KYC_ALLOWLIST_ADDRESS,
         abi: KYC_ALLOWLIST_ABI,
         functionName: "approveAddress",
         args: [walletAddress as `0x${string}`, oneYearFromNow],
       });

       // Store verification record off-chain (NOT PII on-chain)
       await db.kycRecords.create({
         walletAddress,
         sessionId: session_id,
         approvedAt: new Date(),
         provider: "synaps",
         // Store reference ID, not PII
       });
     }

     res.status(200).json({ ok: true });
   }
   ```

### Civic Pass Integration

5. **Civic Pass — Solana + EVM gateway**

   ```typescript
   // Install: npm install @civic/ethereum-gateway-react
   import { GatewayProvider, useGateway } from "@civic/ethereum-gateway-react";
   import { avalanche } from "wagmi/chains";

   // Wrap app with provider
   export function App() {
     return (
       <GatewayProvider
         wallet={userWallet}
         gatekeeperNetwork="uniqobk8oGh4XBLMqM68K8M2zNu3CdYX7q5go7whQiv" // Civic Pass gatekeeper
         chain={avalanche}
       >
         <MyApp />
       </GatewayProvider>
     );
   }

   // Use in components
   function GatedAction() {
     const { gatewayStatus, requestGatewayToken } = useGateway();

     if (gatewayStatus !== GatewayStatus.ACTIVE) {
       return <button onClick={requestGatewayToken}>Complete Identity Verification</button>;
     }

     return <button onClick={performAction}>Execute (Verified)</button>;
   }
   ```

## Privacy Tradeoffs

| Data Type | On-Chain | Off-Chain | Reason |
|---|---|---|---|
| KYC approval status (bool) | Yes | Yes (cache) | Needed for contract gating |
| KYC expiry timestamp | Yes | No | Needed for auto-expiry |
| Wallet address | Yes | Yes | Public anyway |
| Name, DOB, nationality | Never | Yes (encrypted) | GDPR/privacy compliance |
| Document images | Never | Yes (encrypted) | Sensitive PII |
| Session/reference ID | No | Yes | Linkage reference only |
| Jurisdiction | Maybe | Yes | May need on-chain for multi-tier |

## Key concepts

**Off-Chain PII**: Never store names, dates of birth, document numbers, or images on-chain. Store only the minimum: approval status and expiry. Reference back to your off-chain KYC database via session ID.

**Webhook Security**: Synaps and Fractal webhooks must be signature-verified. An unverified webhook endpoint lets anyone approve arbitrary addresses.

**Expiry**: KYC approvals expire. Set `kycExpiry` and require re-verification. 1 year is a common expiry for individual KYC.

**Revocation**: Build revocation from day one. You must be able to remove a user's access if they're flagged post-approval.

**GDPR Right to Erasure**: Your off-chain database must support deletion of PII. On-chain data (approval status, address) cannot be deleted — design for this from the start.

## Common errors

| Error | Cause | Fix |
|---|---|---|
| `KYC required` revert | User's address not in allowlist | Direct user to complete KYC flow; check webhook fired correctly |
| Webhook not firing | Wrong webhook URL in Synaps dashboard | Verify URL, use ngrok for local testing |
| KYC expired | `kycExpiry` passed | Trigger re-verification flow; update expiry on re-approval |
| Compliance wallet has no AVAX | Can't call `approveAddress` | Keep compliance wallet funded; set up alerts on low balance |
| Double-approval | Webhook fires twice | Make `approveAddress` idempotent (re-approving same address is safe) |

## Next skills

- `rwa-tokenization` — tokenize real-world assets with KYC-gated transfers
- `token-standards` — ERC-20/1400 token standards for compliant tokens
- `security` — secure the allowlist admin key and contract
