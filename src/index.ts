import { launch, getStream, wss } from 'puppeteer-stream';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const RECORDINGS_DIR = path.join(__dirname, '..', 'recordings');

// Ensure recordings directory exists
fs.mkdirSync(RECORDINGS_DIR, { recursive: true });

async function main() {
    console.log("🚀 Starting Stream Recorder");
    console.log(`⏰ Current time: ${new Date().toISOString()}`);

    const outputFile = path.join(RECORDINGS_DIR, `stream_${Date.now()}.webm`);
    const file = fs.createWriteStream(outputFile);

    try {
        const browser = await launch({
            executablePath: process.platform === 'darwin' 
                ? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
                : undefined,
            defaultViewport: {
                width: 1920,
                height: 1080,
            },
            headless: "new"
        });

        const page = await browser.newPage();
        console.log("🌐 Navigating to stream page...");
        
        await page.goto("https://ping.gg/embed/nm7dw2hhi4", {
            waitUntil: 'networkidle0',
            timeout: 60000
        });
        console.log("✅ Loaded stream page");

        console.log("🎥 Setting up stream capture...");
        const stream = await getStream(page, { 
            audio: true, 
            video: true,
            audioBitsPerSecond: 192000,  // 192 kbps
            videoBitsPerSecond: 8000000  // 8 Mbps
        });
        
        console.log("▶️ Started recording");
        stream.pipe(file);

        // Record for 10 seconds
        await new Promise(resolve => setTimeout(resolve, 10000));

        console.log("⏹️ Stopping recording...");
        await stream.destroy();
        file.close();
        console.log(`✅ Recording saved to: ${outputFile}`);

        await browser.close();
        (await wss).close();

    } catch (error) {
        console.error("❌ Error:", error);
        file.close();
    }
    
    console.log("\n🎬 Recording session completed!");
    console.log(`⏰ End time: ${new Date().toISOString()}`);
}

main().catch(console.error); 