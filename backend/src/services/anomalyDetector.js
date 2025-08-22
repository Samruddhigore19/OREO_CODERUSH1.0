import { EventEmitter } from 'events';

export class AnomalyDetector extends EventEmitter {
  constructor() {
    super();
    this.baselineData = {
      solarWindSpeed: { mean: 450, std: 150, min: 200, max: 800 },
      protonDensity: { mean: 8, std: 5, min: 1, max: 50 },
      protonTemperature: { mean: 200000, std: 100000, min: 50000, max: 2000000 },
      imfMagnitude: { mean: 5, std: 3, min: 0, max: 50 },
      kpIndex: { mean: 2.5, std: 1.5, min: 0, max: 9 }
    };
    
    this.thresholds = {
      // CME detection thresholds
      cme: {
        speedIncrease: 200, // km/s above baseline
        densityIncrease: 10, // particles/cm³ above baseline
        temperatureIncrease: 300000, // K above baseline
        imfRotation: 45, // degrees
        duration: 300000 // 5 minutes minimum duration
      },
      // Solar flare thresholds
      flare: {
        uvIntensitySpike: 5000, // counts/pixel/s
        suddenIncrease: 0.8, // 80% increase in 1 minute
        xrayFlux: 1e-6 // W/m²
      },
      // Geomagnetic storm thresholds
      geomagStorm: {
        kpIndex: 5, // Kp >= 5 indicates storm
        dstIndex: -50, // Dst <= -50 nT
        duration: 180000 // 3 minutes minimum
      }
    };
    
    this.recentAnomalies = [];
    this.maxAnomalyHistory = 100;
    this.detectionHistory = [];
  }

  detectAnomalies(currentData) {
    if (!currentData) return [];
    
    const anomalies = [];
    const timestamp = new Date().toISOString();
    
    // CME Detection
    const cmeAnomaly = this.detectCME(currentData);
    if (cmeAnomaly) {
      anomalies.push({
        ...cmeAnomaly,
        id: this.generateAnomalyId(),
        timestamp,
        category: 'cme'
      });
    }
    
    // Solar Flare Detection
    const flareAnomaly = this.detectSolarFlare(currentData);
    if (flareAnomaly) {
      anomalies.push({
        ...flareAnomaly,
        id: this.generateAnomalyId(),
        timestamp,
        category: 'solar_flare'
      });
    }
    
    // Geomagnetic Storm Detection
    const geomagAnomaly = this.detectGeomagneticStorm(currentData);
    if (geomagAnomaly) {
      anomalies.push({
        ...geomagAnomaly,
        id: this.generateAnomalyId(),
        timestamp,
        category: 'geomagnetic_storm'
      });
    }
    
    // Particle Enhancement Detection
    const particleAnomaly = this.detectParticleEnhancement(currentData);
    if (particleAnomaly) {
      anomalies.push({
        ...particleAnomaly,
        id: this.generateAnomalyId(),
        timestamp,
        category: 'particle_enhancement'
      });
    }
    
    // Data Quality Anomalies
    const qualityAnomaly = this.detectDataQualityIssues(currentData);
    if (qualityAnomaly) {
      anomalies.push({
        ...qualityAnomaly,
        id: this.generateAnomalyId(),
        timestamp,
        category: 'data_quality'
      });
    }
    
    // Store anomalies
    anomalies.forEach(anomaly => {
      this.recentAnomalies.push(anomaly);
      this.emit('anomalyDetected', anomaly);
    });
    
    // Clean up old anomalies
    if (this.recentAnomalies.length > this.maxAnomalyHistory) {
      this.recentAnomalies = this.recentAnomalies.slice(-this.maxAnomalyHistory);
    }
    
    return anomalies;
  }

  detectCME(data) {
    const speed = data.aspex.solarWindSpeed.value;
    const density = data.aspex.protonDensity.value;
    const temperature = data.aspex.protonTemperature.value;
    const imfMagnitude = data.derived.interplanetaryMagneticField.magnitude;
    
    // CME signature: elevated speed, density, and temperature
    const speedAnomaly = speed > (this.baselineData.solarWindSpeed.mean + this.thresholds.cme.speedIncrease);
    const densityAnomaly = density > (this.baselineData.protonDensity.mean + this.thresholds.cme.densityIncrease);
    const temperatureAnomaly = temperature > (this.baselineData.protonTemperature.mean + this.thresholds.cme.temperatureIncrease);
    const imfAnomaly = imfMagnitude > (this.baselineData.imfMagnitude.mean + this.baselineData.imfMagnitude.std * 2);
    
    // Need at least 2 of these conditions for CME detection
    const anomalyCount = [speedAnomaly, densityAnomaly, temperatureAnomaly, imfAnomaly].filter(Boolean).length;
    
    if (anomalyCount >= 2) {
      const severity = this.calculateCMESeverity(speed, density, temperature);
      const earthImpactProbability = this.calculateEarthImpactProbability(data);
      const estimatedArrivalTime = this.estimateEarthArrivalTime(speed);
      
      return {
        type: 'cme_detection',
        severity,
        confidence: Math.min(95, 60 + (anomalyCount * 10)),
        parameters: {
          solarWindSpeed: speed,
          protonDensity: density,
          protonTemperature: temperature,
          imfMagnitude: imfMagnitude
        },
        earthImpact: {
          probability: earthImpactProbability,
          estimatedArrivalTime,
          expectedEffects: this.predictCMEEffects(severity)
        },
        triggers: {
          speedAnomaly,
          densityAnomaly,
          temperatureAnomaly,
          imfAnomaly
        }
      };
    }
    
    return null;
  }

