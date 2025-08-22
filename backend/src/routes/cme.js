import express from 'express';

const router = express.Router();

// Get current CME detections
router.get('/current', (req, res) => {
  try {
    const dataSimulator = req.app.locals.dataSimulator;
    const anomalyDetector = req.app.locals.anomalyDetector;
    
    const currentData = dataSimulator.getLatestData();
    const currentCME = dataSimulator.getCurrentCMEEvent();
    const recentAnomalies = anomalyDetector.getAnomaliesByCategory('cme', 5);
    
    const response = {
      timestamp: new Date().toISOString(),
      currentCMEEvent: currentCME,
      recentDetections: recentAnomalies,
      detectionStatus: {
        monitoring: true,
        sensitivity: 'high',
        lastUpdate: currentData?.timestamp,
        dataQuality: currentData?.quality?.dataCompleteness || 0
      },
      parameters: currentData ? {
        solarWindSpeed: currentData.aspex.solarWindSpeed.value,
        protonDensity: currentData.aspex.protonDensity.value,
        protonTemperature: currentData.aspex.protonTemperature.value,
        imfMagnitude: currentData.derived.interplanetaryMagneticField.magnitude,
        imfBz: currentData.derived.interplanetaryMagneticField.bz
      } : null
    };
    
    res.json(response);
  } catch (error) {
    console.error('Error fetching current CME data:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to retrieve current CME data'
    });
  }
});

// Get CME event history
router.get('/history', (req, res) => {
  try {
    const anomalyDetector = req.app.locals.anomalyDetector;
    const limit = parseInt(req.query.limit) || 20;
    const severity = req.query.severity;
    const startDate = req.query.startDate;
    const endDate = req.query.endDate;
    
    let cmeEvents = anomalyDetector.getAnomaliesByCategory('cme', 100);
    
    // Filter by severity if specified
    if (severity) {
      cmeEvents = cmeEvents.filter(event => event.severity === severity);
    }
    
    // Filter by date range if specified
    if (startDate || endDate) {
      const start = startDate ? new Date(startDate).getTime() : 0;
      const end = endDate ? new Date(endDate).getTime() : Date.now();
      
      cmeEvents = cmeEvents.filter(event => {
        const eventTime = new Date(event.timestamp).getTime();
        return eventTime >= start && eventTime <= end;
      });
    }
    
    // Apply limit
    cmeEvents = cmeEvents.slice(-limit);
    
    // Enhance events with additional analysis
    const enhancedEvents = cmeEvents.map(event => ({
      ...event,
      analysis: {
        earthImpactCategory: categorizeEarthImpact(event.earthImpact?.probability || 0),
        severityScore: calculateSeverityScore(event),
        riskLevel: assessRiskLevel(event),
        estimatedDuration: estimateEventDuration(event.severity)
      },
      classification: {
        speedClass: classifySpeed(event.parameters?.solarWindSpeed),
        densityClass: classifyDensity(event.parameters?.protonDensity),
        intensityClass: event.severity
      }
    }));
    
    const statistics = calculateCMEStatistics(enhancedEvents);
    
    const response = {
      events: enhancedEvents,
      totalEvents: cmeEvents.length,
      filters: {
        severity: severity || 'all',
        dateRange: {
          start: startDate || 'earliest',
          end: endDate || 'latest'
        },
        limit
      },
      statistics
    };
    
    res.json(response);
  } catch (error) {
    console.error('Error fetching CME history:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to retrieve CME history'
    });
  }
});

// Trigger a simulated CME event (for testing purposes)
router.post('/simulate', (req, res) => {
  try {
    const dataSimulator = req.app.locals.dataSimulator;
    const { intensity = 1.0, duration = 300000, earthDirected = true } = req.body;
    
    // Validate parameters
    if (intensity < 0.1 || intensity > 2.0) {
      return res.status(400).json({
        error: 'Invalid intensity',
        message: 'Intensity must be between 0.1 and 2.0'
      });
    }
    
    if (duration < 60000 || duration > 3600000) {
      return res.status(400).json({
        error: 'Invalid duration',
        message: 'Duration must be between 60 seconds and 1 hour'
      });
    }
    
    // Check if CME is already in progress
    const currentCME = dataSimulator.getCurrentCMEEvent();
    if (currentCME) {
      return res.status(409).json({
        error: 'CME already in progress',
        message: 'Cannot trigger new CME while another is active',
        currentEvent: currentCME
      });
    }
    
    // Trigger the CME event
    dataSimulator.triggerCMEEvent(intensity, duration);
    
    const response = {
      success: true,
      message: 'CME event simulation triggered',
      parameters: {
        intensity,
        duration: duration / 1000 + ' seconds',
        earthDirected,
        estimatedDetectionTime: '30-60 seconds',
        estimatedPeakTime: Math.floor(duration / 2 / 1000) + ' seconds'
      },
      warning: 'This is a simulated event for testing purposes'
    };
    
    res.json(response);
  } catch (error) {
    console.error('Error triggering CME simulation:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to trigger CME simulation'
    });
  }
});

