import { launch, getStream, wss } from 'puppeteer-stream';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const RECORDINGS_DIR = path.join(__dirname, '..', '..', 'recordings');

// Ensure recordings directory exists
fs.mkdirSync(RECORDINGS_DIR, { recursive: true });

export interface StreamRecorderOptions {
    url: string;
    onStatusChange?: (status: string) => void;
    onError?: (error: Error) => void;
}

export class StreamRecorder {
    private browser: any;
    private page: any;
    private stream: any;
    private file: fs.WriteStream | null = null;
    private isRecording: boolean = false;
    private url: string;
    private onStatusChange?: (status: string) => void;
    private onError?: (error: Error) => void;

    constructor(options: StreamRecorderOptions) {
        this.url = options.url;
        this.onStatusChange = options.onStatusChange;
        this.onError = options.onError;
    }

    private updateStatus(status: string) {
        console.log(`[StreamRecorder] ${status}`);
        this.onStatusChange?.(status);
    }

    async start() {
        if (this.isRecording) return;

        try {
            this.updateStatus("Starting browser...");
            
            // Simplified launch configuration matching the docs
            this.browser = await launch({
                executablePath: process.platform === 'darwin' 
                    ? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
                    : undefined,
                defaultViewport: {
                    width: 1920,
                    height: 1080,
                },
                headless: "new"
            });

            this.page = await this.browser.newPage();
            
            this.updateStatus("Navigating to stream...");
            await this.page.goto(this.url, {
                waitUntil: 'networkidle0',
                timeout: 60000
            });

            const timestamp = new Date().toISOString()
                .replace(/[:.]/g, '-')
                .replace('T', '_')
                .slice(0, -5);
            
            const outputPath = path.join(RECORDINGS_DIR, `stream_${timestamp}.webm`);
            this.file = fs.createWriteStream(outputPath);

            this.updateStatus("Setting up stream capture...");

            // Simplified stream configuration matching the docs
            this.stream = await getStream(this.page, { 
                audio: true, 
                video: true
            });

            // Add error handlers
            this.stream.on('error', (error: Error) => {
                console.error('[StreamRecorder] Stream error:', error);
                this.onError?.(error);
            });

            this.file.on('error', (error: Error) => {
                console.error('[StreamRecorder] File write error:', error);
                this.onError?.(error);
            });
            
            this.stream.pipe(this.file);
            this.isRecording = true;
            this.updateStatus("Recording started");

        } catch (error) {
            console.error('[StreamRecorder] Start error:', error);
            this.onError?.(error as Error);
            this.updateStatus("Error starting recording");
            await this.stop();
        }
    }

    async stop() {
        if (!this.isRecording) return;

        try {
            this.updateStatus("Stopping recording...");
            this.isRecording = false;

            if (this.stream) {
                await this.stream.destroy();
            }

            if (this.file) {
                this.file.end();
            }

            if (this.browser) {
                await this.browser.close();
            }

            await wss.then(ws => ws.close());
            this.updateStatus("Recording stopped");

        } catch (error) {
            console.error('[StreamRecorder] Stop error:', error);
            this.onError?.(error as Error);
            this.updateStatus("Error stopping recording");
        }
    }

    isActive(): boolean {
        return this.isRecording;
    }
} 