import os
import json
import asyncio
import base64
import httpx
import websockets
from dotenv import load_dotenv

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

if not GEMINI_API_KEY:
    print("WARNING: GEMINI_API_KEY not set. Voice agent will not work.")

# Model that supports bidiGenerateContent (Live API)
MODEL = "models/gemini-2.5-flash-native-audio-latest"
HOST = "generativelanguage.googleapis.com"
URI = f"wss://{HOST}/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent?key={GEMINI_API_KEY}"

# ──────────────── GEOCODE LOOKUP ────────────────
# ~60 locations with [lat, lon, default_zoom]
GEOCODE_DB: dict[str, tuple[float, float, float]] = {
    # Middle East
    "iran": (32.43, 53.69, 4), "iraq": (33.22, 43.68, 5), "syria": (34.80, 38.99, 5),
    "yemen": (15.55, 48.52, 5), "lebanon": (33.85, 35.86, 7), "israel": (31.05, 34.85, 7),
    "palestine": (31.95, 35.23, 8), "gaza": (31.35, 34.31, 10), "saudi arabia": (23.88, 45.08, 4),
    "persian gulf": (26.50, 52.00, 5), "strait of hormuz": (26.56, 56.25, 7),
    "qatar": (25.35, 51.18, 8), "uae": (23.42, 53.85, 6), "dubai": (25.20, 55.27, 9),
    "bahrain": (26.07, 50.55, 9), "oman": (21.47, 55.97, 5), "jordan": (30.59, 36.24, 6),
    "kuwait": (29.31, 47.48, 7),
    # South & Central Asia  
    "afghanistan": (33.94, 67.71, 5), "pakistan": (30.38, 69.34, 5),
    "india": (20.59, 78.96, 4), "kashmir": (34.08, 74.80, 7),
    "china": (35.86, 104.20, 3), "taiwan": (23.70, 120.96, 7),
    # Africa
    "ukraine": (48.38, 31.17, 5), "russia": (61.52, 105.32, 3),
    "sudan": (12.86, 30.22, 5), "somalia": (5.15, 46.20, 5),
    "ethiopia": (9.15, 40.49, 5), "nigeria": (9.08, 8.67, 5),
    "congo": (-4.04, 21.76, 5), "democratic republic of congo": (-4.04, 21.76, 5),
    "mali": (17.57, -4.00, 5), "burkina faso": (12.24, -1.56, 6),
    "niger": (17.61, 8.08, 5), "libya": (26.34, 17.23, 5),
    "mozambique": (-18.67, 35.53, 5), "cameroon": (7.37, 12.35, 5),
    "chad": (15.45, 18.73, 5), "south sudan": (6.88, 31.31, 6),
    # Asia Pacific
    "myanmar": (21.91, 95.96, 5), "north korea": (40.34, 127.51, 6),
    "south korea": (35.91, 127.77, 6), "japan": (36.20, 138.25, 5),
    "philippines": (12.88, 121.77, 5), "south china sea": (14.60, 114.10, 5),
    # Americas
    "haiti": (18.97, -72.29, 7), "venezuela": (6.42, -66.59, 5),
    "colombia": (4.57, -74.30, 5), "mexico": (23.63, -102.55, 4),
    "united states": (37.09, -95.71, 3), "usa": (37.09, -95.71, 3),
    # Europe
    "turkey": (38.96, 35.24, 5), "germany": (51.17, 10.45, 5),
    "france": (46.23, 2.21, 5), "united kingdom": (55.38, -3.44, 5),
    "kyiv": (50.45, 30.52, 8), "moscow": (55.76, 37.62, 8),
    "beijing": (39.90, 116.40, 8), "tehran": (35.69, 51.39, 8),
    "kabul": (34.53, 69.17, 9), "baghdad": (33.31, 44.37, 8),
    "damascus": (33.51, 36.29, 8), "cairo": (30.04, 31.24, 8),
    "khartoum": (15.60, 32.53, 8), "mogadishu": (2.05, 45.32, 9),
    "addis ababa": (9.01, 38.75, 9), "nairobi": (1.29, 36.82, 9),
    "london": (51.51, -0.13, 9), "paris": (48.86, 2.35, 9),
    "berlin": (52.52, 13.40, 9), "washington": (38.91, -77.04, 9),
    "new york": (40.71, -74.01, 9), "tokyo": (35.68, 139.69, 9),
    "seoul": (37.57, 126.98, 9), "taipei": (25.03, 121.57, 9),
    "new delhi": (28.61, 77.21, 9), "mumbai": (19.08, 72.88, 9),
    "islamabad": (33.69, 73.04, 9), "riyadh": (24.71, 46.67, 8),
}


