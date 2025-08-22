import { EventEmitter } from 'events';

export class AlertSystem extends EventEmitter {
  constructor() {
    super();
    this.activeAlerts = new Map();
    this.alertHistory = [];
    this.maxHistoryLength = 500;
    this.alertRules = this.initializeAlertRules();
    this.contactGroups = this.initializeContactGroups();
    this.alertChannels = this.initializeAlertChannels();
  }

  initializeAlertRules() {
    return {
      cme: {
        enabled: true,
        severity: {
          minor: { priority: 'medium', escalation: false },
          moderate: { priority: 'high', escalation: true },
          severe: { priority: 'critical', escalation: true }
        },
        cooldown: 300000, // 5 minutes between similar alerts
        autoResolve: 3600000 // 1 hour auto-resolve
      },
      solar_flare: {
        enabled: true,
        severity: {
          minor: { priority: 'low', escalation: false },
          moderate: { priority: 'medium', escalation: false },
          severe: { priority: 'high', escalation: true }
        },
        cooldown: 600000, // 10 minutes
        autoResolve: 1800000 // 30 minutes
      },
      geomagnetic_storm: {
        enabled: true,
        severity: {
          minor: { priority: 'medium', escalation: false },
          moderate: { priority: 'high', escalation: true },
          severe: { priority: 'critical', escalation: true }
        },
        cooldown: 900000, // 15 minutes
        autoResolve: 7200000 // 2 hours
      },
      particle_enhancement: {
        enabled: true,
        severity: {
          moderate: { priority: 'medium', escalation: false },
          high: { priority: 'high', escalation: true }
        },
        cooldown: 600000,
        autoResolve: 3600000
      },
      data_quality: {
        enabled: true,
        severity: {
          low: { priority: 'low', escalation: false }
        },
        cooldown: 1800000, // 30 minutes
        autoResolve: 3600000
      }
    };
  }

  initializeContactGroups() {
    return {
      isro_mission_control: {
        name: 'ISRO Mission Control',
        contacts: [
          { name: 'Flight Director', email: 'flight.director@isro.gov.in', phone: '+91-80-2217-2001' },
          { name: 'Space Weather Officer', email: 'space.weather@isro.gov.in', phone: '+91-80-2217-2002' }
        ],
        alertLevels: ['critical', 'high', 'medium']
      },
      satellite_operators: {
        name: 'Satellite Operators',
        contacts: [
          { name: 'INSAT Operations', email: 'insat.ops@isro.gov.in', phone: '+91-80-2217-2003' },
          { name: 'Navigation Team', email: 'navic.ops@isro.gov.in', phone: '+91-80-2217-2004' }
        ],
        alertLevels: ['critical', 'high']
      },
      ground_stations: {
        name: 'Ground Stations',
        contacts: [
          { name: 'Bangalore Ground Station', email: 'bangalore.gs@isro.gov.in', phone: '+91-80-2217-2005' },
          { name: 'Trivandrum Ground Station', email: 'trivandrum.gs@isro.gov.in', phone: '+91-471-2567-001' }
        ],
        alertLevels: ['critical', 'high', 'medium']
      },
      research_teams: {
        name: 'Research Teams',
        contacts: [
          { name: 'Space Weather Research', email: 'research@isro.gov.in', phone: '+91-80-2217-2006' },
          { name: 'Solar Physics Team', email: 'solar.physics@isro.gov.in', phone: '+91-80-2217-2007' }
        ],
        alertLevels: ['critical', 'high', 'medium', 'low']
      },
      external_partners: {
        name: 'External Partners',
        contacts: [
          { name: 'NOAA Space Weather', email: 'alerts@swpc.noaa.gov', phone: '+1-303-497-3171' },
          { name: 'ESA Space Weather', email: 'space.weather@esa.int', phone: '+31-71-565-6565' }
        ],
        alertLevels: ['critical', 'high']
      }
    };
  }

