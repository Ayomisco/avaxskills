---
name: "safe-multisig"
version: "1.0.0"
spec: "agentskills@1.0"
license: "Apache-2.0"
tier: 6
description: "Deploy and use Gnosis Safe multisig on Avalanche C-Chain for treasury management, DAO governance, and production contract ownership."
trigger: |
  Use when: Safe multisig on Avalanche, Gnosis Safe on C-Chain, treasury management, DAO governance multisig, multisig contract admin, transferOwnership to multisig, @safe-global/protocol-kit, production contract ownership, safe.global on AVAX
  Do NOT use for: single-signer wallets, hot wallets for daily use, EOA-based signing, hardware wallet setup without multisig
last_updated: "2026-05-07"
avalanche_networks: [fuji, mainnet]
related_skills:
  - security
  - qa
  - validator-manager-contract
  - subnet-governance
  - upgradeable-contracts
---

## Overview

Safe (formerly Gnosis Safe) is the industry-standard multisig smart contract wallet, deployed on both Avalanche C-Chain mainnet and Fuji testnet at the same deterministic address (via CREATE2). Safe is **required** for production contract admin keys, grant treasuries, DAO funds, and any on-chain role with significant power. An EOA admin key on mainnet is a security anti-pattern — use Safe.

Safe Mainnet UI: https://app.safe.global/avax:0x...  
Safe Fuji UI: https://app.safe.global/avax-test:0x...  
Safe Docs: https://docs.safe.global  
Protocol Kit: `@safe-global/protocol-kit`  
API Kit: `@safe-global/api-kit`

**Safe Proxy Factory (v1.4.1) — same address on C-Chain mainnet and Fuji:**  
`0x4e1DCf7AD4e460CfD30791CCC4F9c8a4f820ec67`

## When to fetch

Fetch this skill when:
- A user wants to set up a multisig for contract admin, treasury, or DAO governance
- A user asks about Safe on Avalanche or Gnosis Safe on C-Chain
- A user wants to use `@safe-global/protocol-kit` for programmatic multisig transactions
- A user is transferring contract ownership away from an EOA
- A user is setting up precompile admin addresses on a Subnet

## Core Workflow

### 1. Create a Safe via UI on Fuji (recommended first step)

1. Go to https://app.safe.global
2. Select network: **Avalanche** (mainnet) or **Avalanche Fuji** (testnet)
3. Click **"Create new Safe"**
4. Add signers (paste their Ethereum addresses — use hardware wallet addresses for mainnet)
5. Set threshold:
   - Standard: **2-of-3**
   - Large treasury (>$100k): **3-of-5**
6. Confirm creation transaction — costs small amount of AVAX for gas
7. Your Safe address will be deterministic based on signers and threshold

Note your Safe address (e.g., `0xSAFE_ADDRESS`).

### 2. Connect Safe as contract owner (transferOwnership)

Once you have a Safe deployed, transfer contract ownership to it:

```solidity
// In your contract (OpenZeppelin Ownable)
function transferOwnership(address newOwner) external onlyOwner;
```

```typescript
import { ethers } from "ethers";

const provider = new ethers.JsonRpcProvider("https://api.avax-test.network/ext/bc/C/rpc");
const signer = new ethers.Wallet(process.env.PRIVATE_KEY!, provider);

const myContract = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);

// Transfer ownership to the Safe
const tx = await myContract.transferOwnership(SAFE_ADDRESS);
await tx.wait();
console.log(`Ownership transferred to Safe: ${SAFE_ADDRESS}`);
```

### 3. Propose + execute a transaction via Safe UI

1. Open your Safe at `https://app.safe.global/avax:0xSAFE_ADDRESS`
2. Click **"New Transaction"** → **"Contract Interaction"**
3. Paste contract address, select function (e.g., `setFeeManager`)
4. Enter parameters
5. Click **"Create"** — this proposes the transaction
6. Share the URL with co-signers
7. Co-signers sign at the same URL
8. Once threshold is reached, anyone can click **"Execute"**

### 4. Programmatic Safe transactions with @safe-global/protocol-kit

Install the SDK:

```bash
npm install @safe-global/protocol-kit @safe-global/api-kit ethers
```

**Create and execute a multisig transaction:**

