# Stream Recorder

<div align="center">
  <svg width="120" height="70" viewBox="0 0 260 150" fill="#DB1D71" xmlns="http://www.w3.org/2000/svg">
    <path d="M231.53,25.79A16.71,16.71,0,0,1,248.24,42.5v65a16.71,16.71,0,0,1-16.71,16.71H134.64a15.5,15.5,0,0,1-31,0H28.47A16.71,16.71,0,0,1,11.76,107.5v-65A16.71,16.71,0,0,1,28.47,25.79H231.53m0-9.76H28.47A26.49,26.49,0,0,0,2,42.5v65A26.49,26.49,0,0,0,28.47,134H96a25.25,25.25,0,0,0,46.33,0h89.23A26.49,26.49,0,0,0,258,107.5v-65A26.49,26.49,0,0,0,231.53,16ZM102.8,98.32a8.84,8.84,0,0,1-17.68,0V68.67a8.84,8.84,0,1,1,17.68,0Zm64.92-1.53a10.38,10.38,0,0,1-10.41,10.33h-.92a10.36,10.36,0,0,1-8.35-4.21l-.11-.16L128,73.93v50a8.84,8.84,0,0,1-17.68,0V52.52a10.39,10.39,0,0,1,10.34-10.41h1a10.6,10.6,0,0,1,8.44,4.37l.18.24L150,75.3v-7a8.84,8.84,0,1,1,17.68,0Zm63.81-3.68a10.49,10.49,0,0,1-5.9,9.55,44.41,44.41,0,0,1-19.93,4.84c-19,0-32.27-13.49-32.27-32.81,0-19.1,13.48-33,32-33A38.68,38.68,0,0,1,227.34,48a8.6,8.6,0,0,1,4.12,7.34,8.44,8.44,0,0,1-8.57,8.49,8.89,8.89,0,0,1-4-1l-.33-.18a22.67,22.67,0,0,0-12.31-3.55c-9.48,0-15.14,5.8-15.14,15.52s6,15.53,15.52,15.53a22.73,22.73,0,0,0,8.08-1.45V83.64h-7.31a8.49,8.49,0,1,1,0-17H222.5a8.93,8.93,0,0,1,9,9ZM74.62,49.56C70,44.87,63.34,42.5,54.76,42.5H37.27a8.84,8.84,0,0,0-8.8,8.87V98.32a8.84,8.84,0,0,0,17.67,0V87.25h8.62c8.58,0,15.26-2.38,19.87-7.07a21.62,21.62,0,0,0,6-15.31A21.6,21.6,0,0,0,74.62,49.56ZM53.85,71.8H46.14V58h7.71c8.6,0,8.6,4.68,8.6,6.92S62.45,71.8,53.85,71.8Z"></path>
  </svg>

  <h1>Stream Recorder</h1>
  <p>A web application for recording streams from ping.gg embeds.<br>Built with Node.js, Express, and Puppeteer.</p>
</div>

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