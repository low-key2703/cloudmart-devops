package handlers

import (
  "database/sql"
  "net/http"

  "github.com/gin-gonic/gin"
)

type HealthHandler struct {
  db              *sql.DB
  serviceName     string
}

func NewHealthHandler(db *sql.DB, serviceName string) *HealthHandler {
  return &HealthHandler{
    db:            db,
    serviceName:   serviceName,
  }
}

func (h *HealthHandler) Health(c *gin.Context) {
  c.JSON(http.StatusOK, gin.H{
    "status":    "healthy",
    "service":   h.serviceName,
  })
}

func (h *HealthHandler) Ready(c *gin.Context) {
  if err := h.db.Ping(); err != nil {
    c.JSON(http.StatusServiceUnavailable, gin.H{
      "status":   "not ready",
      "service":  h.serviceName,
      "error":    "database connection failed",
    })
    return
  }

  c.JSON(http.StatusOK, gin.H{
    "status":    "ready",
    "service":   h.serviceName,
  })
}
