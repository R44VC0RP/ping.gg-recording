#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

echo -e "${GREEN}Starting production deployment...${NC}"

# Check for docker
if ! command_exists docker; then
    echo -e "${RED}Error: Docker is not installed. Please install Docker first.${NC}"
    exit 1
fi

# Create necessary directories and files
echo -e "${GREEN}Setting up directories and configurations...${NC}"

# Create recordings and data directories
mkdir -p recordings
mkdir -p data

# Check if config.json exists, if not create it from template
if [ ! -f "config.json" ]; then
    echo -e "${YELLOW}config.json not found. Creating from template...${NC}"
    cp template_config.json config.json
fi

# Generate a random JWT secret if not provided
if [ -z "$JWT_SECRET" ]; then
    JWT_SECRET=$(openssl rand -hex 32)
    echo -e "${YELLOW}Generated random JWT secret${NC}"
fi

# Stop and remove existing container if it exists
if [ "$(docker ps -aq -f name=stream-recorder)" ]; then
    echo -e "${YELLOW}Stopping and removing existing production container...${NC}"
    docker stop stream-recorder
    docker rm stream-recorder
fi

# Build production image
echo -e "${GREEN}Building production image...${NC}"
docker build -t stream-recorder-prod .

# Run production container
echo -e "${GREEN}Starting production container...${NC}"
docker run -d \
    -p 3000:3000 \
    -v "$(pwd)/recordings:/usr/src/app/recordings" \
    -v "$(pwd)/data:/usr/src/app/data" \
    -v "$(pwd)/config.json:/usr/src/app/config.json" \
    -e JWT_SECRET="$JWT_SECRET" \
    -e NODE_ENV=production \
    --restart unless-stopped \
    --name stream-recorder \
    stream-recorder-prod

# Check if container is running
if [ "$(docker ps -q -f name=stream-recorder)" ]; then
    echo -e "${GREEN}Production container is running successfully!${NC}"
    echo -e "Access the application at: http://localhost:3000"
    echo -e "\nContainer logs:"
    docker logs stream-recorder
else
    echo -e "${RED}Error: Container failed to start. Check logs with: docker logs stream-recorder${NC}"
    exit 1
fi

# Print helpful information
echo -e "\n${GREEN}Useful commands:${NC}"
echo -e "View logs: ${YELLOW}docker logs stream-recorder${NC}"
echo -e "Stop container: ${YELLOW}docker stop stream-recorder${NC}"
echo -e "Start container: ${YELLOW}docker start stream-recorder${NC}"
echo -e "Remove container: ${YELLOW}docker rm -f stream-recorder${NC}"

# Print JWT secret for safekeeping
echo -e "\n${YELLOW}Your JWT secret is: $JWT_SECRET${NC}"
echo -e "${YELLOW}Please save this in a secure location for future reference.${NC}" 