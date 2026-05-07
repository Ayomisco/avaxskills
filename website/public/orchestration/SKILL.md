---
name: "orchestration"
version: "1.0.0"
spec: "agentskills@1.0"
license: "Apache-2.0"
tier: 4
description: "Multi-agent orchestration patterns on Avalanche — manager/worker patterns, on-chain coordination, and state management."
trigger: |
  Use when: building a multi-agent system on Avalanche, implementing on-chain task queues, coordinating multiple AI agents with on-chain state, or designing agent payment flows.
  Do NOT use for: single-agent tasks, off-chain-only orchestration, non-blockchain AI systems.
last_updated: "2026-05-01"
avalanche_networks: [fuji, mainnet]
related_skills:
  - ai-agent-patterns
  - x402-integration
---

## Overview

Avalanche's 1-2 second finality makes it exceptionally well-suited for agent orchestration loops where on-chain state is the source of truth. This skill covers the manager/worker agent pattern, on-chain task queues, per-task payment flows using x402, result aggregation, and error handling across distributed agent execution.

## When to fetch

Fetch when designing a system where multiple AI agents need to coordinate using on-chain state, when implementing autonomous task assignment and payment, or when building an agent system that uses Avalanche's fast finality to close coordination loops quickly.

## Core Workflow

### On-Chain Task Queue Contract

1. **Deploy the task queue**

   ```solidity
   // contracts/TaskQueue.sol
   // SPDX-License-Identifier: Apache-2.0
   pragma solidity ^0.8.24;

   import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
   import "@openzeppelin/contracts/access/AccessControl.sol";

   contract TaskQueue is ReentrancyGuard, AccessControl {
       bytes32 public constant MANAGER_ROLE = keccak256("MANAGER_ROLE");

       enum TaskStatus { Pending, Assigned, Completed, Failed }

       struct Task {
           bytes32 id;
           string taskType;
           bytes payload;
           address assignedWorker;
           uint256 reward;           // AVAX wei
           uint256 deadline;
           TaskStatus status;
           bytes result;
       }

       mapping(bytes32 => Task) public tasks;
       bytes32[] public pendingTaskIds;

       event TaskCreated(bytes32 indexed id, string taskType, uint256 reward);
       event TaskAssigned(bytes32 indexed id, address indexed worker);
       event TaskCompleted(bytes32 indexed id, address indexed worker, bytes result);
       event TaskFailed(bytes32 indexed id, address indexed worker, string reason);

       constructor(address manager) {
           _grantRole(DEFAULT_ADMIN_ROLE, manager);
           _grantRole(MANAGER_ROLE, manager);
       }

       function createTask(
           string calldata taskType,
           bytes calldata payload,
           uint256 deadline
       ) external payable onlyRole(MANAGER_ROLE) returns (bytes32 taskId) {
           taskId = keccak256(abi.encodePacked(block.timestamp, msg.sender, payload));
           tasks[taskId] = Task({
               id: taskId,
               taskType: taskType,
               payload: payload,
               assignedWorker: address(0),
               reward: msg.value,
               deadline: deadline,
               status: TaskStatus.Pending,
               result: ""
           });
           pendingTaskIds.push(taskId);
           emit TaskCreated(taskId, taskType, msg.value);
       }

       function claimTask(bytes32 taskId) external nonReentrant {
           Task storage task = tasks[taskId];
           require(task.status == TaskStatus.Pending, "Not pending");
           require(block.timestamp < task.deadline, "Expired");
           task.status = TaskStatus.Assigned;
           task.assignedWorker = msg.sender;
           emit TaskAssigned(taskId, msg.sender);
       }

       function submitResult(bytes32 taskId, bytes calldata result) external nonReentrant {
           Task storage task = tasks[taskId];
           require(task.assignedWorker == msg.sender, "Not assigned to you");
           require(task.status == TaskStatus.Assigned, "Not assigned");
           require(block.timestamp < task.deadline, "Expired");

           task.status = TaskStatus.Completed;
           task.result = result;

           // Pay worker
           uint256 reward = task.reward;
           task.reward = 0;
           (bool ok,) = msg.sender.call{value: reward}("");
           require(ok, "Payment failed");

           emit TaskCompleted(taskId, msg.sender, result);
       }

       function failTask(bytes32 taskId, string calldata reason) external {
           Task storage task = tasks[taskId];
           require(task.assignedWorker == msg.sender, "Not assigned to you");
           require(task.status == TaskStatus.Assigned, "Not assigned");
           task.status = TaskStatus.Failed;
           emit TaskFailed(taskId, msg.sender, reason);
       }
   }
   ```

