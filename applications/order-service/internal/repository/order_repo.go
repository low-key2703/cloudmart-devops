package repository

import (
	"database/sql"
	"fmt"
	"time"

	"github.com/low-key2703/cloudmart-devops/applications/order-service/internal/models"
)

type OrderRepository struct {
	db *sql.DB
}

func NewOrderRepository(db *sql.DB) *OrderRepository {
	return &OrderRepository{db: db}
}

func (r *OrderRepository) Create(order *models.Order, items []models.CreateOrderItem) error {
	tx, err := r.db.Begin()
	if err != nil {
		return fmt.Errorf("failed to begin transaction: %w", err)
	}
	defer tx.Rollback()

	var totalAmount float64
	for _, item := range items {
		totalAmount += item.Price * float64(item.Quantity)
	}

	orderQuery := `
		INSERT INTO orders (user_id, total_amount, status, payment_status, shipping_address)
		VALUES ($1, $2, $3, $4, $5)
		RETURNING id, created_at, updated_at`

	err = tx.QueryRow(
		orderQuery,
		order.UserID,
		totalAmount,
		models.StatusPending,
		models.PaymentPending,
		order.ShippingAddress,
	).Scan(&order.ID, &order.CreatedAt, &order.UpdatedAt)

	if err != nil {
		return fmt.Errorf("failed to insert order: %w", err)
	}

	order.TotalAmount = totalAmount
	order.Status = models.StatusPending
	order.PaymentStatus = models.PaymentPending

	itemQuery := `
		INSERT INTO order_items (order_id, product_id, quantity, price)
		VALUES ($1, $2, $3, $4)
		RETURNING id, created_at`

	order.Items = make([]models.OrderItem, len(items))
	for i, item := range items {
		var orderItem models.OrderItem
		err = tx.QueryRow(
			itemQuery,
			order.ID,
			item.ProductID,
			item.Quantity,
			item.Price,
		).Scan(&orderItem.ID, &orderItem.CreatedAt)

		if err != nil {
			return fmt.Errorf("failed to insert order item: %w", err)
		}

		orderItem.OrderID = order.ID
		orderItem.ProductID = item.ProductID
		orderItem.Quantity = item.Quantity
		orderItem.Price = item.Price
		order.Items[i] = orderItem
	}

	if err := tx.Commit(); err != nil {
		return fmt.Errorf("failed to commit transaction: %w", err)
	}

	return nil
}

func (r *OrderRepository) GetByID(id string) (*models.Order, error) {
	query := `
		SELECT id, user_id, total_amount, status, payment_status, 
		       shipping_address, created_at, updated_at
		FROM orders
		WHERE id = $1`

	order := &models.Order{}
	err := r.db.QueryRow(query, id).Scan(
		&order.ID,
		&order.UserID,
		&order.TotalAmount,
		&order.Status,
		&order.PaymentStatus,
		&order.ShippingAddress,
		&order.CreatedAt,
		&order.UpdatedAt,
	)

	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, fmt.Errorf("failed to get order: %w", err)
	}

	items, err := r.GetOrderItems(id)
	if err != nil {
		return nil, err
	}
	order.Items = items

	return order, nil
}

func (r *OrderRepository) GetOrderItems(orderID string) ([]models.OrderItem, error) {
	query := `
		SELECT id, order_id, product_id, quantity, price, created_at
		FROM order_items
		WHERE order_id = $1`

	rows, err := r.db.Query(query, orderID)
	if err != nil {
		return nil, fmt.Errorf("failed to get order items: %w", err)
	}
	defer rows.Close()

	var items []models.OrderItem
	for rows.Next() {
		var item models.OrderItem
		err := rows.Scan(
			&item.ID,
			&item.OrderID,
			&item.ProductID,
			&item.Quantity,
			&item.Price,
			&item.CreatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan order item: %w", err)
		}
		items = append(items, item)
	}

	return items, nil
}

func (r *OrderRepository) GetByUserID(userID string, limit, offset int) ([]models.Order, error) {
	query := `
		SELECT id, user_id, total_amount, status, payment_status,
		       shipping_address, created_at, updated_at
		FROM orders
		WHERE user_id = $1
		ORDER BY created_at DESC
		LIMIT $2 OFFSET $3`

	rows, err := r.db.Query(query, userID, limit, offset)
	if err != nil {
		return nil, fmt.Errorf("failed to get orders: %w", err)
	}
	defer rows.Close()

	var orders []models.Order
	for rows.Next() {
		var order models.Order
		err := rows.Scan(
			&order.ID,
			&order.UserID,
			&order.TotalAmount,
			&order.Status,
			&order.PaymentStatus,
			&order.ShippingAddress,
			&order.CreatedAt,
			&order.UpdatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan order: %w", err)
		}
		orders = append(orders, order)
	}

	return orders, nil
}

func (r *OrderRepository) UpdateStatus(id, status string) error {
	query := `
		UPDATE orders
		SET status = $1, updated_at = $2
		WHERE id = $3`

	result, err := r.db.Exec(query, status, time.Now(), id)
	if err != nil {
		return fmt.Errorf("failed to update order status: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}

	if rowsAffected == 0 {
		return fmt.Errorf("order not found")
	}

	return nil
}

func (r *OrderRepository) GetAll(limit, offset int) ([]models.Order, error) {
	query := `
		SELECT id, user_id, total_amount, status, payment_status,
		       shipping_address, created_at, updated_at
		FROM orders
		ORDER BY created_at DESC
		LIMIT $1 OFFSET $2`

	rows, err := r.db.Query(query, limit, offset)
	if err != nil {
		return nil, fmt.Errorf("failed to get orders: %w", err)
	}
	defer rows.Close()

	var orders []models.Order
	for rows.Next() {
		var order models.Order
		err := rows.Scan(
			&order.ID,
			&order.UserID,
			&order.TotalAmount,
			&order.Status,
			&order.PaymentStatus,
			&order.ShippingAddress,
			&order.CreatedAt,
			&order.UpdatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan order: %w", err)
		}
		orders = append(orders, order)
	}

	return orders, nil
}
