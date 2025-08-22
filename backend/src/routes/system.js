import express from 'express';

const router = express.Router();

// Get overall system status
router.get('/status', (req, res) => {
  try {
    const dataSimulator = req.app.locals.dataSimulator;
    const wsManager = req.app.locals.wsManager;
    const alertSystem = req.app.locals.alertSystem;
    
    const currentData = dataSimulator.getLatestData();
    const wsStats = wsManager.getStatistics();
    const alertStats = alertSystem.getAlertStatistics();
    
    const systemStatus = {
      overall: 'operational',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      
      components: {
        dataSimulation: {
          status: dataSimulator.isRunning ? 'online' : 'offline',
          lastUpdate: currentData?.timestamp || 'never',
          dataPoints: dataSimulator.dataHistory.length,
          currentCME: dataSimulator.getCurrentCMEEvent() ? 'active' : 'none'
        },
        
        anomalyDetection: {
          status: 'online',
          recentAnomalies: alertStats.total,
          detectionSensitivity: 'normal',
          lastAnalysis: new Date().toISOString()
        },
        
        alertSystem: {
          status: 'active',
          activeAlerts: alertStats.active,
          totalProcessed: alertStats.total,
          deliveryChannels: {
            email: 'enabled',
            sms: 'enabled',
            webhook: 'enabled',
            dashboard: 'enabled'
          }
        },
        
        webSocket: {
          status: 'online',
          connectedClients: wsStats.connectedClients,
          totalConnections: wsStats.totalConnections,
          messageQueueSize: wsStats.messageQueueSize
        },
        
        dataQuality: currentData ? {
          completeness: currentData.quality.dataCompleteness,
          signalToNoise: currentData.quality.signalToNoise,
          communicationDelay: currentData.quality.communicationDelay,
          calibrationStatus: currentData.quality.calibrationStatus
        } : null
      },
      
      performance: {
        memoryUsage: process.memoryUsage(),
        cpuUsage: process.cpuUsage(),
        nodeVersion: process.version,
        platform: process.platform
      }
    };
    
    res.json(systemStatus);
  } catch (error) {
    console.error('Error fetching system status:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to retrieve system status'
    });
  }
});

// Get detailed instrument status
router.get('/instruments', (req, res) => {
  try {
    const dataSimulator = req.app.locals.dataSimulator;
    const currentData = dataSimulator.getLatestData();
    
    if (!currentData) {
      return res.status(503).json({
        error: 'Data not available',
        message: 'Instrument data is currently unavailable'
      });
    }
    
    const instrumentStatus = {
      timestamp: currentData.timestamp,
      
      aspex: {
        name: 'Aditya Solar wind Particle EXperiment',
        status: currentData.quality.instrumentHealth.aspex,
        dataStreams: {
          solarWindSpeed: {
            current: currentData.aspex.solarWindSpeed.value,
            unit: currentData.aspex.solarWindSpeed.unit,
            quality: currentData.aspex.solarWindSpeed.quality,
            lastUpdate: currentData.aspex.solarWindSpeed.timestamp
          },
          protonDensity: {
            current: currentData.aspex.protonDensity.value,
            unit: currentData.aspex.protonDensity.unit,
            quality: currentData.aspex.protonDensity.quality,
            lastUpdate: currentData.aspex.protonDensity.timestamp
          },
          protonTemperature: {
            current: currentData.aspex.protonTemperature.value,
            unit: currentData.aspex.protonTemperature.unit,
            quality: currentData.aspex.protonTemperature.quality,
            lastUpdate: currentData.aspex.protonTemperature.timestamp
          },
          ionComposition: {
            current: currentData.aspex.ionComposition,
            unit: currentData.aspex.ionComposition.unit,
            quality: currentData.aspex.ionComposition.quality,
            lastUpdate: currentData.aspex.ionComposition.timestamp
          }
        },
        operationalMode: 'nominal',
        powerConsumption: '12.5 W',
        temperature: '23.4°C',
        lastCalibration: '2024-01-10T00:00:00Z'
      },
      
      suit: {
        name: 'Solar Ultraviolet Imaging Telescope',
        status: currentData.quality.instrumentHealth.suit,
        dataStreams: {
          uvIntensity: {
            current: currentData.suit.uvIntensity.value,
            unit: currentData.suit.uvIntensity.unit,
            wavelength: currentData.suit.uvIntensity.wavelength,
            quality: currentData.suit.uvIntensity.quality,
            lastUpdate: currentData.suit.uvIntensity.timestamp
          },
          coronalHoles: {
            detected: currentData.suit.coronalHoles.detected,
            area: currentData.suit.coronalHoles.area,
            location: {
              latitude: currentData.suit.coronalHoles.latitude,
              longitude: currentData.suit.coronalHoles.longitude
            },
            quality: currentData.suit.coronalHoles.quality,
            lastUpdate: currentData.suit.coronalHoles.timestamp
          },
          solarFlares: {
            detected: currentData.suit.solarFlares.detected,
            class: currentData.suit.solarFlares.class,
            intensity: currentData.suit.solarFlares.intensity,
            location: currentData.suit.solarFlares.location,
            quality: currentData.suit.solarFlares.quality,
            lastUpdate: currentData.suit.solarFlares.timestamp
          }
        },
        operationalMode: 'nominal',
        powerConsumption: '18.3 W',
        temperature: '21.8°C',
        lastCalibration: '2024-01-12T00:00:00Z'
      },
      
      spacecraft: {
        position: 'L1 Lagrange Point',
        distance: '1.5 million km from Earth',
        communicationStatus: 'nominal',
        dataLatency: currentData.quality.communicationDelay + ' minutes',
        nextPassTime: calculateNextPass(),
        attitude: 'sun-pointing',
        powerGeneration: '850 W',
        batteryLevel: '98%'
      }
    };
    
    res.json(instrumentStatus);
  } catch (error) {
    console.error('Error fetching instrument status:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to retrieve instrument status'
    });
  }
});

