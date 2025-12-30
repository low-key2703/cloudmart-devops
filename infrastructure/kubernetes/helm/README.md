# CloudMart Helm Charts

Multi-chart Helm deployment for CloudMart microservices platform.

## Chart Structure

This directory contains **5 separate Helm charts** (one for infrastructure, four for microservices):
```
helm/
├── infrastructure/      # Shared infrastructure (PostgreSQL, Redis, Ingress, Network Policies, Secrets)
├── product-service/     # Product catalog microservice
├── order-service/       # Order processing microservice
├── api-gateway/         # API Gateway (entry point)
└── user-service/        # User authentication microservice
```

## Why Separate Charts?

- **Independent deployments** - Update services without affecting others
- **GitOps compatibility** - Each service can be managed by separate ArgoCD Application
- **Clearer ownership** - Teams can own specific charts
- **Flexible scaling** - Different replica counts per environment

## Installation Order

**IMPORTANT:** Install in this order due to dependencies:
```bash
# 1. Infrastructure FIRST (required by all services)
helm install infrastructure helm/infrastructure/ -n cloudmart-dev --create-namespace

# 2. Wait for infrastructure to be ready
kubectl wait --for=condition=ready pod -l app.kubernetes.io/component=database -n cloudmart-dev --timeout=120s

# 3. Install microservices (any order)
helm install product-service helm/product-service/ -n cloudmart-dev
helm install order-service helm/order-service/ -n cloudmart-dev
helm install api-gateway helm/api-gateway/ -n cloudmart-dev
helm install user-service helm/user-service/ -n cloudmart-dev
```

**Or use Makefile shortcuts:**
```bash
make helm-install              # Install all charts
make helm-install-infrastructure
make helm-install-product-service
# etc.
```

## Chart Dependencies
```
Infrastructure (postgres, redis, ingress, network-policies, shared secrets)
    ↓
    ├── product-service  (needs: postgres, redis, jwt-secret)
    ├── order-service    (needs: postgres, postgres-secret)
    ├── api-gateway      (needs: redis, jwt-secret)
    └── user-service     (needs: postgres, jwt-secret)
```

## Quick Reference

| Chart | Purpose | Key Resources |
|-------|---------|---------------|
| infrastructure | Shared components | PostgreSQL, Redis, Ingress, NetworkPolicies, Sealed Secrets (JWT, Postgres) |
| product-service | Product catalog | Deployment, Service, ConfigMap, HPA, Sealed Secret |
| order-service | Order processing | Deployment, Service, HPA, Sealed Secret |
| api-gateway | API entry point | Deployment, Service, ConfigMap, HPA |
| user-service | User auth | Deployment, Service, HPA, Sealed Secret |

## Configuration

Each chart has:
- `values.yaml` - Default values (development)
- `values-prod.yaml` - Production overrides (higher replicas, resources)

**Example: Deploy to production**
```bash
helm install infrastructure helm/infrastructure/ \
  -n cloudmart-prod --create-namespace \
  -f helm/infrastructure/values-prod.yaml
```

## Common Operations
```bash
# Lint all charts
make helm-lint

# Template all charts (dry-run)
make helm-template

# Upgrade specific chart
helm upgrade product-service helm/product-service/ -n cloudmart-dev

# Upgrade all
make helm-upgrade

# List releases
helm list -n cloudmart-dev

# Uninstall all
make helm-uninstall
```

## GitOps with ArgoCD

Each chart has a corresponding ArgoCD Application in `../argocd/`:
```bash
# Apply all ArgoCD applications
kubectl apply -f ../argocd/ -n argocd

# ArgoCD will automatically sync from Git
```

See [ArgoCD Setup Guide](../../../docs/argocd-setup.md) for details.

## Secrets Management

### Shared Secrets (in infrastructure chart)
- `jwt-secret` - Shared JWT signing key (used by api-gateway, user-service)
- `postgres-secret` - PostgreSQL credentials (used by all data services)

### Service-Specific Secrets
Each service chart contains its own Sealed Secret for DATABASE_URL.

**Creating sealed secrets:**
```bash
# See ../README.md for kubeseal instructions
```

## Service Communication

Services communicate via Kubernetes DNS:
```
http://product-service:8000      # Product Service
http://order-service:8080        # Order Service
http://user-service:3001         # User Service
http://postgres:5432             # PostgreSQL
http://redis:6379                # Redis
```

These names are **fixed** and defined in each chart's values.yaml for cross-chart compatibility.

## Verification
```bash
# Check all pods
kubectl get pods -n cloudmart-dev

# Check all services
kubectl get svc -n cloudmart-dev

# Check Helm releases
helm list -n cloudmart-dev

# Detailed status
make status
```

## Troubleshooting

### Chart installation fails
```bash
# Validate chart
helm lint helm/<chart-name>/

# Template to see rendered manifests
helm template <chart-name> helm/<chart-name>/ -n cloudmart-dev
```

### Service can't connect to postgres/redis
- Ensure infrastructure chart is installed first
- Check service names: `kubectl get svc -n cloudmart-dev`
- Verify network policies allow traffic: `kubectl get networkpolicy -n cloudmart-dev`

### Sealed secrets not decrypting
- Verify sealed-secrets controller is running: `kubectl get pods -n kube-system | grep sealed-secrets`
- Check secret status: `kubectl get sealedsecrets -n cloudmart-dev`

## Migration from Old Structure

**Old:** Single umbrella chart at `helm/cloudmart/`  
**New:** Separate charts for each component

Benefits of new structure:
- Independent versioning
- Faster CI/CD (only rebuild changed services)
- Better separation of concerns
- GitOps-friendly (one ArgoCD app per chart)

## Further Documentation

- [Kubernetes README](../README.md) - Detailed deployment guide
- [ArgoCD Applications](../argocd/) - GitOps configuration
- [Project Documentation](../../../docs/) - Overall project docs