  initializeAlertChannels() {
    return {
      email: {
        enabled: true,
        templates: {
          cme: 'CME Detection Alert - {severity} Event',
          solar_flare: 'Solar Flare Alert - Class {flareClass}',
          geomagnetic_storm: 'Geomagnetic Storm Alert - Kp {kpIndex}',
          particle_enhancement: 'Particle Enhancement Alert',
          data_quality: 'Data Quality Issue Alert'
        }
      },
      sms: {
        enabled: true,
        maxLength: 160,
        criticalOnly: true
      },
      webhook: {
        enabled: true,
        endpoints: [
          'https://mission-control.isro.gov.in/api/alerts',
          'https://satellite-ops.isro.gov.in/api/alerts'
        ]
      },
      dashboard: {
        enabled: true,
        realTime: true
      },
      audio: {
        enabled: true,
        tones: {
          critical: 'alarm_critical.wav',
          high: 'alarm_high.wav',
          medium: 'notification_medium.wav',
          low: 'notification_low.wav'
        }
      }
    };
  }

  processAnomalies(anomalies) {
    const processedAlerts = [];

    for (const anomaly of anomalies) {
      const alert = this.createAlert(anomaly);
      if (alert && this.shouldTriggerAlert(alert)) {
        this.activeAlerts.set(alert.id, alert);
        this.alertHistory.push(alert);
        
        // Dispatch alert through various channels
        this.dispatchAlert(alert);
        processedAlerts.push(alert);
        
        console.log(`🚨 Alert triggered: ${alert.type} - ${alert.severity} (${alert.id})`);
        this.emit('alertTriggered', alert);
      }
    }

    // Clean up history
    if (this.alertHistory.length > this.maxHistoryLength) {
      this.alertHistory = this.alertHistory.slice(-this.maxHistoryLength);
    }

    return processedAlerts;
  }

  createAlert(anomaly) {
    const alertRule = this.alertRules[anomaly.category];
    if (!alertRule?.enabled) return null;

    const severityConfig = alertRule.severity[anomaly.severity];
    if (!severityConfig) return null;

    const alert = {
      id: this.generateAlertId(),
      type: anomaly.type,
      category: anomaly.category,
      severity: anomaly.severity,
      priority: severityConfig.priority,
      confidence: anomaly.confidence,
      timestamp: new Date().toISOString(),
      status: 'active',
      source: 'aditya-l1',
      
      // Anomaly data
      parameters: anomaly.parameters,
      earthImpact: anomaly.earthImpact,
      triggers: anomaly.triggers,
      
      // Alert metadata
      escalationRequired: severityConfig.escalation,
      cooldownPeriod: alertRule.cooldown,
      autoResolveTime: new Date(Date.now() + alertRule.autoResolve).toISOString(),
      
      // Message content
      title: this.generateAlertTitle(anomaly),
      message: this.generateAlertMessage(anomaly),
      recommendations: this.generateRecommendations(anomaly),
      
      // Delivery tracking
      deliveryStatus: {
        email: 'pending',
        sms: 'pending',
        webhook: 'pending',
        dashboard: 'pending'
      },
      
      // Contact information
      targetGroups: this.determineTargetGroups(severityConfig.priority),
      
      // Timeline
      timeline: [{
        timestamp: new Date().toISOString(),
        event: 'alert_created',
        details: 'Alert created from anomaly detection'
      }]
    };

    return alert;
  }

  shouldTriggerAlert(alert) {
    // Check cooldown period for similar alerts
    const recentSimilarAlerts = Array.from(this.activeAlerts.values()).filter(existingAlert => 
      existingAlert.type === alert.type &&
      existingAlert.severity === alert.severity &&
      (Date.now() - new Date(existingAlert.timestamp).getTime()) < alert.cooldownPeriod
    );

    if (recentSimilarAlerts.length > 0) {
      console.log(`Alert suppressed due to cooldown: ${alert.type}`);
      return false;
    }

    return true;
  }

  dispatchAlert(alert) {
    // Email notifications
    if (this.alertChannels.email.enabled) {
      this.sendEmailAlert(alert);
    }

    // SMS notifications for critical alerts
    if (this.alertChannels.sms.enabled && 
        (alert.priority === 'critical' || !this.alertChannels.sms.criticalOnly)) {
      this.sendSMSAlert(alert);
    }

    // Webhook notifications
    if (this.alertChannels.webhook.enabled) {
      this.sendWebhookAlert(alert);
    }

    // Dashboard notifications (real-time)
    if (this.alertChannels.dashboard.enabled) {
      this.updateDashboard(alert);
    }

    // Audio alerts for control room
    if (this.alertChannels.audio.enabled) {
      this.playAudioAlert(alert);
    }
  }

