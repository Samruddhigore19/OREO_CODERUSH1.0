import { WebSocketServer } from 'ws';
import { EventEmitter } from 'events';

export class WebSocketManager extends EventEmitter {
  constructor(httpServer) {
    super();
    this.wss = new WebSocketServer({ 
      server: httpServer,
      path: '/ws'
    });
    this.clients = new Set();
    this.clientMetadata = new Map();
    this.messageQueue = [];
    this.maxQueueSize = 1000;
    
    this.setupWebSocketServer();
    this.startHeartbeat();
    
    console.log('📡 WebSocket server initialized');
  }

  setupWebSocketServer() {
    this.wss.on('connection', (ws, request) => {
      const clientId = this.generateClientId();
      const clientInfo = {
        id: clientId,
        ip: request.socket.remoteAddress,
        userAgent: request.headers['user-agent'],
        connectedAt: new Date().toISOString(),
        lastPing: Date.now(),
        subscriptions: new Set(['all']) // Default subscription
      };
      
      this.clients.add(ws);
      this.clientMetadata.set(ws, clientInfo);
      
      console.log(`🔌 WebSocket client connected: ${clientId} from ${clientInfo.ip}`);
      
      // Send welcome message with current status
      this.sendToClient(ws, {
        type: 'connection_established',
        clientId: clientId,
        timestamp: new Date().toISOString(),
        message: 'Connected to Aditya-L1 CME Detection System'
      });

      // Set up message handlers
      ws.on('message', (data) => this.handleClientMessage(ws, data));
      ws.on('close', () => this.handleClientDisconnect(ws));
      ws.on('error', (error) => this.handleClientError(ws, error));
      ws.on('pong', () => this.handlePong(ws));
      
      this.emit('clientConnected', clientInfo);
    });

    this.wss.on('error', (error) => {
      console.error('WebSocket server error:', error);
    });
  }

  handleClientMessage(ws, data) {
    try {
      const message = JSON.parse(data.toString());
      const clientInfo = this.clientMetadata.get(ws);
      
      console.log(`📨 Message from ${clientInfo.id}:`, message.type);
      
      switch (message.type) {
        case 'subscribe':
          this.handleSubscription(ws, message.channels);
          break;
          
        case 'unsubscribe':
          this.handleUnsubscription(ws, message.channels);
          break;
          
        case 'request_data':
          this.handleDataRequest(ws, message);
          break;
          
        case 'ping':
          this.sendToClient(ws, { type: 'pong', timestamp: new Date().toISOString() });
          break;
          
        case 'acknowledge_alert':
          this.handleAlertAcknowledge(ws, message);
          break;
          
        default:
          this.sendToClient(ws, {
            type: 'error',
            message: `Unknown message type: ${message.type}`
          });
      }
    } catch (error) {
      console.error('Error parsing client message:', error);
      this.sendToClient(ws, {
        type: 'error',
        message: 'Invalid message format'
      });
    }
  }

  handleSubscription(ws, channels) {
    const clientInfo = this.clientMetadata.get(ws);
    const validChannels = ['all', 'alerts', 'data', 'system', 'cme', 'flares', 'geomag'];
    
    for (const channel of channels) {
      if (validChannels.includes(channel)) {
        clientInfo.subscriptions.add(channel);
      }
    }
    
    this.sendToClient(ws, {
      type: 'subscription_updated',
      subscriptions: Array.from(clientInfo.subscriptions),
      timestamp: new Date().toISOString()
    });
    
    console.log(`📡 Client ${clientInfo.id} subscribed to: ${channels.join(', ')}`);
  }

  handleUnsubscription(ws, channels) {
    const clientInfo = this.clientMetadata.get(ws);
    
    for (const channel of channels) {
      clientInfo.subscriptions.delete(channel);
    }
    
    // Ensure at least one subscription remains
    if (clientInfo.subscriptions.size === 0) {
      clientInfo.subscriptions.add('system');
    }
    
    this.sendToClient(ws, {
      type: 'subscription_updated',
      subscriptions: Array.from(clientInfo.subscriptions),
      timestamp: new Date().toISOString()
    });
    
    console.log(`📡 Client ${clientInfo.id} unsubscribed from: ${channels.join(', ')}`);
  }

