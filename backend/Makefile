.PHONY: help build run test clean fmt lint docker-build docker-run

# Default target
help:
	@echo "Spar Backend - Available Commands:"
	@echo ""
	@echo "  make build         - Build the server binary"
	@echo "  make run           - Run the development server"
	@echo "  make test          - Run all tests"
	@echo "  make test-coverage - Run tests with coverage report"
	@echo "  make clean         - Remove build artifacts"
	@echo "  make fmt           - Format code with gofmt"
	@echo "  make lint          - Run golangci-lint"
	@echo "  make docker-build  - Build Docker image"
	@echo "  make docker-run    - Run with Docker Compose"
	@echo ""

# Build the server binary
build:
	@echo "Building server..."
	@go build -o bin/server ./service/game-server/cmd/server.go
	@echo "Build complete: bin/server"

# Run the development server
run:
	@echo "Starting development server..."
	@go run ./service/game-server/cmd/server.go

# Run all tests
test:
	@echo "Running tests..."
	@go test -v ./...

# Run tests with coverage
test-coverage:
	@echo "Running tests with coverage..."
	@go test -coverprofile=coverage.out ./...
	@go tool cover -html=coverage.out -o coverage.html
	@echo "Coverage report generated: coverage.html"

# Clean build artifacts
clean:
	@echo "Cleaning build artifacts..."
	@rm -rf bin/
	@rm -f coverage.out coverage.html
	@echo "Clean complete"

# Format code
fmt:
	@echo "Formatting code..."
	@gofmt -w -s .
	@echo "Format complete"

# Run linter (requires golangci-lint)
lint:
	@echo "Running linter..."
	@golangci-lint run ./...

# Install dependencies
deps:
	@echo "Installing dependencies..."
	@go mod download
	@go mod tidy
	@echo "Dependencies installed"

# Build Docker image
docker-build:
	@echo "Building Docker image..."
	@docker build -t spar-backend:latest -f service/game-server/docker/Dockerfile .
	@echo "Docker image built: spar-backend:latest"

# Run with Docker Compose
docker-run:
	@echo "Starting services with Docker Compose..."
	@docker-compose up

# Run with Docker Compose in background
docker-up:
	@echo "Starting services in background..."
	@docker-compose up -d

# Stop Docker Compose services
docker-down:
	@echo "Stopping services..."
	@docker-compose down

# Hot reload with air (requires air to be installed)
dev:
	@echo "Starting development server with hot reload..."
	@air

# Install development tools
install-tools:
	@echo "Installing development tools..."
	@go install github.com/golangci/golangci-lint/cmd/golangci-lint@latest
	@go install github.com/air-verse/air@latest
	@echo "Tools installed"

# Database commands
db-start:
	@echo "Starting database containers..."
	@docker compose up -d

db-stop:
	@echo "Stopping database containers..."
	@docker compose stop

db-reset:
	@echo "Resetting database (removing all data)..."
	@docker compose down -v
	@docker compose up -d
	@sleep 5
	@echo "Database reset complete"

db-logs:
	@echo "Showing database logs..."
	@docker compose logs -f postgres

db-shell:
	@echo "Opening PostgreSQL shell..."
	@docker exec -it spar-postgres psql -U sparuser -d spardb

db-test:
	@echo "Testing database connection..."
	@docker exec spar-postgres psql -U sparuser -d spardb -c "SELECT version();"
