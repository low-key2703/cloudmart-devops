# CloudMart Kubernetes Manifests

## Structure
```
base/
├── namespace.yaml          # cloudmart-dev namespace
├── api-gateway/            # API Gateway deployment
├── product-service/        # Product Service deployment
├── order-service/          # Order Service deployment
├── user-service/           # User Service deployment
├── postgres/               # PostgreSQL StatefulSet
└── shared/                 # Shared resources (JWT secret)
```

## Prerequisites

- Minikube running: `minikube start --memory=4096 --cpus=2`
- kubectl configured: `kubectl cluster-info`
- Images built: `eval $(minikube docker-env) && docker-compose build`

## Setup Secrets

Secrets are not committed to Git. Create them from examples:
```bash
# Copy and edit each secret
cp postgres/secret.example.yaml postgres/secret.yaml
cp product-service/secret.example.yaml product-service/secret.yaml
cp order-service/secret.example.yaml order-service/secret.yaml
cp user-service/secret.example.yaml user-service/secret.yaml
cp shared/jwt-secret.example.yaml shared/jwt-secret.yaml

# Edit with your values
# Generate JWT secret: openssl rand -base64 32
```

## Deploy
```bash
# 1. Create namespace
kubectl apply -f base/namespace.yaml

# 2. Deploy shared secrets
kubectl apply -f base/shared/ -n cloudmart-dev

# 3. Deploy PostgreSQL
kubectl apply -f base/postgres/ -n cloudmart-dev

# 4. Wait for PostgreSQL to be ready
kubectl wait --for=condition=ready pod -l app=postgres-database -n cloudmart-dev --timeout=120s

# 5. Deploy services
kubectl apply -f base/api-gateway/ -n cloudmart-dev
kubectl apply -f base/product-service/ -n cloudmart-dev
kubectl apply -f base/order-service/ -n cloudmart-dev
kubectl apply -f base/user-service/ -n cloudmart-dev

# 6. Verify
kubectl get pods -n cloudmart-dev
```

## Access
```bash
# Get API Gateway URL
minikube service cloudmart-api-gateway-service -n cloudmart-dev --url

# Test
curl http://<url>/health
```

## Cleanup
```bash
kubectl delete namespace cloudmart-dev
```
