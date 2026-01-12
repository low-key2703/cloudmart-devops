# CloudMart Kubernetes Infrastructure

## Structure
```
infrastructure/kubernetes/
├── argocd/               # ArgoCD Application manifests (6 apps)
├── helm/                 # Helm charts (GitOps source of truth)
│   ├── infrastructure/   # Postgres, Redis, Ingress, Network Policies, Shared Secrets
│   ├── observability/    # Prometheus, Grafana, Loki, Alertmanager, Promtail
│   ├── product-service/  # Product microservice chart
│   ├── order-service/    # Order microservice chart
│   ├── api-gateway/      # API Gateway chart
│   └── user-service/     # User microservice chart
├── base/                 # OLD: Raw manifests (kept for reference)
└── secrets-plaintext/    # OLD: Plain secrets (kept for reference)
```

## Deployment Methods

### Option 1: GitOps with ArgoCD (Recommended)

**Prerequisites:**
- Minikube running: `minikube start --memory=8192 --cpus=4`
- ArgoCD installed: `kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml`

**Deploy all applications:**
```bash
# Apply all ArgoCD applications
kubectl apply -f argocd/ -n argocd

# Access ArgoCD UI
kubectl port-forward svc/argocd-server -n argocd 8443:443

# Get initial password
kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath="{.data.password}" | base64 -d

# Sync via UI at https://localhost:8443 or via CLI
argocd app sync infrastructure
argocd app sync observability
argocd app sync product-service
argocd app sync order-service
argocd app sync api-gateway
argocd app sync user-service
```

### Option 2: Direct Helm Install (Development)

**Prerequisites:**
- Minikube running
- Sealed Secrets controller installed

**Deploy all charts:**
```bash
# From project root
make helm-install

# Or install individually
make helm-install-infrastructure
make helm-install-observability
make helm-install-product-service
make helm-install-order-service
make helm-install-api-gateway
make helm-install-user-service
```

## Helm Charts Overview

### 1. Infrastructure Chart
**Purpose:** Shared infrastructure components

**Includes:**
- PostgreSQL (StatefulSet with PVC)
- Redis (Deployment)
- NGINX Ingress Controller
- Network Policies (default-deny + allow rules)
- Shared Sealed Secrets (JWT, Postgres credentials)

**Install:**
```bash
helm install infrastructure helm/infrastructure/ -n cloudmart-dev --create-namespace
```

### 2. Observability Chart
**Purpose:** Complete monitoring and logging stack

**Includes:**
- Prometheus (metrics collection, 15-day retention)
- Grafana (visualization, 3 custom dashboards)
- Alertmanager (20+ alert rules)
- Loki (log aggregation, 7-day retention)
- Promtail (log collection DaemonSet)

**Install:**
```bash
helm install observability helm/observability/ -n cloudmart-monitoring --create-namespace
```

**Access:**
```bash
# Grafana
kubectl port-forward -n cloudmart-monitoring svc/observability-grafana 3002:80
# http://localhost:3002 (admin / <get password>)

# Prometheus
kubectl port-forward -n cloudmart-monitoring svc/prometheus-operated 9090:9090
# http://localhost:9090

# Alertmanager
kubectl port-forward -n cloudmart-monitoring svc/alertmanager-operated 9093:9093
# http://localhost:9093
```

### 3. Service Charts (4 microservices)
**Charts:** product-service, order-service, api-gateway, user-service

**Each includes:**
- Deployment (with rolling update strategy)
- Service (ClusterIP)
- ConfigMap (environment-specific config)
- HorizontalPodAutoscaler (CPU-based scaling)
- Sealed Secret (service-specific credentials)
- ServiceMonitor (Prometheus metrics scraping)

**Install example:**
```bash
helm install product-service helm/product-service/ -n cloudmart-dev
```

## Configuration

### Environment-Specific Values

Each chart has:
- `values.yaml` - Default values (development)
- `values-prod.yaml` - Production overrides

**Deploy to production:**
```bash
helm install infrastructure helm/infrastructure/ -n cloudmart-prod --create-namespace -f helm/infrastructure/values-prod.yaml
```

### Image Tags

By default, charts use `image.tag: main` for GitOps compatibility with ArgoCD.

**Override for development:**
```bash
helm install api-gateway helm/api-gateway/ -n cloudmart-dev --set image.tag=dev-branch
```

## Secrets Management

### Sealed Secrets (GitOps-Friendly)

