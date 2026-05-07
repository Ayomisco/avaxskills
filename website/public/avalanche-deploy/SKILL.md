---
name: "avalanche-deploy"
version: "1.0.0"
spec: "agentskills@1.0"
license: "Apache-2.0"
tier: 2
description: "Use Avalanche Deploy cloud playbooks for automated L1 and validator deployment on cloud infrastructure."
trigger: |
  Use when: deploying Avalanche validators to cloud (AWS, GCP, Azure), automated L1 deployment, Avalanche Deploy tool, cloud-based validator setup, cloud playbooks for Avalanche nodes, infrastructure-as-code for Avalanche
  Do NOT use for: manual node setup, local development, tmpnet, non-cloud validator setups, bare-metal without Avalanche Deploy
last_updated: "2026-05-07"
avalanche_networks: [fuji, mainnet]
related_skills:
  - node-setup
  - validator-management
  - subnet-deployment
  - platform-cli
---

## Overview

Avalanche Deploy is a cloud automation tool for provisioning Avalanche validator nodes and L1s on AWS, GCP, and Azure. It automates node provisioning, AvalancheGo installation, Subnet deployment, and validator registration using YAML-based playbooks (similar to Ansible). Available at `build.avax.network` under Tools.

Docs: https://build.avax.network/docs/tooling/avalanche-deploy

## When to fetch

Fetch this skill when:
- A user wants to deploy a validator node to AWS, GCP, or Azure
- A user asks about Avalanche Deploy, cloud playbooks, or automated L1 deployment
- A user wants to automate the validator provisioning pipeline
- A user needs a repeatable infrastructure-as-code approach for Avalanche nodes

## Core Workflow

### 1. Install Avalanche CLI (includes Deploy tooling)

```bash
curl -sSfL https://raw.githubusercontent.com/ava-labs/avalanche-cli/main/scripts/install.sh | sh

# Verify installation
avalanche --version
```

### 2. Configure cloud provider credentials

**AWS:**

```bash
# Install AWS CLI
brew install awscli  # macOS
# or: pip install awscli

# Configure credentials
aws configure
# AWS Access Key ID: <your-access-key>
# AWS Secret Access Key: <your-secret-key>
# Default region: us-east-1  (or your preferred region)
# Default output format: json

# Set region for deploy:
export AVALANCHE_DEPLOY_CLOUD_REGION=us-east-1
```

**GCP:**

```bash
# Install gcloud SDK
# https://cloud.google.com/sdk/docs/install

gcloud auth application-default login
gcloud config set project <YOUR_GCP_PROJECT_ID>

export AVALANCHE_DEPLOY_CLOUD_PROVIDER=gcp
export AVALANCHE_DEPLOY_GCP_PROJECT=<YOUR_GCP_PROJECT_ID>
```

**Azure:**

```bash
az login
az account set --subscription <YOUR_SUBSCRIPTION_ID>

export AVALANCHE_DEPLOY_CLOUD_PROVIDER=azure
```

### 3. Write a deployment playbook

Playbooks are YAML files that describe your desired node and Subnet configuration.

```yaml
# avalanche-deploy-playbook.yaml

# Cloud provider settings
cloud:
  provider: aws           # aws | gcp | azure
  region: us-east-1
  instance_type: c5.2xlarge   # 8 vCPU, 16 GB RAM — minimum for mainnet validator

# Number of nodes to provision
nodes: 5

# AvalancheGo version to install
avalanchego_version: latest   # or pin: "v1.11.3"

# Staking key configuration
# IMPORTANT: Generate keys beforehand with: avalanche key create mykey
staking:
  key_name: my-validator-key

# Optional: deploy a Subnet/L1 on the provisioned nodes
subnet:
  name: my-l1
  config: ./my-l1-config.json   # path to your subnet genesis config

# Monitoring (optional but recommended)
monitoring:
  enabled: true
  grafana_endpoint: https://grafana.example.com
```

