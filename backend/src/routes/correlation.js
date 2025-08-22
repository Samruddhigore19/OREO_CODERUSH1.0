import express from 'express';

const router = express.Router();

// Get correlation with external databases
router.get('/external', async (req, res) => {
  try {
    const source = req.query.source || 'all';
    const timeRange = parseInt(req.query.timeRange) || 86400000; // 24 hours
    
    const correlations = await fetchExternalCorrelations(source, timeRange);
    
    res.json({
      timestamp: new Date().toISOString(),
      timeRange: `${timeRange / 3600000} hours`,
      correlations,
      sources: {
        cactus: correlations.cactus ? 'available' : 'unavailable',
        noaa: correlations.noaa ? 'available' : 'unavailable',
        esa: correlations.esa ? 'available' : 'unavailable',
        stereo: correlations.stereo ? 'available' : 'unavailable'
      }
    });
  } catch (error) {
    console.error('Error fetching external correlations:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch external correlations'
    });
  }
});

// Get CACTus database correlation
router.get('/cactus', async (req, res) => {
  try {
    const anomalyDetector = req.app.locals.anomalyDetector;
    const recentCMEs = anomalyDetector.getAnomaliesByCategory('cme', 10);
    
    const cactusData = await fetchCACTusData();
    const correlation = correlateCMEEvents(recentCMEs, cactusData);
    
    res.json({
      timestamp: new Date().toISOString(),
      source: 'CACTus (Computer Aided CME Tracking)',
      correlation,
      summary: {
        aditya_detections: recentCMEs.length,
        cactus_events: cactusData.length,
        matches: correlation.matches.length,
        correlation_rate: correlation.matches.length / Math.max(1, recentCMEs.length)
      }
    });
  } catch (error) {
    console.error('Error fetching CACTus correlation:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch CACTus correlation'
    });
  }
});

// Get NOAA space weather correlation
router.get('/noaa', async (req, res) => {
  try {
    const dataSimulator = req.app.locals.dataSimulator;
    const anomalyDetector = req.app.locals.anomalyDetector;
    
    const currentData = dataSimulator.getLatestData();
    const recentAnomalies = anomalyDetector.getRecentAnomalies(20);
    
    const noaaData = await fetchNOAAData();
    const correlation = correlateWithNOAA(currentData, recentAnomalies, noaaData);
    
    res.json({
      timestamp: new Date().toISOString(),
      source: 'NOAA Space Weather Prediction Center',
      correlation,
      comparison: {
        solarWind: correlation.solarWind,
        geomagneticIndices: correlation.geomagneticIndices,
        solarActivity: correlation.solarActivity
      }
    });
  } catch (error) {
    console.error('Error fetching NOAA correlation:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch NOAA correlation'
    });
  }
});

// Get ESA space weather correlation
router.get('/esa', async (req, res) => {
  try {
    const anomalyDetector = req.app.locals.anomalyDetector;
    const recentAnomalies = anomalyDetector.getRecentAnomalies(15);
    
    const esaData = await fetchESAData();
    const correlation = correlateWithESA(recentAnomalies, esaData);
    
    res.json({
      timestamp: new Date().toISOString(),
      source: 'ESA Space Weather Service Network',
      correlation,
      validation: {
        eventMatches: correlation.eventMatches,
        parameterComparison: correlation.parameterComparison,
        confidenceMetrics: correlation.confidenceMetrics
      }
    });
  } catch (error) {
    console.error('Error fetching ESA correlation:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch ESA correlation'
    });
  }
});

// Get multi-source validation
router.get('/validation', async (req, res) => {
  try {
    const eventId = req.query.eventId;
    const anomalyDetector = req.app.locals.anomalyDetector;
    
    if (!eventId) {
      return res.status(400).json({
        error: 'Missing event ID',
        message: 'eventId parameter is required for validation'
      });
    }
    
    const event = anomalyDetector.getRecentAnomalies().find(a => a.id === eventId);
    
    if (!event) {
      return res.status(404).json({
        error: 'Event not found',
        message: `No event found with ID: ${eventId}`
      });
    }
    
    const validation = await performMultiSourceValidation(event);
    
    res.json({
      timestamp: new Date().toISOString(),
      eventId,
      event: {
        type: event.type,
        timestamp: event.timestamp,
        severity: event.severity,
        confidence: event.confidence
      },
      validation
    });
  } catch (error) {
    console.error('Error performing validation:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to perform multi-source validation'
    });
  }
});

