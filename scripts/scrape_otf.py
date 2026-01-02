import os
import requests
import json
import time
import argparse
from bs4 import BeautifulSoup
from datetime import datetime
from google.cloud import firestore
from anthropic import AnthropicVertex

# Configuration
DEFAULT_LOCATION = "us-central1"
DEFAULT_PROJECT = "grants-platform-dev"

def get_client(project_id, location):
    return AnthropicVertex(region=location, project_id=project_id)

def extract_grant_data(client, url, html_content):
    """Use Claude to extract structured grant data and sub-grant links from HTML."""
    soup = BeautifulSoup(html_content, 'html.parser')
    for script in soup(["script", "style", "nav", "footer"]):
        script.decompose()
    text = soup.get_text(separator=' ', strip=True)[:30000]

    prompt = f"""
    You are a grant data extractor. Analyze the text below from {url}.
    
    1. Extract grant programs found on this page.
    2. Identify URLs to "sub-grants" or related programs mentioned that should be crawled.

    Return ONLY a JSON object:
    {{
      "grants": [
        {{
          "id": "unique-slug",
          "title": "Grant Title",
          "summary": "Short description",
          "min_amount": number_or_null,
          "max_amount": number_or_null,
          "open_date": "YYYY-MM-DD",
          "close_date": "YYYY-MM-DD",
          "categories": ["category"]
        }}
      ],
      "sub_links": ["https://..."]
    }}

    Text:
    {text}
    """

    try:
        message = client.messages.create(
            max_tokens=2048,
            messages=[{"role": "user", "content": prompt}],
            model="claude-3-haiku@20240307",
            temperature=0
        )
        response_text = message.content[0].text if isinstance(message.content, list) else message.content
        if "```json" in response_text:
            response_text = response_text.split("```json")[1].split("```")[0].strip()
        elif "```" in response_text:
            response_text = response_text.split("```")[1].split("```")[0].strip()
        return json.loads(response_text.strip())
    except Exception as e:
        print(f"Error calling Claude for {url}: {e}")
        return {"grants": [], "sub_links": []}

def upsert_grants(db, grants, source_url):
    """Upsert extracted grants to Firestore."""
    for grant in grants:
        # Use a more stable ID if possible, or append year for versioning
        base_id = grant.get('id', grant['title'].lower().replace(' ', '-'))
        grant_id = f"{base_id}-2026"
        print(f"Upserting {grant_id}: {grant['title']}")

        grant_doc = {
            'funder_id': 'ontario-trillium-foundation',
            'title': grant['title'],
            'summary': grant.get('summary', ''),
            'min_amount': grant.get('min_amount'),
            'max_amount': grant.get('max_amount'),
            'deadline_open': grant.get('open_date'),
            'deadline_close': grant.get('close_date'),
            'categories': grant.get('categories', []),
            'application_url': source_url,
            'source_url': source_url,
            'status': 'open',
            'rolling': False,
            'created_at': firestore.SERVER_TIMESTAMP,
            'updated_at': firestore.SERVER_TIMESTAMP,
            'last_verified_at': firestore.SERVER_TIMESTAMP,
            'currency': 'CAD'
        }
        db.collection('grants').document(grant_id).set(grant_doc, merge=True)

        # Still save to subcollection for historical compatibility/detailed tracking
        if grant.get('open_date') or grant.get('close_date'):
            db.collection('grants').document(grant_id).collection('deadlines').document('current').set({
                'type': 'fixed',
                'open_date': grant.get('open_date'),
                'close_date': grant.get('close_date'),
                'cycle': 'current'
            })

def run_spider(project_id, location, start_urls, max_pages=15, recursive=True):
    print(f"Starting Recursive Scraper (Project: {project_id}, Region: {location})")
    db = firestore.Client(project=project_id)
    client = get_client(project_id, location)
    
    visited = set()
    queue = list(start_urls)
    count = 0

    while queue and len(visited) < max_pages:
        url = queue.pop(0)
        if url in visited: continue
        
        print(f"[{len(visited)+1}/{max_pages}] Crawling {url}...")
        visited.add(url)
        
        try:
            resp = requests.get(url, timeout=10)
            if resp.status_code == 200:
                result = extract_grant_data(client, url, resp.content)
                if result.get('grants'):
                    upsert_grants(db, result['grants'], url)
                    count += len(result['grants'])
                
                if recursive:
                    for link in result.get('sub_links', []):
                        if link.startswith('http') and 'otf.ca' in link:
                            queue.append(link)
            time.sleep(1)
        except Exception as e:
            print(f"Failed {url}: {e}")

    print(f"Done. Processed {len(visited)} pages, found {count} grants.")

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='AI-Powered Grant Scraper')
    parser.add_argument('--urls', nargs='+', help='Start URLs to crawl')
    parser.add_argument('--project', default=os.environ.get('GOOGLE_CLOUD_PROJECT', DEFAULT_PROJECT), help='GCP Project ID')
    parser.add_argument('--location', default=DEFAULT_LOCATION, help='Vertex AI Location')
    parser.add_argument('--max-pages', type=int, default=15, help='Max pages to visit')
    parser.add_argument('--no-recursive', action='store_false', dest='recursive', help='Disable recursive crawling')
    
    args = parser.parse_args()
    
    urls = args.urls or [
        "https://otf.ca/our-grants/community-investments-grants/seed-grant",
        "https://otf.ca/our-grants/community-investments-grants/grow-grant",
        "https://otf.ca/our-grants/community-investments-grants/capital-grant",
        "https://otf.ca/our-grants/youth-opportunities-fund"
    ]
    
    run_spider(args.project, args.location, urls, args.max_pages, args.recursive)
