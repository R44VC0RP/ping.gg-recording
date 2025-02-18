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
    private outputFile: string | null = null;

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
            this.browser = await launch({
                executablePath: process.platform === 'darwin' 
                    ? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
                    : undefined,
                defaultViewport: {
                    width: 1920,
                    height: 1080,
                },
                headless: "new",
                args: [
                    '--autoplay-policy=no-user-gesture-required',
                    '--use-fake-ui-for-media-stream',
                    '--no-sandbox',
                    '--enable-audio-autoplay'
                ]
            });

            this.page = await this.browser.newPage();
            
            // Enable permissions before navigation
            const context = this.browser.defaultBrowserContext();
            await context.overridePermissions(this.url, ['microphone', 'camera']);
            await this.page.setBypassCSP(true);

            this.updateStatus("Navigating to stream...");
            await this.page.goto(this.url, {
                waitUntil: 'networkidle0',
                timeout: 60000
            });

            // Enable audio in iframes
            await this.page.evaluate(() => {
                const iframes = document.querySelectorAll('iframe');
                iframes.forEach(iframe => {
                    iframe.allow = 'autoplay; microphone; camera';
                    iframe.removeAttribute('muted');
                });
            });

            // Wait a bit for audio to initialize
            await new Promise(resolve => setTimeout(resolve, 1000));

            const timestamp = new Date().toISOString()
                .replace(/[:.]/g, '-')
                .replace('T', '_')
                .slice(0, -5);
            
            this.outputFile = path.join(RECORDINGS_DIR, `stream_${timestamp}.webm`);
            this.file = fs.createWriteStream(this.outputFile);

            this.updateStatus("Setting up stream capture...");

            this.stream = await getStream(this.page, { 
                audio: true, 
                video: true,
                mimeType: 'video/webm;codecs=vp9,opus',
                audioBitsPerSecond: 192000,
                videoBitsPerSecond: 8000000
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
            this.updateStatus("Recording started with audio enabled");

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
                // Wait for the file to finish writing
                await new Promise<void>((resolve) => {
                    if (this.file) {
                        this.file.on('finish', () => {
                            console.log('[StreamRecorder] File write completed');
                            resolve();
                        });
                    } else {
                        resolve();
                    }
                });
            }

            if (this.browser) {
                await this.browser.close();
            }

            // Close the WebSocket server
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