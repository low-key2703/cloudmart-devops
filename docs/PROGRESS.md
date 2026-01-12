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
Location: `infrastructure/kubernetes/helm/`
- Split from umbrella chart into per-service charts
- Separate charts for:
  - infrastructure (postgres, redis, shared secrets, ingress)
  - api-gateway
  - product-service
  - order-service
  - user-service
- Environment-driven values
- Kubernetes recommended labels
- HPA, NetworkPolicies, SealedSecrets templated
- Legacy umbrella chart removed

### GitOps (ArgoCD)
- ArgoCD installed in `argocd` namespace
- Application manifests defined per component
  Location: `infrastructure/kubernetes/argocd/`
- One ArgoCD Application per Helm chart
- Manual sync workflow (no auto-prune)
- Namespaces created via ArgoCD
- Git is the single source of truth

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

### Observability Stack

**Location:** `infrastructure/kubernetes/helm/observability/`

**Components Deployed:**
- **Prometheus** (metrics collection & storage)
  - Scrape interval: 15s, Retention: 15 days
  - 10Gi PVC for metrics storage
  - ServiceMonitor auto-discovery across namespaces
  - Active scrape targets: all microservices, postgres, redis, nodes
  
- **Grafana** (visualization)
  - 3 custom dashboards + built-in Kubernetes dashboards
  - Prometheus + Loki data sources
  - Auto-loading dashboards from Git via sidecar
  - Admin credentials in Sealed Secret
  
- **Alertmanager** (alert routing)
  - 20+ custom alert rules across 6 categories
  - Severity-based routing (critical/warning/info)
  - Inhibition rules to prevent alert storms
  - Ready for Slack/email integration
  
- **Loki** (log aggregation)
  - 7-day log retention
  - Label-based indexing
  - 5Gi PVC for log storage
  
- **Promtail** (log collection)
  - DaemonSet on all nodes
  - Automatic pod log discovery
  - Kubernetes metadata enrichment

**Custom Dashboards:**
1. CloudMart - Infrastructure (node/pod metrics)
2. CloudMart - Application (service health, request rates)
3. CloudMart - Business Metrics (orders, products, users)

**Alert Rules (20+):**
- Application Health: PodNotReady, HighErrorRate, SlowResponseTime
- Infrastructure: PodHighCPU, PodHighMemory, NodeHighDiskUsage
- Database: PostgreSQLPodDown, RedisPodDown
- Business Metrics: HighOrderFailureRate, LowProductInventory
- Monitoring Health: AlertmanagerConfigReloadFailed, PrometheusScrapeFailure

**Key Achievements:**
- Complete GitOps deployment via ArgoCD
- Application metrics exposed and scraped from all 4 microservices
- Alert firing validated (PodHighCPU triggered during load test)
- Metrics - logs correlation working in Grafana
- Fixed ServiceMonitor discovery with RBAC + selector configuration
- All dashboards auto-loaded from Git ConfigMaps

**Troubleshooting Solved:**
1. **Alertmanager crashloop** → Removed broken webhook URL
2. **Control plane alerts firing** → Disabled etcd/scheduler/controller monitoring for Minikube
3. **ServiceMonitors not discovered** → Added RBAC ClusterRole + set `serviceMonitorSelectorNilUsesHelmValues: false`
4. **Container label missing** → Removed `container!=""` filter from queries
5. **Dashboard queries failing** → Fixed metric label matching

## Pending
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
