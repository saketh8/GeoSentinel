import os
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
import json
import asyncio
from typing import Any
from datetime import datetime, timedelta
import httpx
from agent import GeminiLiveAgent
from dotenv import load_dotenv

load_dotenv()

AVIATIONSTACK_API_KEY = os.getenv("AVIATIONSTACK_API_KEY")

app = FastAPI(title="GeoSentinel 4D API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Simple in-memory cache for live APIs to avoid rate limits
cache: dict[str, dict[str, Any]] = {
    "earthquakes": {"data": None, "timestamp": datetime.min},
    "flights": {"data": None, "timestamp": datetime.min},
    "wildfires": {"data": None, "timestamp": datetime.min},
    "infrastructure": {"data": None, "timestamp": datetime.min},
    "sanctions": {"data": None, "timestamp": datetime.min}
}
CACHE_TTL = 60  # seconds

@app.get("/")
def read_root():
    return {"status": "online", "service": "GeoSentinel 4D Live Agent"}

@app.get("/api/earthquakes")
async def get_earthquakes():
    now = datetime.now()
    if cache["earthquakes"]["data"] is not None:
        ts = cache["earthquakes"]["timestamp"]
        if isinstance(ts, datetime) and (now - ts).total_seconds() < CACHE_TTL:
            return cache["earthquakes"]["data"]
            
    async with httpx.AsyncClient() as client:
        try:
            resp = await client.get("https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_day.geojson", timeout=10)
            if resp.status_code == 200:
                data = resp.json()
                cache["earthquakes"]["data"] = data
                cache["earthquakes"]["timestamp"] = now
                return data
        except Exception as e:
            print(f"Error fetching earthquakes: {e}")
    
    return cache["earthquakes"]["data"] or {"features": []}

async def fetch_aviationstack_flights(client: httpx.AsyncClient) -> list:
    if not AVIATIONSTACK_API_KEY:
        return []
    try:
        # Fetch active flights with live data
        url = f"http://api.aviationstack.com/v1/flights?access_key={AVIATIONSTACK_API_KEY}&flight_status=active&limit=50"
        resp = await client.get(url, timeout=10)
        if resp.status_code == 200:
            data = resp.json()
            flights = data.get("data", [])
            normalized = []
            for f in flights:
                live = f.get("live")
                if not live:
                    continue
                
                # Map to OpenSky format: 
                # [ icao24, callsign, origin_country, time_position, last_contact, longitude, latitude, baro_altitude, on_ground, velocity, true_track, vertical_rate, sensors, geo_altitude, squawk, spi, position_source ]
                state = [
                    f.get("aircraft", {}).get("icao24") or f.get("flight", {}).get("icao") or "UNK",
                    f.get("flight", {}).get("icao") or "UNK",
                    f.get("departure", {}).get("airport") or "Unknown",
                    int(datetime.now().timestamp()), # time_position
                    int(datetime.now().timestamp()), # last_contact
                    live.get("longitude"),
                    live.get("latitude"),
                    live.get("altitude"),
                    live.get("is_ground", False),
                    live.get("speed_horizontal"),
                    live.get("direction"),
                    live.get("speed_vertical"),
                    None, # sensors
                    live.get("altitude"), # geo_altitude
                    None, # squawk
                    False, # spi
                    1 # position_source (1 for ADS-B/High-fidelity)
                ]
                normalized.append(state)
            return normalized
    except Exception as e:
        print(f"Error fetching AviationStack: {e}")
    return []

@app.get("/api/flights")
async def get_flights():
    now = datetime.now()
    if cache["flights"]["data"]:
        ts = cache["flights"]["timestamp"]
        if isinstance(ts, datetime) and (now - ts).total_seconds() < 120:
            return cache["flights"]["data"]
            
    async with httpx.AsyncClient() as client:
        # Parallel fetch from both sources
        try:
            opensky_task = client.get("https://opensky-network.org/api/states/all", timeout=10)
            avstack_task = fetch_aviationstack_flights(client)
            
            os_resp, av_states = await asyncio.gather(opensky_task, avstack_task)
            
            combined_states = av_states
            if os_resp.status_code == 200:
                os_data = os_resp.json()
                combined_states.extend(os_data.get("states", []) or [])
                
            data = {"states": combined_states}
            cache["flights"]["data"] = data
            cache["flights"]["timestamp"] = now
            return data
        except Exception as e:
            print(f"Error fetching flights: {e}")
            
    return cache["flights"]["data"] or {"states": []}

@app.websocket("/ws/agent")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    
    agent = GeminiLiveAgent()
    try:
        await agent.connect()
        print("Agent connection established.")
    except Exception as e:
        print(f"Error connecting to Gemini agent: {e}")
        await websocket.send_text(json.dumps({
            "type": "text",
            "content": "⚠ Could not connect to Gemini Live API."
        }))
        await asyncio.sleep(3)
        await websocket.close()
        return

    try:
        async def receive_from_client():
            try:
                while True:
                    data = await websocket.receive()
                    if data.get("type") == "websocket.disconnect":
                        break
                    if "bytes" in data and data["bytes"]:
                        await agent.send_audio(data["bytes"])
                    elif "text" in data and data["text"]:
                        try:
                            msg = json.loads(data["text"])
                            if msg.get("type") == "text_query":
                                text = msg.get("content", "")
                                if text:
                                    print(f"Forwarding text query: {text}")
                                    await agent.send_text(text)
                        except json.JSONDecodeError:
                            pass
            except WebSocketDisconnect:
                print("Client disconnected.")
            except Exception as e:
                print(f"Error reading from client: {e}")

        async def send_to_client():
            try:
                async for msg in agent.receive_stream():
                    try:
                        if "audio" in msg:
                            await websocket.send_bytes(msg["audio"])
                        if "text" in msg:
                            await websocket.send_text(json.dumps({"type": "text", "content": msg["text"]}))
                        if "brief" in msg:
                            await websocket.send_text(json.dumps({"type": "brief", "content": msg["brief"]}))
                        if "globe_action" in msg:
                            await websocket.send_text(json.dumps({"type": "globe_action", "content": msg["globe_action"]}))
                        if "news" in msg:
                            await websocket.send_text(json.dumps({"type": "news", "content": msg["news"]}))
                    except Exception as e:
                        print(f"Error sending to client: {e}")
                        break
            except Exception as e:
                print(f"Error reading from agent stream: {e}")

        done, pending = await asyncio.wait(
            [
                asyncio.create_task(receive_from_client()),
                asyncio.create_task(send_to_client()),
            ],
            return_when=asyncio.FIRST_COMPLETED,
        )
        for task in pending:
            task.cancel()

    except Exception as e:
        print(f"WebSocket handler error: {e}")
    finally:
        print("WebSocket disconnected, cleaning up.")
        await agent.close()

@app.get("/api/wildfires")
async def get_wildfires():
    now = datetime.now()
    if cache["wildfires"]["data"] is not None:
        ts = cache["wildfires"]["timestamp"]
        if isinstance(ts, datetime) and (now - ts).total_seconds() < 300:
            return cache["wildfires"]["data"]
        
    wildfire_data = [
        {"id": 1, "lat": -15.0, "lon": -55.0, "intensity": 80, "label": "Amazon Cluster"},
        {"id": 2, "lat": -33.0, "lon": 150.0, "intensity": 95, "label": "NSW Outbreak"},
        {"id": 3, "lat": 38.0, "lon": 23.0, "intensity": 70, "label": "Attica Fire"},
        {"id": 4, "lat": 34.0, "lon": -118.0, "intensity": 60, "label": "SoCal Alert"},
        {"id": 5, "lat": 1.0, "lon": 114.0, "intensity": 85, "label": "Borneo Hotspot"}
    ]
    cache["wildfires"]["data"] = wildfire_data
    cache["wildfires"]["timestamp"] = now
    return wildfire_data

@app.get("/api/infrastructure")
async def get_infrastructure():
    outages = [
        {"id": "out-1", "name": "Beirut Grid Failure", "lat": 33.89, "lon": 35.50, "type": "POWER", "status": "CRITICAL"},
        {"id": "out-2", "name": "Lagos Fiber Cut", "lat": 6.52, "lon": 3.37, "type": "INTERNET", "status": "MODERATE"},
        {"id": "out-3", "name": "Kyiv Energy Alert", "lat": 50.45, "lon": 30.52, "type": "POWER", "status": "STABLE"},
        {"id": "out-4", "name": "Taipei Subsea Cable", "lat": 25.03, "lon": 121.56, "type": "INTERNET", "status": "HEALING"}
    ]
    return outages

@app.get("/api/sanctions")
async def get_sanctions():
    # Simulated OSINT for global financial sanctions / asset freezes
    sanctions = [
        {"id": "snc-1", "target": "VTB Bank", "lat": 55.75, "lon": 37.61, "type": "FINANCIAL", "level": "CRITICAL"},
        {"id": "snc-2", "target": "Energy Corp X", "lat": 35.68, "lon": 51.38, "type": "ENERGY", "level": "HIGH"},
        {"id": "snc-3", "target": "High-Tech Log", "lat": 22.31, "lon": 114.16, "type": "TRADE", "level": "MEDIUM"},
        {"id": "snc-4", "target": "Mining Assets", "lat": -12.04, "lon": -77.04, "type": "MINING", "level": "MEDIUM"}
    ]
    return sanctions

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