// Get correlation statistics
router.get('/statistics', async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 7;
    const anomalyDetector = req.app.locals.anomalyDetector;
    
    const timeRange = days * 86400000;
    const startTime = new Date(Date.now() - timeRange).toISOString();
    const endTime = new Date().toISOString();
    
    const events = anomalyDetector.getAnomaliesByTimeRange(startTime, endTime);
    const stats = await calculateCorrelationStatistics(events, days);
    
    res.json({
      timestamp: new Date().toISOString(),
      period: `${days} days`,
      statistics: stats,
      summary: {
        totalEvents: events.length,
        validatedEvents: stats.validation.confirmed,
        correlationRate: stats.overallCorrelation,
        reliabilitScore: stats.reliability
      }
    });
  } catch (error) {
    console.error('Error calculating correlation statistics:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to calculate correlation statistics'
    });
  }
});

// Post event for external validation
router.post('/validate', async (req, res) => {
  try {
    const { eventData, sources } = req.body;
    
    if (!eventData) {
      return res.status(400).json({
        error: 'Missing event data',
        message: 'eventData is required for validation'
      });
    }
    
    const validationSources = sources || ['cactus', 'noaa', 'esa'];
    const validation = await validateEventWithSources(eventData, validationSources);
    
    res.json({
      timestamp: new Date().toISOString(),
      eventData,
      validation,
      conclusion: {
        validated: validation.overallConfidence > 0.7,
        confidence: validation.overallConfidence,
        supportingSources: validation.supportingSources.length,
        conflictingSources: validation.conflictingSources.length
      }
    });
  } catch (error) {
    console.error('Error validating event:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to validate event'
    });
  }
});

// Correlation helper functions

async function fetchExternalCorrelations(source, timeRange) {
  const correlations = {};
  
  if (source === 'all' || source === 'cactus') {
    correlations.cactus = await fetchCACTusData();
  }
  
  if (source === 'all' || source === 'noaa') {
    correlations.noaa = await fetchNOAAData();
  }
  
  if (source === 'all' || source === 'esa') {
    correlations.esa = await fetchESAData();
  }
  
  if (source === 'all' || source === 'stereo') {
    correlations.stereo = await fetchSTEREOData();
  }
  
  return correlations;
}

async function fetchCACTusData() {
  // Simulate CACTus database query
  return [
    {
      id: 'cactus_001',
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      type: 'cme',
      speed: 680,
      angle: 45,
      width: 120,
      source: 'SOHO/LASCO',
      confidence: 0.92
    },
    {
      id: 'cactus_002',
      timestamp: new Date(Date.now() - 7200000).toISOString(),
      type: 'cme',
      speed: 520,
      angle: 15,
      width: 85,
      source: 'STEREO-A',
      confidence: 0.87
    },
    {
      id: 'cactus_003',
      timestamp: new Date(Date.now() - 14400000).toISOString(),
      type: 'cme',
      speed: 890,
      angle: 8,
      width: 160,
      source: 'SOHO/LASCO',
      confidence: 0.94
    }
  ];
}

async function fetchNOAAData() {
  // Simulate NOAA SWPC data
  return {
    solarWind: {
      speed: 445,
      density: 7.8,
      temperature: 180000,
      bz: -2.1,
      timestamp: new Date().toISOString()
    },
    geomagneticIndices: {
      kp: 3.7,
      ap: 15,
      dst: -25,
      timestamp: new Date().toISOString()
    },
    solarActivity: {
      xrayFlux: 'C2.1',
      flareEvents: [
        {
          class: 'C5.4',
          timestamp: new Date(Date.now() - 1800000).toISOString(),
          location: 'N15W30'
        }
      ],
      protonFlux: 'normal'
    }
  };
}

