#!/bin/sh
set -e

echo "Waiting for PostgreSQL..."
until PGPASSWORD=$POSTGRES_PASSWORD psql -h postgres -U $POSTGRES_USER -d $POSTGRES_DB -c '\q' 2>/dev/null; do
  sleep 1
done
echo "PostgreSQL is ready"

echo "Running Order Service migrations..."
PGPASSWORD=$POSTGRES_PASSWORD psql -h postgres -U $POSTGRES_USER -d $POSTGRES_DB -f /migrations/order-service/001_init.sql
echo "Order Service migrations complete"

echo "Running User Service migrations..."
cd /app/user-service && npm run migrate
echo "User Service migrations complete"

echo "All migrations complete!"
