import express from 'express';

const router = express.Router();

// Get active alerts
router.get('/active', (req, res) => {
  try {
    const alertSystem = req.app.locals.alertSystem;
    const activeAlerts = alertSystem.getActiveAlerts();
    
    const response = {
      activeAlerts,
      count: activeAlerts.length,
      lastUpdate: new Date().toISOString(),
      summary: {
        critical: activeAlerts.filter(a => a.priority === 'critical').length,
        high: activeAlerts.filter(a => a.priority === 'high').length,
        medium: activeAlerts.filter(a => a.priority === 'medium').length,
        low: activeAlerts.filter(a => a.priority === 'low').length
      }
    };
    
    res.json(response);
  } catch (error) {
    console.error('Error fetching active alerts:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to retrieve active alerts'
    });
  }
});

// Get alert history
router.get('/history', (req, res) => {
  try {
    const alertSystem = req.app.locals.alertSystem;
    const limit = parseInt(req.query.limit) || 50;
    const type = req.query.type;
    const severity = req.query.severity;
    const priority = req.query.priority;
    
    let alerts = alertSystem.getAlertHistory(limit);
    
    // Apply filters
    if (type) {
      alerts = alerts.filter(alert => alert.type === type);
    }
    
    if (severity) {
      alerts = alerts.filter(alert => alert.severity === severity);
    }
    
    if (priority) {
      alerts = alerts.filter(alert => alert.priority === priority);
    }
    
    const response = {
      alerts: alerts.slice(-limit),
      totalReturned: Math.min(alerts.length, limit),
      filters: { type, severity, priority, limit },
      statistics: alertSystem.getAlertStatistics()
    };
    
    res.json(response);
  } catch (error) {
    console.error('Error fetching alert history:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to retrieve alert history'
    });
  }
});

// Get specific alert by ID
router.get('/:alertId', (req, res) => {
  try {
    const alertSystem = req.app.locals.alertSystem;
    const alertId = req.params.alertId;
    
    const alert = alertSystem.getAlertById(alertId);
    
    if (!alert) {
      return res.status(404).json({
        error: 'Alert not found',
        message: `Alert with ID ${alertId} does not exist`
      });
    }
    
    res.json({
      alert,
      retrievedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching alert:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to retrieve alert'
    });
  }
});

// Acknowledge an alert
router.post('/:alertId/acknowledge', (req, res) => {
  try {
    const alertSystem = req.app.locals.alertSystem;
    const alertId = req.params.alertId;
    const { acknowledgedBy } = req.body;
    
    if (!acknowledgedBy) {
      return res.status(400).json({
        error: 'Missing required field',
        message: 'acknowledgedBy field is required'
      });
    }
    
    const success = alertSystem.acknowledgeAlert(alertId, acknowledgedBy);
    
    if (!success) {
      return res.status(404).json({
        error: 'Alert not found or already processed',
        message: `Cannot acknowledge alert ${alertId}`
      });
    }
    
    res.json({
      success: true,
      message: 'Alert acknowledged successfully',
      alertId,
      acknowledgedBy,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error acknowledging alert:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to acknowledge alert'
    });
  }
});

// Resolve an alert
router.post('/:alertId/resolve', (req, res) => {
  try {
    const alertSystem = req.app.locals.alertSystem;
    const alertId = req.params.alertId;
    const { resolvedBy, resolution } = req.body;
    
    if (!resolvedBy || !resolution) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'resolvedBy and resolution fields are required'
      });
    }
    
    const success = alertSystem.resolveAlert(alertId, resolvedBy, resolution);
    
    if (!success) {
      return res.status(404).json({
        error: 'Alert not found or already resolved',
        message: `Cannot resolve alert ${alertId}`
      });
    }
    
    res.json({
      success: true,
      message: 'Alert resolved successfully',
      alertId,
      resolvedBy,
      resolution,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error resolving alert:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to resolve alert'
    });
  }
});

