# CloudMart ArgoCD Setup

This document describes how ArgoCD is used to deploy CloudMart services
using a simple GitOps workflow. It reflects the current state of the project
and avoids advanced or future configurations.

---

## Structure

    infrastructure/kubernetes/argocd/
    ├── infrastructure-app.yaml        # Postgres, Redis, Ingress, Network Policies
    ├── observability-app.yaml         # Prometheus, Grafana, Loki, Alertmanager, Promtail
    ├── api-gateway-app.yaml
    ├── product-service-app.yaml
    ├── order-service-app.yaml
    └── user-service-app.yaml

**Total:** 6 ArgoCD Applications

Each file defines one ArgoCD Application.

### Observability Application

Deploys the complete monitoring stack:
- **Namespace:** cloudmart-monitoring
- **Chart:** infrastructure/kubernetes/helm/observability
- **Auto-Sync:** Enabled (selfHeal + prune)
- **Components:** Prometheus, Grafana, Alertmanager, Loki, Promtail
- **Dashboards:** Auto-loaded from Git ConfigMaps (3 custom dashboards)

**Access after deployment:**
```bash
# Grafana
kubectl port-forward -n cloudmart-monitoring svc/observability-grafana 3002:80
# Open http://localhost:3002

# Get password
kubectl get secret grafana-admin-secret -n cloudmart-monitoring \
  -o jsonpath='{.data.admin-password}' | base64 -d

# Prometheus
kubectl port-forward -n cloudmart-monitoring svc/prometheus-operated 9090:9090
# Open http://localhost:9090

# Alertmanager
kubectl port-forward -n cloudmart-monitoring svc/alertmanager-operated 9093:9093
# Open http://localhost:9093
```

---

## Prerequisites

- Kubernetes cluster running (Minikube, EKS, etc.)
- kubectl configured
- Repository cloned locally
- Helm charts already present in the repo

Verify cluster access:

    kubectl cluster-info

---

## Install ArgoCD

Install ArgoCD using the official manifests.

    kubectl create namespace argocd
    kubectl apply -n argocd \
      -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml

Wait for ArgoCD to be ready:

    kubectl get pods -n argocd

---

## Access ArgoCD UI

Expose the ArgoCD server locally:

    kubectl port-forward svc/argocd-server -n argocd 8443:443

Open in browser:

    https://localhost:8443

---

## Login

Default credentials:
- Username: admin

Get the initial password:

    kubectl -n argocd get secret argocd-initial-admin-secret \
      -o jsonpath="{.data.password}" | base64 -d && echo

---

## Deploy Applications

ArgoCD Applications are defined in the repository.

Apply all applications:

    kubectl apply -n argocd \
      -f infrastructure/kubernetes/argocd/

Verify:

    kubectl get applications -n argocd

---

## Sync Applications

Applications start in OutOfSync state.

From the ArgoCD UI:
- Open an application
- Click Sync
- Confirm

From CLI:

    argocd app sync infrastructure
    argocd app sync observability
    argocd app sync product-service
    argocd app sync order-service
    argocd app sync api-gateway
    argocd app sync user-service

---

## Verify Deployment

Check namespaces:

    kubectl get namespaces

Check pods:

    kubectl get pods -n cloudmart-dev
    kubectl get pods -n cloudmart-monitoring

Check application status:

    kubectl get applications -n argocd

Check monitoring stack:

    kubectl get pods -n cloudmart-monitoring
    kubectl get svc -n cloudmart-monitoring

---

## Notes

- ArgoCD creates namespaces when required
- Helm charts do not hardcode namespaces
- Shared resources are deployed via the infrastructure application
- Monitoring stack is deployed via the observability application
- Auto-sync is enabled for observability (self-healing)
- Manual sync for application services (more control)

---

## Cleanup

Remove all applications:

    kubectl delete -n argocd \
      -f infrastructure/kubernetes/argocd/

Remove ArgoCD:

    kubectl delete namespace argocd
