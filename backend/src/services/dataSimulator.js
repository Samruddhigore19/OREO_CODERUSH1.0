import { EventEmitter } from 'events';

export class DataSimulator extends EventEmitter {
  constructor() {
    super();
    this.isRunning = false;
    this.interval = null;
    this.currentData = this.generateInitialData();
    this.dataHistory = [];
    this.maxHistoryLength = 1000;
    
    // CME simulation parameters
    this.cmeEvent = null;
    this.cmeStartTime = null;
    this.cmeDuration = 0;
  }

  generateInitialData() {
    return {
      timestamp: new Date().toISOString(),
      aspex: this.generateASPEXData(),
      suit: this.generateSUITData(),
      derived: this.generateDerivedParameters(),
      quality: this.generateQualityMetrics()
    };
  }

  generateASPEXData() {
    // ASPEX (Aditya Solar wind Particle EXperiment) data simulation
    const baseSpeed = 400 + Math.random() * 200; // 400-600 km/s typical range
    const baseDensity = 5 + Math.random() * 10; // 5-15 particles/cm³
    const baseTemperature = 100000 + Math.random() * 200000; // 100K-300K K
    
    // Add CME effects if active
    let speed = baseSpeed;
    let density = baseDensity;
    let temperature = baseTemperature;
    
    if (this.cmeEvent) {
      const elapsed = Date.now() - this.cmeStartTime;
      const progress = elapsed / this.cmeDuration;
      
      if (progress < 1) {
        // CME enhancement effects
        const enhancement = Math.sin(progress * Math.PI) * this.cmeEvent.intensity;
        speed += enhancement * 300; // Speed increase during CME
        density += enhancement * 20; // Density increase
        temperature += enhancement * 500000; // Temperature spike
      } else {
        this.cmeEvent = null; // CME event ended
      }
    }

    return {
      solarWindSpeed: {
        value: speed,
        unit: 'km/s',
        quality: 'good',
        timestamp: new Date().toISOString()
      },
      protonDensity: {
        value: density,
        unit: 'particles/cm³',
        quality: 'good',
        timestamp: new Date().toISOString()
      },
      protonTemperature: {
        value: temperature,
        unit: 'K',
        quality: 'good',
        timestamp: new Date().toISOString()
      },
      alphaParticleRatio: {
        value: 0.03 + Math.random() * 0.02, // 3-5% typical
        unit: 'ratio',
        quality: 'good',
        timestamp: new Date().toISOString()
      },
      ionComposition: {
        hydrogen: 95 + Math.random() * 2,
        helium: 4 + Math.random() * 1,
        oxygen: 0.5 + Math.random() * 0.3,
        carbon: 0.3 + Math.random() * 0.2,
        unit: 'percentage',
        quality: 'good',
        timestamp: new Date().toISOString()
      }
    };
  }

  generateSUITData() {
    // SUIT (Solar Ultraviolet Imaging Telescope) data simulation
    return {
      uvIntensity: {
        value: 1000 + Math.random() * 5000,
        unit: 'counts/pixel/s',
        wavelength: '121.6 nm', // Lyman-alpha
        quality: 'excellent',
        timestamp: new Date().toISOString()
      },
      coronalHoles: {
        detected: Math.random() > 0.7,
        area: Math.random() * 100,
        latitude: (Math.random() - 0.5) * 180,
        longitude: Math.random() * 360,
        unit: 'degrees',
        quality: 'good',
        timestamp: new Date().toISOString()
      },
      solarFlares: {
        detected: Math.random() > 0.95,
        class: this.generateFlareClass(),
        intensity: Math.random() * 1000,
        location: {
          latitude: (Math.random() - 0.5) * 90,
          longitude: Math.random() * 360
        },
        unit: 'watts/m²',
        quality: 'excellent',
        timestamp: new Date().toISOString()
      },
      magneticField: {
        strength: 1 + Math.random() * 10,
        polarity: Math.random() > 0.5 ? 'positive' : 'negative',
        unit: 'Gauss',
        quality: 'good',
        timestamp: new Date().toISOString()
      }
    };
  }

  generateDerivedParameters() {
    const aspex = this.currentData?.aspex || this.generateASPEXData();
    
    return {
      interplanetaryMagneticField: {
        bx: (Math.random() - 0.5) * 10,
        by: (Math.random() - 0.5) * 10,
        bz: (Math.random() - 0.5) * 10,
        magnitude: Math.sqrt(
          Math.pow((Math.random() - 0.5) * 10, 2) +
          Math.pow((Math.random() - 0.5) * 10, 2) +
          Math.pow((Math.random() - 0.5) * 10, 2)
        ),
        unit: 'nT',
        quality: 'good',
        timestamp: new Date().toISOString()
      },
      kpIndex: {
        value: Math.max(0, Math.min(9, 2 + Math.random() * 3)),
        forecast: Math.max(0, Math.min(9, 2 + Math.random() * 3)),
        unit: 'dimensionless',
        quality: 'good',
        timestamp: new Date().toISOString()
      },
      dstIndex: {
        value: -20 + Math.random() * 40,
        unit: 'nT',
        quality: 'good',
        timestamp: new Date().toISOString()
      },
      plasmaBeta: {
        value: 0.1 + Math.random() * 2,
        unit: 'dimensionless',
        quality: 'good',
        timestamp: new Date().toISOString()
      },
      alfvenSpeed: {
        value: aspex.solarWindSpeed.value / Math.sqrt(aspex.protonDensity.value),
        unit: 'km/s',
        quality: 'derived',
        timestamp: new Date().toISOString()
      }
    };
  }

