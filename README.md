<div align="center">
  <img src="https://github.com/user-attachments/assets/50478dd3-10e5-4313-b939-ae54be5e5c0b" alt="Stream Recorder Logo" style="max-width: 200px; margin-bottom: 1rem;">
  <h1 style="font-size: 3rem; margin: 0.5rem 0; color: #333;">Stream Recorder</h1>
  <p style="font-size: 1.2rem; color: #666; margin-bottom: 2rem;">
    A web application for recording streams from ping.gg embeds.<br>
    Built with Node.js, Express, and Puppeteer.
  </p>
</div>

<div style="max-width: 800px; margin: 0 auto; padding: 0 1rem;">

  <h2 style="color: #333; border-bottom: 2px solid #eee; padding-bottom: 0.5rem;">Prerequisites</h2>

  <ul style="list-style-type: none; padding-left: 0;">
    <li style="margin: 0.5rem 0;">• Docker</li>
    <li style="margin: 0.5rem 0;">• Docker Compose (optional, for development)</li>
  </ul>

  <h2 style="color: #333; border-bottom: 2px solid #eee; padding-bottom: 0.5rem; margin-top: 2rem;">Quick Start</h2>

  <h3 style="color: #444;">Development</h3>

  <ol style="padding-left: 1.5rem;">
    <li style="margin-bottom: 1rem;">Clone the repository:
      <pre style="background: #f6f8fa; padding: 1rem; border-radius: 5px; overflow-x: auto;">
git clone <repository-url>
cd stream-recorder</pre>
    </li>

    <li>Run the development script:
      <pre style="background: #f6f8fa; padding: 1rem; border-radius: 5px; overflow-x: auto;">
./dev.sh</pre>
    </li>
  </ol>

  <p style="color: #666;">This script will:</p>
  <ul style="list-style-type: none; padding-left: 1rem;">
    <li style="margin: 0.3rem 0;">• Create config.json from template if it doesn't exist</li>
    <li style="margin: 0.3rem 0;">• Create the recordings directory</li>
    <li style="margin: 0.3rem 0;">• Build the development Docker image</li>
    <li style="margin: 0.3rem 0;">• Start the container with appropriate volumes</li>
    <li style="margin: 0.3rem 0;">• Provide access to the application at http://localhost:3000</li>
  </ul>

  <h3 style="color: #444; margin-top: 2rem;">Production</h3>

  <ol style="padding-left: 1.5rem;">
    <li>Deploy using the production script:
      <pre style="background: #f6f8fa; padding: 1rem; border-radius: 5px; overflow-x: auto;">
