export const config = {
  port: process.env.PORT || 3001,
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // Simulated API Keys (for demonstration only)
  apiKeys: {
    isro: 'sim_isro_aditya_l1_key_2024',
    cactus: 'sim_cactus_database_key',
    noaa: 'sim_noaa_space_weather_key'
  },
  
  // Database Configuration (simulated)
  database: {
    host: 'localhost',
    port: 5432,
    name: 'cme_detection_db',
    user: 'cme_user',
    password: 'secure_password_2024'
  },
  
  // WebSocket Configuration
  websocket: {
    port: 3002
  },
  
  // Alert System Configuration
  alerts: {
    emailEnabled: true,
    smsEnabled: true,
    webhookEnabled: true
  },
  
  // Data Processing Configuration
  processing: {
    dataRetentionDays: 30,
    intervalSeconds: 30,
    anomalyThresholdMultiplier: 2.5
  },
  
  // External APIs
  externalApis: {
    cactusBaseUrl: 'https://cdaw.gsfc.nasa.gov/cactus',
    noaaBaseUrl: 'https://services.swpc.noaa.gov'
  }
};
