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
    "sanctions": {"data": None, "timestamp": datetime.min},
    "news_global": {"data": None, "timestamp": datetime.min},
    "tension": {"data": None, "timestamp": datetime.min}
}
CACHE_TTL = 60  # seconds

@app.get("/")
def read_root():
    return {"status": "online", "service": "GeoSentinel Live Intelligence Node"}

@app.get("/api/news/global")
async def get_global_news():
    now = datetime.now()
    if cache["news_global"]["data"] is not None:
        ts = cache["news_global"]["timestamp"]
        if (now - ts).total_seconds() < 300: # 5 min cache
            return cache["news_global"]["data"]
            
    async with httpx.AsyncClient() as client:
        try:
            # GDELT Global Crisis Query
            url = "https://api.gdeltproject.org/api/v2/doc/doc"
            params = {
                "query": "world news sourcelang:eng",
                "mode": "artlist",
                "maxrecords": "30",
                "format": "json",
                "sort": "DateDesc"
            }
            resp = await client.get(url, params=params, timeout=15)
            print(f"GDELT Status: {resp.status_code}")
            if resp.status_code == 200:
                try:
                    raw_data = resp.json()
                    data = raw_data.get("articles", [])
                    print(f"GDELT Articles Found: {len(data)}")
                except Exception as je:
                    print(f"JSON Parse Error: {je} | Raw: {resp.text[:100]}")
                    data = []
                normalized = [
                    {
                        "title": a.get("title", ""),
                        "url": a.get("url", ""),
                        "source": a.get("domain", ""),
                        "date": a.get("seendate", ""),
                        "image": a.get("socialimage", ""),
                        "tone": a.get("tone", 0),
                    }
                    for a in data
                ]
                cache["news_global"]["data"] = normalized
                cache["news_global"]["timestamp"] = now
                return normalized
        except Exception as e:
            print(f"Error fetching global news: {e}")
            
    return cache["news_global"]["data"] or []

