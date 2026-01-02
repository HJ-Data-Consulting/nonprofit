"""
Grants API - FastAPI application

Serves grant data from BigQuery with API key authentication and rate limiting.
"""

from fastapi import FastAPI, HTTPException, Header, Query, Depends
from fastapi.middleware.cors import CORSMiddleware
from google.cloud import bigquery
from typing import Optional, List
import os
from datetime import datetime, timedelta
from functools import lru_cache
import hashlib


app = FastAPI(
    title="Grants Intelligence API",
    description="Ontario nonprofit grants discovery and filtering API",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # TODO: Restrict in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API Tier Configuration (from Terraform variables)
API_TIERS = {
    'free': {'daily_quota': 100, 'description': 'Free tier'},
    'pro': {'daily_quota': 10000, 'description': 'Pro tier'},
    'enterprise': {'daily_quota': 100000, 'description': 'Enterprise tier'},
}


# Dependency: BigQuery Client
@lru_cache()
def get_bigquery_client():
    """Cached BigQuery client."""
    return bigquery.Client()


# Dependency: API Key Validation
async def validate_api_key(x_api_key: Optional[str] = Header(None)):
    """
    Validate API key and return tier.
    
    In Phase 2 (Public Discovery):
    - If key is missing: Return 'public' tier (limited results)
    - If key is provided: Return 'free' tier (for now, eventually 'pro/ent')
    """
    if not x_api_key:
        return {'tier': 'public', 'api_key_hash': None}
    
    # Mock tier detection (would query database in production)
    # For now, any key unlocks the 'free' tier (unlimited for internal use)
    tier = 'free'
    
    return {'tier': tier, 'api_key_hash': hashlib.sha256(x_api_key.encode()).hexdigest()[:8]}


@app.get("/")
async def root():
    """API root endpoint."""
    return {
        "name": "Grants Intelligence API",
        "version": "1.0.0",
        "docs": "/docs"
    }


@app.get("/api/v1/grants")
async def search_grants(
    province: Optional[str] = Query(None, description="Province code (e.g., ON)"),
    category: Optional[str] = Query(None, description="Category slug"),
    min_amount: Optional[int] = Query(None, description="Minimum grant amount"),
    max_amount: Optional[int] = Query(None, description="Maximum grant amount"),
    status: Optional[str] = Query('open', description="Grant status"),
    max_deadline_days: Optional[int] = Query(None, description="Deadline within N days"),
    limit: int = Query(50, le=100, description="Results per page"),
    offset: int = Query(0, description="Pagination offset"),
    auth: dict = Depends(validate_api_key)
):
    """
    Search and filter grants.
    
    Public Tier: Returns only top 5 results, ignores offset/limit.
    """
    bq = get_bigquery_client()
    project_id = os.environ.get('GCP_PROJECT', 'grants-platform-dev')
    
    # Enforce public tier limits
    if auth['tier'] == 'public':
        limit = 5
        offset = 0

    # Build query dynamically
    query_parts = [
        f"SELECT *, count(*) OVER() as total_rows FROM `{project_id}.grants_warehouse.grants_flat`",
        "WHERE 1=1"
    ]
    params = []
    
    if province:
        query_parts.append("AND province = @province")
        params.append(bigquery.ScalarQueryParameter("province", "STRING", province))
    
    if category:
        # Use case-insensitive substring match for flexibility
        query_parts.append("AND EXISTS (SELECT 1 FROM UNNEST(categories) c WHERE LOWER(c) LIKE @category_pattern)")
        params.append(bigquery.ScalarQueryParameter("category_pattern", "STRING", f"%{category.lower()}%"))
    
    if min_amount:
        query_parts.append("AND max_amount >= @min_amount")
        params.append(bigquery.ScalarQueryParameter("min_amount", "INT64", min_amount))
    
    if max_amount:
        query_parts.append("AND min_amount <= @max_amount")
        params.append(bigquery.ScalarQueryParameter("max_amount", "INT64", max_amount))
    
    if status:
        query_parts.append("AND status = @status")
        params.append(bigquery.ScalarQueryParameter("status", "STRING", status))
    
    if max_deadline_days:
        deadline_cutoff = datetime.now().date() + timedelta(days=max_deadline_days)
        query_parts.append("AND deadline_close <= @deadline_cutoff")
        params.append(bigquery.ScalarQueryParameter("deadline_cutoff", "DATE", deadline_cutoff))
    
    # Always filter by partition (deadline_close) to reduce costs, but include NULLs for rolling grants
    query_parts.append("AND (deadline_close >= CURRENT_DATE() OR deadline_close IS NULL)")
    
    # Order and pagination
    query_parts.append("ORDER BY deadline_close ASC")
    query_parts.append("LIMIT @limit OFFSET @offset")
    params.append(bigquery.ScalarQueryParameter("limit", "INT64", limit))
    params.append(bigquery.ScalarQueryParameter("offset", "INT64", offset))
    
    query = "\n".join(query_parts)
    
    job_config = bigquery.QueryJobConfig(query_parameters=params)
    
    try:
        query_job = bq.query(query, job_config=job_config)
        results = list(query_job.result())
        
        grants = [dict(row) for row in results]
        # Remove the window function helper from individual rows but keep the count
        total_count = results[0]['total_rows'] if results else 0
        for g in grants:
            g.pop('total_rows', None)
        
        return {
            'grants': grants,
            'count': len(grants),
            'total_count': total_count,
            'limit': limit,
            'offset': offset,
            'tier': auth['tier']
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Query failed: {str(e)}")


@app.get("/api/v1/grants/{grant_id}")
async def get_grant(
    grant_id: str,
    auth: dict = Depends(validate_api_key)
):
    """Get a single grant by ID."""
    bq = get_bigquery_client()
    project_id = os.environ.get('GCP_PROJECT', 'grants-platform-dev')
    
    query = f"""
    SELECT * FROM `{project_id}.grants_warehouse.grants_flat`
    WHERE grant_id = @grant_id
    AND deadline_close >= CURRENT_DATE()
    LIMIT 1
    """
    
    job_config = bigquery.QueryJobConfig(
        query_parameters=[
            bigquery.ScalarQueryParameter("grant_id", "STRING", grant_id)
        ]
    )
    
    try:
        query_job = bq.query(query, job_config=job_config)
        results = list(query_job.result())
        
        if not results:
            raise HTTPException(status_code=404, detail="Grant not found")
        
        return dict(results[0])
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Query failed: {str(e)}")


@app.get("/api/v1/funders")
async def list_funders(
    auth: dict = Depends(validate_api_key)
):
    """List active funders with grant counts."""
    bq = get_bigquery_client()
    project_id = os.environ.get('GCP_PROJECT', 'grants-platform-dev')
    
    query = f"""
    SELECT * FROM `{project_id}.grants_warehouse.funders_activity`
    ORDER BY open_grants DESC
    """
    
    try:
        query_job = bq.query(query)
        results = query_job.result()
        
        funders = [dict(row) for row in results]
        return {'funders': funders}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Query failed: {str(e)}")


@app.get("/api/v1/insights/deadlines")
async def upcoming_deadlines(
    days: int = Query(30, le=90, description="Days ahead to look"),
    auth: dict = Depends(validate_api_key)
):
    """Get upcoming grant deadlines calendar."""
    bq = get_bigquery_client()
    project_id = os.environ.get('GCP_PROJECT', 'grants-platform-dev')
    
    query = f"""
    SELECT 
        deadline_close as date,
        COUNT(*) as grant_count,
        ARRAY_AGG(STRUCT(grant_id, title, funder_name) LIMIT 10) as grants
    FROM `{project_id}.grants_warehouse.grants_flat`
    WHERE deadline_close BETWEEN CURRENT_DATE() AND DATE_ADD(CURRENT_DATE(), INTERVAL @days DAY)
    AND status = 'open'
    GROUP BY deadline_close
    ORDER BY deadline_close ASC
    """
    
    job_config = bigquery.QueryJobConfig(
        query_parameters=[
            bigquery.ScalarQueryParameter("days", "INT64", days)
        ]
    )
    
    try:
        query_job = bq.query(query, job_config=job_config)
        results = query_job.result()
        
        deadlines = [dict(row) for row in results]
        return {'deadlines': deadlines}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Query failed: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8080)