// Get system health metrics
router.get('/health', (req, res) => {
  try {
    const dataSimulator = req.app.locals.dataSimulator;
    const wsManager = req.app.locals.wsManager;
    
    const currentData = dataSimulator.getLatestData();
    const wsStats = wsManager.getStatistics();
    
    // Calculate health scores
    const dataQualityScore = currentData ? 
      Math.min(100, currentData.quality.dataCompleteness) : 0;
    
    const communicationScore = currentData ? 
      Math.max(0, 100 - (currentData.quality.communicationDelay * 5)) : 0;
    
    const systemLoadScore = Math.max(0, 100 - (process.memoryUsage().heapUsed / process.memoryUsage().heapTotal * 100));
    
    const overallHealth = Math.round((dataQualityScore + communicationScore + systemLoadScore) / 3);
    
    const healthMetrics = {
      overall: {
        score: overallHealth,
        status: overallHealth > 80 ? 'healthy' : overallHealth > 60 ? 'warning' : 'critical',
        lastUpdate: new Date().toISOString()
      },
      
      components: {
        dataAcquisition: {
          score: dataQualityScore,
          status: dataQualityScore > 90 ? 'excellent' : dataQualityScore > 70 ? 'good' : 'poor',
          metrics: currentData ? {
            completeness: currentData.quality.dataCompleteness,
            signalToNoise: currentData.quality.signalToNoise,
            calibrationStatus: currentData.quality.calibrationStatus
          } : null
        },
        
        communication: {
          score: communicationScore,
          status: communicationScore > 80 ? 'excellent' : communicationScore > 60 ? 'good' : 'poor',
          metrics: currentData ? {
            latency: currentData.quality.communicationDelay,
            lastContact: currentData.timestamp
          } : null
        },
        
        systemPerformance: {
          score: systemLoadScore,
          status: systemLoadScore > 80 ? 'excellent' : systemLoadScore > 60 ? 'good' : 'poor',
          metrics: {
            memoryUsage: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
            uptime: Math.round(process.uptime()),
            connectedClients: wsStats.connectedClients
          }
        }
      },
      
      trends: {
        dataQuality: calculateDataQualityTrend(dataSimulator),
        alertFrequency: calculateAlertFrequencyTrend(),
        systemLoad: 'stable'
      },
      
      recommendations: generateHealthRecommendations(overallHealth, {
        dataQuality: dataQualityScore,
        communication: communicationScore,
        systemLoad: systemLoadScore
      })
    };
    
    res.json(healthMetrics);
  } catch (error) {
    console.error('Error fetching health metrics:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to retrieve health metrics'
    });
  }
});

// Get system configuration
router.get('/config', (req, res) => {
  try {
    const configuration = {
      system: {
        version: '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        region: 'Asia/Kolkata',
        deployment: 'production-simulation'
      },
      
      dataAcquisition: {
        updateInterval: '1 second',
        retentionPeriod: '30 days',
        dataLatency: '2-3 minutes',
        qualityThreshold: 90
      },
      
      anomalyDetection: {
        algorithms: ['threshold-based', 'trend-analysis', 'pattern-recognition'],
        sensitivity: 'high',
        confidenceMinimum: 60,
        processingInterval: '30 seconds'
      },
      
      alerting: {
        channels: ['email', 'sms', 'webhook', 'dashboard'],
        escalationEnabled: true,
        autoResolution: true,
        cooldownPeriods: {
          cme: 5,
          solar_flare: 10,
          geomagnetic_storm: 15
        }
      },
      
      communication: {
        websocket: {
          port: 3002,
          maxConnections: 100,
          heartbeatInterval: 15
        },
        api: {
          rateLimit: '1000/hour',
          timeout: 30,
          retries: 3
        }
      },
      
      external: {
        cactusDatabase: 'enabled',
        noaaApi: 'enabled',
        spacePol: 'enabled',
        donkiApi: 'enabled'
      }
    };
    
    res.json(configuration);
  } catch (error) {
    console.error('Error fetching system configuration:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to retrieve system configuration'
    });
  }
});