  async sendEmailAlert(alert) {
    try {
      const targetGroups = alert.targetGroups;
      const template = this.alertChannels.email.templates[alert.category] || 'Space Weather Alert - {type}';
      
      for (const groupName of targetGroups) {
        const group = this.contactGroups[groupName];
        if (group && group.alertLevels.includes(alert.priority)) {
          
          for (const contact of group.contacts) {
            // Simulate email sending
            const emailData = {
              to: contact.email,
              subject: this.populateTemplate(template, alert),
              body: this.generateEmailBody(alert, contact),
              priority: alert.priority,
              timestamp: new Date().toISOString()
            };
            
            // Log email sending (simulated)
            console.log(`📧 Email sent to ${contact.name} (${contact.email}): ${emailData.subject}`);
            
            alert.timeline.push({
              timestamp: new Date().toISOString(),
              event: 'email_sent',
              details: `Email sent to ${contact.name}`,
              recipient: contact.email
            });
          }
        }
      }
      
      alert.deliveryStatus.email = 'sent';
    } catch (error) {
      console.error('Email alert failed:', error);
      alert.deliveryStatus.email = 'failed';
      alert.timeline.push({
        timestamp: new Date().toISOString(),
        event: 'email_failed',
        details: error.message
      });
    }
  }

  async sendSMSAlert(alert) {
    try {
      const smsMessage = this.generateSMSMessage(alert);
      const targetGroups = alert.targetGroups;
      
      for (const groupName of targetGroups) {
        const group = this.contactGroups[groupName];
        if (group && group.alertLevels.includes(alert.priority)) {
          
          for (const contact of group.contacts) {
            if (contact.phone) {
              // Simulate SMS sending
              console.log(`📱 SMS sent to ${contact.name} (${contact.phone}): ${smsMessage}`);
              
              alert.timeline.push({
                timestamp: new Date().toISOString(),
                event: 'sms_sent',
                details: `SMS sent to ${contact.name}`,
                recipient: contact.phone
              });
            }
          }
        }
      }
      
      alert.deliveryStatus.sms = 'sent';
    } catch (error) {
      console.error('SMS alert failed:', error);
      alert.deliveryStatus.sms = 'failed';
    }
  }

  async sendWebhookAlert(alert) {
    try {
      const webhookData = {
        alert: {
          id: alert.id,
          type: alert.type,
          severity: alert.severity,
          priority: alert.priority,
          timestamp: alert.timestamp,
          parameters: alert.parameters,
          earthImpact: alert.earthImpact,
          recommendations: alert.recommendations
        },
        source: 'aditya-l1-cme-detection',
        version: '1.0'
      };
      
      for (const endpoint of this.alertChannels.webhook.endpoints) {
        // Simulate webhook call
        console.log(`🔗 Webhook sent to ${endpoint}:`, JSON.stringify(webhookData, null, 2));
        
        alert.timeline.push({
          timestamp: new Date().toISOString(),
          event: 'webhook_sent',
          details: `Webhook sent to ${endpoint}`
        });
      }
      
      alert.deliveryStatus.webhook = 'sent';
    } catch (error) {
      console.error('Webhook alert failed:', error);
      alert.deliveryStatus.webhook = 'failed';
    }
  }

  updateDashboard(alert) {
    // Emit event for real-time dashboard updates
    this.emit('dashboardUpdate', {
      type: 'new_alert',
      alert: alert,
      timestamp: new Date().toISOString()
    });
    
    alert.deliveryStatus.dashboard = 'sent';
    console.log(`📊 Dashboard updated with alert: ${alert.id}`);
  }

  playAudioAlert(alert) {
    const audioFile = this.alertChannels.audio.tones[alert.priority];
    console.log(`🔊 Audio alert played: ${audioFile} for ${alert.type}`);
    
    alert.timeline.push({
      timestamp: new Date().toISOString(),
      event: 'audio_played',
      details: `Audio alert played: ${audioFile}`
    });
  }

  // Message generation methods
  generateAlertTitle(anomaly) {
    const titleMap = {
      cme_detection: `CME Detection - ${anomaly.severity.toUpperCase()} Event`,
      solar_flare: `Solar Flare Alert - ${anomaly.parameters?.flareClass || 'Unknown Class'}`,
      geomagnetic_storm: `Geomagnetic Storm - Kp ${anomaly.parameters?.kpIndex || 'N/A'}`,
      particle_enhancement: `Particle Enhancement Event`,
      data_quality_issue: `Data Quality Alert`
    };
    
    return titleMap[anomaly.type] || `Space Weather Alert - ${anomaly.type}`;
  }

