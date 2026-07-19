package main

import (
	"context"
	"log"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"strconv"
	"strings"
	"syscall"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
	"github.com/npeprah/sparui/backend/common/db"
	"github.com/npeprah/sparui/backend/service/game-server/controller/auth"
	"github.com/npeprah/sparui/backend/service/game-server/controller/game"
	"github.com/npeprah/sparui/backend/service/game-server/controller/stats"
	"github.com/npeprah/sparui/backend/service/game-server/controller/websocket"
)

func main() {
	// Initialize logger
	logger := slog.New(slog.NewJSONHandler(os.Stdout, nil))
	slog.SetDefault(logger)

	slog.Info("Starting Spar Game Server...")

	// SPAR_TEST_MODE is a strictly-gated switch used ONLY by the e2e harness.
	// It MUST NEVER be enabled in production. When on, it bundles a DB-optional
	// boot (the server runs with no Postgres; auth/stats degrade to no-op and
	// live gameplay runs entirely in memory) plus the deterministic
	// hand-injection hook. When off (the default), the boot path below is the
	// unchanged production path that hard-fails without a database.
	testMode := testModeFromEnv(os.Getenv)

	if testMode {
		slog.Warn("SPAR_TEST_MODE is set - booting in DB-optional test mode; NOT FOR PRODUCTION")
		websocket.EnableTestMode()

		// Try to connect to the DB but tolerate its absence: the acceptance
		// scenarios exercise no persisted data.
		var database *db.DB
		if d, err := initDatabase(); err != nil {
			slog.Warn("SPAR_TEST_MODE: continuing without a database", "error", err)
		} else {
			database = d
			defer database.Close()
		}

		// Initialize auth/stats regardless of DB presence so their REST routes
		// mount without panicking. With a nil DB these degrade to non-validating
		// stubs / no-ops (the e2e acceptance path never calls these endpoints;
		// the WS auth handshake derives player ids without the DB).
		auth.InitService(database)
		stats.InitService(database)

		// Live gameplay + rooms run in memory; never wire the repository-backed
		// path (it would try to persist and fail without Postgres).
		websocket.InitWebSocketTestMode()
	} else {
		// Production boot path (unchanged): a database is required.
		database, err := initDatabase()
		if err != nil {
			log.Fatalf("Failed to initialize database: %v", err)
		}
		defer database.Close()
		slog.Info("Database connection established")

		// Initialize auth service with database
		auth.InitService(database)

		// Initialize stats service with database
		stats.InitService(database)

		// Initialize WebSocket service with database
		websocket.InitWebSocket(database)
	}

	// Get port from environment or use default
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	// Initialize router
	r := chi.NewRouter()

	// Middleware
	r.Use(middleware.RequestID)
	r.Use(middleware.RealIP)
	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)
	r.Use(middleware.Timeout(60 * time.Second))

	// CORS configuration for frontend
	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   []string{"http://localhost:5173", "http://localhost:5174"},
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type"},
		AllowCredentials: true,
		MaxAge:           300,
	}))

	// Health check endpoint
	r.Get("/health", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		w.Write([]byte(`{"status":"healthy","service":"game-server"}`))
	})

	// API routes
	r.Route("/api/v1", func(r chi.Router) {
		// Auth routes
		r.Mount("/auth", auth.Routes())

		// Game routes
		r.Mount("/game", game.Routes())

		// Stats routes
		r.Mount("/stats", stats.Routes())
	})

	// WebSocket endpoint
	r.Get("/ws", websocket.HandleWebSocket)

	// Test-only endpoints (SPAR_TEST_MODE): deterministic hand injection for the
	// e2e harness. Mounted ONLY when test mode is on, so these routes simply do
	// not exist in a normal/production boot.
	if testMode {
		r.Post("/test/inject-hands", websocket.HandleTestInject)
		r.Post("/test/reset", websocket.HandleTestReset)
		slog.Warn("SPAR_TEST_MODE: /test/inject-hands and /test/reset endpoints mounted")
	}

	// Create server
	srv := &http.Server{
		Addr:         ":" + port,
		Handler:      r,
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 15 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	// Start server in goroutine
	go func() {
		slog.Info("Starting server", "port", port)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("Server failed to start: %v", err)
		}
	}()

	// Graceful shutdown
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	slog.Info("Shutting down server...")

	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	if err := srv.Shutdown(ctx); err != nil {
		log.Fatalf("Server forced to shutdown: %v", err)
	}

	slog.Info("Server stopped gracefully")
}

// initDatabase initializes the database connection
func initDatabase() (*db.DB, error) {
	// Load database configuration from environment
	config := db.Config{
		Host:     getEnv("DB_HOST", "localhost"),
		Port:     getEnv("DB_PORT", "5432"),
		User:     getEnv("DB_USER", "sparuser"),
		Password: getEnv("DB_PASSWORD", "sparpassword"),
		DBName:   getEnv("DB_NAME", "spardb"),
		SSLMode:  getEnv("DB_SSLMODE", "disable"),
		MaxConns: getEnvInt("DB_MAX_CONNS", 20),
		MaxIdle:  getEnvInt("DB_MAX_IDLE", 5),
	}

	slog.Info("Connecting to database",
		"host", config.Host,
		"port", config.Port,
		"database", config.DBName,
	)

	// Connect to database
	database, err := db.NewPostgresDB(config)
	if err != nil {
		return nil, err
	}

	// Verify connection with health check
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := database.HealthCheck(ctx); err != nil {
		return nil, err
	}

	return database, nil
}

// testModeFromEnv reports whether SPAR_TEST_MODE requests test mode. It is
// deliberately conservative: only explicitly truthy values ("1", "true", "yes",
// "on", case-insensitive) enable it, and it defaults OFF so a missing or empty
// variable always yields the production boot path. getenv is injected for
// testability.
func testModeFromEnv(getenv func(string) string) bool {
	switch strings.ToLower(strings.TrimSpace(getenv("SPAR_TEST_MODE"))) {
	case "1", "true", "yes", "on":
		return true
	default:
		return false
	}
}

// getEnv gets an environment variable with a default value
func getEnv(key, defaultValue string) string {
	value := os.Getenv(key)
	if value == "" {
		return defaultValue
	}
	return value
}

// getEnvInt gets an environment variable as integer with a default value
func getEnvInt(key string, defaultValue int) int {
	value := os.Getenv(key)
	if value == "" {
		return defaultValue
	}
	intValue, err := strconv.Atoi(value)
	if err != nil {
		return defaultValue
	}
	return intValue
}