// Get system logs (simplified)
router.get('/logs', (req, res) => {
  try {
    const level = req.query.level || 'info';
    const limit = parseInt(req.query.limit) || 50;
    
    // Simulated log entries
    const logs = generateSimulatedLogs(limit, level);
    
    res.json({
      logs,
      level,
      count: logs.length,
      timestamp: new Date().toISOString(),
      note: 'This is a simulated log endpoint for demonstration'
    });
  } catch (error) {
    console.error('Error fetching system logs:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to retrieve system logs'
    });
  }
});

// System maintenance operations
router.post('/maintenance/:operation', (req, res) => {
  try {
    const operation = req.params.operation;
    const { confirmedBy } = req.body;
    
    if (!confirmedBy) {
      return res.status(400).json({
        error: 'Missing confirmation',
        message: 'confirmedBy field is required for maintenance operations'
      });
    }
    
    switch (operation) {
      case 'cleanup':
        performCleanup();
        res.json({
          success: true,
          operation: 'cleanup',
          message: 'System cleanup completed successfully',
          confirmedBy,
          timestamp: new Date().toISOString()
        });
        break;
        
      case 'reset-alerts':
        const alertSystem = req.app.locals.alertSystem;
        alertSystem.performMaintenanceTasks();
        res.json({
          success: true,
          operation: 'reset-alerts',
          message: 'Alert system maintenance completed',
          confirmedBy,
          timestamp: new Date().toISOString()
        });
        break;
        
      case 'restart-simulation':
        const dataSimulator = req.app.locals.dataSimulator;
        dataSimulator.stopSimulation();
        setTimeout(() => dataSimulator.startSimulation(), 1000);
        res.json({
          success: true,
          operation: 'restart-simulation',
          message: 'Data simulation restarted',
          confirmedBy,
          timestamp: new Date().toISOString()
        });
        break;
        
      default:
        res.status(400).json({
          error: 'Invalid operation',
          message: `Unknown maintenance operation: ${operation}`,
          availableOperations: ['cleanup', 'reset-alerts', 'restart-simulation']
        });
    }
  } catch (error) {
    console.error('Error performing maintenance operation:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to perform maintenance operation'
    });
  }
});

// Helper functions

function calculateNextPass() {
  // Simulate next communication pass
  const nextPass = new Date(Date.now() + (2 + Math.random() * 4) * 3600000);
  return nextPass.toISOString();
}

function calculateDataQualityTrend(dataSimulator) {
  const recentData = dataSimulator.getHistoricalData(3600000); // Last hour
  
  if (recentData.length < 10) return 'insufficient_data';
  
  const qualityScores = recentData.map(d => d.quality.dataCompleteness);
  const firstHalf = qualityScores.slice(0, Math.floor(qualityScores.length / 2));
  const secondHalf = qualityScores.slice(Math.floor(qualityScores.length / 2));
  
  const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
  const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
  
  if (secondAvg > firstAvg + 2) return 'improving';
  if (secondAvg < firstAvg - 2) return 'degrading';
  return 'stable';
}

function calculateAlertFrequencyTrend() {
  // Simplified trend calculation
  return 'stable';
}

function generateHealthRecommendations(overallHealth, scores) {
  const recommendations = [];
  
  if (overallHealth < 70) {
    recommendations.push('System requires immediate attention');
  }
  
  if (scores.dataQuality < 80) {
    recommendations.push('Check instrument calibration and data links');
  }
  
  if (scores.communication < 70) {
    recommendations.push('Verify communication systems and antenna alignment');
  }
  
  if (scores.systemLoad < 70) {
    recommendations.push('Consider reducing system load or upgrading resources');
  }
  
  if (recommendations.length === 0) {
    recommendations.push('System operating within normal parameters');
  }
  
  return recommendations;
}

function generateSimulatedLogs(limit, level) {
  const levels = ['error', 'warn', 'info', 'debug'];
  const messages = [
    'Data acquisition cycle completed',
    'Anomaly detection scan finished',
    'WebSocket client connected',
    'Alert notification sent',
    'System health check passed',
    'CME detection algorithm executed',
    'Database cleanup completed',
    'Communication link established'
  ];
  
  const logs = [];
  
  for (let i = 0; i < limit; i++) {
    const logLevel = level === 'all' ? 
      levels[Math.floor(Math.random() * levels.length)] : level;
    
    const timestamp = new Date(Date.now() - i * 60000).toISOString();
    const message = messages[Math.floor(Math.random() * messages.length)];
    
    logs.unshift({
      timestamp,
      level: logLevel,
      message,
      component: 'cme-detection-system',
      correlationId: 'req_' + Math.random().toString(36).substr(2, 8)
    });
  }
  
  return logs;
}

function performCleanup() {
  // Simulate cleanup operations
  if (global.gc) {
    global.gc();
  }
  console.log('🧹 System cleanup performed');
}

export default router;
