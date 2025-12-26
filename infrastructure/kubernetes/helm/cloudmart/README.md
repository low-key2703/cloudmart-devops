# CloudMart Helm Chart

Helm chart for deploying CloudMart e-commerce microservices platform on Kubernetes.

## Overview

CloudMart is a cloud-native e-commerce platform consisting of 4 microservices:

| Service | Technology | Port | Description |
|---------|------------|------|-------------|
| API Gateway | Node.js/Express | 3000 | Entry point, JWT auth, rate limiting |
| Product Service | Python/FastAPI | 8000 | Product catalog, Redis caching |
| Order Service | Go/Gin | 8080 | Order processing |
| User Service | Node.js/Express | 3001 | Authentication, user management |

Supporting infrastructure:
- **PostgreSQL** — Primary database (StatefulSet)
- **Redis** — Caching and rate limiting

## Prerequisites

- Kubernetes 1.24+
- Helm 3.0+
- NGINX Ingress Controller (for ingress)
- Namespace created: `kubectl create namespace cloudmart-dev`

### Required Secrets

Create these secrets **before** installing the chart:
```bash
# JWT Secret
kubectl create secret generic cloudmart-jwt-secret \
  --from-literal=JWT_SECRET=your-secret-key \
  -n cloudmart-dev

# PostgreSQL Secret
kubectl create secret generic cloudmart-postgres-database-secret \
  --from-literal=POSTGRES_USER=your-username \
  --from-literal=POSTGRES_PASSWORD=your-password \
  -n cloudmart-dev

# Service Database URLs
kubectl create secret generic cloudmart-product-service-secret \
  --from-literal=DATABASE_URL=postgresql://user:password@cloudmart-postgres-database-service:5432/cloudmart \
  -n cloudmart-dev

kubectl create secret generic cloudmart-order-service-secret \
  --from-literal=DATABASE_URL=postgresql://user:password@cloudmart-postgres-database-service:5432/cloudmart \
  -n cloudmart-dev

kubectl create secret generic cloudmart-user-service-secret \
  --from-literal=DATABASE_URL=postgresql://user:password@cloudmart-postgres-database-service:5432/cloudmart \
  -n cloudmart-dev
```

## Installation
```bash
# From chart directory
cd infrastructure/kubernetes/helm/cloudmart

# Install
helm install cloudmart . -n cloudmart-dev

# Install with custom values
helm install cloudmart . -n cloudmart-dev -f values-prod.yaml

# Upgrade
helm upgrade cloudmart . -n cloudmart-dev
```

## Configuration

Key configuration in `values.yaml`:

| Parameter | Description | Default |
|-----------|-------------|---------|
| `namespace` | Kubernetes namespace | `cloudmart-dev` |
| `apiGateway.replicas` | API Gateway replicas | `2` |
| `productService.replicas` | Product Service replicas | `2` |
| `orderService.replicas` | Order Service replicas | `2` |
| `userService.replicas` | User Service replicas | `2` |
| `postgres.storage.size` | PostgreSQL PVC size | `1Gi` |
| `ingress.enabled` | Enable Ingress | `true` |
| `ingress.host` | Ingress hostname | `cloudmart.local` |
| `ingress.tls.enabled` | Enable TLS | `true` |

### Image Configuration

Each service has configurable image settings:
```yaml
apiGateway:
  image:
    repository: cloudmart-api-gateway
    tag: latest
    pullPolicy: IfNotPresent
```

### Resource Limits
```yaml
apiGateway:
  resources:
    requests:
      memory: "128Mi"
      cpu: "100m"
    limits:
      memory: "256Mi"
      cpu: "200m"
```

## Architecture

### Service Dependencies

| Service | Port | PostgreSQL | Redis | Purpose |
|---------|------|------------|-------|---------|
| API Gateway | 3000 | ❌ | ✅ | Rate limiting |
| Product Service | 8000 | ✅ | ✅ | Data + Caching |
| Order Service | 8080 | ✅ | ❌ | Data |
| User Service | 3001 | ✅ | ❌ | Data |

### Request Flow
```
Client → Ingress → API Gateway → Product/Order/User Service → PostgreSQL/Redis
```

### Infrastructure

| Component | Type | Port | Purpose |
|-----------|------|------|---------|
| PostgreSQL | StatefulSet | 5432 | Primary database |
| Redis | Deployment | 6379 | Caching & rate limiting |
| Ingress | NGINX | 443 | TLS termination, routing |

## Accessing the Application

### Minikube
```bash
# Get Ingress URL
minikube service ingress-nginx-controller -n ingress-nginx --url

# Add to /etc/hosts
echo "<minikube-ip> cloudmart.local" | sudo tee -a /etc/hosts

# Test
curl -k https://cloudmart.local:<port>/health
```

### Port Forward (No Ingress)
```bash
kubectl port-forward svc/cloudmart-api-gateway-service 3000:3000 -n cloudmart-dev
curl http://localhost:3000/health
```

## Verify Deployment
```bash
# Check pods
kubectl get pods -n cloudmart-dev

# Check services
kubectl get svc -n cloudmart-dev

# Check ingress
kubectl get ingress -n cloudmart-dev

# View logs
kubectl logs -n cloudmart-dev -l app.kubernetes.io/name=api-gateway
```

## Uninstall
```bash
helm uninstall cloudmart -n cloudmart-dev
```

**Note:** PersistentVolumeClaims are not deleted automatically. To remove:
```bash
kubectl delete pvc -n cloudmart-dev --all
```

## Files Structure
```
cloudmart/
├── Chart.yaml              # Chart metadata
├── values.yaml             # Default configuration
├── values-prod.yaml        # Production overrides
├── README.md               # This file
└── templates/
    ├── _helpers.tpl        # Reusable template functions
    ├── NOTES.txt           # Post-install instructions
    ├── api-gateway/
    │   ├── deployment.yaml
    │   ├── service.yaml
    │   └── configmap.yaml
    ├── product-service/
    ├── order-service/
    ├── user-service/
    ├── postgres/
    │   ├── statefulset.yaml
    │   ├── service.yaml
    │   ├── configmap.yaml
    │   └── pvc.yaml
    ├── redis/
    └── ingress/
```

## Labels

This chart uses Kubernetes recommended labels:
```yaml
app.kubernetes.io/name: <component>
app.kubernetes.io/instance: <release-name>
app.kubernetes.io/component: <component>
app.kubernetes.io/managed-by: Helm
helm.sh/chart: cloudmart-<version>
```

## Troubleshooting

### Pods not starting
```bash
kubectl describe pod <pod-name> -n cloudmart-dev
kubectl logs <pod-name> -n cloudmart-dev
```

### Database connection issues

1. Verify PostgreSQL is running: `kubectl get pods -n cloudmart-dev | grep postgres`
2. Check secrets exist: `kubectl get secrets -n cloudmart-dev`
3. Verify DATABASE_URL format in secrets

### Ingress not working

1. Check Ingress Controller: `kubectl get pods -n ingress-nginx`
2. Check Ingress resource: `kubectl describe ingress -n cloudmart-dev`
3. Verify `/etc/hosts` entry