async function fetchESAData() {
  // Simulate ESA space weather data
  return {
    solarWind: {
      speed: 448,
      density: 8.1,
      bField: 4.8,
      temperature: 175000
    },
    predictions: {
      geomagActivity: 'active',
      auroraVisibility: 'enhanced',
      radiationLevels: 'nominal'
    },
    alerts: [
      {
        type: 'geomagnetic_disturbance',
        level: 'yellow',
        timestamp: new Date(Date.now() - 900000).toISOString()
      }
    ]
  };
}

async function fetchSTEREOData() {
  // Simulate STEREO mission data
  return {
    cmeDetections: [
      {
        spacecraft: 'STEREO-A',
        timestamp: new Date(Date.now() - 5400000).toISOString(),
        speed: 625,
        direction: 'earth-directed',
        width: 95
      }
    ],
    solarWind: {
      speed: 442,
      density: 7.5,
      magnetic_field: 5.2
    }
  };
}

function correlateCMEEvents(adityaCMEs, cactusData) {
  const matches = [];
  const unmatched = [];
  
  for (const adityaCME of adityaCMEs) {
    let bestMatch = null;
    let bestScore = 0;
    
    for (const cactusEvent of cactusData) {
      const score = calculateEventCorrelation(adityaCME, cactusEvent);
      if (score > bestScore && score > 0.6) {
        bestScore = score;
        bestMatch = cactusEvent;
      }
    }
    
    if (bestMatch) {
      matches.push({
        adityaEvent: adityaCME,
        cactusEvent: bestMatch,
        correlationScore: bestScore,
        timeDifference: Math.abs(
          new Date(adityaCME.timestamp).getTime() - 
          new Date(bestMatch.timestamp).getTime()
        ) / 60000, // minutes
        speedComparison: {
          aditya: adityaCME.parameters?.solarWindSpeed,
          cactus: bestMatch.speed,
          difference: Math.abs(
            (adityaCME.parameters?.solarWindSpeed || 0) - bestMatch.speed
          )
        }
      });
    } else {
      unmatched.push(adityaCME);
    }
  }
  
  return {
    matches,
    unmatched,
    correlationRate: matches.length / Math.max(1, adityaCMEs.length),
    averageTimeDifference: matches.length > 0 ? 
      matches.reduce((sum, m) => sum + m.timeDifference, 0) / matches.length : 0
  };
}

function calculateEventCorrelation(adityaEvent, externalEvent) {
  let score = 0;
  
  // Time correlation (within 6 hours = good)
  const timeDiff = Math.abs(
    new Date(adityaEvent.timestamp).getTime() - 
    new Date(externalEvent.timestamp).getTime()
  ) / 3600000; // hours
  
  const timeScore = Math.max(0, 1 - (timeDiff / 6));
  score += timeScore * 0.4;
  
  // Speed correlation
  if (adityaEvent.parameters?.solarWindSpeed && externalEvent.speed) {
    const speedDiff = Math.abs(
      adityaEvent.parameters.solarWindSpeed - externalEvent.speed
    );
    const speedScore = Math.max(0, 1 - (speedDiff / 500));
    score += speedScore * 0.4;
  }
  
  // Type correlation
  if (adityaEvent.type === 'cme_detection' && externalEvent.type === 'cme') {
    score += 0.2;
  }
  
  return score;
}

