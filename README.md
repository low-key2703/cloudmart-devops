# CloudMart DevOps Project

Production-grade, cloud-native e-commerce platform demonstrating enterprise-level DevOps practices.

## Architecture

| Service | Technology | Port | Description |
|---------|------------|------|-------------|
| API Gateway | Node.js/Express | 3000 | Single entry point, routing, auth, rate limiting |
| Product Service | Python/FastAPI | 8000 | Product catalog management |
| Order Service | Go/Gin | 8080 | Order processing |
| User Service | Node.js/Express | 3001 | Authentication & user management |

## Tech Stack

- **Orchestration:** Kubernetes (Minikube)
- **CI/CD:** GitHub Actions + ArgoCD
- **Monitoring:** Prometheus, Grafana, Loki, Alertmanager
- **Infrastructure:** Terraform
- **Security:** Trivy, RBAC, Network Policies, Sealed Secrets

## Project Structure

```
cloudmart-devops/
├── applications/          # Microservices source code
│   ├── api-gateway/       # Node.js/Express
│   ├── product-service/   # Python/FastAPI
│   ├── order-service/     # Go/Gin
│   └── user-service/      # Node.js/Express
├── infrastructure/        # IaC
│   ├── terraform/         # Cloud resources
│   └── kubernetes/        # K8s Helm charts + ArgoCD apps
│       ├── argocd/        # ArgoCD Application manifests (6 apps)
│       ├── helm/          # Helm charts
│       │   ├── infrastructure/   # Postgres, Redis, Ingress
│       │   ├── observability/    # Monitoring stack
│       │   ├── api-gateway/
│       │   ├── product-service/
│       │   ├── order-service/
│       │   └── user-service/
│       └── base/          # OLD: Raw manifests (reference only)
├── .github/workflows/     # CI/CD pipelines
├── monitoring/            # Prometheus, Grafana configs
├── scripts/               # Automation scripts
└── docs/                  # Documentation
```

## Quick Start

### Prerequisites

- Docker
- Kubernetes (Minikube)
- Node.js 20+
- Python 3.11+
- Go 1.21+

### Local Development

```bash
# Clone repository
git clone https://github.com/low-key2703/cloudmart-devops.git
cd cloudmart-devops

# Start API Gateway
cd applications/api-gateway
cp .env.example .env
npm install
npm run dev
```

### Kubernetes Deployment

#### Option 1: GitOps with ArgoCD (Recommended)

```bash
# Start Minikube
minikube start --memory=8192 --cpus=4

# Install ArgoCD
kubectl create namespace argocd
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml

# Deploy all applications
kubectl apply -f infrastructure/kubernetes/argocd/ -n argocd

# Access ArgoCD UI
kubectl port-forward svc/argocd-server -n argocd 8443:443
# https://localhost:8443

# Get admin password
kubectl -n argocd get secret argocd-initial-admin-secret \
  -o jsonpath="{.data.password}" | base64 -d
```

#### Option 2: Direct Helm Install

```bash
# From project root
make helm-install
```

## Features

- Microservices Architecture (4 services)
- Kubernetes Orchestration
- CI/CD Pipelines
- GitOps with ArgoCD
- Full Observability Stack
- Security Scanning
- Infrastructure as Code

## Observability

### Monitoring Stack

**Components:**
- Prometheus (metrics collection, 15-day retention)
- Grafana (visualization, 3 custom dashboards + built-in K8s dashboards)
- Alertmanager (20+ alert rules)
- Loki (log aggregation, 7-day retention)
- Promtail (log collection)

**Custom Dashboards:**
1. CloudMart - Infrastructure
2. CloudMart - Application
3. CloudMart - Business Metrics

**Access:**
```bash
# Grafana
make port-forward-grafana
# Open http://localhost:3002 (admin / <run: make grafana-password>)

# Prometheus
make port-forward-prometheus
# Open http://localhost:9090

# Alertmanager
make port-forward-alertmanager
# Open http://localhost:9093
```

## Documentation

- [ArgoCD Setup](docs/argocd-setup.md)
- [Observability Guide](docs/observability-guide.md)
- [Troubleshooting](docs/troubleshooting.md)
- [Progress Tracker](docs/progress.md)
- [Kubernetes README](infrastructure/kubernetes/README.md)
- [Helm Charts README](infrastructure/kubernetes/helm/README.md)

## Common Commands

```bash
# Helm
make helm-upgrade
make pods
make status

# Build images
make build

# Monitoring
make monitoring
make monitoring-targets
make monitoring-alerts
```

## Cleanup

```bash
# Uninstall via Helm
make helm-uninstall

# Or delete namespaces
kubectl delete namespace cloudmart-dev
kubectl delete namespace cloudmart-monitoring

# Delete ArgoCD apps
kubectl delete -f infrastructure/kubernetes/argocd/ -n argocd
```

## GitHub Actions CI/CD

| Service | Linter | Tests | Trivy | GHCR |
|---------|--------|-------|-------|------|
| Product Service | pylint | pytest | ✅ | ✅ |
| Order Service | golangci-lint | go test | ✅ | ✅ |
| API Gateway | eslint | - | ✅ | ✅ |
| User Service | eslint | - | ✅ | ✅ |

**Pipeline:** Checkout → Setup → Install → Lint → Test → Build → Scan → Push

## Project Stats

- **Microservices:** 4 (Node.js, Python, Go)
- **Kubernetes Resources:** 60+
- **Helm Charts:** 6
- **CI/CD Pipelines:** 5
- **Grafana Dashboards:** 3 custom + built-in K8s dashboards
- **Alert Rules:** 20+
- **Docker Images:** 4 (GHCR)