// Get CME impact predictions
router.get('/impact/earth', (req, res) => {
  try {
    const anomalyDetector = req.app.locals.anomalyDetector;
    const dataSimulator = req.app.locals.dataSimulator;
    
    const recentCMEs = anomalyDetector.getAnomaliesByCategory('cme', 5);
    const currentCME = dataSimulator.getCurrentCMEEvent();
    
    const activeCMEs = recentCMEs.filter(cme => 
      cme.status === 'active' && 
      cme.earthImpact?.probability > 0.3
    );
    
    const predictions = activeCMEs.map(cme => ({
      eventId: cme.id,
      timestamp: cme.timestamp,
      impactPrediction: {
        probability: cme.earthImpact.probability,
        estimatedArrival: cme.earthImpact.estimatedArrivalTime,
        confidence: calculateImpactConfidence(cme),
        severity: cme.severity
      },
      expectedEffects: {
        geomagneticStorm: predictGeomagneticStorm(cme),
        radioBlackouts: predictRadioBlackouts(cme),
        satelliteEffects: predictSatelliteEffects(cme),
        auroralActivity: predictAuroralActivity(cme)
      },
      affectedRegions: determineAffectedRegions(cme),
      recommendations: generateImpactRecommendations(cme)
    }));
    
    // Add current ongoing CME if exists
    if (currentCME && currentCME.earthDirected) {
      const ongoingPrediction = {
        eventId: 'current_simulation',
        timestamp: new Date().toISOString(),
        status: 'ongoing',
        impactPrediction: {
          probability: 0.85,
          estimatedArrival: estimateArrivalFromSpeed(currentCME.estimatedSpeed),
          confidence: 'high',
          severity: currentCME.type
        },
        expectedEffects: {
          geomagneticStorm: currentCME.type === 'major' ? 'severe' : 'moderate',
          radioBlackouts: 'possible',
          satelliteEffects: 'moderate',
          auroralActivity: 'enhanced'
        }
      };
      predictions.unshift(ongoingPrediction);
    }
    
    const response = {
      earthImpactPredictions: predictions,
      summary: {
        activeCMEs: predictions.length,
        highProbabilityEvents: predictions.filter(p => p.impactPrediction.probability > 0.7).length,
        nextImpactTime: predictions.length > 0 ? predictions[0].impactPrediction.estimatedArrival : null,
        overallRiskLevel: calculateOverallRiskLevel(predictions)
      },
      lastUpdate: new Date().toISOString()
    };
    
    res.json(response);
  } catch (error) {
    console.error('Error fetching Earth impact predictions:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to retrieve Earth impact predictions'
    });
  }
});

// Get CME classification details
router.get('/classification', (req, res) => {
  try {
    const response = {
      speedClassification: {
        slow: { range: '200-400 km/s', description: 'Typical solar wind speeds' },
        fast: { range: '400-600 km/s', description: 'Enhanced solar wind' },
        'very-fast': { range: '600-1000 km/s', description: 'CME-driven enhancement' },
        extreme: { range: '>1000 km/s', description: 'Extreme CME events' }
      },
      densityClassification: {
        low: { range: '1-5 p/cm³', description: 'Below average density' },
        normal: { range: '5-15 p/cm³', description: 'Typical solar wind density' },
        enhanced: { range: '15-30 p/cm³', description: 'CME-associated enhancement' },
        extreme: { range: '>30 p/cm³', description: 'Rare extreme events' }
      },
      severityClassification: {
        minor: {
          description: 'Weak CME with minimal Earth impact',
          characteristics: ['Speed < 600 km/s', 'Low density enhancement', 'Brief duration'],
          effects: ['Minor radio disruptions', 'Weak auroral activity']
        },
        moderate: {
          description: 'Significant CME with noticeable Earth impact',
          characteristics: ['Speed 600-800 km/s', 'Moderate density enhancement', 'Extended duration'],
          effects: ['Radio blackouts possible', 'Moderate geomagnetic activity', 'Satellite drag increase']
        },
        severe: {
          description: 'Major CME with significant Earth impact',
          characteristics: ['Speed > 800 km/s', 'High density enhancement', 'Long duration'],
          effects: ['HF radio blackouts', 'Strong geomagnetic storms', 'Power grid effects possible']
        }
      },
      directionClassification: {
        'earth-directed': 'CME directed toward Earth (±30° from Sun-Earth line)',
        'near-earth': 'CME possibly affecting Earth (±30-60° from Sun-Earth line)',
        'non-earth': 'CME not directed toward Earth (>60° from Sun-Earth line)'
      },
      detectionMethods: {
        'speed-enhancement': 'Sustained increase in solar wind speed',
        'density-enhancement': 'Elevated proton density',
        'temperature-signature': 'Characteristic temperature profile',
        'magnetic-field': 'IMF rotation and enhancement',
        'composition-anomaly': 'Unusual ion composition ratios'
      }
    };
    
    res.json(response);
  } catch (error) {
    console.error('Error fetching CME classification info:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to retrieve CME classification information'
    });
  }
});

