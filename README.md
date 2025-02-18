# Stream Recorder

A web application for recording streams from ping.gg embeds. Built with Node.js, Express, and Puppeteer.

## Features

- Record streams from ping.gg embeds in high quality
- User authentication and management
- Admin dashboard for user control
- Persistent recording states
- Automatic WebM to MP4 conversion
- Clean and modern UI

## Prerequisites

- Docker
- Docker Compose (optional, for development)

## Quick Start

### One-Line Deployment

The fastest way to get started is to use our pre-built Docker image:

```bash
mkdir -p recordings data && \
docker run -d \
  --name stream-recorder \
  -p 3000:3000 \
  -v $(pwd)/recordings:/usr/src/app/recordings \
  -v $(pwd)/data:/usr/src/app/data \
  -v $(pwd)/config.json:/usr/src/app/config.json \
  -e JWT_SECRET=your-secure-jwt-secret \
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
- Create necessary directories (recordings, data)
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

### Environment Variables

- `JWT_SECRET`: Secret key for JWT token generation (required for authentication)
- `PUPPETEER_EXECUTABLE_PATH`: Path to Chromium executable (default: /usr/bin/chromium)

### Volumes

1. **recordings/**: Stores all recorded videos

   - Mount to persist recordings between container restarts
   - Default path in container: `/usr/src/app/recordings`

2. **data/**: Stores user data and application state

   - Contains user information and recording states
   - Default path in container: `/usr/src/app/data`

3. **config.json**: Stores stream configurations
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

## User Management

### First-Time Setup

1. The first user to register with the username "admin" becomes the administrator
2. Admin can manage users through the Admin tab
3. Admin can enable/disable new user registration

### Authentication

- Users must register and log in to access the recorder
- JWT tokens are used for authentication
- Sessions persist across page reloads

## Usage

1. Access the web interface at `http://localhost:3000`
2. Register or log in to your account
3. Add streams using the format: `ping.gg/embed/<id>`
4. Start/stop recordings using the interface
5. Access recorded files in the `recordings` directory
6. Manage users and settings in the Admin tab (admin only)

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
- The `data` directory stores user information and recording states
- Changes to `config.json` persist between container restarts
- Container runs as non-root user for security
- FFmpeg and Chromium are included in the container for video processing

## Production Notes

- Use a reverse proxy (like Nginx) for SSL termination
- Set a secure `JWT_SECRET` in production
- Consider setting up monitoring and alerting
- Regularly backup the config.json, data directory, and recordings
- Monitor disk space usage for recordings directory

## Troubleshooting

1. **Permission Issues**:

   - Ensure the mounted volumes have correct permissions
   - The container runs as non-root user (node)
   - Check ownership of data and recordings directories

2. **Recording Failures**:

   - Check container logs for errors
   - Verify stream URL is accessible
   - Ensure sufficient disk space
   - Check recording state in data directory

3. **Authentication Issues**:

   - Verify JWT_SECRET is set correctly
   - Clear browser cache and cookies
   - Check user permissions in data directory

4. **Performance Issues**:
   - Monitor container resource usage
   - Adjust video quality settings in config.json
   - Consider cleanup strategy for old recordings

## Security Considerations

- Container runs as non-root user
- Sensitive ports are not exposed except 3000
- JWT tokens used for authentication
- User passwords are hashed
- Use reverse proxy for production deployments
- Regularly update base images and dependencies
