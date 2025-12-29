# CloudMart DevOps - Progress Tracker

## Completed

### Environment Setup
- WSL2 Ubuntu on Windows
- Docker Desktop with WSL2 integration
- Node.js 20, Python 3.10, Go 1.21
- kubectl, Minikube, Helm
- Git + GitHub

### Microservices
| Service | Tech | Port | Status |
|---------|------|------|--------|
| API Gateway | Node.js/Express | 3000 | ✅ Complete |
| Product Service | Python/FastAPI | 8000 | ✅ Complete |
| Order Service | Go/Gin | 8080 | ✅ Complete |
| User Service | Node.js/Express | 3001 | ✅ Complete |

### Docker Compose
- All services containerized
- PostgreSQL with health checks
- Redis for caching/rate-limiting
- Automated migrations (init-db.sh)
- Resource limits defined
- Volume persistence

### Kubernetes (Raw Manifests)
Location: `infrastructure/kubernetes/base/`
- Namespace (`cloudmart-dev`)
- All 4 microservices (Deployments + Services)
- PostgreSQL (StatefulSet + PVC)
- Redis (Deployment + Service)
- Ingress with TLS (self-signed cert)
- ConfigMaps and Secrets
- Liveness/Readiness probes
- Resource requests/limits

### Helm Charts
Location: `infrastructure/kubernetes/helm/cloudmart/`
- 17 templated resources
- Environment-specific values
- Custom helpers (_helpers.tpl)
- Kubernetes recommended labels
- Documentation (NOTES.txt, README.md)

### Security & Scaling
- **HPA:** 4 autoscalers (api-gateway, product, order, user)
- **Network Policies:** 8 policies with default deny
- **Sealed Secrets:** 5 secrets (db, redis, jwt, services)

### GitHub Actions CI/CD 
| Service | Linter | Tests | Trivy | GHCR |
|---------|--------|-------|-------|------|
| Product Service | pylint | pytest | ✅ | ✅ |
| Order Service | golangci-lint | go test | ✅ | ✅ |
| API Gateway | eslint | - | ✅ | ✅ |
| User Service | eslint | - | ✅ | ✅ |

**Pipeline:** Checkout → Setup → Install → Lint → Test → Build → Scan → Push

### CI Enhancements 
- **Helm Lint Workflow:** Validates chart on PR/push
- **Dependency Caching:** pip, Go modules, npm (faster builds)
- **ESLint Config:** Added for Node.js services
- **Security Audits:** npm audit, pip-audit, govulncheck
- **IaC Scanning:** Checkov for Helm charts

## Pending
- GitOps (ArgoCD)
- Monitoring (Prometheus, Grafana, Loki)
- RBAC

---

## Quick Reference
```bash
# Helm
make helm-upgrade
make pods
make status

# Build images
make build

# GitHub Actions
# Trigger: push/PR to main with path changes

# GHCR Images
ghcr.io/low-key2703/product-service
ghcr.io/low-key2703/order-service
ghcr.io/low-key2703/api-gateway
ghcr.io/low-key2703/user-service
```

---

**Note:** Secrets and TLS certs are gitignored. Use `*.example.yaml` files as templates.
