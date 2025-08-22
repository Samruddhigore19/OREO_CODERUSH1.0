import express from 'express';

const router = express.Router();

// Get current solar wind parameters
router.get('/current', (req, res) => {
  try {
    const dataSimulator = req.app.locals.dataSimulator;
    const currentData = dataSimulator.getLatestData();
    
    if (!currentData) {
      return res.status(503).json({
        error: 'Data not available',
        message: 'Solar wind data is currently unavailable'
      });
    }
    
    const response = {
      timestamp: currentData.timestamp,
      source: 'aditya-l1-aspex',
      data: {
        solarWind: {
          speed: currentData.aspex.solarWindSpeed,
          density: currentData.aspex.protonDensity,
          temperature: currentData.aspex.protonTemperature,
          alphaRatio: currentData.aspex.alphaParticleRatio
        },
        magneticField: currentData.derived.interplanetaryMagneticField,
        plasma: {
          beta: currentData.derived.plasmaBeta,
          alfvenSpeed: currentData.derived.alfvenSpeed
        },
        quality: currentData.quality
      }
    };
    
    res.json(response);
  } catch (error) {
    console.error('Error fetching current solar wind data:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to retrieve solar wind data'
    });
  }
});

// Get historical solar wind data
router.get('/history', (req, res) => {
  try {
    const dataSimulator = req.app.locals.dataSimulator;
    const timeRange = parseInt(req.query.timeRange) || 3600000; // 1 hour default
    const points = parseInt(req.query.points) || 100;
    const parameter = req.query.parameter || 'all';
    
    const historicalData = dataSimulator.getHistoricalData(timeRange);
    
    if (historicalData.length === 0) {
      return res.json({
        data: [],
        timeRange,
        count: 0,
        message: 'No historical data available for the specified time range'
      });
    }
    
    let processedData;
    
    switch (parameter) {
      case 'speed':
        processedData = historicalData.slice(-points).map(d => ({
          timestamp: d.timestamp,
          value: d.aspex.solarWindSpeed.value,
          unit: d.aspex.solarWindSpeed.unit,
          quality: d.aspex.solarWindSpeed.quality
        }));
        break;
        
      case 'density':
        processedData = historicalData.slice(-points).map(d => ({
          timestamp: d.timestamp,
          value: d.aspex.protonDensity.value,
          unit: d.aspex.protonDensity.unit,
          quality: d.aspex.protonDensity.quality
        }));
        break;
        
      case 'temperature':
        processedData = historicalData.slice(-points).map(d => ({
          timestamp: d.timestamp,
          value: d.aspex.protonTemperature.value,
          unit: d.aspex.protonTemperature.unit,
          quality: d.aspex.protonTemperature.quality
        }));
        break;
        
      case 'magnetic_field':
        processedData = historicalData.slice(-points).map(d => ({
          timestamp: d.timestamp,
          bx: d.derived.interplanetaryMagneticField.bx,
          by: d.derived.interplanetaryMagneticField.by,
          bz: d.derived.interplanetaryMagneticField.bz,
          magnitude: d.derived.interplanetaryMagneticField.magnitude,
          unit: d.derived.interplanetaryMagneticField.unit,
          quality: d.derived.interplanetaryMagneticField.quality
        }));
        break;
        
      default: // 'all'
        processedData = historicalData.slice(-points).map(d => ({
          timestamp: d.timestamp,
          solarWind: {
            speed: d.aspex.solarWindSpeed.value,
            density: d.aspex.protonDensity.value,
            temperature: d.aspex.protonTemperature.value
          },
          magneticField: {
            bx: d.derived.interplanetaryMagneticField.bx,
            by: d.derived.interplanetaryMagneticField.by,
            bz: d.derived.interplanetaryMagneticField.bz,
            magnitude: d.derived.interplanetaryMagneticField.magnitude
          },
          indices: {
            kp: d.derived.kpIndex.value,
            dst: d.derived.dstIndex.value
          }
        }));
    }
    
    const response = {
      parameter,
      timeRange,
      requestedPoints: points,
      actualPoints: processedData.length,
      data: processedData,
      metadata: {
        startTime: processedData[0]?.timestamp,
        endTime: processedData[processedData.length - 1]?.timestamp,
        source: 'aditya-l1-aspex',
        dataQuality: 'real-time-simulated'
      }
    };
    
    res.json(response);
  } catch (error) {
    console.error('Error fetching historical solar wind data:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to retrieve historical solar wind data'
    });
  }
});

