# CloudMart DevOps - Progress Tracker

## Completed

### Environment Setup
- WSL2 Ubuntu on Windows
- Docker Desktop with WSL2 integration
- Node.js 20, Python 3.10, Go 1.21
- kubectl, Minikube
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
- Resource limits defined
- Volume persistence

### Kubernetes
Location: `infrastructure/kubernetes/base/`

**Deployed:**
- Namespace (`cloudmart-dev`)
- All 4 microservices (Deployments + Services)
- PostgreSQL (StatefulSet + PVC)
- ConfigMaps and Secrets
- Liveness/Readiness probes
- Resource requests/limits

**Tested end-to-end:** Auth flow, service routing, database persistence

---

## In Progress
- Ingress Controller

## Pending
- CI/CD (GitHub Actions)
- GitOps (ArgoCD)
- Monitoring (Prometheus, Grafana, Loki)
- Security (Trivy, RBAC, Network Policies, Sealed Secrets)

---

## Quick Reference
```bash
# Build and deploy
eval $(minikube docker-env)
docker-compose build
kubectl apply -f infrastructure/kubernetes/base/ -n cloudmart-dev

# Access
minikube service cloudmart-api-gateway-service -n cloudmart-dev --url

# Debug
kubectl get pods -n cloudmart-dev
kubectl logs -n cloudmart-dev <pod-name>
```

---

**Note:** Secrets are gitignored. Use `*.example.yaml` files as templates.
