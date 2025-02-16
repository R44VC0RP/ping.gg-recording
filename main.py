import asyncio
import subprocess
from playwright.async_api import async_playwright
from datetime import datetime
import json
import websockets
import base64
import tempfile
import os

# List of Ping.gg stream URLs
stream_links = [
    "https://ping.gg/embed/nm7dw2hhi4",
]

async def get_websocket_url(page, url):
    """Extract the Ably WebSocket URL from the page"""
    print(f"🌐 Navigating to stream URL: {url}")
    
    websocket_url = None
    websocket_messages = []
    
    async def handle_websocket(ws):
        nonlocal websocket_url
        print(f"🔌 WebSocket connection detected: {ws.url}")
        
        # Only capture Ably websocket
        if "realtime.ably.io" in ws.url:
            websocket_url = ws.url
            # Listen to WebSocket messages
            ws.on("framereceived", lambda data: websocket_messages.append(data))
    
    # Listen for WebSocket connections
    page.on("websocket", handle_websocket)
    
    # Navigate to the page and wait for WebSocket
    await page.goto(url, wait_until="networkidle")
    print("⏳ Waiting for Ably WebSocket connection...")
    
    # Wait for the video player to ensure WebSocket is established
    try:
        await page.wait_for_selector(".agora_video_player", timeout=10000)
        await asyncio.sleep(2)  # Give WebSocket time to connect
        
        if websocket_url and "realtime.ably.io" in websocket_url:
            print("✅ Ably WebSocket URL captured")
            print(f"📨 Received {len(websocket_messages)} initial WebSocket messages")
            # Print first few messages for debugging
            for msg in websocket_messages[:3]:
                try:
                    decoded = json.loads(msg)
                    print(f"📝 Message type: {type(decoded)}")
                    print(f"📝 Message keys: {decoded.keys() if isinstance(decoded, dict) else 'Not a dict'}")
                except:
                    print(f"📝 Raw message: {msg[:100]}...")
            return websocket_url
        else:
            print("❌ No Ably WebSocket connection found")
            return None
            
    except Exception as e:
        print(f"❌ Error while waiting for WebSocket: {str(e)}")
        return None

async def record_websocket_stream(index, ws_url):
    """Record the WebSocket stream data"""
    if not ws_url:
        print(f"❌ Cannot start recording {index} - No valid WebSocket URL")
        return None
        
    output_file = f"recording_{index}.mp4"
    temp_file = os.path.join(tempfile.gettempdir(), f"stream_{index}.raw")
    print(f"🎥 Starting recording for stream {index} -> {output_file}")
    
    try:
        async with websockets.connect(ws_url) as websocket:
            print(f"📡 Connected to WebSocket stream {index}")
            
            # Create a temporary file to store raw stream data
            with open(temp_file, "wb") as f:
                start_time = datetime.now()
                duration = 10  # seconds
                message_count = 0
                data_chunks = 0
                
                while (datetime.now() - start_time).seconds < duration:
                    try:
                        message = await websocket.recv()
                        message_count += 1
                        
                        if message_count <= 3:  # Debug first 3 messages
                            print(f"📨 Message {message_count}: {message[:100]}...")
                        
                        data = json.loads(message)
                        
                        # Look for video/audio data in the message
                        if "messages" in data:
                            for msg in data["messages"]:
                                if "data" in msg and isinstance(msg["data"], str):
                                    try:
                                        # Decode base64 data if present
                                        binary_data = base64.b64decode(msg["data"])
                                        f.write(binary_data)
                                        data_chunks += 1
                                        if data_chunks % 10 == 0:  # Log every 10 chunks
                                            print(f"📦 Processed {data_chunks} data chunks")
                                    except Exception as e:
                                        print(f"⚠️ Failed to decode data: {str(e)}")
                                        continue
                                        
                    except websockets.exceptions.ConnectionClosed:
                        print("❌ WebSocket connection closed")
                        break
                    except Exception as e:
                        print(f"⚠️ Error processing message: {str(e)}")
                        continue
                
                print(f"📊 Processed {message_count} messages, {data_chunks} data chunks")
            
            if data_chunks == 0:
                print("❌ No valid data chunks were recorded")
                if os.path.exists(temp_file):
                    os.remove(temp_file)
                return None
            
            # Convert raw data to MP4
            cmd = [
                "ffmpeg",
                "-i", temp_file,
                "-c:v", "libx264",
                "-preset", "ultrafast",
                "-b:v", "4500k",
                "-r", "30",
                "-c:a", "aac",
                "-b:a", "192k",
                "-y", output_file
            ]
            
            process = subprocess.Popen(cmd, stderr=subprocess.PIPE)
            print(f"✅ Converting stream {index} to MP4")
            process.wait()
            
            # Clean up temp file
            os.remove(temp_file)
            return True
            
    except Exception as e:
        print(f"❌ Error recording WebSocket stream: {str(e)}")
        if os.path.exists(temp_file):
            os.remove(temp_file)
        return None

async def main():
    print("🚀 Starting Ping.gg Stream Recorder")
    print(f"⏰ Current time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"📋 Found {len(stream_links)} streams to record")
    
    async with async_playwright() as p:
        print("🌐 Launching browser...")
        browser = await p.chromium.launch(
            headless=True,
            args=['--no-sandbox', '--disable-setuid-sandbox']
        )
        context = await browser.new_context()
        page = await context.new_page()

        recordings = []
        for i, link in enumerate(stream_links):
            print(f"\n📺 Processing stream {i+1}/{len(stream_links)}")
            ws_url = await get_websocket_url(page, link)
            print(f"🔗 WebSocket URL {i}: {ws_url}")

            # Start recording
            success = await record_websocket_stream(i, ws_url)
            if success:
                recordings.append(i)

        if not recordings:
            print("❌ No recordings were completed successfully")
        else:
            print(f"✅ Successfully recorded {len(recordings)} streams")

        await browser.close()
        print("\n🎬 Recording session completed!")
        print(f"⏰ End time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print("📁 Check your recordings in the current directory")

asyncio.run(main())
