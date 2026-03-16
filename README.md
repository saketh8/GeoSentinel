# GeoSentinel — Live OSINT Intelligence Dashboard
**◈ CATEGORY: LIVE AGENTS 🗣️**  
**(Gemini Live Agent Challenge UX/UI Submission)**

GeoSentinel is a next-generation, God's-Eye multimodal AI agent. It fuses real-time global telemetry (flights, maritime, satellite tracking) with Open-Source Intelligence (OSINT) to create a glowing, interactive cyber-physical digital twin of Earth. 

By integrating **Google's Gemini 2.0 Flash (Multimodal Live API)**, users can verbally interrogate the globe, ask for live sit-reps, and instantly visualize geopolitical hotspots using 3D thermographic hexbins and financial prediction layers.

## 🏆 Hackathon Requirements Fulfilled
- **Live Agents (Audio/Vision):** Voice-activated OSINT dashboard that handles natural language interruptions and real-time data streaming.
- **Gemini Live API:** Powered by the `gemini-2.0-flash-exp` model via WebSocket, hosted on Google Cloud.
- **Google Cloud Services:** Backend (FastAPI) and Frontend (Vite/React) deployed dynamically via **Google Cloud Run**.
- **Bonus Points (IaC):** Full automated containerization and deployment via the included `deploy.sh` script.

---

## 🏗 Architecture Diagram
![GeoSentinel Architecture](./architecture.md)

*(See `architecture.md` for the Mermaid source code)*

---

## 🧠 Findings & Learnings
Development of GeoSentinel during the contest led to several key insights regarding the Gemini Live API and Multimodal Agent architecture:

1. **Multimodal Grounding is Critical**: One of our key findings was that relying solely on Gemini's internal knowledge for geography led to occasional coordinate hallucinations. By implementing a **Nominatim Geocoding Tool**, we successfully "grounded" the agent's navigation. The agent now validates every location name through OpenStreetMap before executing a `FLY_TO` command.
2. **Asynchronous UI/Agent Synchronization**: Handling interruptions naturally (barge-in) requires tight state synchronization between the React frontend and the FastAPI backend. We found that a single WebSocket tunnel for both audio and control directives provided the lowest latency and most immersive experience.
3. **OSINT Fusion at Scale**: We learned that visual density (inspired by Palantir's aesthetic) actually improves agentic debugging. By having 8+ data layers visible on the 3D globe, it became easier to verify if the Gemini agent's spatial understanding matched the rendered reality.
4. **GCP Cloud Run for WebSockets**: Initially, we faced timeout issues with standard load balancers. We learned that properly configuring the `PORT` and `timeout` settings in Cloud Run is essential for long-running multimodal WebSocket streams.

---

## 🚀 Features
- **3-Column Intelligence Layout**: Inspired by Palantir and Glint.trade, featuring a live global GDELT news feed, central 3D globe, and a reactive Planetary Intel panel.
- **Glint.trade "Vision Terminal" Effects**: Features 3D Hexbin Activity Heatmaps revealing signal density, and floating 3D diamond "Whale Trades" (e.g., simulated Polymarket predictions).
- **8 Interactive 3D Data Layers**: Flights (Arcs), Warships, Recon Satellites, Conflict Zones (Pulsing Rings), GPS Jamming, No-Fly Zones, Extreme Weather, and Prediction Markets.
- **Agentic Voice Control**: Click the Mic button to talk natively to the Gemini Agent, which interprets intents (like `FLY_TO`) and autonomously orbits the camera to the spoken country.

---

## 👨‍💻 Quick Start & Spin-Up Instructions

### Prerequisites
- Node.js 20+
- Python 3.10+
- A Gemini API Key from Google AI Studio.

### Local Development

1. **Start the Backend (FastAPI/Gemini)**
   ```sh
   cd backend
   python3 -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt
   export GEMINI_API_KEY="your-api-key-here"
   uvicorn agent:app --reload --port 8000
   ```

2. **Start the Frontend (React/Vite & react-globe.gl)**
   ```sh
   cd frontend
   npm install
   npm run dev
   # Runs on http://localhost:5173
   ```

---

## 🧪 Reproducible Testing

Judges can verify the core functionality of GeoSentinel using the following steps:

### 1. Verification of the Immersive UI
- **Action**: Load the [Live Frontend](https://geosentinel-frontend-1044499038422.us-central1.run.app).
- **Expectation**: The 3D globe should initialize in a dark "Command Room" atmosphere. The left panel should populate with live news from the GDELT stream.

### 2. Multi-Layer Intelligence Toggle
- **Action**: Open the **Planetary Intel** panel on the right. Toggle the **'Aviation'** and **'Conflicts'** layers.
- **Expectation**: The globe should render 3D arcs for flights and pulsing red rings for conflict zones. Hovering over an arc should reveal a tactical aircraft tooltip.

### 3. Gemini Live Agent (The "Beyond Text" Test)
- **Action**: Click the **Microphone** button at the bottom center.
- **Voice Command**: Say *"GeoSentinel, fly to France."*
- **Expectation**: The agent should respond with audio via the Gemini Live API, geocode the location, and the camera should autonomously orbit to France. The intelligence panels should refresh to show France-specific data.

### 4. Zero-Click Command Center
- **Action**: Click the **[ 📊 COMMAND CENTER ]** button.
- **Expectation**: A high-density tactical overlay (Masonry grid) should appear, displaying widgets like the **Pentagon Pizza Index** and **AI Strategic Posture**.

---

## ☁️ Google Cloud Deployment (Bonus)

We automate containerizing the entire stack and shipping it to **Google Cloud Run**.

1. Ensure you have the `gcloud` CLI installed and authenticated.
2. Edit `deploy.sh` to include your `PROJECT_ID` and `GEMINI_API_KEY`.
3. Run the Infrastructure-as-Code script:
   ```sh
   chmod +x deploy.sh
   ./deploy.sh
   ```
This will build and deploy both containers, outputting the live public URLs for grading.
## 🏢 Proof of Google Cloud Deployment

GeoSentinel is fully architected for the Google Cloud ecosystem. 

1. **Live Backend**: [https://geosentinel-backend-1044499038422.us-central1.run.app](https://geosentinel-backend-1044499038422.us-central1.run.app)
2. **Live Frontend**: [https://geosentinel-frontend-1044499038422.us-central1.run.app](https://geosentinel-frontend-1044499038422.us-central1.run.app)
3. **Automated IaC**: Deployment is handled via [deploy.sh](./deploy.sh), which automates the build and ship process to Cloud Run.
4. **Cloud-Native SDK**: The backend leverages the `google-generativeai` SDK to connect directly to Gemini 2.0 Flash endpoints.

---

## 📹 Demonstration Video
[Link to your <4-minute Video (YouTube/Vimeo)]

---

## 🏗 Full Architecture
See [architecture.md](./architecture.md) for the detailed Mermaid system flow.