function correlateWithNOAA(currentData, recentAnomalies, noaaData) {
  const solarWindCorr = {
    speed: {
      aditya: currentData.aspex.solarWindSpeed.value,
      noaa: noaaData.solarWind.speed,
      difference: Math.abs(currentData.aspex.solarWindSpeed.value - noaaData.solarWind.speed),
      correlation: calculateParameterCorrelation(
        currentData.aspex.solarWindSpeed.value, 
        noaaData.solarWind.speed,
        50 // tolerance
      )
    },
    density: {
      aditya: currentData.aspex.protonDensity.value,
      noaa: noaaData.solarWind.density,
      difference: Math.abs(currentData.aspex.protonDensity.value - noaaData.solarWind.density),
      correlation: calculateParameterCorrelation(
        currentData.aspex.protonDensity.value,
        noaaData.solarWind.density,
        3 // tolerance
      )
    },
    bz: {
      aditya: currentData.derived.interplanetaryMagneticField.bz,
      noaa: noaaData.solarWind.bz,
      difference: Math.abs(currentData.derived.interplanetaryMagneticField.bz - noaaData.solarWind.bz),
      correlation: calculateParameterCorrelation(
        currentData.derived.interplanetaryMagneticField.bz,
        noaaData.solarWind.bz,
        2 // tolerance
      )
    }
  };
  
  const geomagCorr = {
    kp: {
      aditya: currentData.derived.kpIndex.value,
      noaa: noaaData.geomagneticIndices.kp,
      difference: Math.abs(currentData.derived.kpIndex.value - noaaData.geomagneticIndices.kp),
      correlation: calculateParameterCorrelation(
        currentData.derived.kpIndex.value,
        noaaData.geomagneticIndices.kp,
        1 // tolerance
      )
    }
  };
  
  return {
    solarWind: solarWindCorr,
    geomagneticIndices: geomagCorr,
    solarActivity: correlateFlareActivity(recentAnomalies, noaaData.solarActivity),
    overallCorrelation: calculateOverallCorrelation(solarWindCorr, geomagCorr)
  };
}

function correlateWithESA(recentAnomalies, esaData) {
  const eventMatches = findEventMatches(recentAnomalies, esaData.alerts);
  const parameterComparison = compareParameters(recentAnomalies, esaData);
  
  return {
    eventMatches,
    parameterComparison,
    confidenceMetrics: {
      eventAgreement: eventMatches.agreement,
      parameterAgreement: parameterComparison.agreement,
      overallConfidence: (eventMatches.agreement + parameterComparison.agreement) / 2
    }
  };
}

async function performMultiSourceValidation(event) {
  const cactusData = await fetchCACTusData();
  const noaaData = await fetchNOAAData();
  const esaData = await fetchESAData();
  
  const validations = {
    cactus: validateAgainstCACTus(event, cactusData),
    noaa: validateAgainstNOAA(event, noaaData),
    esa: validateAgainstESA(event, esaData)
  };
  
  const supportingSources = Object.entries(validations)
    .filter(([source, validation]) => validation.supports)
    .map(([source]) => source);
  
  const conflictingSources = Object.entries(validations)
    .filter(([source, validation]) => validation.conflicts)
    .map(([source]) => source);
  
  const overallConfidence = calculateValidationConfidence(validations);
  
  return {
    validations,
    supportingSources,
    conflictingSources,
    overallConfidence,
    recommendation: overallConfidence > 0.7 ? 'validated' : 
                   overallConfidence > 0.4 ? 'uncertain' : 'not_validated'
  };
}

async function calculateCorrelationStatistics(events, days) {
  const stats = {
    validation: {
      confirmed: 0,
      uncertain: 0,
      conflicting: 0
    },
    sources: {
      cactus: { available: 85, correlation: 0.78 },
      noaa: { available: 92, correlation: 0.82 },
      esa: { available: 88, correlation: 0.75 }
    },
    parameters: {
      solarWind: { correlation: 0.84, rmse: 45.2 },
      geomagneticIndices: { correlation: 0.79, rmse: 1.2 },
      timing: { averageOffset: 8.5, standardDeviation: 12.3 }
    },
    overallCorrelation: 0.79,
    reliability: 0.83
  };
  
  // Simulate validation results
  for (const event of events) {
    const rand = Math.random();
    if (rand > 0.8) stats.validation.confirmed++;
    else if (rand > 0.6) stats.validation.uncertain++;
    else stats.validation.conflicting++;
  }
  
  return stats;
}

