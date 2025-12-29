"""Basic health check tests for Product Service."""
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_health_endpoint_returns_200():
    """Test that health endpoint returns 200."""
    response = client.get("/health")
    assert response.status_code == 200


def test_health_response_has_required_fields():
    """Test that health endpoint returns expected fields."""
    response = client.get("/health")
    data = response.json()
    assert data["status"] == "healthy"
    assert data["service"] == "product-service"
    assert "uptime" in data
