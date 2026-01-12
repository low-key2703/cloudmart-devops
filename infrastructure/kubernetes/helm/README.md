# CloudMart Helm Charts

Multi-chart Helm deployment for CloudMart microservices platform.

## Chart Structure

This directory contains **6 separate Helm charts**:
```
helm/
├── infrastructure/      # Shared infrastructure (PostgreSQL, Redis, Ingress, Network Policies, Secrets)
├── observability/       # Monitoring stack (Prometheus, Grafana, Loki, Alertmanager, Promtail)
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

# 2. Observability (optional, but recommended)
helm install observability helm/observability/ -n cloudmart-monitoring --create-namespace

# 3. Wait for infrastructure to be ready
kubectl wait --for=condition=ready pod -l app.kubernetes.io/component=database -n cloudmart-dev --timeout=120s

# 4. Install microservices (any order)
helm install product-service helm/product-service/ -n cloudmart-dev
helm install order-service helm/order-service/ -n cloudmart-dev
helm install api-gateway helm/api-gateway/ -n cloudmart-dev
helm install user-service helm/user-service/ -n cloudmart-dev
```

**Or use Makefile shortcuts:**
```bash
make helm-install              # Install all charts
make helm-install-infrastructure
make helm-install-observability
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

Observability (standalone, monitors all services)
    ├── Prometheus (scrapes metrics from all services)
    ├── Grafana (visualizes metrics + logs)
    ├── Loki (aggregates logs)
    └── Promtail (collects logs from all pods)
```

## Quick Reference

| Chart | Purpose | Namespace | Key Resources |
|-------|---------|-----------|---------------|
| infrastructure | Shared components | cloudmart-dev | PostgreSQL, Redis, Ingress, NetworkPolicies, Sealed Secrets (JWT, Postgres) |
| observability | Monitoring stack | cloudmart-monitoring | Prometheus, Grafana, Loki, Alertmanager, Promtail |
| product-service | Product catalog | cloudmart-dev | Deployment, Service, ConfigMap, HPA, Sealed Secret, ServiceMonitor |
| order-service | Order processing | cloudmart-dev | Deployment, Service, HPA, Sealed Secret, ServiceMonitor |
| api-gateway | API entry point | cloudmart-dev | Deployment, Service, ConfigMap, HPA, ServiceMonitor |
| user-service | User auth | cloudmart-dev | Deployment, Service, HPA, Sealed Secret, ServiceMonitor |

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
helm upgrade observability helm/observability/ -n cloudmart-monitoring

# Upgrade all
make helm-upgrade

# List releases
helm list -n cloudmart-dev
helm list -n cloudmart-monitoring

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

### Monitoring Secrets (in observability chart)
- `grafana-admin-secret` - Grafana admin credentials

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

## Observability Features

### Prometheus Metrics
All services expose `/metrics` endpoint automatically scraped by Prometheus via ServiceMonitors:
- `http_requests_total` - Request counter
- `http_request_duration_seconds` - Request latency
- `product_service_requests_total` - Product-specific metrics
- `user_service_http_requests_total` - User-specific metrics

### Grafana Dashboards
3 custom dashboards + built-in Kubernetes dashboards:
1. CloudMart - Infrastructure (node/pod metrics)
2. CloudMart - Application (service health, request rates)
3. CloudMart - Business Metrics (orders, products, users)

### Alert Rules
20+ custom alerts across 6 categories:
- Application Health (PodNotReady, HighErrorRate, SlowResponseTime)
- Infrastructure (PodHighCPU, PodHighMemory, NodeHighDiskUsage)
- Database (PostgreSQLPodDown, RedisPodDown)
- Business Metrics (HighOrderFailureRate, LowProductInventory)
- Monitoring Health (AlertmanagerConfigReloadFailed, PrometheusScrapeFailure)

### Centralized Logging
- Promtail DaemonSet collects logs from all pods
- Loki aggregates logs with label-based indexing
- Grafana provides unified view of metrics + logs

## Verification
```bash
# Check all pods
kubectl get pods -n cloudmart-dev
kubectl get pods -n cloudmart-monitoring

# Check all services
kubectl get svc -n cloudmart-dev
kubectl get svc -n cloudmart-monitoring

# Check Helm releases
helm list -n cloudmart-dev
helm list -n cloudmart-monitoring

# Detailed status
make status
make monitoring
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

### Prometheus not scraping services
- Check ServiceMonitors exist: `kubectl get servicemonitor -n cloudmart-dev`
- Verify RBAC: `kubectl auth can-i list servicemonitors --as=system:serviceaccount:cloudmart-monitoring:prometheus-prometheus -n cloudmart-dev`
- Check Prometheus config: `kubectl get prometheus -n cloudmart-monitoring -o yaml | grep serviceMonitorSelector`
- View targets: `make monitoring-targets`

### Grafana password issues
```bash
# Get password
make grafana-password

# Reset password (delete secret, Helm will recreate)
kubectl delete secret grafana-admin-secret -n cloudmart-monitoring
helm upgrade observability helm/observability/ -n cloudmart-monitoring
```

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