// Get real-time data stream info
router.get('/stream/info', (req, res) => {
  try {
    const wsManager = req.app.locals.wsManager;
    const stats = wsManager.getStatistics();
    
    res.json({
      streamStatus: 'active',
      updateInterval: '1 second',
      connectedClients: stats.connectedClients,
      availableChannels: ['all', 'data', 'solar_wind'],
      websocketEndpoint: '/ws',
      subscriptionInfo: {
        message: 'Send {"type": "subscribe", "channels": ["data"]} to receive real-time updates',
        example: {
          type: 'subscribe',
          channels: ['data', 'solar_wind']
        }
      },
      dataFormat: {
        timestamp: 'ISO 8601 string',
        solarWind: {
          speed: 'km/s',
          density: 'particles/cm³',
          temperature: 'K'
        },
        magneticField: {
          components: 'nT',
          magnitude: 'nT'
        }
      }
    });
  } catch (error) {
    console.error('Error getting stream info:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to retrieve stream information'
    });
  }
});

// Get data statistics
router.get('/statistics', (req, res) => {
  try {
    const dataSimulator = req.app.locals.dataSimulator;
    const historicalData = dataSimulator.getHistoricalData(86400000); // 24 hours
    
    if (historicalData.length === 0) {
      return res.json({
        message: 'No data available for statistics',
        timeRange: '24 hours',
        dataPoints: 0
      });
    }
    
    // Calculate statistics
    const speeds = historicalData.map(d => d.aspex.solarWindSpeed.value);
    const densities = historicalData.map(d => d.aspex.protonDensity.value);
    const temperatures = historicalData.map(d => d.aspex.protonTemperature.value);
    const imfMagnitudes = historicalData.map(d => d.derived.interplanetaryMagneticField.magnitude);
    
    const calculateStats = (values) => ({
      min: Math.min(...values),
      max: Math.max(...values),
      mean: values.reduce((a, b) => a + b, 0) / values.length,
      median: values.sort((a, b) => a - b)[Math.floor(values.length / 2)]
    });
    
    const response = {
      timeRange: '24 hours',
      dataPoints: historicalData.length,
      statistics: {
        solarWindSpeed: {
          ...calculateStats(speeds),
          unit: 'km/s'
        },
        protonDensity: {
          ...calculateStats(densities),
          unit: 'particles/cm³'
        },
        protonTemperature: {
          ...calculateStats(temperatures),
          unit: 'K'
        },
        magneticField: {
          ...calculateStats(imfMagnitudes),
          unit: 'nT'
        }
      },
      dataQuality: {
        completeness: 98.5,
        averageDelay: 2.3,
        instrumentStatus: 'nominal'
      },
      lastUpdate: new Date().toISOString()
    };
    
    res.json(response);
  } catch (error) {
    console.error('Error calculating statistics:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to calculate statistics'
    });
  }
});

// Get ion composition data
router.get('/composition', (req, res) => {
  try {
    const dataSimulator = req.app.locals.dataSimulator;
    const currentData = dataSimulator.getLatestData();
    
    if (!currentData) {
      return res.status(503).json({
        error: 'Data not available',
        message: 'Ion composition data is currently unavailable'
      });
    }
    
    const response = {
      timestamp: currentData.timestamp,
      source: 'aditya-l1-aspex',
      composition: currentData.aspex.ionComposition,
      alphaParticleRatio: currentData.aspex.alphaParticleRatio,
      quality: currentData.quality,
      notes: [
        'Ion composition percentages may not sum to 100% due to trace elements',
        'Alpha particle ratio represents He²⁺/H⁺ abundance ratio',
        'Real-time measurements with ~2-3 minute data latency'
      ]
    };
    
    res.json(response);
  } catch (error) {
    console.error('Error fetching ion composition data:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to retrieve ion composition data'
    });
  }
});