./prod.sh</pre>
    </li>
  </ol>

  <p style="color: #666;">This script will:</p>
  <ul style="list-style-type: none; padding-left: 1rem;">
    <li style="margin: 0.3rem 0;">• Check for Docker installation</li>
    <li style="margin: 0.3rem 0;">• Set up necessary directories and configurations</li>
    <li style="margin: 0.3rem 0;">• Build the production Docker image</li>
    <li style="margin: 0.3rem 0;">• Start the container with proper settings</li>
    <li style="margin: 0.3rem 0;">• Verify the deployment</li>
    <li style="margin: 0.3rem 0;">• Display useful commands and container logs</li>
  </ul>

  <h2 style="color: #333; border-bottom: 2px solid #eee; padding-bottom: 0.5rem; margin-top: 2rem;">Configuration</h2>

  <h3 style="color: #444;">Volumes</h3>

  <div style="background: #f8f9fa; padding: 1rem; border-radius: 5px; margin: 1rem 0;">
    <p style="margin: 0.5rem 0;"><strong>1. recordings/</strong>: Stores all recorded videos</p>
    <ul style="list-style-type: none; padding-left: 1rem;">
      <li style="margin: 0.3rem 0;">• Mount to persist recordings between container restarts</li>
      <li style="margin: 0.3rem 0;">• Default path in container: <code style="background: #eee; padding: 0.2rem 0.4rem; border-radius: 3px;">/usr/src/app/recordings</code></li>
    </ul>

    <p style="margin: 0.5rem 0;"><strong>2. config.json</strong>: Stores stream configurations</p>
    <ul style="list-style-type: none; padding-left: 1rem;">
      <li style="margin: 0.3rem 0;">• Contains stream settings and quality preferences</li>
      <li style="margin: 0.3rem 0;">• Default path in container: <code style="background: #eee; padding: 0.2rem 0.4rem; border-radius: 3px;">/usr/src/app/config.json</code></li>
    </ul>
  </div>

  <h3 style="color: #444;">Config File Structure</h3>

  <pre style="background: #f6f8fa; padding: 1rem; border-radius: 5px; overflow-x: auto;">
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
}</pre>

  <h2 style="color: #333; border-bottom: 2px solid #eee; padding-bottom: 0.5rem; margin-top: 2rem;">Usage</h2>

  <ol style="padding-left: 1.5rem;">
    <li style="margin: 0.5rem 0;">Access the web interface at <code style="background: #eee; padding: 0.2rem 0.4rem; border-radius: 3px;">http://localhost:3000</code></li>
    <li style="margin: 0.5rem 0;">Add streams using the format: <code style="background: #eee; padding: 0.2rem 0.4rem; border-radius: 3px;">ping.gg/embed/&lt;id&gt;</code></li>
    <li style="margin: 0.5rem 0;">Start/stop recordings using the interface</li>
    <li style="margin: 0.5rem 0;">Access recorded files in the <code style="background: #eee; padding: 0.2rem 0.4rem; border-radius: 3px;">recordings</code> directory</li>
  </ol>

  <h2 style="color: #333; border-bottom: 2px solid #eee; padding-bottom: 0.5rem; margin-top: 2rem;">Container Management</h2>

  <div style="background: #f8f9fa; padding: 1rem; border-radius: 5px; margin: 1rem 0;">
    <p><strong>View logs:</strong></p>
    <pre style="background: #f6f8fa; padding: 0.5rem; border-radius: 3px;">docker logs stream-recorder</pre>

    <p><strong>Stop container:</strong></p>
    <pre style="background: #f6f8fa; padding: 0.5rem; border-radius: 3px;">docker stop stream-recorder</pre>

    <p><strong>Restart container:</strong></p>
    <pre style="background: #f6f8fa; padding: 0.5rem; border-radius: 3px;">docker restart stream-recorder</pre>

    <p><strong>Remove container:</strong></p>
    <pre style="background: #f6f8fa; padding: 0.5rem; border-radius: 3px;">docker rm -f stream-recorder</pre>
  </div>

  <h2 style="color: #333; border-bottom: 2px solid #eee; padding-bottom: 0.5rem; margin-top: 2rem;">Development Notes</h2>

  <ul style="list-style-type: none; padding-left: 1rem;">
    <li style="margin: 0.5rem 0;">• The <code style="background: #eee; padding: 0.2rem 0.4rem; border-radius: 3px;">recordings</code> directory is mounted as a volume for easy access to recorded files</li>
    <li style="margin: 0.5rem 0;">• Changes to <code style="background: #eee; padding: 0.2rem 0.4rem; border-radius: 3px;">config.json</code> persist between container restarts</li>
    <li style="margin: 0.5rem 0;">• Container runs as non-root user for security</li>
    <li style="margin: 0.5rem 0;">• FFmpeg and Chromium are included in the container for video processing</li>
  </ul>

  <h2 style="color: #333; border-bottom: 2px solid #eee; padding-bottom: 0.5rem; margin-top: 2rem;">Production Notes</h2>

  <ul style="list-style-type: none; padding-left: 1rem;">
    <li style="margin: 0.5rem 0;">• Use a reverse proxy (like Nginx) for SSL termination</li>
    <li style="margin: 0.5rem 0;">• Consider setting up monitoring and alerting</li>
    <li style="margin: 0.5rem 0;">• Regularly backup the config.json and recordings</li>
    <li style="margin: 0.5rem 0;">• Monitor disk space usage for recordings directory</li>
  </ul>

  <h2 style="color: #333; border-bottom: 2px solid #eee; padding-bottom: 0.5rem; margin-top: 2rem;">Troubleshooting</h2>

  <div style="background: #f8f9fa; padding: 1rem; border-radius: 5px; margin: 1rem 0;">
    <p><strong>1. Permission Issues:</strong></p>
    <ul style="list-style-type: none; padding-left: 1rem;">
      <li style="margin: 0.3rem 0;">• Ensure the mounted volumes have correct permissions</li>
      <li style="margin: 0.3rem 0;">• The container runs as non-root user (node)</li>
    </ul>

    <p><strong>2. Recording Failures:</strong></p>
    <ul style="list-style-type: none; padding-left: 1rem;">
      <li style="margin: 0.3rem 0;">• Check container logs for errors</li>
      <li style="margin: 0.3rem 0;">• Verify stream URL is accessible</li>
      <li style="margin: 0.3rem 0;">• Ensure sufficient disk space</li>
    </ul>

    <p><strong>3. Performance Issues:</strong></p>
    <ul style="list-style-type: none; padding-left: 1rem;">
      <li style="margin: 0.3rem 0;">• Monitor container resource usage</li>
      <li style="margin: 0.3rem 0;">• Adjust video quality settings in config.json</li>
      <li style="margin: 0.3rem 0;">• Consider cleanup strategy for old recordings</li>
    </ul>
  </div>

  <h2 style="color: #333; border-bottom: 2px solid #eee; padding-bottom: 0.5rem; margin-top: 2rem;">Security Considerations</h2>

  <ul style="list-style-type: none; padding-left: 1rem;">
    <li style="margin: 0.5rem 0;">• Container runs as non-root user</li>
    <li style="margin: 0.5rem 0;">• Sensitive ports are not exposed except 3000</li>
    <li style="margin: 0.5rem 0;">• Use reverse proxy for production deployments</li>
    <li style="margin: 0.5rem 0;">• Regularly update base images and dependencies</li>
  </ul>

</div>
