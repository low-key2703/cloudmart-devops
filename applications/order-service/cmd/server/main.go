package main

import (
	"database/sql"
	"log"
	"net/http"

	"github.com/gin-gonic/gin"
	_ "github.com/lib/pq"

	"github.com/low-key2703/cloudmart-devops/applications/order-service/internal/config"
	"github.com/low-key2703/cloudmart-devops/applications/order-service/internal/handlers"
	"github.com/low-key2703/cloudmart-devops/applications/order-service/internal/middleware"
	"github.com/low-key2703/cloudmart-devops/applications/order-service/internal/repository"
)

func main() {
	cfg := config.Load()

	gin.SetMode(cfg.GinMode)

	db, err := sql.Open("postgres", cfg.DatabaseURL)
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}
	defer db.Close()

	if err := db.Ping(); err != nil {
		log.Fatalf("Failed to ping database: %v", err)
	}
	log.Println("Connected to database")

	orderRepo := repository.NewOrderRepository(db)

	healthHandler := handlers.NewHealthHandler(db, cfg.ServiceName)
	orderHandler := handlers.NewOrderHandler(orderRepo)

	router := gin.New()
	router.Use(gin.Recovery())
	router.Use(middleware.Logger())

	router.GET("/health", healthHandler.Health)
	router.GET("/ready", healthHandler.Ready)

	router.GET("/metrics", func(c *gin.Context) {
		c.String(http.StatusOK, "# Order service metrics\norder_service_up 1\n")
	})

	router.POST("/orders", orderHandler.Create)
	router.GET("/orders", orderHandler.List)
	router.GET("/orders/:id", orderHandler.GetByID)
	router.PUT("/orders/:id/cancel", orderHandler.Cancel)
	router.GET("/orders/:id/status", orderHandler.GetStatus)
	router.PUT("/orders/:id/status", orderHandler.UpdateStatus)

	log.Printf("Starting %s on port %s", cfg.ServiceName, cfg.Port)
	if err := router.Run(":" + cfg.Port); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}