// Get real-time CME monitoring status
router.get('/monitoring/status', (req, res) => {
  try {
    const dataSimulator = req.app.locals.dataSimulator;
    const wsManager = req.app.locals.wsManager;
    
    const currentData = dataSimulator.getLatestData();
    const wsStats = wsManager.getStatistics();
    
    const response = {
      monitoringStatus: 'active',
      dataStream: {
        status: currentData ? 'online' : 'offline',
        latency: currentData ? '2.3 minutes' : 'N/A',
        updateFrequency: '1 second',
        lastUpdate: currentData?.timestamp
      },
      detectionSensitivity: {
        speedThreshold: '200 km/s above baseline',
        densityThreshold: '10 p/cm³ above baseline',
        temperatureThreshold: '300,000 K above baseline',
        confidenceMinimum: '60%'
      },
      realTimeConnections: {
        activeClients: wsStats.connectedClients,
        subscribedToAlerts: wsStats.subscriptionStats?.alerts || 0,
        dataStreamClients: wsStats.subscriptionStats?.data || 0
      },
      instrumentStatus: currentData ? {
        aspex: currentData.quality.instrumentHealth.aspex,
        suit: currentData.quality.instrumentHealth.suit,
        dataCompleteness: currentData.quality.dataCompleteness,
        signalToNoise: currentData.quality.signalToNoise
      } : null,
      alertSystem: {
        status: 'active',
        emailNotifications: 'enabled',
        smsAlerts: 'enabled for critical events',
        webhookEndpoints: 2
      }
    };
    
    res.json(response);
  } catch (error) {
    console.error('Error fetching monitoring status:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to retrieve monitoring status'
    });
  }
});

// Helper functions for CME analysis

function categorizeEarthImpact(probability) {
  if (probability > 0.8) return 'high';
  if (probability > 0.5) return 'medium';
  if (probability > 0.2) return 'low';
  return 'minimal';
}

function calculateSeverityScore(event) {
  const speedScore = Math.min(10, (event.parameters?.solarWindSpeed || 400) / 100);
  const densityScore = Math.min(10, (event.parameters?.protonDensity || 5) / 3);
  const tempScore = Math.min(10, (event.parameters?.protonTemperature || 100000) / 100000);
  
  return Math.round((speedScore + densityScore + tempScore) / 3);
}

function assessRiskLevel(event) {
  const severity = event.severity;
  const confidence = event.confidence;
  const earthImpact = event.earthImpact?.probability || 0;
  
  const riskScore = (
    (severity === 'severe' ? 3 : severity === 'moderate' ? 2 : 1) +
    (confidence / 100 * 2) +
    (earthImpact * 3)
  ) / 3;
  
  if (riskScore > 2.5) return 'high';
  if (riskScore > 1.5) return 'medium';
  return 'low';
}

function estimateEventDuration(severity) {
  const durations = {
    minor: '6-12 hours',
    moderate: '12-24 hours',
    severe: '24-48 hours'
  };
  return durations[severity] || '6-12 hours';
}

function classifySpeed(speed) {
  if (!speed) return 'unknown';
  if (speed > 1000) return 'extreme';
  if (speed > 600) return 'very-fast';
  if (speed > 400) return 'fast';
  return 'slow';
}

function classifyDensity(density) {
  if (!density) return 'unknown';
  if (density > 30) return 'extreme';
  if (density > 15) return 'enhanced';
  if (density > 5) return 'normal';
  return 'low';
}