// Get alert statistics
router.get('/statistics/summary', (req, res) => {
  try {
    const alertSystem = req.app.locals.alertSystem;
    const stats = alertSystem.getAlertStatistics();
    
    // Calculate additional metrics
    const last24Hours = Date.now() - 86400000;
    const last7Days = Date.now() - 604800000;
    
    const recent24h = alertSystem.getAlertHistory(1000).filter(
      alert => new Date(alert.timestamp).getTime() > last24Hours
    );
    
    const recent7d = alertSystem.getAlertHistory(1000).filter(
      alert => new Date(alert.timestamp).getTime() > last7Days
    );
    
    const response = {
      overall: stats,
      recentActivity: {
        last24Hours: {
          count: recent24h.length,
          critical: recent24h.filter(a => a.priority === 'critical').length,
          high: recent24h.filter(a => a.priority === 'high').length,
          byType: recent24h.reduce((acc, alert) => {
            acc[alert.type] = (acc[alert.type] || 0) + 1;
            return acc;
          }, {})
        },
        last7Days: {
          count: recent7d.length,
          averagePerDay: Math.round(recent7d.length / 7),
          trend: calculateTrend(recent7d)
        }
      },
      systemHealth: {
        alertsPerHour: calculateAlertsPerHour(recent24h),
        avgResolutionTime: calculateAvgResolutionTime(recent7d),
        escalationRate: calculateEscalationRate(recent7d)
      },
      lastUpdate: new Date().toISOString()
    };
    
    res.json(response);
  } catch (error) {
    console.error('Error fetching alert statistics:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to retrieve alert statistics'
    });
  }
});

// Get alerts by type
router.get('/type/:alertType', (req, res) => {
  try {
    const alertSystem = req.app.locals.alertSystem;
    const alertType = req.params.alertType;
    const limit = parseInt(req.query.limit) || 20;
    
    const typeAlerts = alertSystem.getAlertsByType(alertType, limit);
    
    if (typeAlerts.length === 0) {
      return res.json({
        alerts: [],
        type: alertType,
        count: 0,
        message: `No alerts found for type: ${alertType}`
      });
    }
    
    // Calculate type-specific statistics
    const typeStats = {
      total: typeAlerts.length,
      severityDistribution: typeAlerts.reduce((acc, alert) => {
        acc[alert.severity] = (acc[alert.severity] || 0) + 1;
        return acc;
      }, {}),
      avgConfidence: Math.round(
        typeAlerts.reduce((sum, alert) => sum + alert.confidence, 0) / typeAlerts.length
      ),
      recentTrend: analyzeTypeFrequency(typeAlerts)
    };
    
    res.json({
      alerts: typeAlerts,
      type: alertType,
      count: typeAlerts.length,
      statistics: typeStats,
      lastUpdate: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching alerts by type:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to retrieve alerts by type'
    });
  }
});

// Test alert system (development/testing endpoint)
router.post('/test', (req, res) => {
  try {
    const { type = 'test_alert', severity = 'minor', message = 'Test alert' } = req.body;
    
    // Create a test anomaly
    const testAnomaly = {
      type,
      severity,
      confidence: 95,
      timestamp: new Date().toISOString(),
      category: 'test',
      parameters: {
        testParameter: 'test_value'
      },
      earthImpact: {
        probability: 0.1
      },
      triggers: {
        testTrigger: true
      }
    };
    
    const alertSystem = req.app.locals.alertSystem;
    const processedAlerts = alertSystem.processAnomalies([testAnomaly]);
    
    res.json({
      success: true,
      message: 'Test alert processed',
      testAnomaly,
      processedAlerts,
      timestamp: new Date().toISOString(),
      warning: 'This is a test alert for development purposes'
    });
  } catch (error) {
    console.error('Error processing test alert:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to process test alert'
    });
  }
});