// Get specific parameter trends
router.get('/trends/:parameter', (req, res) => {
  try {
    const parameter = req.params.parameter;
    const hours = parseInt(req.query.hours) || 6;
    const dataSimulator = req.app.locals.dataSimulator;
    
    const timeRange = hours * 3600000; // Convert to milliseconds
    const historicalData = dataSimulator.getHistoricalData(timeRange);
    
    if (historicalData.length === 0) {
      return res.json({
        parameter,
        timeRange: `${hours} hours`,
        data: [],
        trend: 'insufficient_data'
      });
    }
    
    let trendData;
    
    switch (parameter) {
      case 'speed':
        trendData = historicalData.map(d => ({
          timestamp: d.timestamp,
          value: d.aspex.solarWindSpeed.value
        }));
        break;
        
      case 'density':
        trendData = historicalData.map(d => ({
          timestamp: d.timestamp,
          value: d.aspex.protonDensity.value
        }));
        break;
        
      case 'temperature':
        trendData = historicalData.map(d => ({
          timestamp: d.timestamp,
          value: d.aspex.protonTemperature.value
        }));
        break;
        
      case 'bz':
        trendData = historicalData.map(d => ({
          timestamp: d.timestamp,
          value: d.derived.interplanetaryMagneticField.bz
        }));
        break;
        
      case 'kp':
        trendData = historicalData.map(d => ({
          timestamp: d.timestamp,
          value: d.derived.kpIndex.value
        }));
        break;
        
      default:
        return res.status(400).json({
          error: 'Invalid parameter',
          message: 'Valid parameters: speed, density, temperature, bz, kp'
        });
    }
    
    // Calculate trend direction
    const values = trendData.map(d => d.value);
    const firstHalf = values.slice(0, Math.floor(values.length / 2));
    const secondHalf = values.slice(Math.floor(values.length / 2));
    
    const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
    
    let trend;
    const changePercent = ((secondAvg - firstAvg) / firstAvg) * 100;
    
    if (Math.abs(changePercent) < 5) {
      trend = 'stable';
    } else if (changePercent > 0) {
      trend = 'increasing';
    } else {
      trend = 'decreasing';
    }
    
    const response = {
      parameter,
      timeRange: `${hours} hours`,
      dataPoints: trendData.length,
      trend: {
        direction: trend,
        changePercent: changePercent.toFixed(2),
        currentValue: values[values.length - 1],
        averageValue: values.reduce((a, b) => a + b, 0) / values.length
      },
      data: trendData.slice(-50), // Return last 50 points for visualization
      analysis: {
        volatility: this.calculateVolatility(values),
        peakValue: Math.max(...values),
        minValue: Math.min(...values),
        crossingEvents: this.findThresholdCrossings(values, parameter)
      }
    };
    
    res.json(response);
  } catch (error) {
    console.error('Error fetching parameter trends:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to retrieve parameter trends'
    });
  }
});

// Helper function for volatility calculation
function calculateVolatility(values) {
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance = values.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / values.length;
  return Math.sqrt(variance);
}

// Helper function for threshold crossing events
function findThresholdCrossings(values, parameter) {
  const thresholds = {
    speed: [600, 800], // High speed thresholds
    density: [15, 25], // High density thresholds
    temperature: [500000, 1000000], // High temperature thresholds
    bz: [-5, -10], // Southward IMF thresholds
    kp: [5, 7] // Geomagnetic activity thresholds
  };
  
  const paramThresholds = thresholds[parameter] || [];
  const crossings = [];
  
  for (const threshold of paramThresholds) {
    let aboveThreshold = false;
    
    for (let i = 0; i < values.length; i++) {
      const currentAbove = parameter === 'bz' ? values[i] < threshold : values[i] > threshold;
      
      if (currentAbove && !aboveThreshold) {
        crossings.push({
          type: 'crossed_above',
          threshold,
          index: i,
          value: values[i]
        });
      } else if (!currentAbove && aboveThreshold) {
        crossings.push({
          type: 'crossed_below',
          threshold,
          index: i,
          value: values[i]
        });
      }
      
      aboveThreshold = currentAbove;
    }
  }
  
  return crossings;
}

export default router;