@app.get("/api/intelligence/tension")
async def get_tension_scores():
    """Calculates global tension scores dynamically from the current news feed."""
    now = datetime.now()
    if cache["tension"]["data"] is not None:
        ts = cache["tension"]["timestamp"]
        if (now - ts).total_seconds() < 300: # 5 min cache
            return cache["tension"]["data"]
            
    # Fetch latest news first
    news = await get_global_news()
    if not news:
        return {}

    # Common countries and regions for organic mapping
    countries = {
        "Ukraine": "Ukraine", "Russia": "Russia", "Israel": "Israel", "Palestine": "Israel", 
        "Gaza": "Israel", "Iran": "Iran", "Iraq": "Iraq", "Syria": "Syria", "Lebanon": "Lebanon",
        "China": "China", "Taiwan": "Taiwan", "USA": "United States of America", 
        "United States": "United States of America", "UK": "United Kingdom", "Britain": "United Kingdom",
        "France": "France", "Germany": "Germany", "Poland": "Poland", "North Korea": "North Korea",
        "South Korea": "South Korea", "Japan": "Japan", "India": "India", "Pakistan": "Pakistan",
        "Sudan": "Sudan", "Ethiopia": "Ethiopia", "Haiti": "Haiti", "Mexico": "Mexico",
        "Brazil": "Brazil", "Venezuela": "Venezuela", "Guyana": "Guyana", "Myanmar": "Myanmar",
        "Vietnam": "Vietnam", "Philippines": "Philippines", "Turkey": "Turkey", "Egypt": "Egypt",
        "Libya": "Libya", "Yemen": "Yemen", "Afghanistan": "Afghanistan", "Australia": "Australia",
        "Canada": "Canada", "Nigeria": "Nigeria", "Kenya": "Kenya", "Somalia": "Somalia", 
        "Mali": "Mali", "Niger": "Niger", "Congo": "Democratic Republic of the Congo", 
        "Armenia": "Armenia", "Azerbaijan": "Azerbaijan", "Serbia": "Serbia", "Kosovo": "Serbia",
        "Hong Kong": "China", "Scotland": "United Kingdom", "Wales": "United Kingdom",
        "Middle East": "Israel", # Regional mapping
    }
    
    # Tension Keywords (Impact Scores)
    impact_keywords = {
        "WAR": -15, "CONFLICT": -10, "TERROR": -15, "ATTACK": -12, "CRISIS": -8,
        "FIGHTING": -10, "EXPLOSION": -12, "DEATH": -8, "KILL": -8, "PROTEST": -5,
        "SANCTION": -7, "NUCLEAR": -15, "MISSILE": -12, "FIRE": -6, "BANNING": -3
    }
    
    country_scores = {}
    
    for article in news:
        title = article.get("title", "").upper()
        # Fallback tone if GDELT tone is 0 or missing
        raw_tone = float(article.get("tone", 0))
        
        # Adjust tone based on keywords if necessary
        for kw, boost in impact_keywords.items():
            if kw in title:
                raw_tone += boost
        
        # Detect mentions
        for label, std_name in countries.items():
            if label.upper() in title:
                if std_name not in country_scores:
                    country_scores[std_name] = {"sum_tone": 0, "count": 0}
                
                country_scores[std_name]["sum_tone"] += raw_tone
                country_scores[std_name]["count"] += 1
                
    # Normalize to 0-100 score
    final_scores = {}
    for country, stats in country_scores.items():
        avg_tone = stats["sum_tone"] / stats["count"]
        # Formula: Base 30 + Intensity based on negative tone and frequency
        # More negative tone = higher score
        intensity = int(abs(min(0.0, float(avg_tone))) * 4)
        score = 30 + intensity + (int(stats["count"]) * 3)
        final_scores[country] = int(min(98, max(20, score)))
        
    cache["tension"]["data"] = final_scores
    cache["tension"]["timestamp"] = now
    return final_scores

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
        url = f"http://api.aviationstack.com/v1/flights?access_key={AVIATIONSTACK_API_KEY}&flight_status=active&limit=50"
        resp = await client.get(url, timeout=10)
        if resp.status_code == 200:
            data = resp.json()
            flights = data.get("data", [])
            normalized = []
            for f in flights:
                live = f.get("live")
                if not live: continue
                state = [
                    f.get("aircraft", {}).get("icao24") or f.get("flight", {}).get("icao") or "UNK",
                    f.get("flight", {}).get("icao") or "UNK",
                    f.get("departure", {}).get("airport") or "Unknown",
                    int(datetime.now().timestamp()), 
                    int(datetime.now().timestamp()), 
                    live.get("longitude"),
                    live.get("latitude"),
                    live.get("altitude"),
                    live.get("is_ground", False),
                    live.get("speed_horizontal"),
                    live.get("direction"),
                    live.get("speed_vertical"),
                    None, 
                    live.get("altitude"), 
                    None, 
                    False, 
                    1 
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
    except Exception as e:
        await websocket.send_text(json.dumps({"type": "text", "content": "⚠ Gemini connection offline."}))
        await websocket.close()
        return

    try:
        async def receive_from_client():
            try:
                while True:
                    data = await websocket.receive()
                    if data.get("type") == "websocket.disconnect": break
                    if "bytes" in data and data["bytes"]:
                        await agent.send_audio(data["bytes"])
                    elif "text" in data and data["text"]:
                        try:
                            msg = json.loads(data["text"])
                            if msg.get("type") == "text_query":
                                text = msg.get("content", "")
                                if text: await agent.send_text(text)
                        except: pass
            except: pass

        async def send_to_client():
            try:
                async for msg in agent.receive_stream():
                    if "audio" in msg: await websocket.send_bytes(msg["audio"])
                    if "text" in msg: await websocket.send_text(json.dumps({"type": "text", "content": msg["text"]}))
                    if "brief" in msg: await websocket.send_text(json.dumps({"type": "brief", "content": msg["brief"]}))
                    if "globe_action" in msg: await websocket.send_text(json.dumps({"type": "globe_action", "content": msg["globe_action"]}))
                    if "news" in msg: await websocket.send_text(json.dumps({"type": "news", "content": msg["news"]}))
            except: pass

        await asyncio.gather(receive_from_client(), send_to_client())
    finally:
        await agent.close()

@app.get("/api/wildfires")
async def get_wildfires():
    # Dynamic simulation of wildfire hotspots
    now = datetime.now()
    if cache["wildfires"]["data"] and (now - cache["wildfires"]["timestamp"]).total_seconds() < 600:
        return cache["wildfires"]["data"]
        
    wildfire_data = [
        {"id": 1, "lat": -15.0 + (now.minute/60), "lon": -55.0, "intensity": 80, "label": "Amazon Cluster"},
        {"id": 2, "lat": -33.9, "lon": 151.2, "intensity": 90, "label": "NSW Outbreak"},
        {"id": 3, "lat": 1.3, "lon": 114.1, "intensity": 85, "label": "Borneo Hotspot"},
        {"id": 4, "lat": 34.0, "lon": -118.2, "intensity": 65, "label": "SoCal Alert"}
    ]
    cache["wildfires"]["data"] = wildfire_data
    cache["wildfires"]["timestamp"] = now
    return wildfire_data

@app.get("/api/infrastructure")
async def get_infrastructure():
    return [
        {"id": "out-1", "name": "Beirut Grid", "lat": 33.89, "lon": 35.50, "type": "POWER", "status": "CRITICAL"},
        {"id": "out-2", "name": "Lagos Fiber", "lat": 6.52, "lon": 3.37, "type": "INTERNET", "status": "MODERATE"},
        {"id": "out-3", "name": "Kyiv Energy", "lat": 50.45, "lon": 30.52, "type": "POWER", "status": "STABLE"}
    ]

@app.get("/api/sanctions")
async def get_sanctions():
    return [
        {"id": "snc-1", "target": "VTB Bank", "lat": 55.75, "lon": 37.61, "type": "FINANCIAL", "level": "CRITICAL"},
        {"id": "snc-2", "target": "Energy Corp", "lat": 35.68, "lon": 51.38, "type": "ENERGY", "level": "HIGH"}
    ]

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8080)
