# CME Detection and Alert System Backend

A comprehensive backend system for processing Aditya-L1 data to detect Coronal Mass Ejections (CMEs), classify their intensity, and provide real-time alerts.

## Features

### Core Capabilities
- **Real-time Data Simulation**: Simulates Aditya-L1 ASPEX and SUIT payload data
- **Anomaly Detection**: Advanced time-series analysis for CME detection
- **CME Classification**: Intensity classification and Earth impact assessment
- **Alert System**: Multi-channel alerting with escalation capabilities
- **Real-time Communication**: WebSocket support for live data streaming
- **External Correlation**: Integration with CACTus, NOAA, and ESA databases

### API Endpoints

#### Solar Wind Data (`/api/solar-wind`)
- `GET /current` - Current solar wind parameters
- `GET /history` - Historical data with time range filtering
- `GET /statistics` - Statistical analysis of recent data
- `GET /composition` - Ion composition data
- `GET /trends/:parameter` - Parameter trend analysis

#### CME Detection (`/api/cme`)
- `GET /current` - Current CME detections and status
- `GET /history` - Historical CME events with filtering
- `POST /simulate` - Trigger simulated CME events (testing)
- `GET /impact/earth` - Earth impact predictions
- `GET /classification` - CME classification information
- `GET /monitoring/status` - Real-time monitoring status

#### Alerts (`/api/alerts`)
- `GET /active` - Active alerts
- `GET /history` - Alert history with filtering
- `GET /:alertId` - Specific alert details
- `POST /:alertId/acknowledge` - Acknowledge alerts
- `POST /:alertId/resolve` - Resolve alerts
- `GET /statistics/summary` - Alert system statistics

#### System Management (`/api/system`)
- `GET /status` - Overall system status
- `GET /instruments` - Instrument health and status
- `GET /health` - System health metrics
- `GET /config` - System configuration
- `POST /maintenance/:operation` - Maintenance operations

#### Forecasting (`/api/forecasts`)
- `GET /current` - Current space weather forecast
- `GET /extended` - Extended multi-day forecasts
- `GET /cme-impacts` - CME impact predictions
- `GET /geomagnetic` - Geomagnetic activity forecast
- `GET /aurora` - Aurora visibility predictions
- `GET /satellite-ops` - Satellite operations forecast
- `GET /radio-comm` - Radio communication conditions

#### External Correlation (`/api/correlation`)
- `GET /external` - Multi-source correlation data
- `GET /cactus` - CACTus database correlation
- `GET /noaa` - NOAA space weather correlation
- `GET /esa` - ESA space weather correlation
- `GET /validation` - Event validation against external sources

## Installation

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Setup
1. Clone the repository
2. Install dependencies:
   ```bash
   cd backend
   npm install
   ```

3. Start the server:
   ```bash
   # Development mode with auto-reload
   npm run dev
   
   # Production mode
   npm start
   ```

## Configuration

The system uses the following configuration (see `config.js`):

- **Port**: 3001 (HTTP API)
- **WebSocket Port**: 3002
- **Data Retention**: 30 days
- **Processing Interval**: 30 seconds
- **Alert Cooldown**: 5-15 minutes (varies by type)

## Data Flow

1. **Data Simulation**: Generates realistic Aditya-L1 ASPEX and SUIT data
2. **Anomaly Detection**: Analyzes data for CME signatures every 30 seconds
3. **Classification**: Classifies detected events by severity and Earth impact
4. **Alerting**: Triggers multi-channel alerts based on severity
5. **Broadcasting**: Real-time data and alerts via WebSocket

## Real-time Features

### WebSocket API
Connect to `ws://localhost:3001/ws` for real-time updates:

```javascript
const ws = new WebSocket('ws://localhost:3001/ws');

// Subscribe to data updates
ws.send(JSON.stringify({
  type: 'subscribe',
  channels: ['data', 'alerts']
}));

// Handle incoming messages
ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Received:', data.type, data);
};
```

### Available Channels
- `all` - All updates (default)
- `data` - Solar wind data updates
- `alerts` - Alert notifications
- `system` - System status updates
- `cme` - CME-specific events
- `flares` - Solar flare events
- `geomag` - Geomagnetic events

## Simulated Data Sources

### ASPEX (Aditya Solar wind Particle EXperiment)
- Solar wind speed (200-800 km/s)
- Proton density (1-50 particles/cm³)
- Proton temperature (50K-2M K)
- Alpha particle ratio (3-5%)
- Ion composition (H, He, O, C)

### SUIT (Solar Ultraviolet Imaging Telescope)
- UV intensity (Lyman-alpha line)
- Coronal hole detection
- Solar flare monitoring
- Magnetic field measurements

### Derived Parameters
- Interplanetary Magnetic Field (IMF)
- Kp and Dst indices
- Plasma beta
- Alfvén speed

## Testing Features

### CME Simulation
Trigger test CME events:
```bash
curl -X POST http://localhost:3001/api/cme/simulate \
  -H "Content-Type: application/json" \
  -d '{"intensity": 1.5, "duration": 300000, "earthDirected": true}'
```

### Test Alerts
Generate test alerts:
```bash
curl -X POST http://localhost:3001/api/alerts/test \
  -H "Content-Type: application/json" \
  -d '{"type": "test_cme", "severity": "moderate"}'
```

## External Correlations

The system simulates correlation with:
- **CACTus**: Computer Aided CME Tracking database
- **NOAA SWPC**: Space Weather Prediction Center
- **ESA SSWS**: Space Situational Awareness Space Weather Service
- **STEREO**: Solar Terrestrial Relations Observatory

## Alert System

### Severity Levels
- **Minor**: Weak events, minimal Earth impact
- **Moderate**: Significant events, noticeable impact
- **Severe**: Major events, significant Earth impact

### Alert Channels
- **Email**: Configurable contact groups
- **SMS**: Critical alerts only
- **Webhook**: Integration endpoints
- **Dashboard**: Real-time UI updates
- **Audio**: Control room alerts

### Contact Groups
- ISRO Mission Control
- Satellite Operators
- Ground Stations
- Research Teams
- External Partners

## Health Monitoring

The system provides comprehensive health monitoring:
- Data quality metrics
- Communication latency
- Processing performance
- Alert delivery status
- WebSocket connection health

Access health status: `GET /api/system/health`

## Maintenance

### Available Operations
- `cleanup`: System cleanup and garbage collection
- `reset-alerts`: Reset alert system state
- `restart-simulation`: Restart data simulation

### Log Levels
- `error`: Critical errors
- `warn`: Warning conditions
- `info`: General information
- `debug`: Detailed debugging

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Data          │    │   Anomaly       │    │   Alert         │
│   Simulator     │───▶│   Detector      │───▶│   System        │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   WebSocket     │    │   API           │    │   External      │
│   Manager       │    │   Routes        │    │   Correlation   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Development

### Project Structure
```
backend/
├── src/
│   ├── routes/          # API route handlers
│   ├── services/        # Core business logic
│   └── server.js        # Main server file
├── config.js           # Configuration
└── package.json        # Dependencies
```

### Adding New Features
1. Create service in `src/services/`
2. Add routes in `src/routes/`
3. Update server.js imports
4. Add API documentation

## License

This project is developed for ISRO's Aditya-L1 mission and space weather monitoring capabilities.
