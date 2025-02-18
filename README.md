<div align="center">
  <img src="https://github.com/user-attachments/assets/50478dd3-10e5-4313-b939-ae54be5e5c0b" alt="Stream Recorder Logo" style="max-width: 100px; margin-bottom: 1rem;">
  <h1 style="font-size: 3rem; margin: 0.5rem 0; color: #333;">Stream Recorder</h1>
  <p style="font-size: 1.2rem; color: #666; margin-bottom: 2rem;">
    A web application for recording streams from ping.gg embeds.<br>
    Built with Node.js, Express, and Puppeteer.
  </p>
</div>

## Prerequisites

- Docker
- Docker Compose (optional, for development)

## Quick Start

### One-Line Deployment

The fastest way to get started is to use our pre-built Docker image:

```bash
mkdir -p recordings && \
docker run -d \
  --name stream-recorder \
  -p 3000:3000 \
  -v $(pwd)/recordings:/usr/src/app/recordings \
  -v $(pwd)/config.json:/usr/src/app/config.json \
  mandarin3d/stream-recorder:latest
```

Then visit `http://localhost:3000` to access the recorder interface.

### Development

1. Clone the repository:

```bash
git clone <repository-url>
cd stream-recorder
```

2. Run the development script:

```bash
./dev.sh
```

This script will:

- Create config.json from template if it doesn't exist
- Create the recordings directory
- Build the development Docker image
- Start the container with appropriate volumes
- Provide access to the application at http://localhost:3000

### Production

1. Deploy using the production script:

```bash
./prod.sh
```

This script will:

- Check for Docker installation
- Set up necessary directories and configurations
- Build the production Docker image
- Start the container with proper settings
- Verify the deployment
- Display useful commands and container logs

## Configuration

### Volumes

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