async def geocode(location_name: str) -> tuple[float, float, float]:
    """Returns (lat, lon, zoom) for a location name."""
    key = location_name.strip().lower()
    if key in GEOCODE_DB:
        return GEOCODE_DB[key]
    # Fuzzy match — check if any key is contained in the query
    for k, v in GEOCODE_DB.items():
        if k in key or key in k:
            return v
            
    # Fallback to free OpenStreetMap Nominatim API
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.get(
                "https://nominatim.openstreetmap.org/search",
                params={"q": location_name, "format": "json", "limit": 1},
                headers={"User-Agent": "GeoSentinel-OSINT/1.0 (contact@example.com)"}
            )
            if resp.status_code == 200:
                data = resp.json()
                if data:
                    lat = float(data[0]["lat"])
                    lon = float(data[0]["lon"])
                    # Heuristic zoom: 5 for countries, 9 for cities
                    zoom = 5 if data[0].get("addresstype") == "country" else 9
                    return (lat, lon, zoom)
    except Exception as e:
        print(f"Geocoding API error: {e}")
        
    # Default fallback
    return (30.0, 45.0, 2)


# ──────────────── GDELT NEWS FETCH ────────────────

async def fetch_gdelt_news(location: str, max_results: int = 8) -> list[dict]:
    """Fetch recent news from GDELT GEO API (free, no key required)."""
    try:
        async with httpx.AsyncClient(timeout=8.0) as client:
            # GDELT DOC 2.0 API — search by location keyword
            url = "https://api.gdeltproject.org/api/v2/doc/doc"
            params = {
                "query": f"{location} sourcelang:eng",
                "mode": "artlist",
                "maxrecords": str(max_results),
                "format": "json",
                "sort": "DateDesc",
            }
            resp = await client.get(url, params=params)
            if resp.status_code == 200:
                data = resp.json()
                articles = data.get("articles", [])
                return [
                    {
                        "title": a.get("title", ""),
                        "url": a.get("url", ""),
                        "source": a.get("domain", ""),
                        "date": a.get("seendate", ""),
                        "image": a.get("socialimage", ""),
                        "tone": a.get("tone", 0),
                    }
                    for a in articles[:max_results]
                ]
    except Exception as e:
        print(f"GDELT fetch error: {e}")

    # Fallback mock data if GDELT is unavailable
    return [
        {"title": f"Latest developments in {location}", "source": "Reuters", "date": "2025-03-14", "tone": -5},
        {"title": f"Analysis: Tensions rise in {location} region", "source": "BBC", "date": "2025-03-13", "tone": -7},
        {"title": f"International response to {location} crisis", "source": "Al Jazeera", "date": "2025-03-13", "tone": -4},
    ]


# ──────────────── SYSTEM PROMPT ────────────────

SYSTEM_PROMPT = """
You are GeoSentinel, a real-time geopolitical intelligence analyst 
with access to a live 4D globe. You can see flights, ships, 
satellites, GPS jamming zones, conflict events, no-fly zones, 
WILDFIRES, INFRASTRUCTURE OUTAGES (Power/Internet), and ECONOMIC SANCTIONS anywhere on Earth.

BEHAVIOR RULES:
1. When a user mentions ANY location (country, city, region), 
   IMMEDIATELY call fly_to_location() FIRST, then get_location_intelligence() 
   before speaking. ALWAYS call both tools together.
   
2. Speak in SHORT sentences. Maximum 3 sentences before pausing.
   You are a calm, precise analyst.
   
3. After your audio response, ALWAYS emit a brief JSON block 
   wrapped in <BRIEF>...</BRIEF> tags for the UI to render.
   Example:
   <BRIEF>
   {
     "region": "Persian Gulf",
     "tension": "HIGH",
     "summary": "High tension in Persian Gulf. Vessel count down 40%.",
     "bullets": ["847 flights | 12 military", "Hormuz: 23 vessels", "GPS jam active"],
     "timestamp": "2025-03-13T04:23:00Z"
   }
   </BRIEF>

4. You ARE interruptible.

5. For time-based questions, call set_globe_time() to rewind the globe.

6. When presenting intelligence data, include the NEWS headlines from 
   the get_location_intelligence tool response. Mention the top 2-3 
   headlines and their sources.
   
7. Be proactive: If a location has active WILDFIRES or INFRASTRUCTURE OUTAGES reported, 
   highlight them as CRITICAL threats.
"""