function calculateParameterCorrelation(value1, value2, tolerance) {
  const difference = Math.abs(value1 - value2);
  return Math.max(0, 1 - (difference / tolerance));
}

function calculateOverallCorrelation(solarWind, geomag) {
  const solarWindAvg = (solarWind.speed.correlation + solarWind.density.correlation + solarWind.bz.correlation) / 3;
  const geomagAvg = geomag.kp.correlation;
  
  return (solarWindAvg + geomagAvg) / 2;
}

function correlateFlareActivity(anomalies, solarActivity) {
  const flareAnomalies = anomalies.filter(a => a.category === 'solar_flare');
  const noaaFlares = solarActivity.flareEvents;
  
  return {
    adityaFlares: flareAnomalies.length,
    noaaFlares: noaaFlares.length,
    agreement: Math.abs(flareAnomalies.length - noaaFlares.length) <= 1
  };
}

function findEventMatches(anomalies, alerts) {
  const matches = anomalies.filter(anomaly => 
    alerts.some(alert => 
      alert.type.includes(anomaly.category) &&
      Math.abs(new Date(anomaly.timestamp).getTime() - new Date(alert.timestamp).getTime()) < 3600000
    )
  );
  
  return {
    matches: matches.length,
    total: anomalies.length,
    agreement: matches.length / Math.max(1, anomalies.length)
  };
}

function compareParameters(anomalies, esaData) {
  // Simplified parameter comparison
  return {
    agreement: 0.75 + Math.random() * 0.2,
    details: 'Parameter comparison with ESA data'
  };
}

function validateAgainstCACTus(event, cactusData) {
  if (event.category !== 'cme') {
    return { supports: false, conflicts: false, reason: 'Non-CME event' };
  }
  
  const timeWindow = 3600000; // 1 hour
  const matchingEvents = cactusData.filter(cme => 
    Math.abs(new Date(event.timestamp).getTime() - new Date(cme.timestamp).getTime()) < timeWindow
  );
  
  return {
    supports: matchingEvents.length > 0,
    conflicts: false,
    confidence: matchingEvents.length > 0 ? 0.8 : 0.2,
    details: `Found ${matchingEvents.length} matching CACTus events`
  };
}

function validateAgainstNOAA(event, noaaData) {
  // Simplified NOAA validation
  return {
    supports: Math.random() > 0.3,
    conflicts: Math.random() > 0.8,
    confidence: 0.6 + Math.random() * 0.3,
    details: 'NOAA parameter correlation analysis'
  };
}

function validateAgainstESA(event, esaData) {
  // Simplified ESA validation
  return {
    supports: Math.random() > 0.4,
    conflicts: Math.random() > 0.9,
    confidence: 0.5 + Math.random() * 0.4,
    details: 'ESA space weather service validation'
  };
}

function calculateValidationConfidence(validations) {
  const confidences = Object.values(validations).map(v => v.confidence || 0);
  return confidences.reduce((sum, conf) => sum + conf, 0) / confidences.length;
}

async function validateEventWithSources(eventData, sources) {
  const validations = {};
  
  for (const source of sources) {
    switch (source) {
      case 'cactus':
        const cactusData = await fetchCACTusData();
        validations.cactus = validateAgainstCACTus(eventData, cactusData);
        break;
      case 'noaa':
        const noaaData = await fetchNOAAData();
        validations.noaa = validateAgainstNOAA(eventData, noaaData);
        break;
      case 'esa':
        const esaData = await fetchESAData();
        validations.esa = validateAgainstESA(eventData, esaData);
        break;
    }
  }
  
  const supportingSources = Object.entries(validations)
    .filter(([source, validation]) => validation.supports)
    .map(([source]) => source);
  
  const conflictingSources = Object.entries(validations)
    .filter(([source, validation]) => validation.conflicts)
    .map(([source]) => source);
  
  return {
    validations,
    supportingSources,
    conflictingSources,
    overallConfidence: calculateValidationConfidence(validations)
  };
}

export default router;
