import express from 'express';
import { launch, getStream } from 'puppeteer-stream';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);
const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const port = 3000;

// Load config
const CONFIG_PATH = join(__dirname, 'config.json');
let config = { streams: [], settings: {} };

try {
    config = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
} catch (error) {
    // If config doesn't exist, create it with defaults
    config = {
        streams: [],
        settings: {
            recordingsPath: "recordings",
            defaultVideoQuality: {
                width: 1920,
                height: 1080,
                videoBitrate: 8000000,
                audioBitrate: 192000
            }
        }
    };
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 4));
}

// Create recordings directory if it doesn't exist
const RECORDINGS_DIR = join(__dirname, config.settings.recordingsPath);
fs.mkdirSync(RECORDINGS_DIR, { recursive: true });

// Store active recorders
const recorders = new Map();

app.use(express.json());
app.use(express.static(__dirname));

// Get saved streams
app.get('/config', (req, res) => {
    res.json(config);
});

// Save stream to config
app.post('/config/streams', (req, res) => {
    const { url, name } = req.body;
    const stream = {
        id: Date.now().toString(),
        url,
        name: name || url,
        addedAt: new Date().toISOString()
    };
    
    config.streams.push(stream);
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 4));
    
    res.json(stream);
});

// Delete stream from config
app.delete('/config/streams/:id', (req, res) => {
    const { id } = req.params;
    config.streams = config.streams.filter(s => s.id !== id);
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 4));
    res.json({ success: true });
});

// Add function to get video metadata
async function getVideoMetadata(filePath) {
    try {
        const { stdout } = await execAsync(`ffprobe -v quiet -print_format json -show_format -show_streams "${filePath}"`);
        const metadata = JSON.parse(stdout);
        
        const videoStream = metadata.streams.find(s => s.codec_type === 'video');
        const audioStream = metadata.streams.find(s => s.codec_type === 'audio');
        
        return {
            duration: parseFloat(metadata.format.duration),
            size: parseInt(metadata.format.size),
            bitrate: parseInt(metadata.format.bit_rate),
            format: metadata.format.format_name,
            video: videoStream ? {
                codec: videoStream.codec_name,
                width: videoStream.width,
                height: videoStream.height,
                fps: eval(videoStream.r_frame_rate),
                bitrate: parseInt(videoStream.bit_rate)
            } : null,
            audio: audioStream ? {
                codec: audioStream.codec_name,
                channels: audioStream.channels,
                sampleRate: parseInt(audioStream.sample_rate),
                bitrate: parseInt(audioStream.bit_rate)
            } : null
        };
    } catch (error) {
        console.error('Error getting video metadata:', error);
        return null;
    }
}

// Add metadata handling functions
async function getMetadataPath(filename) {
    return join(RECORDINGS_DIR, `${filename}.meta.json`);
}

