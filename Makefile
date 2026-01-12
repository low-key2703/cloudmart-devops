.PHONY: help build push helm-install helm-upgrade helm-uninstall helm-lint helm-template \
        pods logs status hpa netpol secrets ingress-url clean monitoring

# Default namespace
NAMESPACE := cloudmart-dev
MONITORING_NS := cloudmart-monitoring
HELM_DIR := infrastructure/kubernetes/helm

# Chart list (including observability)
CHARTS := infrastructure observability product-service order-service api-gateway user-service

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-25s\033[0m %s\n", $$1, $$2}'
	@echo ""
	@echo "Single chart commands (replace CHART with: infrastructure, observability, product-service, order-service, api-gateway, user-service):"
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
		if [ "$$chart" = "observability" ]; then \
			helm install $$chart $(HELM_DIR)/$$chart -n $(MONITORING_NS) --create-namespace; \
		else \
			helm install $$chart $(HELM_DIR)/$$chart -n $(NAMESPACE); \
		fi; \
	done

helm-upgrade: ## Upgrade all Helm charts
	@for chart in $(CHARTS); do \
		echo "Upgrading $$chart..."; \
		if [ "$$chart" = "observability" ]; then \
			helm upgrade $$chart $(HELM_DIR)/$$chart -n $(MONITORING_NS); \
		else \
			helm upgrade $$chart $(HELM_DIR)/$$chart -n $(NAMESPACE); \
		fi; \
	done

helm-uninstall: ## Uninstall all Helm charts
	@for chart in $(CHARTS); do \
		echo "Uninstalling $$chart..."; \
		if [ "$$chart" = "observability" ]; then \
			helm uninstall $$chart -n $(MONITORING_NS) || true; \
		else \
			helm uninstall $$chart -n $(NAMESPACE) || true; \
		fi; \
	done

helm-lint: ## Lint all Helm charts
	@for chart in $(CHARTS); do \
		echo "Linting $$chart..."; \
		helm lint $(HELM_DIR)/$$chart; \
	done

helm-template: ## Render all Helm templates (dry-run)
	@for chart in $(CHARTS); do \
		echo "=== $$chart ==="; \
		if [ "$$chart" = "observability" ]; then \
			helm template $$chart $(HELM_DIR)/$$chart --namespace $(MONITORING_NS); \
		else \
			helm template $$chart $(HELM_DIR)/$$chart --namespace $(NAMESPACE); \
		fi; \
	done

helm-dry-run: ## Install all with dry-run
	@for chart in $(CHARTS); do \
		echo "Dry-run $$chart..."; \
		if [ "$$chart" = "observability" ]; then \
			helm install $$chart $(HELM_DIR)/$$chart -n $(MONITORING_NS) --dry-run; \
		else \
			helm install $$chart $(HELM_DIR)/$$chart -n $(NAMESPACE) --dry-run; \
		fi; \
	done

# ============== Helm (Single Chart) ==============
helm-install-%:
	@if [ "$*" = "observability" ]; then \
		helm install $* $(HELM_DIR)/$* -n $(MONITORING_NS) --create-namespace; \
	else \
		helm install $* $(HELM_DIR)/$* -n $(NAMESPACE); \
	fi

helm-upgrade-%:
	@if [ "$*" = "observability" ]; then \
		helm upgrade $* $(HELM_DIR)/$* -n $(MONITORING_NS); \
	else \
		helm upgrade $* $(HELM_DIR)/$* -n $(NAMESPACE); \
	fi

helm-uninstall-%:
	@if [ "$*" = "observability" ]; then \
		helm uninstall $* -n $(MONITORING_NS); \
	else \
		helm uninstall $* -n $(NAMESPACE); \
	fi

helm-lint-%:
	helm lint $(HELM_DIR)/$*

helm-template-%:
	@if [ "$*" = "observability" ]; then \
		helm template $* $(HELM_DIR)/$* --namespace $(MONITORING_NS); \
	else \
		helm template $* $(HELM_DIR)/$* --namespace $(NAMESPACE); \
	fi

# ============== Status ==============
pods: ## List all pods
	@echo "=== Application Pods ===" && kubectl get pods -n $(NAMESPACE)
	@echo "\n=== Monitoring Pods ===" && kubectl get pods -n $(MONITORING_NS)

status: ## Full status (pods, svc, ingress)
	@echo "=== Application Pods ===" && kubectl get pods -n $(NAMESPACE)
	@echo "\n=== Application Services ===" && kubectl get svc -n $(NAMESPACE)
	@echo "\n=== Ingress ===" && kubectl get ingress -n $(NAMESPACE)
	@echo "\n=== Monitoring Pods ===" && kubectl get pods -n $(MONITORING_NS)
	@echo "\n=== Monitoring Services ===" && kubectl get svc -n $(MONITORING_NS)

hpa: ## Check HPA status
	kubectl get hpa -n $(NAMESPACE)

netpol: ## List network policies
	kubectl get networkpolicies -n $(NAMESPACE)

secrets: ## List sealed secrets
	@echo "=== Application Secrets ===" && kubectl get sealedsecrets -n $(NAMESPACE)
	@echo "\n=== Monitoring Secrets ===" && kubectl get secret -n $(MONITORING_NS) | grep -E "grafana|prometheus"

top: ## Show resource usage
	@echo "=== Application Resources ===" && kubectl top pods -n $(NAMESPACE)
	@echo "\n=== Monitoring Resources ===" && kubectl top pods -n $(MONITORING_NS)

events: ## Show recent events
	@echo "=== Application Events ===" && kubectl get events -n $(NAMESPACE) --sort-by='.lastTimestamp' | tail -20
	@echo "\n=== Monitoring Events ===" && kubectl get events -n $(MONITORING_NS) --sort-by='.lastTimestamp' | tail -10

helm-status: ## Show all Helm releases
	@echo "=== Application Releases ===" && helm list -n $(NAMESPACE)
	@echo "\n=== Monitoring Releases ===" && helm list -n $(MONITORING_NS)

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

logs-prometheus: ## Tail Prometheus logs
	kubectl logs -f -l app.kubernetes.io/name=prometheus -n $(MONITORING_NS)

logs-grafana: ## Tail Grafana logs
	kubectl logs -f -l app.kubernetes.io/name=grafana -n $(MONITORING_NS)

logs-alertmanager: ## Tail Alertmanager logs
	kubectl logs -f -l app.kubernetes.io/name=alertmanager -n $(MONITORING_NS)

logs-loki: ## Tail Loki logs
	kubectl logs -f -l app.kubernetes.io/name=loki -n $(MONITORING_NS)

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

port-forward-grafana: ## Port forward Grafana to localhost:3002
	@echo "Getting Grafana password..."
	@kubectl get secret grafana-admin-secret -n $(MONITORING_NS) -o jsonpath='{.data.admin-password}' | base64 -d && echo
	@echo "\nStarting port-forward to localhost:3002..."
	kubectl port-forward svc/observability-grafana 3002:80 -n $(MONITORING_NS)

port-forward-prometheus: ## Port forward Prometheus to localhost:9090
	kubectl port-forward svc/prometheus-operated 9090:9090 -n $(MONITORING_NS)

port-forward-alertmanager: ## Port forward Alertmanager to localhost:9093
	kubectl port-forward svc/alertmanager-operated 9093:9093 -n $(MONITORING_NS)

port-forward-loki: ## Port forward Loki to localhost:3100
	kubectl port-forward svc/observability-loki 3100:3100 -n $(MONITORING_NS)

# ============== Monitoring ==============
monitoring: ## Show monitoring stack status
	@echo "=== Prometheus ===" && kubectl get pods -l app.kubernetes.io/name=prometheus -n $(MONITORING_NS)
	@echo "\n=== Grafana ===" && kubectl get pods -l app.kubernetes.io/name=grafana -n $(MONITORING_NS)
	@echo "\n=== Alertmanager ===" && kubectl get pods -l app.kubernetes.io/name=alertmanager -n $(MONITORING_NS)
	@echo "\n=== Loki ===" && kubectl get pods -l app.kubernetes.io/name=loki -n $(MONITORING_NS)
	@echo "\n=== Promtail ===" && kubectl get pods -l app.kubernetes.io/name=promtail -n $(MONITORING_NS)

monitoring-targets: ## Show Prometheus scrape targets
	@echo "Port-forwarding to Prometheus..." && \
	kubectl port-forward svc/prometheus-operated 9090:9090 -n $(MONITORING_NS) > /dev/null 2>&1 & \
	sleep 2 && \
	curl -s http://localhost:9090/api/v1/targets | jq -r '.data.activeTargets[] | "\(.labels.job) - \(.health)"' && \
	pkill -f "port-forward.*prometheus"

monitoring-alerts: ## Show firing alerts
	@echo "Port-forwarding to Prometheus..." && \
	kubectl port-forward svc/prometheus-operated 9090:9090 -n $(MONITORING_NS) > /dev/null 2>&1 & \
	sleep 2 && \
	curl -s http://localhost:9090/api/v1/alerts | jq -r '.data.alerts[] | select(.state=="firing") | "\(.labels.alertname) - \(.labels.severity)"' && \
	pkill -f "port-forward.*prometheus"

monitoring-dashboards: ## List Grafana dashboards
	kubectl get configmap -l grafana_dashboard=1 -n $(MONITORING_NS) -o jsonpath='{.items[*].metadata.name}' | tr ' ' '\n'

monitoring-rules: ## List Prometheus alert rules
	kubectl get prometheusrule -n $(MONITORING_NS)

grafana-password: ## Get Grafana admin password
	@kubectl get secret grafana-admin-secret -n $(MONITORING_NS) -o jsonpath='{.data.admin-password}' | base64 -d && echo

# ============== Cleanup ==============
clean: ## Delete all pods (force restart)
	kubectl delete pods --all -n $(NAMESPACE)

clean-monitoring: ## Delete all monitoring pods (force restart)
	kubectl delete pods --all -n $(MONITORING_NS)

restart-%:
	kubectl rollout restart deployment/$* -n $(NAMESPACE)

restart-prometheus:
	kubectl delete pod -l app.kubernetes.io/name=prometheus -n $(MONITORING_NS)

restart-grafana:
	kubectl delete pod -l app.kubernetes.io/name=grafana -n $(MONITORING_NS)

restart-alertmanager:
	kubectl delete pod -l app.kubernetes.io/name=alertmanager -n $(MONITORING_NS)

# ============== Quick Access ==============
open-grafana: ## Open Grafana in browser (requires port-forward)
	@echo "Run 'make port-forward-grafana' in another terminal first"
	@echo "Then open: http://localhost:3002"
	@echo "Username: admin"
	@make grafana-password

open-prometheus: ## Open Prometheus in browser (requires port-forward)
	@echo "Run 'make port-forward-prometheus' in another terminal first"
	@echo "Then open: http://localhost:9090"

open-alertmanager: ## Open Alertmanager in browser (requires port-forward)
	@echo "Run 'make port-forward-alertmanager' in another terminal first"
	@echo "Then open: http://localhost:9093"
