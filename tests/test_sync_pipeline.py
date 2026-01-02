"""
Test suite for Firestore to BigQuery sync function
"""

import pytest
from unittest.mock import Mock, patch
from datetime import datetime, timezone
import sys
import os

# Add functions directory to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '../functions/sync-to-bigquery'))

from main import denormalize_grant, fetch_modified_grants


def test_denormalize_grant_basic():
    """Test basic grant denormalization."""
    # Mock Firestore client
    mock_db = Mock()
    
    # Mock funder
    mock_funder_doc = Mock()
    mock_funder_doc.exists = True
    mock_funder_doc.to_dict.return_value = {
        'name': 'Test Funder',
        'type': 'foundation'
    }
    mock_db.collection.return_value.document.return_value.get.return_value = mock_funder_doc
    
    # Mock empty subcollections
    mock_db.collection.return_value.document.return_value.collection.return_value.stream.return_value = []
    
    grant = {
        'grant_id': 'test-grant-1',
        'title': 'Test Grant',
        'funder_id': 'test-funder',
        'summary': 'Test summary',
        'max_amount': 100000,
        'min_amount': 10000,
        'currency': 'CAD',
        'status': 'open',
        'rolling': False,
        'created_at': datetime.now(timezone.utc),
        'updated_at': datetime.now(timezone.utc),
        'last_verified_at': datetime.now(timezone.utc),
    }
    
    result = denormalize_grant(mock_db, grant)
    
    assert result['grant_id'] == 'test-grant-1'
    assert result['title'] == 'Test Grant'
    assert result['funder_name'] == 'Test Funder'
    assert result['max_amount'] == 100000
    assert result['currency'] == 'CAD'


def test_denormalize_grant_with_deadline():
    """Test grant denormalization with deadline."""
    mock_db = Mock()
    
    # Mock funder
    mock_funder_doc = Mock()
    mock_funder_doc.exists = True
    mock_funder_doc.to_dict.return_value = {'name': 'Test Funder', 'type': 'foundation'}
    
    # Mock deadline
    mock_deadline_doc = Mock()
    mock_deadline_doc.to_dict.return_value = {
        'open_date': '2025-01-01',
        'close_date': '2025-12-31'
    }
    
    # Setup mock to return deadline
    def mock_collection_chain(*args, **kwargs):
        if 'deadlines' in str(args):
            mock_stream = Mock()
            mock_stream.stream.return_value = [mock_deadline_doc]
            return mock_stream
        mock_stream = Mock()
        mock_stream.stream.return_value = []
        return mock_stream
    
    mock_db.collection.return_value.document.return_value.get.return_value = mock_funder_doc
    mock_db.collection.return_value.document.return_value.collection.side_effect = mock_collection_chain
    
    grant = {
        'grant_id': 'test-grant-2',
        'title': 'Test Grant with Deadline',
        'funder_id': 'test-funder',
        'status': 'open',
        'currency': 'CAD',
        'rolling': False,
        'created_at': datetime.now(timezone.utc),
        'updated_at': datetime.now(timezone.utc),
        'last_verified_at': datetime.now(timezone.utc),
    }
    
    result = denormalize_grant(mock_db, grant)
    
    assert result['deadline_open'] == '2025-01-01'
    assert result['deadline_close'] == '2025-12-31'


if __name__ == '__main__':
    pytest.main([__file__, '-v'])
