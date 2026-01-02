# Nonprofit Grants Platform - Terraform Infrastructure

This directory contains Infrastructure as Code for the grants platform.

## Structure

```
terraform/
├── environments/
│   ├── dev/
│   │   └── terraform.tfvars
│   └── prod/
│       └── terraform.tfvars
├── modules/
│   ├── firestore/
│   ├── bigquery/
│   ├── cloud-run/
│   └── monitoring/
├── main.tf
├── variables.tf
├── outputs.tf
└── versions.tf
```

## Prerequisites

1. Install Terraform: `brew install terraform` (or equivalent)
2. Install gcloud CLI: `brew install google-cloud-sdk`
3. Authenticate: `gcloud auth application-default login`

## Usage

### Initialize Terraform
```bash
cd terraform
terraform init
```

### Plan (Dev)
```bash
terraform plan -var-file=environments/dev/terraform.tfvars
```

### Apply (Dev)
```bash
terraform apply -var-file=environments/dev/terraform.tfvars
```

### Apply (Prod)
```bash
terraform apply -var-file=environments/prod/terraform.tfvars
```

## Manual Steps Required

1. **Create GCP Projects** (one-time, manual):
   ```bash
   gcloud projects create grants-platform-dev --name="Grants Platform Dev"
   gcloud projects create grants-platform-prod --name="Grants Platform Prod"
   ```

2. **Link Billing Account** (replace BILLING_ACCOUNT_ID):
   ```bash
   gcloud billing projects link grants-platform-dev --billing-account=BILLING_ACCOUNT_ID
   gcloud billing projects link grants-platform-prod --billing-account=BILLING_ACCOUNT_ID
   ```

3. **Enable Terraform to manage project**:
   ```bash
   # Run terraform with project_id in tfvars
   ```

## Cost Estimates

### Dev Environment
- Firestore: ~$0 (free tier)
- BigQuery: ~$5/month (1GB storage, minimal queries)
- Cloud Run: ~$0 (scales to zero)
- **Total: ~$5/month**

### Prod Environment (100 nonprofits using API)
- Firestore: ~$10/month
- BigQuery: ~$20/month (10GB storage, 100GB queries)
- Cloud Run: ~$15/month
- Memorystore (Redis): ~$30/month
- **Total: ~$75/month**
