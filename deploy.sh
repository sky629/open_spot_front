#!/bin/bash

# OpenSpot Frontend Deployment Script
# Usage: ./deploy.sh [environment]
# Environments: dev, prod

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default environment
ENVIRONMENT=${1:-prod}

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if Docker is running
check_docker() {
    if ! docker info >/dev/null 2>&1; then
        print_error "Docker is not running. Please start Docker and try again."
        exit 1
    fi
    print_success "Docker is running"
}

# Function to check if required files exist
check_files() {
    local required_files=("Dockerfile" "docker-compose.yml" "nginx.conf")

    for file in "${required_files[@]}"; do
        if [ ! -f "$file" ]; then
            print_error "Required file '$file' not found"
            exit 1
        fi
    done
    print_success "All required files found"
}

# Function to load environment variables
load_env() {
    if [ -f .env ]; then
        print_status "Loading environment variables from .env"
        export $(cat .env | grep -v '^#' | xargs)
        print_success "Environment variables loaded"
    else
        print_warning ".env file not found, using default values"
    fi
}

# Function to build and deploy for production
deploy_production() {
    print_status "🚀 Starting production deployment..."

    # Stop and remove existing containers
    print_status "Stopping existing containers..."
    docker-compose down --remove-orphans || true

    # Remove old images (optional)
    print_status "Cleaning up old images..."
    docker image prune -f || true

    # Build new image
    print_status "Building production image..."
    docker-compose build --no-cache frontend

    # Start services
    print_status "Starting production services..."
    docker-compose up -d

    # Wait for services to be healthy
    print_status "Waiting for services to be ready..."
    sleep 10

    # Health check
    if curl -f http://localhost/health >/dev/null 2>&1; then
        print_success "✅ Production deployment completed successfully!"
        print_status "🌐 Application is available at: http://localhost"
    else
        print_error "❌ Health check failed. Check container logs:"
        docker-compose logs --tail=50
        exit 1
    fi
}

# Function to deploy for development
deploy_development() {
    print_status "🛠️ Starting development deployment..."

    # Check if dev compose file exists
    if [ ! -f "docker-compose.dev.yml" ]; then
        print_error "docker-compose.dev.yml not found"
        exit 1
    fi

    # Stop existing dev containers
    print_status "Stopping existing development containers..."
    docker-compose -f docker-compose.dev.yml down --remove-orphans || true

    # Start development services
    print_status "Starting development services..."
    docker-compose -f docker-compose.dev.yml up -d

    # Wait for services
    print_status "Waiting for services to be ready..."
    sleep 15

    # Health check
    if curl -f http://localhost/health >/dev/null 2>&1; then
        print_success "✅ Development deployment completed successfully!"
        print_status "🌐 Application is available at: http://localhost"
        print_status "🔥 Vite dev server is available at: http://localhost:3000"
        print_status "📊 View logs with: docker-compose -f docker-compose.dev.yml logs -f"
    else
        print_error "❌ Health check failed. Check container logs:"
        docker-compose -f docker-compose.dev.yml logs --tail=50
        exit 1
    fi
}

# Function to show deployment status
show_status() {
    print_status "📊 Current deployment status:"
    echo ""

    if [ "$ENVIRONMENT" = "dev" ]; then
        docker-compose -f docker-compose.dev.yml ps
    else
        docker-compose ps
    fi

    echo ""
    print_status "📈 Resource usage:"
    docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}"
}

# Function to show usage
show_usage() {
    echo "Usage: $0 [environment] [action]"
    echo ""
    echo "Environments:"
    echo "  dev   - Development environment with hot-reloading"
    echo "  prod  - Production environment (default)"
    echo ""
    echo "Actions:"
    echo "  deploy  - Deploy the application (default)"
    echo "  status  - Show deployment status"
    echo "  logs    - Show container logs"
    echo "  stop    - Stop all containers"
    echo "  clean   - Stop containers and remove images"
    echo ""
    echo "Examples:"
    echo "  $0 prod          # Deploy to production"
    echo "  $0 dev           # Deploy to development"
    echo "  $0 prod status   # Show production status"
    echo "  $0 dev logs      # Show development logs"
}

# Main execution
main() {
    ACTION=${2:-deploy}

    print_status "🏗️ OpenSpot Frontend Deployment"
    print_status "Environment: $ENVIRONMENT"
    print_status "Action: $ACTION"
    echo ""

    # Handle different actions
    case $ACTION in
        "deploy")
            check_docker
            check_files
            load_env

            case $ENVIRONMENT in
                "dev"|"development")
                    deploy_development
                    ;;
                "prod"|"production")
                    deploy_production
                    ;;
                *)
                    print_error "Unknown environment: $ENVIRONMENT"
                    show_usage
                    exit 1
                    ;;
            esac

            show_status
            ;;
        "status")
            show_status
            ;;
        "logs")
            if [ "$ENVIRONMENT" = "dev" ]; then
                docker-compose -f docker-compose.dev.yml logs -f
            else
                docker-compose logs -f
            fi
            ;;
        "stop")
            print_status "Stopping containers..."
            if [ "$ENVIRONMENT" = "dev" ]; then
                docker-compose -f docker-compose.dev.yml down
            else
                docker-compose down
            fi
            print_success "Containers stopped"
            ;;
        "clean")
            print_status "Cleaning up..."
            if [ "$ENVIRONMENT" = "dev" ]; then
                docker-compose -f docker-compose.dev.yml down --rmi all -v
            else
                docker-compose down --rmi all -v
            fi
            docker system prune -f
            print_success "Cleanup completed"
            ;;
        *)
            print_error "Unknown action: $ACTION"
            show_usage
            exit 1
            ;;
    esac
}

# Check if running with help flag
if [ "$1" = "-h" ] || [ "$1" = "--help" ]; then
    show_usage
    exit 0
fi

# Run main function
main "$@"