  generateAlertMessage(anomaly) {
    const messageMap = {
      cme_detection: this.generateCMEMessage(anomaly),
      solar_flare: this.generateFlareMessage(anomaly),
      geomagnetic_storm: this.generateGeomagMessage(anomaly),
      particle_enhancement: this.generateParticleMessage(anomaly),
      data_quality_issue: this.generateDataQualityMessage(anomaly)
    };
    
    return messageMap[anomaly.type] || `Space weather anomaly detected: ${anomaly.type}`;
  }

  generateCMEMessage(anomaly) {
    const params = anomaly.parameters;
    const impact = anomaly.earthImpact;
    
    return `Coronal Mass Ejection detected with ${anomaly.severity} intensity. ` +
           `Solar wind speed: ${params?.solarWindSpeed?.toFixed(1)} km/s, ` +
           `Proton density: ${params?.protonDensity?.toFixed(1)} p/cm³. ` +
           `Earth impact probability: ${(impact?.probability * 100)?.toFixed(0)}%. ` +
           `${impact?.estimatedArrivalTime ? `Estimated arrival: ${impact.estimatedArrivalTime}` : ''}`;
  }

  generateFlareMessage(anomaly) {
    const params = anomaly.parameters;
    return `Solar flare detected - Class ${params?.flareClass || 'Unknown'}. ` +
           `UV intensity: ${params?.uvIntensity?.toFixed(0)} counts/pixel/s. ` +
           `Location: ${params?.location?.latitude?.toFixed(1)}°, ${params?.location?.longitude?.toFixed(1)}°.`;
  }

  generateGeomagMessage(anomaly) {
    const params = anomaly.parameters;
    return `Geomagnetic storm conditions detected. ` +
           `Kp index: ${params?.kpIndex?.toFixed(1)}, ` +
           `Dst index: ${params?.dstIndex?.toFixed(0)} nT. ` +
           `Storm phase: ${params?.stormPhase || 'unknown'}.`;
  }

  generateParticleMessage(anomaly) {
    const params = anomaly.parameters;
    return `Particle enhancement event detected. ` +
           `Proton density: ${params?.protonDensity?.toFixed(1)} p/cm³ ` +
           `(${params?.enhancement?.toFixed(1)}x normal). ` +
           `Alpha ratio: ${(params?.alphaRatio * 100)?.toFixed(1)}%.`;
  }

  generateDataQualityMessage(anomaly) {
    const params = anomaly.parameters;
    return `Data quality issue detected. ` +
           `Completeness: ${params?.dataCompleteness?.toFixed(1)}%, ` +
           `SNR: ${params?.signalToNoise?.toFixed(1)}, ` +
           `Delay: ${params?.communicationDelay?.toFixed(1)} min.`;
  }

  generateRecommendations(anomaly) {
    const recommendationMap = {
      cme_detection: [
        'Monitor satellite operations closely',
        'Prepare for possible communication disruptions',
        'Alert astronauts of radiation exposure risk',
        'Consider power grid monitoring'
      ],
      solar_flare: [
        'Monitor HF radio communications',
        'Check satellite operations',
        'Consider flight path adjustments for polar routes'
      ],
      geomagnetic_storm: [
        'Monitor power grid operations',
        'Check GPS accuracy',
        'Observe auroral activity',
        'Monitor satellite drag effects'
      ],
      particle_enhancement: [
        'Monitor radiation exposure levels',
        'Check spacecraft charging status',
        'Consider crew activity restrictions'
      ],
      data_quality_issue: [
        'Verify instrument status',
        'Check communication links',
        'Consider backup data sources'
      ]
    };
    
    return recommendationMap[anomaly.type] || ['Monitor situation closely'];
  }

  generateEmailBody(alert, contact) {
    return `
Dear ${contact.name},

${alert.message}

Event Details:
- Type: ${alert.type}
- Severity: ${alert.severity.toUpperCase()}
- Confidence: ${alert.confidence}%
- Timestamp: ${alert.timestamp}

Recommended Actions:
${alert.recommendations.map(rec => `• ${rec}`).join('\n')}

This is an automated alert from the Aditya-L1 CME Detection System.
For more information, please check the mission control dashboard.

Best regards,
Aditya-L1 Mission Control
    `.trim();
  }

