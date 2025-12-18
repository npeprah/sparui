package db

import (
	"context"
	"database/sql"
	"fmt"
	"log/slog"
	"time"

	_ "github.com/lib/pq"
)

// Config holds database configuration
type Config struct {
	Host     string
	Port     string
	User     string
	Password string
	DBName   string
	SSLMode  string
	MaxConns int
	MaxIdle  int
}

// DB wraps sql.DB with additional functionality
type DB struct {
	*sql.DB
}

// NewPostgresDB creates a new PostgreSQL connection
func NewPostgresDB(config Config) (*DB, error) {
	// Build connection string
	dsn := fmt.Sprintf(
		"host=%s port=%s user=%s password=%s dbname=%s sslmode=%s",
		config.Host,
		config.Port,
		config.User,
		config.Password,
		config.DBName,
		config.SSLMode,
	)

	slog.Info("Connecting to PostgreSQL database", "host", config.Host, "port", config.Port, "dbname", config.DBName)

	// Open connection
	db, err := sql.Open("postgres", dsn)
	if err != nil {
		return nil, fmt.Errorf("failed to open database: %w", err)
	}

	// Set connection pool settings
	db.SetMaxOpenConns(config.MaxConns)
	db.SetMaxIdleConns(config.MaxIdle)
	db.SetConnMaxLifetime(time.Hour)

	// Verify connection with retries
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	var lastErr error
	for i := 0; i < 3; i++ {
		if err := db.PingContext(ctx); err == nil {
			slog.Info("Successfully connected to PostgreSQL database")
			return &DB{db}, nil
		} else {
			lastErr = err
			slog.Warn("Failed to ping database, retrying...", "attempt", i+1, "error", err)
			time.Sleep(2 * time.Second)
		}
	}

	return nil, fmt.Errorf("failed to connect to database after 3 attempts: %w", lastErr)
}

// HealthCheck verifies database connectivity
func (db *DB) HealthCheck(ctx context.Context) error {
	ctx, cancel := context.WithTimeout(ctx, 2*time.Second)
	defer cancel()

	if err := db.PingContext(ctx); err != nil {
		return fmt.Errorf("database health check failed: %w", err)
	}

	return nil
}

// Close closes the database connection
func (db *DB) Close() error {
	slog.Info("Closing database connection")
	return db.DB.Close()
}

// ParseDatabaseURL parses a DATABASE_URL string into Config
func ParseDatabaseURL(dbURL string) (Config, error) {
	// For simplicity, we'll use a basic parser
	// In production, consider using url.Parse or a library

	// Example: postgresql://user:password@localhost:5432/dbname?sslmode=disable
	// For now, return a default config and let the user set via env vars
	config := Config{
		Host:     "localhost",
		Port:     "5432",
		User:     "sparuser",
		Password: "sparpassword",
		DBName:   "spardb",
		SSLMode:  "disable",
		MaxConns: 20,
		MaxIdle:  5,
	}

	// TODO: Implement proper URL parsing
	// For now, this is a placeholder
	slog.Warn("Using default database config - DATABASE_URL parsing not fully implemented")

	return config, nil
}
