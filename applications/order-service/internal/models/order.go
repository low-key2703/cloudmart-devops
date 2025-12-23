package models

import "time"

type Order struct {
	ID              string      `json:"id"`
	UserID          string      `json:"user_id"`
	TotalAmount     float64     `json:"total_amount"`
	Status          string      `json:"status"`
	PaymentStatus   string      `json:"payment_status"`
	ShippingAddress string      `json:"shipping_address"`
	Items           []OrderItem `json:"items,omitempty"`
	CreatedAt       time.Time   `json:"created_at"`
	UpdatedAt       time.Time   `json:"updated_at"`
}

type OrderItem struct {
	ID        string    `json:"id"`
	OrderID   string    `json:"order_id"`
	ProductID string    `json:"product_id"`
	Quantity  int       `json:"quantity"`
	Price     float64   `json:"price"`
	CreatedAt time.Time `json:"created_at"`
}

type CreateOrderRequest struct {
	UserID          string            `json:"user_id" binding:"required"`
	ShippingAddress string            `json:"shipping_address" binding:"required"`
	Items           []CreateOrderItem `json:"items" binding:"required,min=1"`
}

type CreateOrderItem struct {
	ProductID string  `json:"product_id" binding:"required"`
	Quantity  int     `json:"quantity" binding:"required,min=1"`
	Price     float64 `json:"price" binding:"required,gt=0"`
}

type UpdateStatusRequest struct {
	Status string `json:"status" binding:"required"`
}

const (
	StatusPending    = "pending"
	StatusConfirmed  = "confirmed"
	StatusProcessing = "processing"
	StatusShipped    = "shipped"
	StatusDelivered  = "delivered"
	StatusCancelled  = "cancelled"
)

const (
	PaymentPending   = "pending"
	PaymentCompleted = "completed"
	PaymentFailed    = "failed"
	PaymentRefunded  = "refunded"
)

var ValidTransitions = map[string][]string{
	StatusPending:    {StatusConfirmed, StatusCancelled},
	StatusConfirmed:  {StatusProcessing, StatusCancelled},
	StatusProcessing: {StatusShipped},
	StatusShipped:    {StatusDelivered},
	StatusDelivered:  {},
	StatusCancelled:  {},
}

func CanTransition(currentStatus, newStatus string) bool {
	allowedStatuses, exists := ValidTransitions[currentStatus]
	if !exists {
		return false
	}
	for _, status := range allowedStatuses {
		if status == newStatus {
			return true
		}
	}
	return false
}