**Create new sealed secret:**
```bash
# 1. Create plain secret
kubectl create secret generic my-secret --from-literal=key=value --dry-run=client -o yaml > secret.yaml

# 2. Seal it
kubeseal -f secret.yaml -w sealed-secret.yaml

# 3. Add to chart templates/
mv sealed-secret.yaml helm/my-service/templates/

# 4. Delete plain secret
rm secret.yaml
```

**Sealed secrets are automatically decrypted in-cluster by the Sealed Secrets controller.**

## Verification
```bash
# Check all pods
kubectl get pods -n cloudmart-dev
kubectl get pods -n cloudmart-monitoring

# Check Helm releases
helm list -n cloudmart-dev
helm list -n cloudmart-monitoring

# Check ArgoCD apps (if using GitOps)
kubectl get applications -n argocd

# Detailed status
make status
```

## Access Services
```bash
# API Gateway
kubectl port-forward svc/api-gateway -n cloudmart-dev 3000:3000
curl http://localhost:3000/health

# Grafana (Monitoring)
kubectl port-forward svc/observability-grafana -n cloudmart-monitoring 3002:80
# http://localhost:3002

# Via Ingress (if configured)
curl http://cloudmart.local/health
```

## Common Commands
```bash
# Lint all charts
make helm-lint

# Template all charts (dry-run)
make helm-template

# Upgrade all releases
make helm-upgrade

# Uninstall all
make helm-uninstall

# View chart values
helm get values infrastructure -n cloudmart-dev
helm get values observability -n cloudmart-monitoring

# Monitoring commands
make monitoring              # Show monitoring stack status
make monitoring-targets      # Show Prometheus scrape targets
make monitoring-alerts       # Show firing alerts
make grafana-password        # Get Grafana admin password
```

## Troubleshooting

### Pods not starting
```bash
# Check pod status
kubectl describe pod <pod-name> -n cloudmart-dev

# View logs
kubectl logs <pod-name> -n cloudmart-dev

# Check events
kubectl get events -n cloudmart-dev --sort-by='.lastTimestamp'
```

### Sealed Secrets not decrypting
```bash
# Verify controller is running
kubectl get pods -n kube-system | grep sealed-secrets

# Check secret status
kubectl get sealedsecrets -n cloudmart-dev
kubectl describe sealedsecret <name> -n cloudmart-dev
```

### ArgoCD app OutOfSync
```bash
# View diff
argocd app diff <app-name>

# Force sync
argocd app sync <app-name> --force

# Check ArgoCD logs
kubectl logs -n argocd -l app.kubernetes.io/name=argocd-server
```

### Prometheus not scraping services
```bash
# Check ServiceMonitors
kubectl get servicemonitor -n cloudmart-dev

# Check Prometheus targets
kubectl port-forward -n cloudmart-monitoring svc/prometheus-operated 9090:9090 &
curl -s http://localhost:9090/api/v1/targets | jq '.data.activeTargets[] | select(.health=="down")'

# Check RBAC permissions
kubectl auth can-i list servicemonitors --as=system:serviceaccount:cloudmart-monitoring:prometheus-prometheus -n cloudmart-dev
```

### Grafana dashboards not loading
```bash
# Check sidecar logs
kubectl logs -n cloudmart-monitoring -l app.kubernetes.io/name=grafana -c grafana-sc-dashboard

# Check ConfigMaps
kubectl get configmap -l grafana_dashboard=1 -n cloudmart-monitoring

# Restart Grafana
kubectl delete pod -l app.kubernetes.io/name=grafana -n cloudmart-monitoring
```

## Network Policies

Default-deny policies are in place. Only explicitly allowed traffic is permitted:

**Allowed:**
- API Gateway → Product/Order/User Services
- All services → PostgreSQL
- All services → Redis
- Product Service → Order Service
- Order Service → User Service
- Prometheus → All services (metrics scraping)

**Blocked by default:**
- External traffic (except via Ingress)
- Inter-pod traffic (unless explicitly allowed)

## Cleanup
```bash
# Uninstall via Helm
make helm-uninstall

# Or delete namespaces (removes everything)
kubectl delete namespace cloudmart-dev
kubectl delete namespace cloudmart-monitoring

# Delete ArgoCD apps
kubectl delete -f argocd/ -n argocd
```

## Migration from Old Structure

The old `base/` directory with raw manifests is deprecated. To migrate:

1. Use Helm charts for all deployments
2. Use ArgoCD for GitOps automation
3. Keep `base/` as reference only
