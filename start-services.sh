#!/bin/bash

echo "Starting Coding Platform Microservices..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check required tools
if ! command_exists node; then
    echo -e "${RED}Error: Node.js is not installed${NC}"
    exit 1
fi

if ! command_exists docker; then
    echo -e "${RED}Error: Docker is not installed${NC}"
    exit 1
fi

# Start infrastructure services
echo -e "${GREEN}Starting infrastructure services...${NC}"
docker-compose up -d mongodb redis rabbitmq

# Wait for services to be ready
echo -e "${YELLOW}Waiting for infrastructure services to be ready...${NC}"
sleep 5

# Start services
echo -e "${GREEN}Starting microservices...${NC}"

# Start common package first
echo -e "${YELLOW}Installing common package...${NC}"
cd services/common
npm install 2>/dev/null
cd ../..

# Function to start a service
start_service() {
    local name=$1
    local path=$2
    local port=$3
    
    echo -e "${YELLOW}Starting $name...${NC}"
    cd "$path"
    npm install 2>/dev/null
    PORT=$port npm start &
    cd ../..
}

# Start all services
start_service "Auth Service" "services/auth-service" 3001
start_service "User Service" "services/user-service" 3002
start_service "Workspace Service" "services/workspace-service" 3003
start_service "Snippet Service" "services/snippet-service" 3004
start_service "API Test Service" "services/api-test-service" 3005
start_service "Terminal Service" "services/terminal-service" 3006
start_service "Admin Service" "services/admin-service" 3008
start_service "Gateway" "services/gateway" 3000

echo ""
echo -e "${GREEN}All microservices started!${NC}"
echo ""
echo "Services running:"
echo "  - API Gateway: http://localhost:3000"
echo "  - Auth Service: http://localhost:3001"
echo "  - User Service: http://localhost:3002"
echo "  - Workspace Service: http://localhost:3003"
echo "  - Snippet Service: http://localhost:3004"
echo "  - API Test Service: http://localhost:3005"
echo "  - Terminal Service: http://localhost:3006"
echo "  - Admin Service: http://localhost:3008"
echo ""
echo "Infrastructure:"
echo "  - MongoDB: localhost:27018"
echo "  - Redis: localhost:6379"
echo "  - RabbitMQ: localhost:5672 (management: localhost:15672)"
echo ""
echo "Press Ctrl+C to stop all services"
echo ""

# Wait for all background jobs
wait