function calculateCMEStatistics(events) {
  if (events.length === 0) {
    return {
      totalEvents: 0,
      severityDistribution: {},
      averageConfidence: 0
    };
  }
  
  const severityDistribution = events.reduce((acc, event) => {
    acc[event.severity] = (acc[event.severity] || 0) + 1;
    return acc;
  }, {});
  
  const avgConfidence = events.reduce((sum, event) => sum + event.confidence, 0) / events.length;
  
  return {
    totalEvents: events.length,
    severityDistribution,
    averageConfidence: Math.round(avgConfidence),
    earthDirectedEvents: events.filter(e => e.earthImpact?.probability > 0.5).length,
    recentTrend: analyzeRecentTrend(events)
  };
}

function analyzeRecentTrend(events) {
  if (events.length < 2) return 'insufficient_data';
  
  const recentEvents = events.slice(-10);
  const olderEvents = events.slice(-20, -10);
  
  if (olderEvents.length === 0) return 'insufficient_data';
  
  const recentRate = recentEvents.length;
  const olderRate = olderEvents.length;
  
  if (recentRate > olderRate * 1.2) return 'increasing';
  if (recentRate < olderRate * 0.8) return 'decreasing';
  return 'stable';
}

function calculateImpactConfidence(cme) {
  const baseConfidence = cme.confidence;
  const speedFactor = cme.parameters?.solarWindSpeed > 600 ? 1.1 : 0.9;
  const densityFactor = cme.parameters?.protonDensity > 15 ? 1.1 : 0.9;
  
  return Math.min(95, Math.round(baseConfidence * speedFactor * densityFactor));
}

function predictGeomagneticStorm(cme) {
  const severity = cme.severity;
  const probability = cme.earthImpact?.probability || 0;
  
  if (severity === 'severe' && probability > 0.7) return 'major storm likely';
  if (severity === 'moderate' && probability > 0.5) return 'moderate storm possible';
  if (probability > 0.3) return 'minor disturbances possible';
  return 'minimal effects expected';
}

function predictRadioBlackouts(cme) {
  if (cme.severity === 'severe') return 'HF radio blackouts likely';
  if (cme.severity === 'moderate') return 'radio disruptions possible';
  return 'minimal radio effects';
}

function predictSatelliteEffects(cme) {
  if (cme.severity === 'severe') return 'significant orbital drag, possible operations impact';
  if (cme.severity === 'moderate') return 'increased drag, monitor operations';
  return 'minimal effects expected';
}

function predictAuroralActivity(cme) {
  const probability = cme.earthImpact?.probability || 0;
  if (cme.severity === 'severe' && probability > 0.7) return 'visible at mid-latitudes';
  if (probability > 0.5) return 'enhanced activity at high latitudes';
  return 'normal background levels';
}

function determineAffectedRegions(cme) {
  const severity = cme.severity;
  const probability = cme.earthImpact?.probability || 0;
  
  if (severity === 'severe' && probability > 0.7) {
    return ['polar regions', 'high latitudes', 'mid-latitudes'];
  }
  if (probability > 0.5) {
    return ['polar regions', 'high latitudes'];
  }
  return ['polar regions'];
}

function generateImpactRecommendations(cme) {
  const recommendations = [];
  
  if (cme.severity === 'severe') {
    recommendations.push('Alert satellite operators');
    recommendations.push('Monitor power grid operations');
    recommendations.push('Consider flight path adjustments for polar routes');
    recommendations.push('Prepare for HF radio blackouts');
  } else if (cme.severity === 'moderate') {
    recommendations.push('Monitor satellite operations');
    recommendations.push('Check communication systems');
    recommendations.push('Observe geomagnetic activity');
  } else {
    recommendations.push('Continue normal monitoring');
    recommendations.push('Watch for minor fluctuations');
  }
  
  return recommendations;
}

function calculateOverallRiskLevel(predictions) {
  if (predictions.length === 0) return 'minimal';
  
  const maxProbability = Math.max(...predictions.map(p => p.impactPrediction.probability));
  const severeCMEs = predictions.filter(p => p.impactPrediction.severity === 'severe').length;
  
  if (maxProbability > 0.8 || severeCMEs > 0) return 'high';
  if (maxProbability > 0.5) return 'moderate';
  return 'low';
}

function estimateArrivalFromSpeed(speed) {
  const distance = 1500000; // km from L1 to Earth
  const travelTime = distance / speed; // hours
  const arrivalTime = new Date(Date.now() + travelTime * 3600000);
  
  return {
    estimatedHours: Math.round(travelTime * 10) / 10,
    arrivalTime: arrivalTime.toISOString(),
    uncertainty: '±6 hours'
  };
}

export default router;
