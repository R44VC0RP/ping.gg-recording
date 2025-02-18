#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}Starting development setup...${NC}"

# Check if config.json exists, if not create it from template
if [ ! -f "config.json" ]; then
    echo -e "${YELLOW}config.json not found. Creating from template...${NC}"
    cp template_config.json config.json
fi

# Create necessary directories
mkdir -p recordings
mkdir -p data

# Stop and remove existing container if it exists
if [ "$(docker ps -aq -f name=stream-recorder-dev)" ]; then
    echo -e "${YELLOW}Stopping and removing existing development container...${NC}"
    docker stop stream-recorder-dev
    docker rm stream-recorder-dev
fi

echo -e "${GREEN}Building development image...${NC}"
docker build -t stream-recorder-dev .

echo -e "${GREEN}Starting development container...${NC}"
docker run -p 3000:3000 \
    -v "$(pwd)/recordings:/usr/src/app/recordings" \
    -v "$(pwd)/data:/usr/src/app/data" \
    -v "$(pwd)/config.json:/usr/src/app/config.json" \
    -e JWT_SECRET=dev-secret-key \
    --name stream-recorder-dev \
    stream-recorder-dev

echo -e "${GREEN}Development container is running!${NC}"
echo -e "Access the application at: http://localhost:3000" 