  generateQualityMetrics() {
    return {
      dataCompleteness: 95 + Math.random() * 5,
      signalToNoise: 10 + Math.random() * 40,
      calibrationStatus: 'nominal',
      instrumentHealth: {
        aspex: Math.random() > 0.1 ? 'nominal' : 'degraded',
        suit: Math.random() > 0.05 ? 'nominal' : 'maintenance'
      },
      communicationDelay: 2 + Math.random() * 3, // minutes
      lastUpdate: new Date().toISOString()
    };
  }

  generateFlareClass() {
    const rand = Math.random();
    if (rand > 0.95) return 'X' + (1 + Math.random() * 9).toFixed(1);
    if (rand > 0.85) return 'M' + (1 + Math.random() * 9).toFixed(1);
    if (rand > 0.6) return 'C' + (1 + Math.random() * 9).toFixed(1);
    return 'B' + (1 + Math.random() * 9).toFixed(1);
  }

  // Trigger a CME event for testing
  triggerCMEEvent(intensity = 1.0, duration = 300000) { // 5 minutes default
    this.cmeEvent = {
      intensity: intensity,
      type: intensity > 0.8 ? 'major' : intensity > 0.5 ? 'moderate' : 'minor',
      direction: {
        latitude: (Math.random() - 0.5) * 60, // ±30 degrees
        longitude: Math.random() * 360
      },
      estimatedSpeed: 500 + intensity * 1000, // 500-1500 km/s
      earthDirected: Math.random() > 0.7
    };
    this.cmeStartTime = Date.now();
    this.cmeDuration = duration;
    
    console.log(`🌞 CME Event Triggered: ${this.cmeEvent.type} intensity, ${this.cmeEvent.earthDirected ? 'Earth-directed' : 'not Earth-directed'}`);
    
    this.emit('cmeEvent', this.cmeEvent);
  }

  updateData() {
    const newData = {
      timestamp: new Date().toISOString(),
      aspex: this.generateASPEXData(),
      suit: this.generateSUITData(),
      derived: this.generateDerivedParameters(),
      quality: this.generateQualityMetrics()
    };

    // Add some temporal continuity
    if (this.currentData) {
      newData.aspex.solarWindSpeed.value = this.addNoise(
        this.currentData.aspex.solarWindSpeed.value, 0.95, 50
      );
      newData.aspex.protonDensity.value = this.addNoise(
        this.currentData.aspex.protonDensity.value, 0.9, 2
      );
    }

    this.currentData = newData;
    
    // Store in history
    this.dataHistory.push(newData);
    if (this.dataHistory.length > this.maxHistoryLength) {
      this.dataHistory.shift();
    }

    // Random CME events (rare)
    if (Math.random() > 0.9998 && !this.cmeEvent) { // Very rare automatic CME
      this.triggerCMEEvent(Math.random(), 180000 + Math.random() * 300000);
    }

    this.emit('dataUpdate', newData);
    return newData;
  }

  addNoise(currentValue, persistence, maxChange) {
    const change = (Math.random() - 0.5) * maxChange;
    return Math.max(0, currentValue * persistence + change);
  }

  startSimulation() {
    if (this.isRunning) return;
    
    this.isRunning = true;
    this.interval = setInterval(() => {
      this.updateData();
    }, 1000); // Update every second
    
    console.log('📡 Aditya-L1 Data Simulation Started');
    this.emit('simulationStarted');
  }

  stopSimulation() {
    if (!this.isRunning) return;
    
    this.isRunning = false;
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
    
    console.log('📡 Aditya-L1 Data Simulation Stopped');
    this.emit('simulationStopped');
  }

  getLatestData() {
    return this.currentData;
  }

  getHistoricalData(timeRange = 3600000) { // 1 hour default
    const cutoffTime = Date.now() - timeRange;
    return this.dataHistory.filter(data => 
      new Date(data.timestamp).getTime() > cutoffTime
    );
  }

  getCurrentCMEEvent() {
    return this.cmeEvent;
  }

  // Get specific data streams for different visualizations
  getSolarWindSpeedHistory(points = 100) {
    return this.dataHistory
      .slice(-points)
      .map(data => ({
        timestamp: data.timestamp,
        value: data.aspex.solarWindSpeed.value
      }));
  }

  getProtonDensityHistory(points = 100) {
    return this.dataHistory
      .slice(-points)
      .map(data => ({
        timestamp: data.timestamp,
        value: data.aspex.protonDensity.value
      }));
  }

  getIMFHistory(points = 100) {
    return this.dataHistory
      .slice(-points)
      .map(data => ({
        timestamp: data.timestamp,
        bx: data.derived.interplanetaryMagneticField.bx,
        by: data.derived.interplanetaryMagneticField.by,
        bz: data.derived.interplanetaryMagneticField.bz,
        magnitude: data.derived.interplanetaryMagneticField.magnitude
      }));
  }
}