  detectSolarFlare(data) {
    const uvIntensity = data.suit.uvIntensity.value;
    const flareDetected = data.suit.solarFlares.detected;
    const flareIntensity = data.suit.solarFlares.intensity;
    
    if (flareDetected || uvIntensity > this.thresholds.flare.uvIntensitySpike) {
      const flareClass = this.classifyFlare(flareIntensity);
      const severity = this.mapFlareClassToSeverity(flareClass);
      
      return {
        type: 'solar_flare',
        severity,
        confidence: flareDetected ? 90 : 75,
        parameters: {
          uvIntensity,
          flareClass,
          location: data.suit.solarFlares.location,
          peakIntensity: flareIntensity
        },
        earthImpact: {
          radioBlackout: this.predictRadioBlackout(flareClass),
          radiationStorm: this.predictRadiationStorm(flareClass),
          estimatedDuration: this.estimateFlareEffectDuration(flareClass)
        }
      };
    }
    
    return null;
  }

  detectGeomagneticStorm(data) {
    const kpIndex = data.derived.kpIndex.value;
    const dstIndex = data.derived.dstIndex.value;
    const imfBz = data.derived.interplanetaryMagneticField.bz;
    
    const kpStorm = kpIndex >= this.thresholds.geomagStorm.kpIndex;
    const dstStorm = dstIndex <= this.thresholds.geomagStorm.dstIndex;
    const bzSouth = imfBz < -5; // Southward IMF Bz enhances geomagnetic activity
    
    if (kpStorm || dstStorm) {
      const severity = this.calculateGeomagneticStormSeverity(kpIndex, dstIndex);
      
      return {
        type: 'geomagnetic_storm',
        severity,
        confidence: 85,
        parameters: {
          kpIndex,
          dstIndex,
          imfBz,
          stormPhase: this.determineStormPhase(dstIndex)
        },
        earthImpact: {
          auroralActivity: this.predictAuroralActivity(kpIndex),
          satelliteEffects: this.predictSatelliteEffects(severity),
          powerGridRisk: this.assessPowerGridRisk(severity),
          navigationDisruption: this.assessNavigationDisruption(kpIndex)
        },
        triggers: {
          kpStorm,
          dstStorm,
          bzSouth
        }
      };
    }
    
    return null;
  }

  detectParticleEnhancement(data) {
    const density = data.aspex.protonDensity.value;
    const alphaRatio = data.aspex.alphaParticleRatio.value;
    
    const densityEnhancement = density > (this.baselineData.protonDensity.mean + this.baselineData.protonDensity.std * 3);
    const alphaEnhancement = alphaRatio > 0.08; // Above normal 3-5%
    
    if (densityEnhancement || alphaEnhancement) {
      return {
        type: 'particle_enhancement',
        severity: densityEnhancement && alphaEnhancement ? 'high' : 'moderate',
        confidence: 80,
        parameters: {
          protonDensity: density,
          alphaRatio: alphaRatio,
          enhancement: density / this.baselineData.protonDensity.mean
        },
        earthImpact: {
          radiationExposure: this.assessRadiationExposure(density),
          spacecraftCharging: this.assessSpacecraftCharging(density)
        }
      };
    }
    
    return null;
  }

  detectDataQualityIssues(data) {
    const completeness = data.quality.dataCompleteness;
    const snr = data.quality.signalToNoise;
    const delay = data.quality.communicationDelay;
    
    const lowCompleteness = completeness < 90;
    const lowSNR = snr < 15;
    const highDelay = delay > 10; // minutes
    
    if (lowCompleteness || lowSNR || highDelay) {
      return {
        type: 'data_quality_issue',
        severity: 'low',
        confidence: 95,
        parameters: {
          dataCompleteness: completeness,
          signalToNoise: snr,
          communicationDelay: delay,
          instrumentHealth: data.quality.instrumentHealth
        },
        impact: {
          dataReliability: lowCompleteness ? 'reduced' : 'normal',
          detectionSensitivity: lowSNR ? 'reduced' : 'normal',
          responseTime: highDelay ? 'delayed' : 'normal'
        }
      };
    }
    
    return null;
  }

  // Helper methods for classification and prediction

  calculateCMESeverity(speed, density, temperature) {
    const speedScore = Math.min(3, Math.max(0, (speed - 400) / 400));
    const densityScore = Math.min(3, Math.max(0, (density - 5) / 20));
    const tempScore = Math.min(3, Math.max(0, (temperature - 100000) / 1000000));
    
    const totalScore = (speedScore + densityScore + tempScore) / 3;
    
    if (totalScore > 2) return 'severe';
    if (totalScore > 1) return 'moderate';
    return 'minor';
  }

