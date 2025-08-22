const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export interface SolarWindData {
  timestamp: string;
  solarWind: {
    speed: { value: number; unit: string; quality: string };
    density: { value: number; unit: string; quality: string };
    temperature: { value: number; unit: string; quality: string };
    alphaRatio: { value: number; unit: string; quality: string };
  };
  magneticField: {
    bx: number;
    by: number;
    bz: number;
    magnitude: number;
    unit: string;
    quality: string;
  };
  plasma: {
    beta: { value: number; unit: string; quality: string };
    alfvenSpeed: { value: number; unit: string; quality: string };
  };
  quality: {
    dataCompleteness: number;
    signalToNoise: number;
    communicationDelay: number;
    calibrationStatus: string;
    instrumentHealth: {
      aspex: string;
      suit: string;
    };
  };
}

export interface CMEEvent {
  id: string;
  type: string;
  category: string;
  severity: string;
  confidence: number;
  timestamp: string;
  status: string;
  parameters?: {
    solarWindSpeed?: number;
    protonDensity?: number;
    protonTemperature?: number;
    imfMagnitude?: number;
  };
  earthImpact?: {
    probability: number;
    estimatedArrivalTime?: {
      estimatedHours: number;
      arrivalTime: string;
      uncertainty: string;
    };
    expectedEffects: string[];
  };
  analysis?: {
    earthImpactCategory: string;
    severityScore: number;
    riskLevel: string;
    estimatedDuration: string;
  };
}

export interface Alert {
  id: string;
  type: string;
  category: string;
  severity: string;
  priority: string;
  confidence: number;
  timestamp: string;
  status: string;
  title: string;
  message: string;
  recommendations: string[];
  deliveryStatus: {
    email: string;
    sms: string;
    webhook: string;
    dashboard: string;
  };
}

export interface SystemStatus {
  overall: string;
  timestamp: string;
  uptime: number;
  components: {
    dataSimulation: {
      status: string;
      lastUpdate: string;
      dataPoints: number;
      currentCME: string;
    };
    anomalyDetection: {
      status: string;
      recentAnomalies: number;
      detectionSensitivity: string;
      lastAnalysis: string;
    };
    alertSystem: {
      status: string;
      activeAlerts: number;
      totalProcessed: number;
      deliveryChannels: {
        email: string;
        sms: string;
        webhook: string;
        dashboard: string;
      };
    };
    webSocket: {
      status: string;
      connectedClients: number;
      totalConnections: number;
      messageQueueSize: number;
    };
    dataQuality?: {
      completeness: number;
      signalToNoise: number;
      communicationDelay: number;
      calibrationStatus: string;
    };
  };
}

class APIError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'APIError';
  }
}

async function apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
    throw new APIError(response.status, errorData.message || `HTTP ${response.status}`);
  }

  return response.json();
}

// Solar Wind API
export const solarWindAPI = {
  getCurrent: (): Promise<{ data: SolarWindData }> =>
    apiRequest('/solar-wind/current'),

  getHistory: (params?: {
    timeRange?: number;
    points?: number;
    parameter?: string;
  }): Promise<{
    parameter: string;
    timeRange: number;
    data: any[];
    metadata: any;
  }> => {
    const searchParams = new URLSearchParams();
    if (params?.timeRange) searchParams.set('timeRange', params.timeRange.toString());
    if (params?.points) searchParams.set('points', params.points.toString());
    if (params?.parameter) searchParams.set('parameter', params.parameter);
    
    return apiRequest(`/solar-wind/history?${searchParams}`);
  },

  getStatistics: (): Promise<{
    timeRange: string;
    dataPoints: number;
    statistics: any;
    dataQuality: any;
  }> => apiRequest('/solar-wind/statistics'),

  getComposition: (): Promise<{
    timestamp: string;
    composition: any;
    alphaParticleRatio: any;
    quality: any;
  }> => apiRequest('/solar-wind/composition'),

  getTrends: (parameter: string, hours?: number): Promise<{
    parameter: string;
    timeRange: string;
    trend: any;
    data: any[];
    analysis: any;
  }> => {
    const searchParams = new URLSearchParams();
    if (hours) searchParams.set('hours', hours.toString());
    
    return apiRequest(`/solar-wind/trends/${parameter}?${searchParams}`);
  },
};

