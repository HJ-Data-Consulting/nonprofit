"""
Sample seed data for grants platform

This demonstrates the Firestore schema structure.
Run this script to populate dev environment with sample data.
"""

from google.cloud import firestore
from datetime import datetime, timedelta
import os

# Set project
os.environ['GOOGLE_CLOUD_PROJECT'] = 'grants-platform-dev'

db = firestore.Client()

def seed_funders():
    """Seed sample funders."""
    funders = [
        {
            'name': 'Ontario Trillium Foundation',
            'type': 'provincial_government',
            'website': 'https://otf.ca',
            'description': 'Provincial agency supporting healthy communities',
            'contact_email': 'info@otf.ca',
            'created_at': firestore.SERVER_TIMESTAMP,
            'updated_at': firestore.SERVER_TIMESTAMP,
        },
        {
            'name': 'Community Foundation of Ottawa',
            'type': 'community_foundation',
            'website': 'https://cfottawa.ca',
            'description': 'Community foundation serving Ottawa region',
            'contact_email': None,
            'created_at': firestore.SERVER_TIMESTAMP,
            'updated_at': firestore.SERVER_TIMESTAMP,
        }
    ]
    
    for funder in funders:
        funder_id = funder['name'].lower().replace(' ', '-')
        db.collection('funders').document(funder_id).set(funder)
        print(f"Created funder: {funder['name']}")


def seed_categories():
    """Seed sample categories."""
    categories = [
        {'name': 'Youth Development', 'slug': 'youth-development'},
        {'name': 'Arts & Culture', 'slug': 'arts-culture'},
        {'name': 'Environment', 'slug': 'environment'},
        {'name': 'Health & Wellness', 'slug': 'health-wellness'},
        {'name': 'Education', 'slug': 'education'},
    ]
    
    for category in categories:
        db.collection('categories').document(category['slug']).set(category)
        print(f"Created category: {category['name']}")


def seed_grants():
    """Seed sample grants with nested collections."""
    
    # Grant 1: OTF Grow Grant
    grant_id = 'otf-grow-2025'
    grant_data = {
        'title': 'Grow Grant',
        'funder_id': 'ontario-trillium-foundation',
        'summary': 'Supports capacity building for nonprofits in Ontario',
        'max_amount': 250000,
        'min_amount': 5000,
        'currency': 'CAD',
        'status': 'open',
        'rolling': False,
        'application_url': 'https://otf.ca/apply',
        'source_url': 'https://otf.ca/grants/grow',
        'created_at': firestore.SERVER_TIMESTAMP,
        'updated_at': firestore.SERVER_TIMESTAMP,
        'last_verified_at': firestore.SERVER_TIMESTAMP,
        'schema_version': 1,
    }
    
    grant_ref = db.collection('grants').document(grant_id)
    grant_ref.set(grant_data)
    print(f"Created grant: {grant_data['title']}")
    
    # Add deadline
    current_year = datetime.now().year
    grant_ref.collection('deadlines').document(f'spring-{current_year}').set({
        'type': 'fixed',
        'open_date': (datetime.now() - timedelta(days=30)).strftime('%Y-%m-%d'),
        'close_date': (datetime.now() + timedelta(days=45)).strftime('%Y-%m-%d'),
        'cycle': f'spring_{current_year}'
    })
    
    # Add eligibility
    grant_ref.collection('eligibility').document('default').set({
        'organization_type': ['nonprofit', 'charity'],
        'registered_required': True,
        'years_active_min': 1,
        'revenue_max': 2000000,
        'notes': 'Must be incorporated in Ontario'
    })
    
    # Add geography
    grant_ref.collection('geography').document('ontario').set({
        'region_type': 'province',
        'region_code': 'ON',
        'region_name': 'Ontario'
    })
    
    # Add categories
    grant_ref.collection('categories').document('youth-development').set({
        'category_id': 'youth-development'
    })
    grant_ref.collection('categories').document('education').set({
        'category_id': 'education'
    })
    
    # Grant 2: Community Foundation Grant
    grant_id_2 = f'cfo-community-{current_year}'
    grant_data_2 = {
        'title': 'Community Vitality Grant',
        'funder_id': 'community-foundation-of-ottawa',
        'summary': 'Supports community-led projects in Ottawa',
        'max_amount': 50000,
        'min_amount': 1000,
        'currency': 'CAD',
        'status': 'open',
        'rolling': True,
        'application_url': 'https://cfottawa.ca/apply',
        'source_url': 'https://cfottawa.ca/grants',
        'created_at': firestore.SERVER_TIMESTAMP,
        'updated_at': firestore.SERVER_TIMESTAMP,
        'last_verified_at': firestore.SERVER_TIMESTAMP,
        'schema_version': 1,
    }
    
    grant_ref_2 = db.collection('grants').document(grant_id_2)
    grant_ref_2.set(grant_data_2)
    print(f"Created grant: {grant_data_2['title']}")
    
    # Add deadline (rolling)
    grant_ref_2.collection('deadlines').document('rolling').set({
        'type': 'rolling',
        'open_date': None,
        'close_date': None,
        'cycle': None
    })
    
    # Add eligibility
    grant_ref_2.collection('eligibility').document('default').set({
        'organization_type': ['nonprofit', 'charity', 'community_group'],
        'registered_required': False,
        'years_active_min': 0,
        'revenue_max': None,
        'notes': 'Must serve Ottawa region'
    })
    
    # Add geography
    grant_ref_2.collection('geography').document('ottawa').set({
        'region_type': 'city',
        'region_code': 'ON',
        'region_name': 'Ontario',
        'city': 'Ottawa'
    })
    
    # Add categories
    grant_ref_2.collection('categories').document('arts-culture').set({
        'category_id': 'arts-culture'
    })


if __name__ == '__main__':
    print("Seeding grants platform with sample data...")
    seed_funders()
    seed_categories()
    seed_grants()
    print("\nSeed complete! Run sync function to populate BigQuery.")
