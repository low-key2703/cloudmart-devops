from fastapi import APIRouter, Response
from prometheus_client import Counter, Histogram, generate_latest, REGISTRY, CONTENT_TYPE_LATEST

router = APIRouter()

# Define metrics
REQUEST_COUNT = Counter(
    'product_service_requests_total',
    'Total requests to product service',
    ['method', 'endpoint', 'status']
)

REQUEST_LATENCY = Histogram(
    'product_service_request_duration_seconds',
    'Request latency in seconds',
    ['method', 'endpoint']
)


@router.get("/metrics")
def get_metrics():
    """Prometheus metrics endpoint"""
    return Response(
        content=generate_latest(REGISTRY),
        media_type=CONTENT_TYPE_LATEST
    )
