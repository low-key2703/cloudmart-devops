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
- **Monitoring:** Prometheus, Grafana, Loki
- **Infrastructure:** Terraform
- **Security:** Trivy, RBAC, Network Policies, Sealed Secrets

## Project Structure

cloudmart-devops/
├── applications/          # Microservices source code
│   ├── api-gateway/       # Node.js/Express
│   ├── product-service/   # Python/FastAPI
│   ├── order-service/     # Go/Gin
│   └── user-service/      # Node.js/Express
├── infrastructure/        # IaC
│   ├── terraform/         # Cloud resources
│   └── kubernetes/        # K8s manifests
├── .github/workflows/     # CI/CD pipelines
├── gitops/               # ArgoCD configurations
├── monitoring/           # Prometheus, Grafana configs
├── scripts/              # Automation scripts
└── docs/                 # Documentation

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

## Features

- Microservices Architecture (4 services)
- Kubernetes Orchestration
- CI/CD Pipelines
- GitOps with ArgoCD
- Full Observability Stack
- Security Scanning
- Infrastructure as Code
