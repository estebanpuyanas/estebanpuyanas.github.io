AIR := $(shell cd backend && go env GOPATH)/bin/air

.PHONY: help backend frontend dev restart build lint vet typecheck format clean

help:
	@echo "Usage: make [target]"
	@echo ""
	@echo "Development:"
	@echo "  backend     Run the backend dev server (hot-reload via air)"
	@echo "  frontend    Run the frontend dev server"
	@echo "  dev         Run both dev servers"
	@echo "  restart     Rebuild and restart the running backend"
	@echo ""
	@echo "Build:"
	@echo "  build       Build production-ready deployment"
	@echo ""
	@echo "Checks:"
	@echo "  lint        Run ESLint on the frontend"
	@echo "  vet         Run go vet on the backend"
	@echo "  typecheck   Run TypeScript type checking"
	@echo ""
	@echo "Formatting:"
	@echo "  format      Format all code (prettierd + gofmt)"
	@echo ""
	@echo "Cleanup:"
	@echo "  clean       Remove build artifacts"

backend:
	@echo "Starting backend dev server (hot-reload)..."
	cd backend && $(AIR)

frontend:
	@echo "Starting frontend dev server..."
	cd frontend && npm run dev

dev:
	@echo "Starting both dev servers..."
	@make backend & make frontend & wait

restart:
	@echo "Rebuilding and restarting backend..."
	cd backend && go build -o ./bin/api . && pkill -f './bin/api' 2>/dev/null || true && ./bin/api &

build:
	@echo "Building production-ready deployment..."
	cd backend && go build -o bin/api . && \
	cd ../frontend && npm install && npm run build

lint:
	@echo "Linting frontend..."
	cd frontend && npm run lint

vet:
	@echo "Running go vet..."
	cd backend && go vet ./...

format:
	@echo "Formatting frontend (prettierd)..."
	cd frontend && npx prettier --write "src/**/*.{ts,tsx,css}"
	@echo "Formatting backend (gofmt)..."
	cd backend && gofmt -w .

typecheck:
	@echo "Type checking frontend..."
	cd frontend && npx tsc --noEmit

clean:
	@echo "Cleaning build artifacts..."
	rm -rf backend/bin
	rm -rf frontend/dist
