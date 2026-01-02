"""
Test suite for API endpoints
"""

import pytest
from fastapi.testclient import TestClient
from unittest.mock import Mock, patch
import sys
import os

# Add api directory to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '../api'))

from main import app


client = TestClient(app)


def test_root_endpoint():
    """Test API root endpoint."""
    response = client.get("/")
    assert response.status_code == 200
    assert response.json()['name'] == 'Grants Intelligence API'


def test_search_grants_requires_api_key():
    """Test that search endpoint requires API key."""
    response = client.get("/api/v1/grants")
    assert response.status_code == 422  # Missing required header


def test_search_grants_with_api_key():
    """Test search endpoint with API key."""
    with patch('main.get_bigquery_client') as mock_bq:
        # Mock BigQuery response
        mock_query_job = Mock()
        mock_query_job.result.return_value = []
        mock_bq.return_value.query.return_value = mock_query_job
        
        response = client.get(
            "/api/v1/grants?province=ON",
            headers={"X-API-Key": "test-key"}
        )
        
        assert response.status_code == 200
        assert 'grants' in response.json()
        assert response.json()['tier'] == 'free'


def test_search_grants_filters():
    """Test search endpoint with multiple filters."""
    with patch('main.get_bigquery_client') as mock_bq:
        mock_query_job = Mock()
        mock_query_job.result.return_value = []
        mock_bq.return_value.query.return_value = mock_query_job
        
        response = client.get(
            "/api/v1/grants?province=ON&category=youth-development&min_amount=5000",
            headers={"X-API-Key": "test-key"}
        )
        
        assert response.status_code == 200
        # Verify query was called with parameters
        assert mock_bq.return_value.query.called


def test_get_grant_not_found():
    """Test getting non-existent grant."""
    with patch('main.get_bigquery_client') as mock_bq:
        mock_query_job = Mock()
        mock_query_job.result.return_value = []
        mock_bq.return_value.query.return_value = mock_query_job
        
        response = client.get(
            "/api/v1/grants/nonexistent",
            headers={"X-API-Key": "test-key"}
        )
        
        assert response.status_code == 404


if __name__ == '__main__':
    pytest.main([__file__, '-v'])