// Get alert configuration
router.get('/config/rules', (req, res) => {
  try {
    const alertSystem = req.app.locals.alertSystem;
    
    const config = {
      alertRules: alertSystem.alertRules,
      contactGroups: Object.keys(alertSystem.contactGroups).map(key => ({
        name: key,
        displayName: alertSystem.contactGroups[key].name,
        contactCount: alertSystem.contactGroups[key].contacts.length,
        alertLevels: alertSystem.contactGroups[key].alertLevels
      })),
      alertChannels: {
        email: {
          enabled: alertSystem.alertChannels.email.enabled,
          templates: Object.keys(alertSystem.alertChannels.email.templates)
        },
        sms: {
          enabled: alertSystem.alertChannels.sms.enabled,
          criticalOnly: alertSystem.alertChannels.sms.criticalOnly
        },
        webhook: {
          enabled: alertSystem.alertChannels.webhook.enabled,
          endpointCount: alertSystem.alertChannels.webhook.endpoints.length
        },
        dashboard: {
          enabled: alertSystem.alertChannels.dashboard.enabled,
          realTime: alertSystem.alertChannels.dashboard.realTime
        }
      },
      lastUpdate: new Date().toISOString()
    };
    
    res.json(config);
  } catch (error) {
    console.error('Error fetching alert configuration:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to retrieve alert configuration'
    });
  }
});

// Helper functions

function calculateTrend(alerts) {
  if (alerts.length < 2) return 'insufficient_data';
  
  // Simple trend calculation based on last 7 days
  const dailyCounts = {};
  const today = new Date();
  
  // Initialize days
  for (let i = 6; i >= 0; i--) {
    const date = new Date(today.getTime() - i * 86400000);
    const dateStr = date.toISOString().split('T')[0];
    dailyCounts[dateStr] = 0;
  }
  
  // Count alerts per day
  alerts.forEach(alert => {
    const alertDate = new Date(alert.timestamp).toISOString().split('T')[0];
    if (dailyCounts.hasOwnProperty(alertDate)) {
      dailyCounts[alertDate]++;
    }
  });
  
  const counts = Object.values(dailyCounts);
  const firstHalf = counts.slice(0, Math.floor(counts.length / 2));
  const secondHalf = counts.slice(Math.floor(counts.length / 2));
  
  const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
  const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
  
  if (secondAvg > firstAvg * 1.2) return 'increasing';
  if (secondAvg < firstAvg * 0.8) return 'decreasing';
  return 'stable';
}

function calculateAlertsPerHour(alerts) {
  if (alerts.length === 0) return 0;
  return Math.round((alerts.length / 24) * 10) / 10;
}

function calculateAvgResolutionTime(alerts) {
  const resolvedAlerts = alerts.filter(alert => 
    alert.status === 'resolved' && alert.resolvedAt
  );
  
  if (resolvedAlerts.length === 0) return 'N/A';
  
  const totalTime = resolvedAlerts.reduce((total, alert) => {
    const created = new Date(alert.timestamp).getTime();
    const resolved = new Date(alert.resolvedAt).getTime();
    return total + (resolved - created);
  }, 0);
  
  const avgMs = totalTime / resolvedAlerts.length;
  const avgMinutes = Math.round(avgMs / 60000);
  
  if (avgMinutes < 60) return `${avgMinutes} minutes`;
  if (avgMinutes < 1440) return `${Math.round(avgMinutes / 60)} hours`;
  return `${Math.round(avgMinutes / 1440)} days`;
}

function calculateEscalationRate(alerts) {
  if (alerts.length === 0) return 0;
  
  const escalatedAlerts = alerts.filter(alert => alert.escalationRequired);
  return Math.round((escalatedAlerts.length / alerts.length) * 100);
}

function analyzeTypeFrequency(alerts) {
  if (alerts.length < 5) return 'insufficient_data';
  
  // Group by recent periods
  const last24h = alerts.filter(alert => 
    new Date(alert.timestamp).getTime() > Date.now() - 86400000
  );
  
  const previous24h = alerts.filter(alert => {
    const time = new Date(alert.timestamp).getTime();
    return time > Date.now() - 172800000 && time <= Date.now() - 86400000;
  });
  
  if (previous24h.length === 0) return 'insufficient_data';
  
  const recentRate = last24h.length;
  const previousRate = previous24h.length;
  
  if (recentRate > previousRate * 1.5) return 'increasing';
  if (recentRate < previousRate * 0.5) return 'decreasing';
  return 'stable';
}

export default router;
