.PHONY: help build push helm-install helm-upgrade helm-uninstall helm-lint helm-template \
        pods logs status hpa netpol secrets ingress-url clean

# Default namespace
NAMESPACE := cloudmart-dev
HELM_DIR := infrastructure/kubernetes/helm

# Chart list
CHARTS := infrastructure product-service order-service api-gateway user-service

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'
	@echo ""
	@echo "Single chart commands (replace CHART with: infrastructure, product-service, order-service, api-gateway, user-service):"
	@echo "  helm-install-CHART    Install single chart"
	@echo "  helm-upgrade-CHART    Upgrade single chart"
	@echo "  helm-uninstall-CHART  Uninstall single chart"
	@echo "  helm-lint-CHART       Lint single chart"
	@echo "  helm-template-CHART   Template single chart"
	@echo "  restart-CHART         Restart deployment"

# ============== Build ==============
build: ## Build all images into Minikube
	eval $$(minikube docker-env) && docker-compose build

build-no-cache: ## Build all images without cache
	eval $$(minikube docker-env) && docker-compose build --no-cache

# ============== Helm (All Charts) ==============
helm-install: ## Install all Helm charts
	@for chart in $(CHARTS); do \
		echo "Installing $$chart..."; \
		helm install $$chart $(HELM_DIR)/$$chart -n $(NAMESPACE); \
	done

helm-upgrade: ## Upgrade all Helm charts
	@for chart in $(CHARTS); do \
		echo "Upgrading $$chart..."; \
		helm upgrade $$chart $(HELM_DIR)/$$chart -n $(NAMESPACE); \
	done

helm-uninstall: ## Uninstall all Helm charts
	@for chart in $(CHARTS); do \
		echo "Uninstalling $$chart..."; \
		helm uninstall $$chart -n $(NAMESPACE) || true; \
	done

helm-lint: ## Lint all Helm charts
	@for chart in $(CHARTS); do \
		echo "Linting $$chart..."; \
		helm lint $(HELM_DIR)/$$chart; \
	done

helm-template: ## Render all Helm templates (dry-run)
	@for chart in $(CHARTS); do \
		echo "=== $$chart ==="; \
		helm template $$chart $(HELM_DIR)/$$chart --namespace $(NAMESPACE); \
	done

helm-dry-run: ## Install all with dry-run
	@for chart in $(CHARTS); do \
		echo "Dry-run $$chart..."; \
		helm install $$chart $(HELM_DIR)/$$chart -n $(NAMESPACE) --dry-run; \
	done

# ============== Helm (Single Chart) ==============
helm-install-%:
	helm install $* $(HELM_DIR)/$* -n $(NAMESPACE)

helm-upgrade-%:
	helm upgrade $* $(HELM_DIR)/$* -n $(NAMESPACE)

helm-uninstall-%:
	helm uninstall $* -n $(NAMESPACE)

helm-lint-%:
	helm lint $(HELM_DIR)/$*

helm-template-%:
	helm template $* $(HELM_DIR)/$* --namespace $(NAMESPACE)

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

helm-status: ## Show all Helm releases
	helm list -n $(NAMESPACE)

# ============== Logs ==============
logs-api: ## Tail API Gateway logs
	kubectl logs -f -l app.kubernetes.io/name=api-gateway -n $(NAMESPACE)

logs-product: ## Tail Product Service logs
	kubectl logs -f -l app.kubernetes.io/name=product-service -n $(NAMESPACE)

logs-order: ## Tail Order Service logs
	kubectl logs -f -l app.kubernetes.io/name=order-service -n $(NAMESPACE)

logs-user: ## Tail User Service logs
	kubectl logs -f -l app.kubernetes.io/name=user-service -n $(NAMESPACE)

logs-postgres: ## Tail PostgreSQL logs
	kubectl logs -f -l app.kubernetes.io/name=postgres -n $(NAMESPACE)

logs-redis: ## Tail Redis logs
	kubectl logs -f -l app.kubernetes.io/name=redis -n $(NAMESPACE)

# ============== Access ==============
ingress-url: ## Get Ingress URL
	minikube service ingress-nginx-controller -n ingress-nginx --url

port-forward-api: ## Port forward API Gateway to localhost:3000
	kubectl port-forward svc/api-gateway 3000:3000 -n $(NAMESPACE)

port-forward-product: ## Port forward Product Service to localhost:8000
	kubectl port-forward svc/product-service 8000:8000 -n $(NAMESPACE)

port-forward-order: ## Port forward Order Service to localhost:8080
	kubectl port-forward svc/order-service 8080:8080 -n $(NAMESPACE)

port-forward-user: ## Port forward User Service to localhost:3001
	kubectl port-forward svc/user-service 3001:3001 -n $(NAMESPACE)

# ============== Cleanup ==============
clean: ## Delete all pods (force restart)
	kubectl delete pods --all -n $(NAMESPACE)

restart-%:
	kubectl rollout restart deployment/$* -n $(NAMESPACE)