  calculateEarthImpactProbability(data) {
    // Simplified model based on CME direction and magnetic field
    const baseProb = 0.3; // 30% base probability for any CME
    const cmeEvent = data.cmeEvent;
    
    if (cmeEvent && cmeEvent.earthDirected) {
      return Math.min(0.95, baseProb + 0.5);
    }
    
    return baseProb;
  }

  estimateEarthArrivalTime(speed) {
    // Distance from L1 to Earth: ~1.5 million km
    const distance = 1500000; // km
    const travelTime = distance / speed; // hours
    const arrivalTime = new Date(Date.now() + travelTime * 3600000);
    
    return {
      estimatedHours: travelTime,
      arrivalTime: arrivalTime.toISOString(),
      uncertainty: '±6 hours'
    };
  }

  predictCMEEffects(severity) {
    const effects = {
      minor: ['Minor radio blackouts', 'Weak auroral activity'],
      moderate: ['Radio blackouts on sunlit side', 'Moderate auroral activity', 'Minor satellite drag'],
      severe: ['HF radio blackouts', 'Strong auroral activity', 'Satellite operations affected', 'Power grid fluctuations']
    };
    
    return effects[severity] || effects.minor;
  }

  classifyFlare(intensity) {
    if (intensity > 1000) return 'X' + Math.min(9, intensity / 1000).toFixed(1);
    if (intensity > 100) return 'M' + Math.min(9, intensity / 100).toFixed(1);
    if (intensity > 10) return 'C' + Math.min(9, intensity / 10).toFixed(1);
    return 'B' + Math.min(9, intensity).toFixed(1);
  }

  mapFlareClassToSeverity(flareClass) {
    if (flareClass.startsWith('X')) return 'severe';
    if (flareClass.startsWith('M')) return 'moderate';
    return 'minor';
  }

  calculateGeomagneticStormSeverity(kpIndex, dstIndex) {
    if (kpIndex >= 8 || dstIndex <= -200) return 'severe';
    if (kpIndex >= 6 || dstIndex <= -100) return 'moderate';
    return 'minor';
  }

  generateAnomalyId() {
    return 'anom_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
  }

  // Additional prediction methods
  predictRadioBlackout(flareClass) {
    const classMap = { 'X': 'severe', 'M': 'moderate', 'C': 'minor', 'B': 'none' };
    return classMap[flareClass.charAt(0)] || 'none';
  }

  predictRadiationStorm(flareClass) {
    return flareClass.startsWith('X') ? 'possible' : 'unlikely';
  }

  estimateFlareEffectDuration(flareClass) {
    const durationMap = { 'X': '1-2 hours', 'M': '30-60 minutes', 'C': '10-30 minutes', 'B': '5-15 minutes' };
    return durationMap[flareClass.charAt(0)] || '5-15 minutes';
  }

  determineStormPhase(dstIndex) {
    if (dstIndex > -20) return 'quiet';
    if (dstIndex > -50) return 'initial';
    if (dstIndex > -100) return 'main';
    return 'recovery';
  }

  predictAuroralActivity(kpIndex) {
    if (kpIndex >= 7) return 'visible at mid-latitudes';
    if (kpIndex >= 5) return 'visible at high latitudes';
    return 'minimal';
  }

  predictSatelliteEffects(severity) {
    const effectMap = {
      'minor': 'Minimal impact',
      'moderate': 'Possible drag increase',
      'severe': 'Operations may be affected'
    };
    return effectMap[severity] || 'Minimal impact';
  }

  assessPowerGridRisk(severity) {
    const riskMap = {
      'minor': 'low',
      'moderate': 'medium',
      'severe': 'high'
    };
    return riskMap[severity] || 'low';
  }

  assessNavigationDisruption(kpIndex) {
    if (kpIndex >= 6) return 'significant';
    if (kpIndex >= 4) return 'moderate';
    return 'minimal';
  }

  assessRadiationExposure(density) {
    if (density > 50) return 'elevated';
    if (density > 20) return 'moderate';
    return 'normal';
  }

  assessSpacecraftCharging(density) {
    return density > 30 ? 'increased risk' : 'normal';
  }

  // API methods
  getRecentAnomalies(limit = 10) {
    return this.recentAnomalies.slice(-limit);
  }

  getAnomaliesByCategory(category, limit = 10) {
    return this.recentAnomalies
      .filter(anomaly => anomaly.category === category)
      .slice(-limit);
  }

  getAnomaliesByTimeRange(startTime, endTime) {
    const start = new Date(startTime).getTime();
    const end = new Date(endTime).getTime();
    
    return this.recentAnomalies.filter(anomaly => {
      const anomalyTime = new Date(anomaly.timestamp).getTime();
      return anomalyTime >= start && anomalyTime <= end;
    });
  }
}
