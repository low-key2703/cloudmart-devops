.PHONY: help build push helm-install helm-upgrade helm-uninstall helm-lint helm-template \
        pods logs status hpa netpol secrets ingress-url clean

# Default namespace
NAMESPACE := cloudmart-dev
RELEASE := cloudmart
CHART_PATH := infrastructure/kubernetes/helm/cloudmart

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

# ============== Build ==============

build: ## Build all images into Minikube
	eval $$(minikube docker-env) && docker-compose build

build-no-cache: ## Build all images without cache
	eval $$(minikube docker-env) && docker-compose build --no-cache

# ============== Helm ==============

helm-install: ## Install Helm chart
	cd $(CHART_PATH) && helm install $(RELEASE) . -n $(NAMESPACE)

helm-upgrade: ## Upgrade Helm chart
	cd $(CHART_PATH) && helm upgrade $(RELEASE) . -n $(NAMESPACE)

helm-uninstall: ## Uninstall Helm chart
	helm uninstall $(RELEASE) -n $(NAMESPACE)

helm-lint: ## Lint Helm chart
	cd $(CHART_PATH) && helm lint .

helm-template: ## Render Helm templates (dry-run)
	cd $(CHART_PATH) && helm template $(RELEASE) .

helm-dry-run: ## Install with dry-run
	cd $(CHART_PATH) && helm install $(RELEASE) . -n $(NAMESPACE) --dry-run

# ============== Status ==============

pods: ## List all pods
	kubectl get pods -n $(NAMESPACE)

status: ## Full status (pods, svc, ingress)
	@echo "=== Pods ===" && kubectl get pods -n $(NAMESPACE)
	@echo "\n=== Services ===" && kubectl get svc -n $(NAMESPACE)
	@echo "\n=== Ingress ===" && kubectl get ingress -n $(NAMESPACE)

hpa: ## Check HPA status
	kubectl get hpa -n $(NAMESPACE)

netpol: ## List network policies
	kubectl get networkpolicies -n $(NAMESPACE)

secrets: ## List sealed secrets
	kubectl get sealedsecrets -n $(NAMESPACE)

top: ## Show resource usage
	kubectl top pods -n $(NAMESPACE)

events: ## Show recent events
	kubectl get events -n $(NAMESPACE) --sort-by='.lastTimestamp' | tail -20

# ============== Logs ==============

logs-api: ## Tail API Gateway logs
	kubectl logs -f -l app.kubernetes.io/component=api-gateway -n $(NAMESPACE)

logs-product: ## Tail Product Service logs
	kubectl logs -f -l app.kubernetes.io/component=product-service -n $(NAMESPACE)

logs-order: ## Tail Order Service logs
	kubectl logs -f -l app.kubernetes.io/component=order-service -n $(NAMESPACE)

logs-user: ## Tail User Service logs
	kubectl logs -f -l app.kubernetes.io/component=user-service -n $(NAMESPACE)

logs-postgres: ## Tail PostgreSQL logs
	kubectl logs -f -l app.kubernetes.io/component=postgres -n $(NAMESPACE)

logs-redis: ## Tail Redis logs
	kubectl logs -f -l app.kubernetes.io/component=redis -n $(NAMESPACE)

# ============== Access ==============

ingress-url: ## Get Ingress URL
	minikube service ingress-nginx-controller -n ingress-nginx --url

port-forward-api: ## Port forward API Gateway to localhost:3000
	kubectl port-forward svc/$(RELEASE)-api-gateway-service 3000:3000 -n $(NAMESPACE)

# ============== Cleanup ==============

clean: ## Delete all pods (force restart)
	kubectl delete pods --all -n $(NAMESPACE)

restart-%: ## Restart a deployment (e.g., make restart-api-gateway)
	kubectl rollout restart deployment/$(RELEASE)-$*-deployment -n $(NAMESPACE)