class GeminiLiveAgent:
    def __init__(self):
        self.ws = None
        
    async def connect(self):
        self.ws = await websockets.connect(URI)
        await self.send_setup()

    async def send_setup(self):
        setup_message = {
            "setup": {
                "model": MODEL,
                "generationConfig": {
                    "responseModalities": ["AUDIO"],
                    "speechConfig": {
                        "voiceConfig": {
                            "prebuiltVoiceConfig": {
                                "voiceName": "Orus"
                            }
                        }
                    }
                },
                "systemInstruction": {
                    "parts": [{"text": SYSTEM_PROMPT}]
                },
                "tools": [
                    {
                        "functionDeclarations": [
                            {
                                "name": "fly_to_location",
                                "description": "Sends a fly-to command to the frontend globe. Call this IMMEDIATELY when ANY location is mentioned.",
                                "parameters": {
                                    "type": "OBJECT",
                                    "properties": {
                                        "location_name": {"type": "STRING", "description": "The name of the country, city, or region to fly to."}
                                    },
                                    "required": ["location_name"]
                                }
                            },
                            {
                                "name": "get_location_intelligence",
                                "description": "Fetches current OSINT signals and latest NEWS headlines for a location. Call this after fly_to_location to get intelligence data.",
                                "parameters": {
                                    "type": "OBJECT",
                                    "properties": {
                                        "location": {"type": "STRING", "description": "The name of the location to get intelligence for."}
                                    },
                                    "required": ["location"]
                                }
                            },
                            {
                                "name": "set_globe_time",
                                "description": "Sends timeline scrubber command to frontend.",
                                "parameters": {
                                    "type": "OBJECT",
                                    "properties": {
                                        "timestamp": {
                                            "type": "STRING", 
                                            "description": "ISO timestamp or relative like '-2h'"
                                        }
                                    },
                                    "required": ["timestamp"]
                                }
                            },
                            {
                                "name": "get_global_osint_summary",
                                "description": "Fetches a high-level summary of all global anomalies: Earthquakes, Wildfires, and Outages.",
                                "parameters": {
                                    "type": "OBJECT",
                                    "properties": {}
                                }
                            }
                        ]
                    }
                ]
            }
        }
        await self.ws.send(json.dumps(setup_message))
        response = await self.ws.recv()
        print("Setup complete:", response)

    async def send_audio(self, pcm_data: bytes):
        """Send audio using realtimeInput for streaming mic audio."""
        realtime_msg = {
            "realtimeInput": {
                "mediaChunks": [
                    {
                        "mimeType": "audio/pcm;rate=16000",
                        "data": base64.b64encode(pcm_data).decode("utf-8")
                    }
                ]
            }
        }
        if self.ws:
            await self.ws.send(json.dumps(realtime_msg))

    async def send_text(self, text: str):
        """Send text using clientContent for typed queries."""
        client_content_msg = {
            "clientContent": {
                "turns": [
                    {
                        "role": "user",
                        "parts": [{"text": text}]
                    }
                ],
                "turnComplete": True
            }
        }
        if self.ws:
            await self.ws.send(json.dumps(client_content_msg))

    async def send_tool_response(self, call_id: str, function_name: str, result: dict):
        tool_response = {
            "toolResponse": {
                "functionResponses": [
                    {
                        "id": call_id,
                        "name": function_name,
                        "response": result
                    }
                ]
            }
        }
        await self.ws.send(json.dumps(tool_response))

    async def receive_stream(self):
        text_buffer = ""
        async for msg in self.ws:
            server_msg = json.loads(msg)
            
            if "serverContent" in server_msg:
                content = server_msg["serverContent"].get("modelTurn", {})
                for part in content.get("parts", []):
                    # Yield audio bytes
                    if "inlineData" in part:
                         yield {"audio": base64.b64decode(part["inlineData"]["data"])}
                    # Yield text chunks
                    if "text" in part:
                         text_chunk = part["text"]
                         text_buffer += text_chunk
                         yield {"text": text_chunk}
                         
                         # Check if we have a full BRIEF tag pair in the buffer
                         if "<BRIEF>" in text_buffer and "</BRIEF>" in text_buffer:
                             try:
                                 brief_str = text_buffer.split("<BRIEF>")[-1].split("</BRIEF>")[0]
                                 brief_json = json.loads(brief_str)
                                 yield {"brief": brief_json}
                                 # Clear the part of the buffer we used to avoid double-parsing
                                 text_buffer = text_buffer.split("</BRIEF>")[-1]
                             except Exception as e:
                                 print("Error parsing BRIEF:", e)
                                 # If parsing fails but tags are there, probably partial JSON. Keep buffering.
                                 pass

            # Handle function calls
            if "toolCall" in server_msg:
                for call in server_msg["toolCall"].get("functionCalls", []):
                    call_id = call["id"]
                    name = call["name"]
                    args = call.get("args", {})
                    
                    if name == "fly_to_location":
                        location_name = args.get("location_name", "")
                        lat, lon, zoom = await geocode(location_name)
                        # Send real coordinates to frontend
                        yield {
                            "globe_action": {
                                "action": "FLY_TO",
                                "location": location_name,
                                "lat": lat,
                                "lon": lon,
                                "zoom": zoom,
                                "duration_ms": 2500
                            }
                        }
                        await self.send_tool_response(call_id, name, {
                            "status": "flying",
                            "lat": lat,
                            "lon": lon,
                            "zoom": zoom,
                            "location": location_name
                        })
                        
                    elif name == "get_location_intelligence":
                        location = args.get("location", "")
                        # Fetch real news from GDELT
                        news = await fetch_gdelt_news(location)
                        intel = {
                            "location": location,
                            "tension_level": "HIGH" if any(abs(n.get("tone", 0)) > 5 for n in news) else "MODERATE",
                            "news_headlines": [
                                {"title": n["title"], "source": n.get("source", ""), "date": n.get("date", "")}
                                for n in news
                            ],
                            "article_count": len(news),
                        }
                        # Also send news to frontend for display
                        # Also send news to frontend for display
                        yield {"news": {"location": location, "articles": news}}
                        
                        # Add simulated OSINT alerts for the region
                        intel["wildfire_alert"] = "ACTIVE" if "amazon" in location.lower() or "australia" in location.lower() else "NONE"
                        intel["infrastructure_status"] = "DEGRADED" if "beirut" in location.lower() or "lagos" in location.lower() else "STABLE"
                        
                        await self.send_tool_response(call_id, name, intel)
                        
                    elif name == "get_global_osint_summary":
                        # Fetch global counts from backend
                        try:
                            async with httpx.AsyncClient() as client:
                                wf_res = await client.get("http://localhost:8000/api/wildfires")
                                infra_res = await client.get("http://localhost:8000/api/infrastructure")
                                eq_res = await client.get("http://localhost:8000/api/earthquakes")
                                sanctions_res = await client.get("http://localhost:8000/api/sanctions")
                                
                                wf_count = len(wf_res.json()) if wf_res.status_code == 200 else 0
                                infra_count = len(infra_res.json()) if infra_res.status_code == 200 else 0
                                eq_count = len(eq_res.json().get("features", [])) if eq_res.status_code == 200 else 0
                                sanctions_count = len(sanctions_res.json()) if sanctions_res.status_code == 200 else 0
                                
                                summary = {
                                    "active_wildfires": wf_count,
                                    "infrastructure_outages": infra_count,
                                    "economic_sanctions": sanctions_count,
                                    "significant_earthquakes": eq_count,
                                    "critical_zones": ["Amazon", "NSW", "Beirut", "Kyiv", "Moscow"]
                                }
                                await self.send_tool_response(call_id, name, summary)
                        except Exception as e:
                            await self.send_tool_response(call_id, name, {"error": str(e)})
                        
                    elif name == "set_globe_time":
                        yield {"globe_action": {"action": "SET_TIME", "timestamp": args["timestamp"]}}
                        await self.send_tool_response(call_id, name, {"status": "time_set"})

    async def close(self):
        if self.ws:
            await self.ws.close()