// CME API
export const cmeAPI = {
  getCurrent: (): Promise<{
    timestamp: string;
    currentCMEEvent: any;
    recentDetections: CMEEvent[];
    detectionStatus: any;
    parameters: any;
  }> => apiRequest('/cme/current'),

  getHistory: (params?: {
    limit?: number;
    severity?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<{
    events: CMEEvent[];
    totalEvents: number;
    statistics: any;
  }> => {
    const searchParams = new URLSearchParams();
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    if (params?.severity) searchParams.set('severity', params.severity);
    if (params?.startDate) searchParams.set('startDate', params.startDate);
    if (params?.endDate) searchParams.set('endDate', params.endDate);
    
    return apiRequest(`/cme/history?${searchParams}`);
  },

  simulate: (params: {
    intensity?: number;
    duration?: number;
    earthDirected?: boolean;
  }): Promise<{
    success: boolean;
    message: string;
    parameters: any;
  }> => apiRequest('/cme/simulate', {
    method: 'POST',
    body: JSON.stringify(params),
  }),

  getEarthImpacts: (): Promise<{
    earthImpactPredictions: any[];
    summary: any;
  }> => apiRequest('/cme/impact/earth'),

  getClassification: (): Promise<{
    speedClassification: any;
    densityClassification: any;
    severityClassification: any;
  }> => apiRequest('/cme/classification'),

  getMonitoringStatus: (): Promise<any> => apiRequest('/cme/monitoring/status'),
};

// Alerts API
export const alertsAPI = {
  getActive: (): Promise<{
    activeAlerts: Alert[];
    count: number;
    summary: any;
  }> => apiRequest('/alerts/active'),

  getHistory: (params?: {
    limit?: number;
    type?: string;
    severity?: string;
    priority?: string;
  }): Promise<{
    alerts: Alert[];
    totalReturned: number;
    statistics: any;
  }> => {
    const searchParams = new URLSearchParams();
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    if (params?.type) searchParams.set('type', params.type);
    if (params?.severity) searchParams.set('severity', params.severity);
    if (params?.priority) searchParams.set('priority', params.priority);
    
    return apiRequest(`/alerts/history?${searchParams}`);
  },

  getById: (alertId: string): Promise<{ alert: Alert }> =>
    apiRequest(`/alerts/${alertId}`),

  acknowledge: (alertId: string, acknowledgedBy: string): Promise<{
    success: boolean;
    message: string;
  }> => apiRequest(`/alerts/${alertId}/acknowledge`, {
    method: 'POST',
    body: JSON.stringify({ acknowledgedBy }),
  }),

  resolve: (alertId: string, resolvedBy: string, resolution: string): Promise<{
    success: boolean;
    message: string;
  }> => apiRequest(`/alerts/${alertId}/resolve`, {
    method: 'POST',
    body: JSON.stringify({ resolvedBy, resolution }),
  }),

  getStatistics: (): Promise<{
    overall: any;
    recentActivity: any;
    systemHealth: any;
  }> => apiRequest('/alerts/statistics/summary'),

  getByType: (alertType: string, limit?: number): Promise<{
    alerts: Alert[];
    type: string;
    count: number;
    statistics: any;
  }> => {
    const searchParams = new URLSearchParams();
    if (limit) searchParams.set('limit', limit.toString());
    
    return apiRequest(`/alerts/type/${alertType}?${searchParams}`);
  },

  testAlert: (params?: {
    type?: string;
    severity?: string;
    message?: string;
  }): Promise<{
    success: boolean;
    message: string;
    processedAlerts: any[];
  }> => apiRequest('/alerts/test', {
    method: 'POST',
    body: JSON.stringify(params || {}),
  }),

  getConfig: (): Promise<any> => apiRequest('/alerts/config/rules'),
};

// System API
export const systemAPI = {
  getStatus: (): Promise<SystemStatus> => apiRequest('/system/status'),

  getInstruments: (): Promise<{
    timestamp: string;
    aspex: any;
    suit: any;
    spacecraft: any;
  }> => apiRequest('/system/instruments'),

  getHealth: (): Promise<{
    overall: any;
    components: any;
    trends: any;
    recommendations: string[];
  }> => apiRequest('/system/health'),

  getConfig: (): Promise<{
    system: any;
    dataAcquisition: any;
    anomalyDetection: any;
    alerting: any;
    communication: any;
    external: any;
  }> => apiRequest('/system/config'),

  getLogs: (params?: {
    level?: string;
    limit?: number;
  }): Promise<{
    logs: any[];
    level: string;
    count: number;
  }> => {
    const searchParams = new URLSearchParams();
    if (params?.level) searchParams.set('level', params.level);
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    
    return apiRequest(`/system/logs?${searchParams}`);
  },

  performMaintenance: (operation: string, confirmedBy: string): Promise<{
    success: boolean;
    operation: string;
    message: string;
  }> => apiRequest(`/system/maintenance/${operation}`, {
    method: 'POST',
    body: JSON.stringify({ confirmedBy }),
  }),
};

// Forecasts API
export const forecastsAPI = {
  getCurrent: (): Promise<{
    timestamp: string;
    forecastPeriod: string;
    confidence: string;
    spaceWeatherConditions: any;
    geomagneticActivity: any;
    solarActivity: any;
    impacts: any;
    recommendations: string[];
  }> => apiRequest('/forecasts/current'),

  getExtended: (days?: number): Promise<{
    timestamp: string;
    forecastPeriod: string;
    confidence: string;
    summary: any;
    dailyForecasts: any[];
    keyEvents: any[];
    longTermTrends: any;
  }> => {
    const searchParams = new URLSearchParams();
    if (days) searchParams.set('days', days.toString());
    
    return apiRequest(`/forecasts/extended?${searchParams}`);
  },

  getCMEImpacts: (): Promise<{
    timestamp: string;
    activeCMEs: number;
    predictions: any[];
    riskAssessment: any;
    recommendations: string[];
  }> => apiRequest('/forecasts/cme-impacts'),

  getGeomagnetic: (hours?: number): Promise<{
    timestamp: string;
    forecastPeriod: string;
    currentKp: number;
    hourlyForecast: any[];
    stormProbability: any;
    peakActivity: any;
  }> => {
    const searchParams = new URLSearchParams();
    if (hours) searchParams.set('hours', hours.toString());
    
    return apiRequest(`/forecasts/geomagnetic?${searchParams}`);
  },

  getAurora: (latitude: number, longitude: number): Promise<{
    timestamp: string;
    location: { latitude: number; longitude: number };
    visibility: any;
    currentConditions: any;
    recommendations: string[];
  }> => {
    const searchParams = new URLSearchParams();
    searchParams.set('latitude', latitude.toString());
    searchParams.set('longitude', longitude.toString());
    
    return apiRequest(`/forecasts/aurora?${searchParams}`);
  },

  getSatelliteOps: (params?: {
    altitude?: number;
    mission?: string;
  }): Promise<{
    timestamp: string;
    targetAltitude: number;
    mission: string;
    operationalConditions: any;
    atmosphericDrag: any;
    chargingRisk: any;
    radiationEnvironment: any;
    communicationEffects: any;
    missionSpecific: any;
  }> => {
    const searchParams = new URLSearchParams();
    if (params?.altitude) searchParams.set('altitude', params.altitude.toString());
    if (params?.mission) searchParams.set('mission', params.mission);
    
    return apiRequest(`/forecasts/satellite-ops?${searchParams}`);
  },

  getRadioComm: (params?: {
    frequency?: string;
    region?: string;
  }): Promise<{
    timestamp: string;
    frequency: string;
    region: string;
    current: any;
    next24h: any;
    blackoutRisk: any;
    regional: any;
    recommendations: string[];
  }> => {
    const searchParams = new URLSearchParams();
    if (params?.frequency) searchParams.set('frequency', params.frequency);
    if (params?.region) searchParams.set('region', params.region);
    
    return apiRequest(`/forecasts/radio-comm?${searchParams}`);
  },

  getAccuracy: (days?: number): Promise<{
    timestamp: string;
    period: string;
    overallAccuracy: number;
    byCategory: any;
    confidenceIntervals: any;
    improvements: any;
  }> => {
    const searchParams = new URLSearchParams();
    if (days) searchParams.set('days', days.toString());
    
    return apiRequest(`/forecasts/accuracy?${searchParams}`);
  },
};

// Correlation API
export const correlationAPI = {
  getExternal: (params?: {
    source?: string;
    timeRange?: number;
  }): Promise<{
    timestamp: string;
    timeRange: string;
    correlations: any;
    sources: any;
  }> => {
    const searchParams = new URLSearchParams();
    if (params?.source) searchParams.set('source', params.source);
    if (params?.timeRange) searchParams.set('timeRange', params.timeRange.toString());
    
    return apiRequest(`/correlation/external?${searchParams}`);
  },

  getCACTus: (): Promise<{
    timestamp: string;
    source: string;
    correlation: any;
    summary: any;
  }> => apiRequest('/correlation/cactus'),

  getNOAA: (): Promise<{
    timestamp: string;
    source: string;
    correlation: any;
    comparison: any;
  }> => apiRequest('/correlation/noaa'),

  getESA: (): Promise<{
    timestamp: string;
    source: string;
    correlation: any;
    validation: any;
  }> => apiRequest('/correlation/esa'),

  getValidation: (eventId: string): Promise<{
    timestamp: string;
    eventId: string;
    event: any;
    validation: any;
  }> => {
    const searchParams = new URLSearchParams();
    searchParams.set('eventId', eventId);
    
    return apiRequest(`/correlation/validation?${searchParams}`);
  },

  getStatistics: (days?: number): Promise<{
    timestamp: string;
    period: string;
    statistics: any;
    summary: any;
  }> => {
    const searchParams = new URLSearchParams();
    if (days) searchParams.set('days', days.toString());
    
    return apiRequest(`/correlation/statistics?${searchParams}`);
  },

  validateEvent: (eventData: any, sources?: string[]): Promise<{
    timestamp: string;
    eventData: any;
    validation: any;
    conclusion: any;
  }> => apiRequest('/correlation/validate', {
    method: 'POST',
    body: JSON.stringify({ eventData, sources }),
  }),
};

// Health check
export const healthAPI = {
  check: (): Promise<{
    status: string;
    timestamp: string;
    uptime: number;
    environment: string;
    services: any;
  }> => apiRequest('/health'),
};

// WebSocket connection for real-time updates
export class WebSocketManager {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectInterval = 5000;
  private subscriptions: Set<string> = new Set(['all']);
  private messageHandlers: Map<string, (data: any) => void> = new Map();

  constructor(private baseUrl: string = 'ws://localhost:3001') {}

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(`${this.baseUrl}/ws`);

        this.ws.onopen = () => {
          console.log('WebSocket connected');
          this.reconnectAttempts = 0;
          
          // Subscribe to default channels
          this.subscribe(['all']);
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            this.handleMessage(data);
          } catch (error) {
            console.error('Error parsing WebSocket message:', error);
          }
        };

        this.ws.onclose = () => {
          console.log('WebSocket disconnected');
          this.attemptReconnect();
        };

        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          reject(error);
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  private handleMessage(data: any) {
    const handler = this.messageHandlers.get(data.type);
    if (handler) {
      handler(data);
    }

    // Call generic handler
    const genericHandler = this.messageHandlers.get('*');
    if (genericHandler) {
      genericHandler(data);
    }
  }

  private attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
      
      setTimeout(() => {
        this.connect().catch(console.error);
      }, this.reconnectInterval);
    } else {
      console.error('Max reconnection attempts reached');
    }
  }

  subscribe(channels: string[]) {
    channels.forEach(channel => this.subscriptions.add(channel));
    
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'subscribe',
        channels: channels
      }));
    }
  }

  unsubscribe(channels: string[]) {
    channels.forEach(channel => this.subscriptions.delete(channel));
    
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'unsubscribe',
        channels: channels
      }));
    }
  }

  onMessage(type: string, handler: (data: any) => void) {
    this.messageHandlers.set(type, handler);
  }

  offMessage(type: string) {
    this.messageHandlers.delete(type);
  }

  requestData(dataType: string, params?: any): Promise<any> {
    return new Promise((resolve, reject) => {
      const requestId = Math.random().toString(36).substr(2, 9);
      
      const timeout = setTimeout(() => {
        this.offMessage(`data_response_${requestId}`);
        reject(new Error('Request timeout'));
      }, 10000);

      this.onMessage(`data_response_${requestId}`, (data) => {
        clearTimeout(timeout);
        this.offMessage(`data_response_${requestId}`);
        resolve(data.data);
      });

      if (this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({
          type: 'request_data',
          requestId,
          dataType,
          ...params
        }));
      } else {
        clearTimeout(timeout);
        reject(new Error('WebSocket not connected'));
      }
    });
  }

  acknowledgeAlert(alertId: string) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'acknowledge_alert',
        alertId
      }));
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.messageHandlers.clear();
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}

// Export singleton instance
export const wsManager = new WebSocketManager();

// Utility functions
export function formatTimestamp(timestamp: string): string {
  return new Date(timestamp).toLocaleString();
}

export function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  return `${Math.floor(seconds / 3600)}h`;
}

export function formatBytes(bytes: number): string {
  const sizes = ['B', 'KB', 'MB', 'GB'];
  if (bytes === 0) return '0 B';
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
}

export function getSeverityColor(severity: string): string {
  switch (severity.toLowerCase()) {
    case 'severe':
    case 'critical':
      return 'text-red-600';
    case 'moderate':
    case 'high':
      return 'text-orange-600';
    case 'minor':
    case 'medium':
      return 'text-yellow-600';
    case 'low':
      return 'text-blue-600';
    default:
      return 'text-gray-600';
  }
}

export function getStatusColor(status: string): string {
  switch (status.toLowerCase()) {
    case 'online':
    case 'active':
    case 'nominal':
    case 'healthy':
      return 'text-green-600';
    case 'warning':
    case 'degraded':
      return 'text-yellow-600';
    case 'offline':
    case 'error':
    case 'critical':
      return 'text-red-600';
    default:
      return 'text-gray-600';
  }
}