  handleDataRequest(ws, message) {
    const clientInfo = this.clientMetadata.get(ws);
    
    // Simulate data request handling
    switch (message.dataType) {
      case 'latest':
        this.sendToClient(ws, {
          type: 'data_response',
          requestId: message.requestId,
          dataType: 'latest',
          data: this.getLatestSimulatedData(),
          timestamp: new Date().toISOString()
        });
        break;
        
      case 'historical':
        this.sendToClient(ws, {
          type: 'data_response',
          requestId: message.requestId,
          dataType: 'historical',
          data: this.getHistoricalSimulatedData(message.timeRange),
          timestamp: new Date().toISOString()
        });
        break;
        
      case 'alerts':
        this.sendToClient(ws, {
          type: 'data_response',
          requestId: message.requestId,
          dataType: 'alerts',
          data: this.getActiveAlertsData(),
          timestamp: new Date().toISOString()
        });
        break;
        
      default:
        this.sendToClient(ws, {
          type: 'error',
          requestId: message.requestId,
          message: `Unknown data type: ${message.dataType}`
        });
    }
    
    console.log(`📊 Data request served for ${clientInfo.id}: ${message.dataType}`);
  }

  handleAlertAcknowledge(ws, message) {
    const clientInfo = this.clientMetadata.get(ws);
    
    // Emit acknowledgment event for processing by alert system
    this.emit('alertAcknowledged', {
      alertId: message.alertId,
      acknowledgedBy: clientInfo.id,
      timestamp: new Date().toISOString()
    });
    
    this.sendToClient(ws, {
      type: 'alert_acknowledge_response',
      alertId: message.alertId,
      status: 'acknowledged',
      timestamp: new Date().toISOString()
    });
    
    console.log(`✅ Alert ${message.alertId} acknowledged by ${clientInfo.id}`);
  }

  handleClientDisconnect(ws) {
    const clientInfo = this.clientMetadata.get(ws);
    if (clientInfo) {
      console.log(`🔌 WebSocket client disconnected: ${clientInfo.id}`);
      this.emit('clientDisconnected', clientInfo);
    }
    
    this.clients.delete(ws);
    this.clientMetadata.delete(ws);
  }

  handleClientError(ws, error) {
    const clientInfo = this.clientMetadata.get(ws);
    console.error(`WebSocket client error (${clientInfo?.id || 'unknown'}):`, error);
  }

  handlePong(ws) {
    const clientInfo = this.clientMetadata.get(ws);
    if (clientInfo) {
      clientInfo.lastPing = Date.now();
    }
  }

  // Broadcasting methods
  broadcastData(data) {
    const message = {
      type: 'data_update',
      data: data,
      timestamp: new Date().toISOString()
    };
    
    this.broadcast(message, ['all', 'data']);
  }

  broadcastAlerts(alerts) {
    for (const alert of alerts) {
      const message = {
        type: 'alert',
        alert: alert,
        timestamp: new Date().toISOString()
      };
      
      this.broadcast(message, ['all', 'alerts', alert.category]);
    }
  }

  broadcastSystemStatus(status) {
    const message = {
      type: 'system_status',
      status: status,
      timestamp: new Date().toISOString()
    };
    
    this.broadcast(message, ['all', 'system']);
  }

  broadcast(message, targetChannels = ['all']) {
    const messageStr = JSON.stringify(message);
    let sentCount = 0;
    
    for (const ws of this.clients) {
      if (ws.readyState === ws.OPEN) {
        const clientInfo = this.clientMetadata.get(ws);
        
        // Check if client is subscribed to any of the target channels
        const hasSubscription = targetChannels.some(channel => 
          clientInfo?.subscriptions.has(channel)
        );
        
        if (hasSubscription) {
          try {
            ws.send(messageStr);
            sentCount++;
          } catch (error) {
            console.error('Error sending message to client:', error);
            this.handleClientError(ws, error);
          }
        }
      }
    }
    
    console.log(`📡 Broadcast sent to ${sentCount} clients: ${message.type}`);
    
    // Store message in queue for recently connected clients
    this.messageQueue.push({
      ...message,
      broadcastTime: Date.now()
    });
    
    if (this.messageQueue.length > this.maxQueueSize) {
      this.messageQueue.shift();
    }
  }

