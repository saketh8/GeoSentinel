# Architecture Diagram: GeoSentinel

This Mermaid diagram illustrates the system architecture of GeoSentinel, demonstrating how the React frontend interacts with the Python backend, Gemini Live API, and external intelligence sources.

```mermaid
graph TD
    %% Define Styles
    classDef frontend fill:#0f172a,stroke:#3b82f6,stroke-width:2px,color:#fff;
    classDef backend fill:#1e293b,stroke:#10b981,stroke-width:2px,color:#fff;
    classDef external fill:#334155,stroke:#f59e0b,stroke-width:2px,color:#fff;
    classDef google fill:#ffffff,stroke:#ea4335,stroke-width:2px,color:#ea4335,shadow:true;
    
    %% User & Network
    User((User))
    Web[Google Cloud Run<br>React / react-globe.gl]:::frontend

    %% Backend Services
    subgraph "GeoSentinel Backend (FastAPI / Cloud Run)"
        API[REST API<br/>FastAPI]:::backend
        WebSocket[Agent WebSocket<br/>Audio Stream]:::backend
        LiveClient[GeminiLiveClient<br/>Async Handler]:::backend
    end

    %% External APIs
    subgraph "External Intelligence Sources"
        GDELT[(GDELT Project<br/>Live Global News)]:::external
        OSINT[Mock OSINT Feeds<br/>AIS, ADS-B, Conflicts]:::external
    end

    %% Google Cloud AI
    Gemini[Gemini 2.0 Flash Exp<br/>Multimodal Live API]:::google

    %% Connections
    User -- "Voice Audio (Mic)" --> Web
    User -- "Command Input" --> Web
    Web -- "News Queries" --> GDELT
    Web -- "WebSocket /ws/agent (Audio + JSON)" --> WebSocket
    WebSocket -- "Binary Audio / Text" --> LiveClient
    LiveClient -- "Realtime API (WebSockets)" --> Gemini
    Gemini -- "Audio Speech + JSON Tools" --> LiveClient
    LiveClient -- "Agent Turn Complete" --> WebSocket
    WebSocket -- "Flight / Camera Directives (FLY_TO)" --> Web
    
    %% OSINT flow
    API -- "Fetch Mock/Simulated Data" --> OSINT
    OSINT -- "Globe Datapoints" --> Web
```
