# CloudMart ArgoCD Setup

This document describes how ArgoCD is used to deploy CloudMart services
using a simple GitOps workflow. It reflects the current state of the project
and avoids advanced or future configurations.

---

## Structure

    infrastructure/kubernetes/argocd/
    ├── infrastructure-app.yaml
    ├── api-gateway-app.yaml
    ├── product-service-app.yaml
    ├── order-service-app.yaml
    └── user-service-app.yaml

Each file defines one ArgoCD Application.

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

---

## Verify Deployment

Check namespaces:

    kubectl get namespaces

Check pods:

    kubectl get pods -A

Check application status:

    kubectl get applications -n argocd

---

## Notes

- ArgoCD creates namespaces when required
- Helm charts do not hardcode namespaces
- Shared resources are deployed via the infrastructure application
- Sync is manual at this stage

---

## Cleanup

Remove all applications:

    kubectl delete -n argocd \
      -f infrastructure/kubernetes/argocd/

Remove ArgoCD:

    kubectl delete namespace argocd
