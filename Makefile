# Personal Finance App Makefile

.PHONY: help build test clean lint format security-scan docker-build docker-run dev-setup

# Default target
help: ## Show this help message
	@echo "Available commands:"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

# Development setup
dev-setup: ## Set up development environment
	@echo "Setting up development environment..."
	@which go >/dev/null 2>&1 || (echo "Go is not installed. Please install Go 1.21+" && exit 1)
	@which node >/dev/null 2>&1 || (echo "Node.js is not installed. Please install Node.js 18+" && exit 1)
	@which docker >/dev/null 2>&1 || (echo "Docker is not installed. Please install Docker" && exit 1)
	cd backend && go mod download
	cd frontend && npm install
	@echo "Development environment setup complete!"

# Backend commands
backend-build: ## Build the backend binary
	cd backend && CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o main ./cmd

backend-test: ## Run backend tests
	cd backend && go test -v -race -coverprofile=coverage.out ./...

backend-test-coverage: backend-test ## Run backend tests and show coverage
	cd backend && go tool cover -html=coverage.out -o coverage.html
	@echo "Coverage report generated: backend/coverage.html"

backend-lint: ## Lint backend code
	cd backend && golangci-lint run

backend-format: ## Format backend code
	cd backend && gofmt -s -w .

backend-security: ## Run security scan on backend
	cd backend && gosec ./...

# Frontend commands
frontend-build: ## Build the frontend
	cd frontend && npm run build

frontend-test: ## Run frontend tests
	cd frontend && npm test -- --coverage --watchAll=false

frontend-lint: ## Lint frontend code
	cd frontend && npm run lint

frontend-format: ## Format frontend code
	cd frontend && npx prettier --write src/

frontend-dev: ## Start frontend development server
	cd frontend && npm run dev

# Docker commands
docker-build: ## Build Docker images
	docker build -t personal-finance-backend ./backend
	docker build -t personal-finance-frontend ./frontend

docker-run: ## Run application with Docker Compose
	docker-compose up -d

docker-stop: ## Stop Docker containers
	docker-compose down

docker-prod: ## Run production Docker Compose
	docker-compose -f docker-compose.prod.yml up -d

docker-logs: ## Show Docker logs
	docker-compose logs -f

# Testing commands
test: backend-test frontend-test ## Run all tests

test-integration: ## Run integration tests
	@echo "Running integration tests..."
	docker-compose -f docker-compose.test.yml up --build --abort-on-container-exit
	docker-compose -f docker-compose.test.yml down

# Linting and formatting
lint: backend-lint frontend-lint ## Run all linters

format: backend-format frontend-format ## Format all code

# Security
security-scan: backend-security ## Run security scans
	docker run --rm -v $(PWD):/app aquasec/trivy fs /app

# Clean up
clean: ## Clean build artifacts
	cd backend && rm -f main coverage.out coverage.html
	cd frontend && rm -rf dist node_modules/.cache
	docker system prune -f

# Database commands
db-migrate: ## Run database migrations
	@echo "Running database migrations..."
	# Add migration command here

db-seed: ## Seed database with test data
	@echo "Seeding database..."
	# Add seeding command here

# CI/CD helpers
ci-setup: ## Set up CI environment
	@echo "Setting up CI environment..."
	go version
	node --version
	docker --version

build-all: backend-build frontend-build ## Build all components

# Release commands
release-prepare: ## Prepare for release
	@echo "Preparing release..."
	@git status --porcelain | grep -q . && echo "Working directory not clean" && exit 1 || true
	@echo "Working directory is clean"

release-tag: ## Create release tag
	@echo "Creating release tag..."
	@read -p "Enter version (e.g., v1.0.0): " VERSION; \
	git tag -a $$VERSION -m "Release $$VERSION"; \
	git push origin $$VERSION

# Documentation
docs-serve: ## Serve documentation locally
	@echo "Serving documentation..."
	# Add documentation server command here

docs-build: ## Build documentation
	@echo "Building documentation..."
	# Add documentation build command here