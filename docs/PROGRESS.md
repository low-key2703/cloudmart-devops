# CloudMart DevOps - Progress Tracker

## Completed

### Environment Setup
- WSL2 Ubuntu on Windows
- Docker Desktop with WSL2 integration
- Node.js 20, Python 3.10, Go 1.25
- kubectl, Minikube
- Git + GitHub (SSH/PAT auth)

### API Gateway (Node.js/Express) - Port 3000
Location: `applications/api-gateway/`

**Features:**
- Request routing to microservices
- JWT authentication middleware
- Rate limiting (100 req/min per IP)
- Health endpoint (`/health`)
- Prometheus metrics (`/metrics`)
- Proxy to Product, Order, User services

**Key files:**
- `src/index.js` - Main entry, middleware chain
- `src/config/index.js` - Environment-based config
- `src/middleware/auth.js` - JWT validation
- `src/middleware/rateLimiter.js` - Rate limiting
- `src/routes/health.js` - Health checks
- `src/routes/metrics.js` - Prometheus metrics

**Run:** `npm run dev`

### Product Service (Python/FastAPI) - Port 8000
Location: `applications/product-service/`

**Features:**
- Product CRUD operations
- Category management
- Pagination and search
- Stock management
- PostgreSQL with SQLAlchemy ORM
- Health and readiness endpoints
- Prometheus metrics

**Key files:**
- `app/main.py` - FastAPI app, middleware
- `app/config/settings.py` - Pydantic settings
- `app/models/database.py` - DB connection
- `app/models/product.py` - SQLAlchemy models
- `app/schemas/product.py` - Pydantic schemas
- `app/routers/products.py` - API endpoints

**Run:** `source venv/bin/activate && python run.py`

**Requires:** PostgreSQL on port 5432
```bash
docker run -d --name cloudmart-postgres \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=cloudmart \
  -p 5432:5432 postgres:15-alpine
```

## In Progress
- Order Service (Go/Gin)

## Pending
- User Service (Node.js/Express)
- Docker Compose for all services
- Dockerfiles for each service
- Kubernetes manifests
- CI/CD with GitHub Actions
- ArgoCD GitOps setup
- Prometheus + Grafana monitoring
- Security (Trivy, RBAC, Network Policies)

## Key Concepts Learned

### 12-Factor App Principles Applied
- Config from environment variables
- Stateless services
- Port binding
- Health checks for process management

### API Design Patterns
- `/health` - Liveness probe (is it running?)
- `/ready` - Readiness probe (can it serve traffic?)
- `/metrics` - Prometheus scraping endpoint