### 4. Run deployment

```bash
# Preview what will be deployed (dry run)
avalanche node create \
  --cloud-service aws \
  --region us-east-1 \
  --num-validators 5 \
  --node-type default \
  --fuji   # use --mainnet for mainnet

# Deploy validators (interactive — prompts for confirmation)
avalanche node create \
  --cloud-service aws \
  --region us-east-1 \
  --num-validators 5 \
  --node-type default \
  --fuji
```

The CLI will:
1. Provision EC2 instances (or equivalent)
2. Install AvalancheGo and configure systemd service
3. Generate staking certificates and node IDs
4. Output node IDs for validator registration

### 5. Deploy L1 on the provisioned nodes

```bash
# After nodes are running, deploy your Subnet
avalanche blockchain deploy myL1 \
  --network fuji \
  --node-ids NodeID-ABC123,NodeID-DEF456,NodeID-GHI789
```

### 6. Monitor and manage deployed validators

```bash
# List all deployed cloud nodes
avalanche node list

# SSH into a node
avalanche node ssh <node-name>

# Check node status
avalanche node status <node-name>

# Update AvalancheGo on all nodes
avalanche node upgrade --network fuji

# Stop/destroy nodes (USE WITH CAUTION — removes validators)
avalanche node destroy <node-name>
```

### 7. State files

Avalanche Deploy stores deployment state in `~/.avalanche-cli/nodes/`. These files contain node IDs, IP addresses, and credentials.

```bash
# Location of state files
ls ~/.avalanche-cli/nodes/

# Backup state files
cp -r ~/.avalanche-cli/nodes/ ~/avalanche-node-backup-$(date +%Y%m%d)/
```

## Network config

| Cloud | Recommended Instance | Minimum RAM | Notes |
|-------|---------------------|-------------|-------|
| AWS | `c5.2xlarge` | 16 GB | 8 vCPU, SSD storage required |
| AWS (gaming L1) | `c5.4xlarge` | 32 GB | High gas limit requires more CPU |
| GCP | `n2-standard-8` | 32 GB | Standard for mainnet |
| Azure | `Standard_D8s_v3` | 32 GB | SSD storage recommended |

Estimated monthly cloud cost for a 5-node validator set: **$300–800/month on AWS** (varies by region and instance type).

## Key concepts

- **Playbook**: YAML config file that defines the desired deployment state — cloud provider, node count, AvalancheGo version, and optional Subnet.
- **State files**: Avalanche CLI stores provisioned node info in `~/.avalanche-cli/nodes/`. These files are required to manage, update, or destroy nodes. Back them up.
- **Node ID**: Each provisioned node gets a unique NodeID (e.g., `NodeID-5ZUdznHE5QiNVFkGKMEfNxAYvF6HVbCTA`). Use this ID when adding the node as a validator.
- **Staking certificate**: Auto-generated per node. Stored in `~/.avalanche-cli/nodes/<node-name>/`. Back up the staking key (`staker.key`) and certificate (`staker.crt`).
- **Separate accounts for testnet/mainnet**: Never share cloud accounts or staking keys between Fuji and mainnet deployments.

## Common errors

| Error | Cause | Fix |
|-------|-------|-----|
| `AWS credentials not found` | Missing AWS CLI config | Run `aws configure` |
| `Instance limit exceeded` | AWS service quota too low | Request limit increase in AWS console |
| `Node not synced` | Node still bootstrapping | Wait for bootstrap to complete (1–4 hours) |
| `State file not found` | Running from a different machine | Copy `~/.avalanche-cli/nodes/` to the new machine |
| `Validator not registering` | Insufficient AVAX for staking | Ensure P-Chain address has enough AVAX for minimum stake |

## Next skills

- **node-setup** — manual node setup without cloud automation
- **validator-management** — manage validators after deployment
- **subnet-deployment** — deploy L1s on provisioned nodes
- **platform-cli** — Avalanche CLI reference for all commands
