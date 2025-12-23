package handlers

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/low-key2703/cloudmart-devops/applications/order-service/internal/models"
	"github.com/low-key2703/cloudmart-devops/applications/order-service/internal/repository"
)

type OrderHandler struct {
	repo *repository.OrderRepository
}

func NewOrderHandler(repo *repository.OrderRepository) *OrderHandler {
	return &OrderHandler{repo: repo}
}

func (h *OrderHandler) Create(c *gin.Context) {
	var req models.CreateOrderRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	order := &models.Order{
		UserID:          req.UserID,
		ShippingAddress: req.ShippingAddress,
	}

	if err := h.repo.Create(order, req.Items); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create order"})
		return
	}

	c.JSON(http.StatusCreated, order)
}

func (h *OrderHandler) GetByID(c *gin.Context) {
	id := c.Param("id")

	order, err := h.repo.GetByID(id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get order"})
		return
	}

	if order == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Order not found"})
		return
	}

	c.JSON(http.StatusOK, order)
}

func (h *OrderHandler) List(c *gin.Context) {
	userID := c.Query("user_id")
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))
	offset, _ := strconv.Atoi(c.DefaultQuery("offset", "0"))

	if limit > 100 {
		limit = 100
	}

	var orders []models.Order
	var err error

	if userID != "" {
		orders, err = h.repo.GetByUserID(userID, limit, offset)
	} else {
		orders, err = h.repo.GetAll(limit, offset)
	}

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get orders"})
		return
	}

	if orders == nil {
		orders = []models.Order{}
	}

	c.JSON(http.StatusOK, gin.H{
		"orders": orders,
		"limit":  limit,
		"offset": offset,
	})
}

func (h *OrderHandler) Cancel(c *gin.Context) {
	id := c.Param("id")

	order, err := h.repo.GetByID(id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get order"})
		return
	}

	if order == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Order not found"})
		return
	}

	if !models.CanTransition(order.Status, models.StatusCancelled) {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":          "Cannot cancel order",
			"current_status": order.Status,
			"message":        "Order can only be cancelled when pending or confirmed",
		})
		return
	}

	if err := h.repo.UpdateStatus(id, models.StatusCancelled); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to cancel order"})
		return
	}

	order.Status = models.StatusCancelled
	c.JSON(http.StatusOK, order)
}

func (h *OrderHandler) GetStatus(c *gin.Context) {
	id := c.Param("id")

	order, err := h.repo.GetByID(id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get order"})
		return
	}

	if order == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Order not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"order_id":       order.ID,
		"status":         order.Status,
		"payment_status": order.PaymentStatus,
		"updated_at":     order.UpdatedAt,
	})
}

func (h *OrderHandler) UpdateStatus(c *gin.Context) {
	id := c.Param("id")

	var req models.UpdateStatusRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	order, err := h.repo.GetByID(id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get order"})
		return
	}

	if order == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Order not found"})
		return
	}

	if !models.CanTransition(order.Status, req.Status) {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":          "Invalid status transition",
			"current_status": order.Status,
			"requested":      req.Status,
			"allowed":        models.ValidTransitions[order.Status],
		})
		return
	}

	if err := h.repo.UpdateStatus(id, req.Status); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update order status"})
		return
	}

	order.Status = req.Status
	c.JSON(http.StatusOK, order)
}
