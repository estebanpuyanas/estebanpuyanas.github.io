.PHONY: help backend frontend dev build lint vet typecheck format clean

help:
	@echo "Usage: make [target]"
	@echo ""
	@echo "Development:"
	@echo "  backend     Run the backend dev server"
	@echo "  frontend    Run the frontend dev server"
	@echo "  dev         Run both dev servers"
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
	@echo "Starting backend dev server..."
	cd backend && go run .

frontend:
	@echo "Starting frontend dev server..."
	cd frontend && npm run dev

dev:
	@echo "Starting both dev servers..."
	@make backend & make frontend & wait

build:
	@echo "Building production-ready deployment..."
	cd backend && go build -o server . && \
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
	rm -f backend/server
	rm -rf frontend/dist