### Manager Agent (TypeScript)

2. **Manager agent skeleton**

   ```typescript
   // agents/manager.ts
   import { createPublicClient, createWalletClient, http, parseEther } from "viem";
   import { avalancheFuji } from "viem/chains";
   import { privateKeyToAccount } from "viem/accounts";
   import { TASK_QUEUE_ABI, TASK_QUEUE_ADDRESS } from "./constants";

   const chain = avalancheFuji; // Switch to avalanche for mainnet
   const account = privateKeyToAccount(process.env.MANAGER_KEY as `0x${string}`);

   const publicClient = createPublicClient({
     chain,
     transport: http("https://api.avax-test.network/ext/bc/C/rpc"),
   });

   const walletClient = createWalletClient({
     chain,
     account,
     transport: http("https://api.avax-test.network/ext/bc/C/rpc"),
   });

   async function createTask(taskType: string, payload: object, rewardAVAX: number) {
     const deadline = BigInt(Math.floor(Date.now() / 1000) + 3600); // 1 hour
     const encodedPayload = Buffer.from(JSON.stringify(payload));

     const hash = await walletClient.writeContract({
       address: TASK_QUEUE_ADDRESS,
       abi: TASK_QUEUE_ABI,
       functionName: "createTask",
       args: [taskType, `0x${encodedPayload.toString("hex")}`, deadline],
       value: parseEther(rewardAVAX.toString()),
     });

     // Avalanche finality ~1-2s — don't sleep 15s like Ethereum
     const receipt = await publicClient.waitForTransactionReceipt({ hash, timeout: 10_000 });
     console.log("Task created:", receipt.logs[0]);
     return receipt;
   }

   async function aggregateResults(taskIds: `0x${string}`[]) {
     const results = await Promise.all(
       taskIds.map(async (id) => {
         const task = await publicClient.readContract({
           address: TASK_QUEUE_ADDRESS,
           abi: TASK_QUEUE_ABI,
           functionName: "tasks",
           args: [id],
         }) as any;

         return {
           id,
           status: task.status,
           result: task.result ? JSON.parse(Buffer.from(task.result.slice(2), "hex").toString()) : null,
         };
       })
     );

     const completed = results.filter((r) => r.status === 2n); // TaskStatus.Completed
     const failed = results.filter((r) => r.status === 3n);    // TaskStatus.Failed

     console.log(`Aggregated: ${completed.length} done, ${failed.length} failed`);
     return { completed, failed };
   }

   // Main orchestration loop
   async function orchestrate() {
     // Spawn tasks
     await createTask("analyze-contract", { address: "0x..." }, 0.01);
     await createTask("generate-report", { contractId: "abc" }, 0.005);

     // Wait and collect (fast on Avalanche)
     await new Promise((r) => setTimeout(r, 5000)); // 5s for Avax finality + worker processing

     // Check results
     const taskIds: `0x${string}`[] = []; // Collect from createTask events
     const { completed, failed } = await aggregateResults(taskIds);

     // Handle failures
     for (const failedTask of failed) {
       console.log("Retrying failed task:", failedTask.id);
       // Re-queue or escalate
     }
   }
   ```

### Worker Agent (TypeScript)

