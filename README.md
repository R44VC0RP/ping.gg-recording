# Stream Recorder

A web application for recording streams from ping.gg embeds. Built with Node.js, Express, and Puppeteer.

## Prerequisites

- Docker
- Docker Compose (optional, for development)

## Quick Start

### Development

1. Clone the repository:
```bash
git clone <repository-url>
cd stream-recorder
```

2. Create a development config:
```bash
cp template_config.json config.json
```

3. Build and run the development container:
```bash
# Build the image
docker build -t stream-recorder-dev .

# Run with mounted volumes for development
docker run -p 3000:3000 \
  -v $(pwd)/recordings:/usr/src/app/recordings \
  -v $(pwd)/config.json:/usr/src/app/config.json \
  --name stream-recorder-dev \
  stream-recorder-dev
```

The development setup includes:
- Hot-reloading of recordings directory
- Persistent config.json for stream settings
- Port 3000 exposed for local access

### Production

1. Build the production image:
```bash
docker build -t stream-recorder-prod .
```

2. Run the production container:
```bash
docker run -d \
  -p 3000:3000 \
  -v /path/to/recordings:/usr/src/app/recordings \
  -v /path/to/config.json:/usr/src/app/config.json \
  --restart unless-stopped \
  --name stream-recorder \
  stream-recorder-prod
```

### Docker Compose (Recommended for Production)

Create a `docker-compose.yml`:

```yaml
version: '3.8'
services:
  stream-recorder:
    build: .
    ports:
      - "3000:3000"
    volumes:
      - ./recordings:/usr/src/app/recordings
      - ./config.json:/usr/src/app/config.json
    restart: unless-stopped
```

Run with:
```bash
docker-compose up -d
```

## Configuration

### Volumes

The application uses two important volumes:

1. **recordings/**: Stores all recorded videos
   - Mount to persist recordings between container restarts
   - Default path in container: `/usr/src/app/recordings`

2. **config.json**: Stores stream configurations
   - Contains stream settings and quality preferences
   - Default path in container: `/usr/src/app/config.json`

### Config File Structure

```json
{
  "streams": [],
  "settings": {
    "recordingsPath": "recordings",
    "defaultVideoQuality": {
      "width": 1920,
      "height": 1080,
      "videoBitrate": 8000000,
      "audioBitrate": 192000
    }
  }
}
```

## Usage

1. Access the web interface at `http://localhost:3000`
2. Add streams using the format: `ping.gg/embed/<id>`
3. Start/stop recordings using the interface
4. Access recorded files in the `recordings` directory

## Container Management

### View logs:
```bash
docker logs stream-recorder
```

### Stop container:
```bash
docker stop stream-recorder
```

### Restart container:
```bash
docker restart stream-recorder
```

### Remove container:
```bash
docker rm -f stream-recorder
```

## Development Notes

- The `recordings` directory is mounted as a volume for easy access to recorded files
- Changes to `config.json` persist between container restarts
- Container runs as non-root user for security
- FFmpeg and Chromium are included in the container for video processing

## Production Notes

- Use a reverse proxy (like Nginx) for SSL termination
- Consider setting up monitoring and alerting
- Regularly backup the config.json and recordings
- Monitor disk space usage for recordings directory

## Troubleshooting

1. **Permission Issues**:
   - Ensure the mounted volumes have correct permissions
   - The container runs as non-root user (node)

2. **Recording Failures**:
   - Check container logs for errors
   - Verify stream URL is accessible
   - Ensure sufficient disk space

3. **Performance Issues**:
   - Monitor container resource usage
   - Adjust video quality settings in config.json
   - Consider cleanup strategy for old recordings

## Security Considerations

- Container runs as non-root user
- Sensitive ports are not exposed except 3000
- Use reverse proxy for production deployments
- Regularly update base images and dependencies 