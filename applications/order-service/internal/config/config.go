package config

import (
  "os"

  "github.com/joho/godotenv"
)

type Config struct {
  Port              string
  DatabaseURL       string
  ServiceName       string
  GinMode           string
}

func Load() *Config {
  godotenv.Load()

  return &Config{
    Port:            getEnv("PORT", "8080"),
    DatabaseURL:     getEnv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/cloudmart?sslmode=disable"),
    ServiceName:     getEnv("SERVICE_NAME", "order-service"),
    GinMode:         getEnv("GIN_MODE", "debug"),
  }
}

func getEnv(key, defaultValue string) string {
  if value := os.Getenv(key); value != "" {
    return value
  }
  return defaultValue
}
