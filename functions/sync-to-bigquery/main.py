"""
Firestore to BigQuery Sync Function

Runs hourly via Cloud Scheduler.
Denormalizes Firestore grants data and upserts to BigQuery grants_flat table.
"""

import os
from datetime import datetime, timezone
from typing import Dict, List, Any
import functions_framework
from google.cloud import firestore
from google.cloud import bigquery


def get_last_sync_time(db: firestore.Client) -> datetime:
    """Get the last successful sync timestamp from Firestore metadata."""
    sync_doc = db.collection('metadata').document('sync').get()
    if sync_doc.exists:
        return sync_doc.to_dict().get('last_sync_time', datetime(2000, 1, 1, tzinfo=timezone.utc))
    return datetime(2000, 1, 1, tzinfo=timezone.utc)


def update_sync_time(db: firestore.Client, sync_time: datetime):
    """Update the last successful sync timestamp."""
    db.collection('metadata').document('sync').set({
        'last_sync_time': sync_time,
        'updated_at': firestore.SERVER_TIMESTAMP
    })


def fetch_modified_grants(db: firestore.Client, since: datetime) -> List[Dict[str, Any]]:
    """Fetch grants modified since last sync."""
    grants_ref = db.collection('grants')
    query = grants_ref.where('updated_at', '>=', since).stream()
    
    grants = []
    for doc in query:
        grant_data = doc.to_dict()
        grant_data['grant_id'] = doc.id
        grants.append(grant_data)
    
    return grants


def denormalize_grant(db: firestore.Client, grant: Dict[str, Any]) -> Dict[str, Any]:
    """
    Denormalize a grant by joining with related collections.
    
    This is the critical transformation: OLTP → OLAP
    """
    grant_id = grant['grant_id']
    
    # Fetch funder
    funder = None
    if 'funder_id' in grant:
        funder_doc = db.collection('funders').document(grant['funder_id']).get()
        if funder_doc.exists:
            funder = funder_doc.to_dict()
    
    # Fetch deadlines (take the first active one)
    deadline = None
    # Fetch deadlines (take the latest one)
    deadline = None
    deadlines_ref = db.collection('grants').document(grant_id).collection('deadlines')
    all_deadlines = []
    for deadline_doc in deadlines_ref.stream():
        d_data = deadline_doc.to_dict()
        if d_data.get('close_date'):
            all_deadlines.append(d_data)
    
    # Sort by close_date descending
    if all_deadlines:
        all_deadlines.sort(key=lambda x: x['close_date'] or '', reverse=True)
        deadline = all_deadlines[0]
    
    # Fetch eligibility (merge all into single record)
    eligibility = {}
    eligibility_ref = db.collection('grants').document(grant_id).collection('eligibility')
    for elig_doc in eligibility_ref.stream():
        eligibility.update(elig_doc.to_dict())
    
    # Fetch geography (take first one)
    geography = None
    geo_ref = db.collection('grants').document(grant_id).collection('geography')
    for geo_doc in geo_ref.stream():
        geography = geo_doc.to_dict()
        break
    
    # Fetch categories (collect all)
    categories = []
    cat_ref = db.collection('grants').document(grant_id).collection('categories')
    for cat_doc in cat_ref.stream():
        cat_data = cat_doc.to_dict()
        if 'category_id' in cat_data:
            categories.append(cat_data['category_id'])
    
    # Build flattened record
    flat_record = {
        'grant_id': grant_id,
        'title': grant.get('title'),
        'summary': grant.get('summary'),
        'funder_id': grant.get('funder_id'),
        'funder_name': funder.get('name') if funder else None,
        'funder_type': funder.get('type') if funder else None,
        'min_amount': grant.get('min_amount'),
        'max_amount': grant.get('max_amount'),
        'currency': grant.get('currency', 'CAD'),
        'status': grant.get('status', 'unknown'),
        'rolling': grant.get('rolling', False),
        'deadline_open': deadline.get('open_date') if deadline else None,
        'deadline_close': deadline.get('close_date') if deadline else None,
        'categories': categories,
        'eligible_org_types': eligibility.get('organization_type', []),
        'province': geography.get('region_code') if geography else None,
        'city': geography.get('city') if geography else None,
        'region_type': geography.get('region_type') if geography else None,
        'years_active_min': eligibility.get('years_active_min'),
        'revenue_max': eligibility.get('revenue_max'),
        'registered_required': eligibility.get('registered_required'),
        'application_url': grant.get('application_url'),
        'source_url': grant.get('source_url'),
        'source_name': None,  # TODO: Join with sources collection
        'trust_level': None,  # TODO: Join with sources collection
        'last_verified_at': grant.get('last_verified_at'),
        'created_at': grant.get('created_at'),
        'updated_at': grant.get('updated_at'),
    }
    
    return flat_record


def to_json_serializable(obj):
    """Recursively convert datetime objects to strings for JSON serialization."""
    if isinstance(obj, datetime):
        return obj.isoformat()
    if isinstance(obj, dict):
        return {k: to_json_serializable(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [to_json_serializable(i) for i in obj]
    return obj


def upsert_to_bigquery(bq_client: bigquery.Client, records: List[Dict[str, Any]]):
    """Upsert records to BigQuery grants_flat table."""
    if not records:
        print("No records to sync")
        return
    
    # Convert datetime objects to JSON-serializable strings
    records = to_json_serializable(records)
    
    project_id = os.environ.get('GCP_PROJECT')
    table_id = f"{project_id}.grants_warehouse.grants_flat"
    
    # BigQuery streaming inserts are expensive, so we use load job instead
    job_config = bigquery.LoadJobConfig(
        write_disposition=bigquery.WriteDisposition.WRITE_TRUNCATE,  # For now, full refresh
        source_format=bigquery.SourceFormat.NEWLINE_DELIMITED_JSON,
    )
    
    # TODO: Implement incremental upsert using MERGE statement
    # For MVP, full table refresh is acceptable
    
    job = bq_client.load_table_from_json(records, table_id, job_config=job_config)
    job.result()  # Wait for job to complete
    
    print(f"Synced {len(records)} records to BigQuery")


@functions_framework.http
def sync_to_bigquery(request):
    """
    HTTP Cloud Function triggered by Cloud Scheduler.
    
    Syncs modified grants from Firestore to BigQuery.
    """
    try:
        # Initialize clients
        db = firestore.Client()
        bq_client = bigquery.Client()
        
        # Get last sync time
        last_sync = get_last_sync_time(db)
        current_sync = datetime.now(timezone.utc)
        
        print(f"Starting sync. Last sync: {last_sync}")
        
        # Fetch modified grants
        modified_grants = fetch_modified_grants(db, last_sync)
        print(f"Found {len(modified_grants)} modified grants")
        
        # Denormalize each grant
        flat_records = []
        for grant in modified_grants:
            try:
                flat_record = denormalize_grant(db, grant)
                flat_records.append(flat_record)
            except Exception as e:
                print(f"Error denormalizing grant {grant.get('grant_id')}: {e}")
                continue
        
        # Upsert to BigQuery
        if flat_records:
            upsert_to_bigquery(bq_client, flat_records)
        
        # Update sync metadata
        update_sync_time(db, current_sync)
        
        return {
            'status': 'success',
            'grants_synced': len(flat_records),
            'sync_time': current_sync.isoformat()
        }, 200
        
    except Exception as e:
        print(f"Sync failed: {e}")
        return {'status': 'error', 'message': str(e)}, 500
