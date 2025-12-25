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

**Chart Structure:**
- 17 templated resources
- Environment-specific values (`values.yaml`, `values-prod.yaml`)
- Organized by service (redis/, api-gateway/, postgres/, etc.)

**Templated:**
- Namespace, replicas, images, resources
- Storage size/class for PostgreSQL
- Ingress host and TLS config
- Service types (NodePort/ClusterIP)

**Deployed and tested via:**
```bash
helm install cloudmart . -n cloudmart-dev
```

---

## In Progress
- Helm polish (_helpers.tpl, NOTES.txt) - Optional

## Pending
- Horizontal Pod Autoscaler (HPA)
- Network Policies
- Sealed Secrets
- CI/CD (GitHub Actions)
- GitOps (ArgoCD)
- Monitoring (Prometheus, Grafana, Loki)
- Security (Trivy, RBAC)

---

## Quick Reference
```bash
# Helm deployment
cd infrastructure/kubernetes/helm/cloudmart
helm install cloudmart . -n cloudmart-dev
helm upgrade cloudmart . -n cloudmart-dev
helm list -n cloudmart-dev

# Build images into Minikube
eval $(minikube docker-env)
docker-compose build

# Access via Ingress
minikube service ingress-nginx-controller -n ingress-nginx --url
curl -k https://cloudmart.local:<port>/health

# Debug
kubectl get pods -n cloudmart-dev
kubectl logs -n cloudmart-dev <pod-name>
```

---

**Note:** Secrets and TLS certs are gitignored. Use `*.example.yaml` files as templates.