  generateSMSMessage(alert) {
    const maxLength = this.alertChannels.sms.maxLength;
    const shortMessage = `${alert.severity.toUpperCase()} ${alert.type}: ${alert.message}`;
    
    if (shortMessage.length <= maxLength) {
      return shortMessage;
    }
    
    return shortMessage.substring(0, maxLength - 3) + '...';
  }

  determineTargetGroups(priority) {
    const groupMap = {
      critical: ['isro_mission_control', 'satellite_operators', 'ground_stations'],
      high: ['isro_mission_control', 'satellite_operators', 'ground_stations', 'external_partners'],
      medium: ['isro_mission_control', 'ground_stations', 'research_teams'],
      low: ['research_teams']
    };
    
    return groupMap[priority] || ['research_teams'];
  }

  populateTemplate(template, alert) {
    return template
      .replace('{severity}', alert.severity.toUpperCase())
      .replace('{type}', alert.type)
      .replace('{flareClass}', alert.parameters?.flareClass || 'Unknown')
      .replace('{kpIndex}', alert.parameters?.kpIndex || 'N/A');
  }

  generateAlertId() {
    return 'alert_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
  }

  // Alert management methods
  acknowledgeAlert(alertId, acknowledgedBy) {
    const alert = this.activeAlerts.get(alertId);
    if (alert && alert.status === 'active') {
      alert.status = 'acknowledged';
      alert.acknowledgedBy = acknowledgedBy;
      alert.acknowledgedAt = new Date().toISOString();
      
      alert.timeline.push({
        timestamp: new Date().toISOString(),
        event: 'acknowledged',
        details: `Alert acknowledged by ${acknowledgedBy}`
      });
      
      this.emit('alertAcknowledged', alert);
      console.log(`✅ Alert acknowledged: ${alertId} by ${acknowledgedBy}`);
      return true;
    }
    return false;
  }

  resolveAlert(alertId, resolvedBy, resolution) {
    const alert = this.activeAlerts.get(alertId);
    if (alert && (alert.status === 'active' || alert.status === 'acknowledged')) {
      alert.status = 'resolved';
      alert.resolvedBy = resolvedBy;
      alert.resolvedAt = new Date().toISOString();
      alert.resolution = resolution;
      
      alert.timeline.push({
        timestamp: new Date().toISOString(),
        event: 'resolved',
        details: `Alert resolved by ${resolvedBy}: ${resolution}`
      });
      
      this.activeAlerts.delete(alertId);
      this.emit('alertResolved', alert);
      console.log(`✅ Alert resolved: ${alertId} by ${resolvedBy}`);
      return true;
    }
    return false;
  }

  // Periodic cleanup of auto-resolved alerts
  performMaintenanceTasks() {
    const now = Date.now();
    let autoResolvedCount = 0;
    
    for (const [alertId, alert] of this.activeAlerts.entries()) {
      if (new Date(alert.autoResolveTime).getTime() <= now) {
        this.resolveAlert(alertId, 'system', 'Auto-resolved due to timeout');
        autoResolvedCount++;
      }
    }
    
    if (autoResolvedCount > 0) {
      console.log(`🧹 Auto-resolved ${autoResolvedCount} expired alerts`);
    }
  }

  // API methods
  getActiveAlerts() {
    return Array.from(this.activeAlerts.values());
  }

  getAlertHistory(limit = 50) {
    return this.alertHistory.slice(-limit);
  }

  getAlertById(alertId) {
    return this.activeAlerts.get(alertId) || 
           this.alertHistory.find(alert => alert.id === alertId);
  }

  getAlertsByType(type, limit = 20) {
    return this.alertHistory
      .filter(alert => alert.type === type)
      .slice(-limit);
  }

  getAlertStatistics() {
    const stats = {
      total: this.alertHistory.length,
      active: this.activeAlerts.size,
      byType: {},
      bySeverity: {},
      byStatus: {}
    };
    
    this.alertHistory.forEach(alert => {
      stats.byType[alert.type] = (stats.byType[alert.type] || 0) + 1;
      stats.bySeverity[alert.severity] = (stats.bySeverity[alert.severity] || 0) + 1;
      stats.byStatus[alert.status] = (stats.byStatus[alert.status] || 0) + 1;
    });
    
    return stats;
  }
}
