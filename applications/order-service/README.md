# Order Service

Go/Gin microservice for order processing in CloudMart.

## Tech Stack

- Go 1.21+
- Gin Web Framework
- PostgreSQL

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | /health | Health check |
| GET | /ready | Readiness check |
| GET | /metrics | Prometheus metrics |
| POST | /orders | Create order |
| GET | /orders | List orders |
| GET | /orders/:id | Get order by ID |
| PUT | /orders/:id/cancel | Cancel order |
| GET | /orders/:id/status | Get order status |
| PUT | /orders/:id/status | Update order status |

## Order States
```
PENDING → CONFIRMED → PROCESSING → SHIPPED → DELIVERED
              ↓
          CANCELLED
```

## Setup
```bash
cp .env.example .env
go mod download
go run cmd/server/main.go
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| PORT | Server port | 8080 |
| DATABASE_URL | PostgreSQL connection | - |
| SERVICE_NAME | Service identifier | order-service |
| GIN_MODE | Gin mode (debug/release) | debug |