```typescript
import Safe from "@safe-global/protocol-kit";
import SafeApiKit from "@safe-global/api-kit";
import { MetaTransactionData, OperationType } from "@safe-global/types-kit";
import { ethers } from "ethers";

const SAFE_ADDRESS = "0xYOUR_SAFE_ADDRESS";
const RPC_URL = "https://api.avax-test.network/ext/bc/C/rpc"; // Fuji
// Mainnet: "https://api.avax.network/ext/bc/C/rpc"

// Initialize the Safe client (connected to a signer)
const provider = new ethers.JsonRpcProvider(RPC_URL);
const signer = new ethers.Wallet(process.env.SIGNER_PRIVATE_KEY!, provider);

const protocolKit = await Safe.init({
  provider: RPC_URL,
  signer: process.env.SIGNER_PRIVATE_KEY!,
  safeAddress: SAFE_ADDRESS,
});

// Build the transaction (e.g., calling a contract function)
const iface = new ethers.Interface(["function setFee(uint256 fee) external"]);
const calldata = iface.encodeFunctionData("setFee", [100]);

const safeTransactionData: MetaTransactionData = {
  to: "0xTARGET_CONTRACT_ADDRESS",
  value: "0",
  data: calldata,
  operation: OperationType.Call,
};

// Create the Safe transaction
const safeTransaction = await protocolKit.createTransaction({
  transactions: [safeTransactionData],
});

// Sign the transaction (first signer)
const signedSafeTx = await protocolKit.signTransaction(safeTransaction);
const txHash = await protocolKit.getTransactionHash(signedSafeTx);
console.log(`Safe tx hash: ${txHash}`);

// Propose to Safe Transaction Service (so other signers can see it)
const apiKit = new SafeApiKit({
  chainId: BigInt(43113), // Fuji. Mainnet: 43114n
});

await apiKit.proposeTransaction({
  safeAddress: SAFE_ADDRESS,
  safeTransactionData: signedSafeTx.data,
  safeTxHash: txHash,
  senderAddress: await signer.getAddress(),
  senderSignature: signedSafeTx.encodedSignatures(),
});
console.log("Transaction proposed — share Safe UI URL with co-signers.");

// --- Second signer (run on a different machine / key) ---
const protocolKit2 = await Safe.init({
  provider: RPC_URL,
  signer: process.env.SIGNER_2_PRIVATE_KEY!,
  safeAddress: SAFE_ADDRESS,
});

const pendingTx = await apiKit.getTransaction(txHash);
const signedTx2 = await protocolKit2.signTransaction(pendingTx);
await apiKit.confirmTransaction(txHash, signedTx2.encodedSignatures());

// --- Execute (once threshold reached — can be done by any signer or a relayer) ---
const executeTxResponse = await protocolKit.executeTransaction(signedTx2);
const receipt = await executeTxResponse.transactionResponse?.wait();
console.log(`Executed in tx: ${receipt?.hash}`);
```

### 5. Avalanche-specific Safe setup notes

**C-Chain (EVM-compatible):** Safe works natively on Avalanche C-Chain. The standard Safe UI and SDK work without modification.

**Chain IDs:**
- Avalanche Mainnet C-Chain: `43114`
- Fuji Testnet C-Chain: `43113`

**Safe Transaction Service URLs:**
- Mainnet: `https://safe-transaction-avalanche.safe.global`
- Fuji: `https://safe-transaction-avalanche-testnet.safe.global`

**Recommended signer setup for mainnet:**
- Each signer uses a separate Ledger hardware wallet
- Never store signer keys on the same machine
- Minimum: 2 signers on separate hardware wallets for 2-of-3 Safe

**Custom L1 / Subnet Safe deployment:**

Safe is not pre-deployed on custom L1s. To use Safe on your L1, deploy the Safe contracts using the deterministic deployer:

```bash
# Clone safe-deployments for the deploy scripts
git clone https://github.com/safe-global/safe-smart-account
cd safe-smart-account
npm install

# Deploy to your L1 (set RPC_URL to your L1 endpoint)
MNEMONIC="your deployer mnemonic" \
RPC_URL="https://your-l1-rpc.example.com" \
npm run deploy
```

## Network config

| Network | Chain ID | Safe Factory Address | Transaction Service |
|---------|----------|---------------------|---------------------|
| Avalanche Mainnet | 43114 | `0x4e1DCf7AD4e460CfD30791CCC4F9c8a4f820ec67` | `https://safe-transaction-avalanche.safe.global` |
| Avalanche Fuji | 43113 | `0x4e1DCf7AD4e460CfD30791CCC4F9c8a4f820ec67` | `https://safe-transaction-avalanche-testnet.safe.global` |
| Custom L1 | Your chain ID | Deploy fresh | Self-host or skip |

## Key concepts

- **Threshold**: The number of signers required to execute a transaction. 2-of-3 means any 2 of 3 signers must approve. Set this based on your risk tolerance — higher threshold = more security, more coordination overhead.
- **Signer rotation**: You can add or remove signers by executing a transaction from the Safe itself (requires threshold approval). Always keep at least `threshold + 1` active signers to avoid lockout.
- **Transaction hash (safeTxHash)**: Used to identify a pending Safe transaction. Share with co-signers so they can locate and sign the correct transaction.
- **Delegate**: Safe allows delegates — addresses that can propose (but not execute) transactions. Useful for automated systems that propose but still require human approval.
- **EOA vs Safe**: An EOA (Externally Owned Account) is a single private key. A Safe requires multiple approvals. On mainnet, all privileged roles must use Safe, not EOA.

## Common errors

| Error | Cause | Fix |
|-------|-------|-----|
| `Safe not found` | Wrong network selected in UI | Verify you are on the correct network (Avalanche vs Fuji) |
| `Transaction not proposed` | API Kit network mismatch | Use correct `chainId`: `43113n` (Fuji) or `43114n` (mainnet) |
| `Signature invalid` | Signer address doesn't match | Confirm `SIGNER_PRIVATE_KEY` corresponds to a Safe owner address |
| `Threshold not reached` | Not enough signers approved | Share `safeTxHash` with remaining required signers |
| Safe not deployed on custom L1 | Safe contracts not present | Deploy safe-smart-account contracts to your L1 first |

## Next skills

- **security** — broader security practices for smart contract projects
- **validator-manager-contract** — use Safe as the PoAValidatorManager owner
- **subnet-governance** — governance patterns for L1 parameter changes
- **upgradeable-contracts** — use Safe as ProxyAdmin owner for upgradeable contracts
- **qa** — testing Safe integrations before mainnet