  sendToClient(ws, message) {
    if (ws.readyState === ws.OPEN) {
      try {
        ws.send(JSON.stringify(message));
      } catch (error) {
        console.error('Error sending message to specific client:', error);
        this.handleClientError(ws, error);
      }
    }
  }

  // Heartbeat mechanism
  startHeartbeat() {
    setInterval(() => {
      const now = Date.now();
      const timeout = 30000; // 30 seconds
      
      for (const ws of this.clients) {
        const clientInfo = this.clientMetadata.get(ws);
        
        if (ws.readyState === ws.OPEN) {
          if (now - clientInfo.lastPing > timeout) {
            console.log(`🔌 Pinging client ${clientInfo.id}`);
            ws.ping();
          }
        } else {
          // Clean up dead connections
          this.handleClientDisconnect(ws);
        }
      }
    }, 15000); // Check every 15 seconds
  }

  // Utility methods
  generateClientId() {
    return 'client_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
  }

  getConnectedClients() {
    return Array.from(this.clientMetadata.values());
  }

  getClientCount() {
    return this.clients.size;
  }

  // Simulated data methods (these would typically call actual services)
  getLatestSimulatedData() {
    return {
      solarWindSpeed: 450 + Math.random() * 200,
      protonDensity: 5 + Math.random() * 10,
      protonTemperature: 100000 + Math.random() * 200000,
      imfBz: (Math.random() - 0.5) * 10,
      kpIndex: Math.random() * 9,
      timestamp: new Date().toISOString()
    };
  }

  getHistoricalSimulatedData(timeRange = 3600000) {
    const points = Math.min(100, Math.floor(timeRange / 60000)); // One point per minute
    const data = [];
    
    for (let i = points; i >= 0; i--) {
      data.push({
        timestamp: new Date(Date.now() - i * 60000).toISOString(),
        solarWindSpeed: 400 + Math.random() * 300,
        protonDensity: 3 + Math.random() * 15,
        kpIndex: Math.random() * 6
      });
    }
    
    return data;
  }

  getActiveAlertsData() {
    return [
      {
        id: 'alert_1',
        type: 'cme_detection',
        severity: 'moderate',
        timestamp: new Date(Date.now() - 300000).toISOString(),
        status: 'active'
      },
      {
        id: 'alert_2',
        type: 'solar_flare',
        severity: 'minor',
        timestamp: new Date(Date.now() - 600000).toISOString(),
        status: 'acknowledged'
      }
    ];
  }

  // Clean shutdown
  close() {
    console.log('🔌 Closing WebSocket server...');
    
    // Send disconnection notice to all clients
    this.broadcast({
      type: 'server_shutdown',
      message: 'Server is shutting down',
      timestamp: new Date().toISOString()
    });
    
    // Close all client connections
    for (const ws of this.clients) {
      ws.close(1000, 'Server shutdown');
    }
    
    // Close the server
    this.wss.close(() => {
      console.log('🔌 WebSocket server closed');
    });
  }

  // Statistics and monitoring
  getStatistics() {
    return {
      connectedClients: this.clients.size,
      totalConnections: this.clientMetadata.size,
      messageQueueSize: this.messageQueue.length,
      subscriptionStats: this.getSubscriptionStatistics(),
      uptime: process.uptime()
    };
  }

  getSubscriptionStatistics() {
    const stats = {};
    
    for (const clientInfo of this.clientMetadata.values()) {
      for (const subscription of clientInfo.subscriptions) {
        stats[subscription] = (stats[subscription] || 0) + 1;
      }
    }
    
    return stats;
  }
}
