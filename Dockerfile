# Use Node.js as base image
FROM node:20-slim

# Install required packages including Chrome and FFmpeg
RUN apt-get update && apt-get install -y \
    chromium \
    ffmpeg \
    fonts-noto-color-emoji \
    fonts-noto-cjk \
    # Dependencies for Puppeteer
    ca-certificates \
    fonts-liberation \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libc6 \
    libcairo2 \
    libcups2 \
    libdbus-1-3 \
    libexpat1 \
    libfontconfig1 \
    libgbm1 \
    libgcc1 \
    libglib2.0-0 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libpango-1.0-0 \
    libpangocairo-1.0-0 \
    libstdc++6 \
    libx11-6 \
    libx11-xcb1 \
    libxcb1 \
    libxcomposite1 \
    libxcursor1 \
    libxdamage1 \
    libxext6 \
    libxfixes3 \
    libxi6 \
    libxrandr2 \
    libxrender1 \
    libxss1 \
    libxtst6 \
    lsb-release \
    wget \
    xdg-utils \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

# Set environment variables for Puppeteer and JWT
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium \
    JWT_SECRET=your-secret-key-change-in-production

# Create app directory
WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./

# Copy template config
COPY template_config.json ./config.json

# Install Bun
RUN npm install -g bun

# Install dependencies
RUN bun install

# Copy app source
COPY . .

# Create necessary directories
RUN mkdir -p recordings data && \
    chown -R node:node recordings data

# Switch to non-root user
USER node

# Expose port
EXPOSE 3000

# Start the application
CMD [ "bun", "start" ] 