3. **Worker agent skeleton**

   ```typescript
   // agents/worker.ts
   import { createPublicClient, createWalletClient, http } from "viem";
   import { avalancheFuji } from "viem/chains";

   async function workerLoop() {
     while (true) {
       try {
         // Poll for pending tasks
         const pendingCount = await publicClient.readContract({
           address: TASK_QUEUE_ADDRESS,
           abi: TASK_QUEUE_ABI,
           functionName: "getPendingCount",
         }) as bigint;

         if (pendingCount === 0n) {
           await new Promise((r) => setTimeout(r, 2000)); // Poll every 2s
           continue;
         }

         // Claim first available task
         const taskId = await publicClient.readContract({
           address: TASK_QUEUE_ADDRESS,
           abi: TASK_QUEUE_ABI,
           functionName: "pendingTaskIds",
           args: [0n],
         }) as `0x${string}`;

         const claimHash = await walletClient.writeContract({
           address: TASK_QUEUE_ADDRESS,
           abi: TASK_QUEUE_ABI,
           functionName: "claimTask",
           args: [taskId],
         });
         await publicClient.waitForTransactionReceipt({ hash: claimHash });

         // Execute task
         const task = await getTask(taskId);
         const result = await executeTask(task);

         // Submit result
         const submitHash = await walletClient.writeContract({
           address: TASK_QUEUE_ADDRESS,
           abi: TASK_QUEUE_ABI,
           functionName: "submitResult",
           args: [taskId, result],
         });
         await publicClient.waitForTransactionReceipt({ hash: submitHash });

       } catch (err) {
         console.error("Worker error:", err);
         await new Promise((r) => setTimeout(r, 5000));
       }
     }
   }

   async function executeTask(task: any): Promise<`0x${string}`> {
     const payload = JSON.parse(Buffer.from(task.payload.slice(2), "hex").toString());
     // AI processing logic here
     const result = { success: true, output: "..." };
     return `0x${Buffer.from(JSON.stringify(result)).toString("hex")}`;
   }
   ```

4. **Error handling across agents**

   ```typescript
   // Error handling patterns
   const MAX_RETRIES = 3;
   const RETRY_DELAY = 2000; // ms

   async function withRetry<T>(fn: () => Promise<T>, retries = MAX_RETRIES): Promise<T> {
     try {
       return await fn();
     } catch (err) {
       if (retries === 0) throw err;
       console.warn(`Retrying in ${RETRY_DELAY}ms...`, err);
       await new Promise((r) => setTimeout(r, RETRY_DELAY));
       return withRetry(fn, retries - 1);
     }
   }

   // Use for all on-chain writes
   const hash = await withRetry(() =>
     walletClient.writeContract({ ... })
   );
   ```

## Key concepts

**Avalanche Finality Advantage**: 1-2 second finality means agent coordination loops close in near-real-time. A manager can create a task, a worker can claim and complete it, and the manager can verify — all within 5-10 seconds on-chain.

**On-Chain as Truth**: The task queue contract is the source of truth. Workers can crash and restart without losing state — they re-read their assigned tasks from the chain.

**CEI in Task Queue**: The `submitResult` function zeroes out `task.reward` before calling `msg.sender.call` to prevent reentrancy from a malicious worker contract.

**Task Expiry**: Always set deadlines on tasks. If a worker claims and crashes, the task remains assigned until expiry. Add a `reclaim` function that allows manager to reassign expired tasks.

**Gas Estimation**: Workers must have sufficient AVAX for gas. Build a gas balance check into worker startup — fail fast if balance is too low.

## Common errors

| Error | Cause | Fix |
|---|---|---|
| `Not assigned to you` revert | Two workers raced for same task | Add nonce/lock or use try-catch and move to next task |
| Task stuck in Assigned | Worker crashed before submitting | Add `reclaimExpiredTask` function callable by manager |
| Payment failed to worker | Worker is a contract that reverts on receive | Worker must accept AVAX (implement `receive()`) |
| Aggregation misses results | Reading pendingTaskIds after removal | Track task IDs in manager memory, not from contract array |
| Worker runs out of AVAX | No gas balance check | Check `await publicClient.getBalance(workerAddress)` at startup |

## Next skills

- `ai-agent-patterns` — agent design patterns and prompting strategies
- `x402-integration` — per-request payment flows for agent tasks
