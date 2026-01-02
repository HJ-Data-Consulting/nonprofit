# 🦅 Grants Platform Technical Wiki

This document contains detailed technical information for developers, architects, and operators.

## 🏗️ Architecture Overview

The system follows a production-grade **OLTP/OLAP split** optimized for nonprofit grant discovery.

- **OLTP Layer**: Firestore (`northamerica-northeast1`) stores normalized grant data, funder profiles, and deadlines.
- **OLAP Layer**: BigQuery (`northamerica-northeast1`) hosts denormalized analytical views for scale and API performance.
- **Sync Pipeline**: An hourly Cloud Function denormalizes Firestore data and loads it into BigQuery partitioned tables.
- **API**: A Python FastAPI layer serves discovery queries with built-in tier-based quota skeletons.

## 🤖 Data Ingestion (AI Scraper)

The platform includes an AI-powered recursive scraper located in `scripts/scrape_otf.py`.

### Features
- **Claude 3 Haiku Integration**: Uses Anthropic via Vertex AI for high-accuracy structured data extraction.
- **Recursive Discovery**: Automatically follows sub-links found by the LLM (e.g., finding "sub-grants" inside a main category).
- **CLI Support**: Control project, location, and crawling depth via arguments.

### Usage
```bash
# Install dependencies
pip install requests beautifulsoup4 google-cloud-firestore anthropic[vertex]

# Run default crawl (OTF entry points)
python scripts/scrape_otf.py --project=YOUR_PROJECT_ID

# Run custom crawl
python scripts/scrape_otf.py --urls https://example.com/grants --max-pages 10
```

## 🚀 Deployment Guide

### 1. Infrastructure (Terraform)
```bash
cd terraform
terraform init
terraform apply -var-file=environments/dev/terraform.tfvars
```

### 2. Services
Deploy the sync function and API using `gcloud` or a CI/CD pipeline.

- **Sync Function**: Located in `functions/sync-to-bigquery/`
- **FastAPI**: Located in `api/`

## 📡 API Usage

### Authentication
All endpoints require an `X-API-Key` header.

```bash
curl -H "X-API-Key: test-key" \
  https://grants-api-xxx.a.run.app/api/v1/grants?province=ON
```

## 📉 Cost & Scale
- **Storage**: Partitioned BigQuery tables minimize scan costs (queries are typically < $0.01).
- **Compute**: Serverless architecture (Cloud Run/Functions) scales to zero when not in use.
- **AI**: Claude 3 Haiku provides the best cost-to-performance ratio for parsing unstructured HTML.

---
*Created by HJD Consulting.*
