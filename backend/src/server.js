import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { WebSocketServer } from 'ws';
import { createServer } from 'http';
import cron from 'node-cron';
import { config } from '../config.js';

// Import route modules
import solarWindRoutes from './routes/solarWind.js';
import cmeRoutes from './routes/cme.js';
import alertRoutes from './routes/alerts.js';
import systemRoutes from './routes/system.js';
import forecastRoutes from './routes/forecasts.js';
import correlationRoutes from './routes/correlation.js';

// Import services
import { DataSimulator } from './services/dataSimulator.js';
import { AnomalyDetector } from './services/anomalyDetector.js';
import { AlertSystem } from './services/alertSystem.js';
import { WebSocketManager } from './services/websocketManager.js';

const app = express();
const server = createServer(app);

// Middleware
app.use(helmet());
app.use(compression());
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Initialize services
const dataSimulator = new DataSimulator();
const anomalyDetector = new AnomalyDetector();
const alertSystem = new AlertSystem();
const wsManager = new WebSocketManager(server);

// Make services available to routes
app.locals.dataSimulator = dataSimulator;
app.locals.anomalyDetector = anomalyDetector;
app.locals.alertSystem = alertSystem;
app.locals.wsManager = wsManager;

// Routes
app.use('/api/solar-wind', solarWindRoutes);
app.use('/api/cme', cmeRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/system', systemRoutes);
app.use('/api/forecasts', forecastRoutes);
app.use('/api/correlation', correlationRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: config.nodeEnv,
    services: {
      dataSimulator: 'online',
      anomalyDetector: 'online',
      alertSystem: 'online',
      websocket: 'online'
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: config.nodeEnv === 'development' ? err.message : 'Something went wrong'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not found',
    message: `Route ${req.originalUrl} not found`
  });
});

// Start data simulation and processing
dataSimulator.startSimulation();

// Schedule periodic tasks
cron.schedule('*/30 * * * * *', () => {
  // Run anomaly detection every 30 seconds
  const latestData = dataSimulator.getLatestData();
  const anomalies = anomalyDetector.detectAnomalies(latestData);
  
  if (anomalies.length > 0) {
    alertSystem.processAnomalies(anomalies);
    wsManager.broadcastAlerts(anomalies);
  }
  
  // Broadcast latest data to all connected clients
  wsManager.broadcastData(latestData);
});

// Start server
const PORT = config.port;
server.listen(PORT, () => {
  console.log(`🚀 CME Detection Backend running on port ${PORT}`);
  console.log(`🌐 Health check: http://localhost:${PORT}/api/health`);
  console.log(`📡 WebSocket server running on port ${config.websocket.port}`);
  console.log(`🛰️  Aditya-L1 Data Simulation: ACTIVE`);
});