async function loadMetadata(filename) {
    const metaPath = await getMetadataPath(filename);
    try {
        const data = await fs.promises.readFile(metaPath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        return null;
    }
}

async function saveMetadata(filename, metadata) {
    const metaPath = await getMetadataPath(filename);
    await fs.promises.writeFile(metaPath, JSON.stringify(metadata, null, 2));
}

// Update the recordings endpoint to include custom metadata
app.get('/recordings', async (req, res) => {
    try {
        const files = await Promise.all(
            fs.readdirSync(RECORDINGS_DIR)
                .filter(file => file.endsWith('.webm'))
                .map(async file => {
                    const filePath = join(RECORDINGS_DIR, file);
                    const stats = fs.statSync(filePath);
                    const technicalMetadata = await getVideoMetadata(filePath);
                    const customMetadata = await loadMetadata(file);
                    
                    const metadata = {
                        ...technicalMetadata,
                        ...(customMetadata || {}),
                    };
                    
                    return {
                        name: file,
                        size: stats.size,
                        createdAt: stats.birthtime,
                        url: `/recordings/${file}`,
                        metadata,
                        mp4Url: `/recordings/${file.replace('.webm', '.mp4')}`
                    };
                })
        );
        
        res.json(files.sort((a, b) => b.createdAt - a.createdAt));
    } catch (error) {
        console.error('Error listing recordings:', error);
        res.status(500).json({ error: error.message });
    }
});

// Add endpoint for updating metadata
app.post('/recordings/:filename/metadata', async (req, res) => {
    try {
        const { filename } = req.params;
        const filePath = join(RECORDINGS_DIR, filename);
        
        // Check if file exists and is within recordings directory
        if (!fs.existsSync(filePath) || !filePath.startsWith(RECORDINGS_DIR)) {
            return res.status(404).json({ error: 'Recording not found' });
        }

        const existingMetadata = await loadMetadata(filename) || {};
        const technicalMetadata = await getVideoMetadata(filePath);
        const newMetadata = {
            ...technicalMetadata,
            ...existingMetadata,
            ...req.body,
            updatedAt: new Date().toISOString()
        };
        
        await saveMetadata(filename, newMetadata);
        res.json({ success: true, metadata: newMetadata });
    } catch (error) {
        console.error('Error updating metadata:', error);
        res.status(500).json({ error: error.message });
    }
});

// Update delete endpoint to also remove metadata file
app.delete('/recordings/:filename', async (req, res) => {
    try {
        const { filename } = req.params;
        const filePath = join(RECORDINGS_DIR, filename);
        const metaPath = await getMetadataPath(filename);
        
        // Check if file exists and is within recordings directory
        if (!fs.existsSync(filePath) || !filePath.startsWith(RECORDINGS_DIR)) {
            return res.status(404).json({ error: 'Recording not found' });
        }
        
        // Delete both the recording and its metadata
        fs.unlinkSync(filePath);
        if (fs.existsSync(metaPath)) {
            fs.unlinkSync(metaPath);
        }
        
        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting recording:', error);
        res.status(500).json({ error: error.message });
    }
});

// Add endpoint for MP4 conversion
app.get('/recordings/:filename/convert', async (req, res) => {
    try {
        const { filename } = req.params;
        const webmPath = join(RECORDINGS_DIR, filename);
        const mp4Path = join(RECORDINGS_DIR, filename.replace('.webm', '.mp4'));
        
        // Check if file exists and is within recordings directory
        if (!fs.existsSync(webmPath) || !webmPath.startsWith(RECORDINGS_DIR)) {
            return res.status(404).json({ error: 'Recording not found' });
        }
        
        // Check if MP4 already exists
        if (fs.existsSync(mp4Path)) {
            return res.json({ url: `/recordings/${filename.replace('.webm', '.mp4')}` });
        }
        
        // Convert to MP4 using high quality settings
        await execAsync(`ffmpeg -i "${webmPath}" -c:v libx264 -preset slow -crf 17 -c:a aac -b:a 192k "${mp4Path}"`);
        
        res.json({ url: `/recordings/${filename.replace('.webm', '.mp4')}` });
    } catch (error) {
        console.error('Error converting to MP4:', error);
        res.status(500).json({ error: error.message });
    }
});

// Serve recordings directory
app.use('/recordings', express.static(RECORDINGS_DIR));

// Add logging utility
function log(message, data = {}) {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${message}`, data);
}

app.post('/start', async (req, res) => {
    const startTime = Date.now();
    try {
        const { url } = req.body;
        const streamId = Date.now().toString();
        log(`Starting recording for stream ${streamId}`, { url });
        
        // Find the stream name from config
        const stream = config.streams.find(s => s.url === url);
        const streamName = stream ? stream.name : 'unnamed_stream';
        
        // Format the timestamp
        const timestamp = new Date().toISOString()
            .replace(/[:.]/g, '-')
            .replace('T', '_')
            .slice(0, -5);
        
        const safeStreamName = streamName.toLowerCase()
            .replace(/[^a-z0-9]/g, '_')
            .replace(/_+/g, '_')
            .replace(/^_|_$/g, '');

        const outputFile = join(RECORDINGS_DIR, `${safeStreamName}_${timestamp}.webm`);
        log(`Creating output file`, { outputFile });
        const fileStream = fs.createWriteStream(outputFile);

        log('Launching browser...');
        const browser = await launch({
            executablePath: process.platform === 'darwin' 
                ? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
                : undefined,
            defaultViewport: {
                width: config.settings.defaultVideoQuality.width,
                height: config.settings.defaultVideoQuality.height,
            },
            headless: "new"
        });

        log('Opening page and navigating to URL...');
        const page = await browser.newPage();
        await page.goto(url, {
            waitUntil: 'networkidle0',
            timeout: 60000
        });

        log('Setting up media stream...');
        const mediaStream = await getStream(page, { 
            audio: true, 
            video: true,
            audioBitsPerSecond: config.settings.defaultVideoQuality.audioBitrate,
            videoBitsPerSecond: config.settings.defaultVideoQuality.videoBitrate
        });

        // Add error handlers
        mediaStream.on('error', (error) => {
            log('Media stream error:', { error: error.message });
        });

        fileStream.on('error', (error) => {
            log('File stream error:', { error: error.message });
        });

        fileStream.on('finish', () => {
            log('File stream finished', { streamId });
        });

        mediaStream.pipe(fileStream);
        log('Started piping media stream to file');

        recorders.set(streamId, {
            browser,
            stream: mediaStream,
            fileStream,
            url,
            startTime,
            outputFile,
            streamName: safeStreamName,
            page
        });

        log(`Recording started successfully`, { 
            streamId, 
            duration: Date.now() - startTime 
        });
        res.json({ streamId });
    } catch (error) {
        log('Error starting recording:', { 
            error: error.message, 
            stack: error.stack,
            duration: Date.now() - startTime 
        });
        res.status(500).json({ error: error.message });
    }
});

// Get recording status
app.get('/status/:streamId', (req, res) => {
    const { streamId } = req.params;
    const recorder = recorders.get(streamId);
    
    if (!recorder) {
        return res.status(404).json({ error: 'Recording not found' });
    }
    
    const duration = Date.now() - recorder.startTime;
    const fileSize = fs.statSync(recorder.outputFile).size;
    
    res.json({
        streamId,
        url: recorder.url,
        duration,
        fileSize,
        isRecording: true
    });
});

app.post('/stop', async (req, res) => {
    const stopTime = Date.now();
    try {
        const { streamId } = req.body;
        log(`Stopping recording for stream ${streamId}`);
        
        // Add debug logging for recorders Map
        log(`Current active recorders:`, { 
            recorderIds: Array.from(recorders.keys()),
            requestedId: streamId
        });
        
        const recorder = recorders.get(streamId);
        if (!recorder) {
            log(`No recorder found for stream ${streamId}`, {
                availableRecorders: Array.from(recorders.keys())
            });
            return res.status(404).json({ error: 'Recording not found' });
        }

        const { browser, stream, fileStream, page, startTime } = recorder;
        
        try {
            log('Stopping media stream...');
            if (stream) {
                stream.unpipe(fileStream);
                await stream.destroy();
                log('Media stream destroyed');
            }

            log('Waiting for buffered data...');
            await new Promise(resolve => setTimeout(resolve, 1000));

            log('Closing file stream...');
            if (fileStream) {
                fileStream.end();
                await new Promise((resolve, reject) => {
                    fileStream.on('finish', () => {
                        log('File stream finished and closed');
                        resolve();
                    });
                    fileStream.on('error', reject);
                });
            }

            log('Closing page and browser...');
            if (page) await page.close();
            if (browser) await browser.close();
            log('Browser closed');
            
            recorders.delete(streamId);
            
            const duration = stopTime - startTime;
            log(`Recording stopped successfully`, { 
                streamId, 
                duration,
                fileSize: fs.statSync(recorder.outputFile).size
            });
            
            res.json({ 
                success: true,
                duration,
                outputFile: recorder.outputFile
            });
        } catch (error) {
            log('Error during stop process, attempting cleanup...', { error: error.message });
            try {
                if (stream) stream.unpipe(fileStream);
                if (page) await page.close();
                if (browser) await browser.close();
                if (fileStream) fileStream.end();
                recorders.delete(streamId);
                log('Cleanup completed after error');
            } catch (cleanupError) {
                log('Error during cleanup:', { error: cleanupError.message });
            }
            throw error;
        }
    } catch (error) {
        log('Error stopping recording:', { 
            error: error.message, 
            stack: error.stack,
            duration: Date.now() - stopTime 
        });
        res.status(500).json({ error: error.message });
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
}); 