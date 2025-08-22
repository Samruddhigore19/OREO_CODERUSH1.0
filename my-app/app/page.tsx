"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { SparklineChart } from "@/components/sparkline-chart"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  Activity,
  Wind,
  Zap,
  Compass,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  CheckCircle,
  Clock,
} from "lucide-react"
import { useEffect, useState } from "react"
import { solarWindAPI, systemAPI, alertsAPI, cmeAPI, wsManager } from "@/lib/api"

// Enhanced mock data with historical trends for sparklines
const solarWindData = {
  speed: {
    current: 425.7,
    trend: "up",
    change: 12.3,
    history: [380, 385, 392, 405, 418, 425, 430, 428, 425.7],
  },
  density: {
    current: 8.2,
    trend: "down",
    change: 5.7,
    history: [9.1, 8.9, 8.7, 8.5, 8.3, 8.1, 8.0, 8.1, 8.2],
  },
  bz: {
    current: -3.4,
    trend: "stable",
    change: 0.2,
    history: [-3.2, -3.5, -3.1, -3.6, -3.3, -3.4, -3.5, -3.3, -3.4],
  },
  kpIndex: {
    current: 4.2,
    trend: "up",
    change: 8.2,
    history: [3.1, 3.3, 3.5, 3.8, 4.0, 4.1, 4.3, 4.2, 4.2],
  },
}

const systemHealth = {
  aspex: { status: "online", uptime: 98.7, lastUpdate: "2 min ago" },
  suit: { status: "online", uptime: 95.2, lastUpdate: "1 min ago" },
  processing: { status: "processing", uptime: 87.3, lastUpdate: "30 sec ago" },
  alerts: { status: "active", uptime: 100, lastUpdate: "Live" },
}

const recentEvents = [
  {
    id: 1,
    timestamp: "2024-01-15 14:23:00",
    type: "CME Detection",
    severity: "Moderate",
    speed: 650,
    status: "Active",
    confidence: 87,
  },
  {
    id: 2,
    timestamp: "2024-01-15 09:15:00",
    type: "Solar Flare",
    severity: "Minor",
    speed: 420,
    status: "Resolved",
    confidence: 92,
  },
  {
    id: 3,
    timestamp: "2024-01-14 22:45:00",
    type: "Geomagnetic Storm",
    severity: "Severe",
    speed: 780,
    status: "Monitoring",
    confidence: 95,
  },
  {
    id: 4,
    timestamp: "2024-01-14 18:30:00",
    type: "Particle Enhancement",
    severity: "Minor",
    speed: 380,
    status: "Resolved",
    confidence: 78,
  },
]

function StatCard({
  title,
  value,
  unit,
  icon: Icon,
  trend,
  trendValue,
  description,
  sparklineData,
  sparklineColor,
}: {
  title: string
  value: number
  unit: string
  icon: any
  trend: "up" | "down" | "stable"
  trendValue: number
  description: string
  sparklineData: number[]
  sparklineColor?: string
}) {
  const TrendIcon = trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus
  const trendColor = trend === "up" ? "text-green-600" : trend === "down" ? "text-red-600" : "text-gray-600"

  return (
    <Card className="relative overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          {value} <span className="text-sm font-normal text-muted-foreground">{unit}</span>
        </div>
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center space-x-1 text-xs text-muted-foreground">
            <TrendIcon className={`h-3 w-3 ${trendColor}`} />
            <span className={trendColor}>{trend === "stable" ? "Stable" : `${Math.abs(trendValue)}% ${trend}`}</span>
          </div>
          <SparklineChart
            data={sparklineData}
            color={sparklineColor || (trend === "up" ? "#10b981" : trend === "down" ? "#ef4444" : "#6b7280")}
            className="h-8 w-16"
          />
        </div>
        <p className="text-xs text-muted-foreground mt-1">{description}</p>
      </CardContent>
    </Card>
  )
}

export default function HomePage() {
  const [solarWindData, setSolarWindData] = useState<any>(null)
  const [systemStatus, setSystemStatus] = useState<any>(null)
  const [activeAlerts, setActiveAlerts] = useState<any[]>([])
  const [recentEvents, setRecentEvents] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [wsConnected, setWsConnected] = useState(false)

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setIsLoading(true)
        
        // Fetch all initial data in parallel
        const [solarWind, system, alerts, cmeHistory] = await Promise.all([
          solarWindAPI.getCurrent().catch(() => null),
          systemAPI.getStatus().catch(() => null),
          alertsAPI.getActive().catch(() => ({ activeAlerts: [] })),
          cmeAPI.getHistory({ limit: 10 }).catch(() => ({ events: [] }))
        ])

        if (solarWind) setSolarWindData(solarWind.data)
        if (system) setSystemStatus(system)
        setActiveAlerts(alerts.activeAlerts || [])
        setRecentEvents(cmeHistory.events || [])
      } catch (error) {
        console.error('Error fetching initial data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchInitialData()

    // Set up WebSocket connection
    const setupWebSocket = async () => {
      try {
        await wsManager.connect()
        setWsConnected(true)

        // Subscribe to real-time updates
        wsManager.subscribe(['data', 'alerts', 'system'])

        // Handle real-time data updates
        wsManager.onMessage('data_update', (data) => {
          if (data.data) {
            setSolarWindData(data.data)
          }
        })

        // Handle new alerts
        wsManager.onMessage('alert', (data) => {
          if (data.alert) {
            setActiveAlerts(prev => [data.alert, ...prev].slice(0, 10))
          }
        })

        // Handle system status updates
        wsManager.onMessage('system_status', (data) => {
          if (data.status) {
            setSystemStatus(data.status)
          }
        })
      } catch (error) {
        console.error('WebSocket connection failed:', error)
        setWsConnected(false)
      }
    }

    setupWebSocket()

    // Cleanup on unmount
    return () => {
      wsManager.disconnect()
    }
  }, [])

  // Generate sparkline data from historical trends
  const generateSparklineData = (current: number, trend: string) => {
    const data = []
    for (let i = 8; i >= 0; i--) {
      const variation = (Math.random() - 0.5) * 0.1
      const trendFactor = trend === 'up' ? 1 + (i * 0.02) : trend === 'down' ? 1 - (i * 0.02) : 1
      data.push(current * trendFactor * (1 + variation))
    }
    return data
  }

  return (
    <DashboardLayout currentPage="home">
      <div className="space-y-6">
        {/* Enhanced Hero Section */}
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className={`h-3 w-3 rounded-full animate-pulse ${
              systemStatus?.overall === 'operational' ? 'bg-green-500' : 
              systemStatus?.overall === 'warning' ? 'bg-yellow-500' : 
              'bg-red-500'
            }`} />
            <Badge variant="outline" className={
              systemStatus?.overall === 'operational' ? 'text-green-700 border-green-200' :
              systemStatus?.overall === 'warning' ? 'text-yellow-700 border-yellow-200' :
              'text-red-700 border-red-200'
            }>
              {systemStatus?.overall === 'operational' ? 'System Operational' :
               systemStatus?.overall === 'warning' ? 'System Warning' :
               systemStatus?.overall === 'error' ? 'System Error' :
               'System Status Unknown'}
            </Badge>
            {wsConnected && (
              <Badge variant="outline" className="text-blue-700 border-blue-200">
                Live Data
              </Badge>
            )}
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Aditya-L1 CME Detection & Alert System</h1>
          <p className="text-muted-foreground">
            Real-time monitoring of solar wind parameters and coronal mass ejection detection from L1 Lagrange point
          </p>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span>
              Last updated: {solarWindData?.timestamp ? 
                new Date(solarWindData.timestamp).toLocaleTimeString() : 
                'Loading...'}
            </span>
            <span>•</span>
            <span>
              Data latency: {solarWindData?.quality?.communicationDelay ? 
                `${Math.round(solarWindData.quality.communicationDelay)} minutes` : 
                'Unknown'}
            </span>
            <span>•</span>
            <span>Active alerts: {activeAlerts.length}</span>
          </div>
        </div>

        {/* Enhanced Quick Stats Grid with Sparklines */}
        {!isLoading && solarWindData ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="Solar Wind Speed"
              value={solarWindData.solarWind?.speed?.value || 0}
              unit="km/s"
              icon={Wind}
              trend="stable"
              trendValue={0}
              description="Current solar wind velocity"
              sparklineData={generateSparklineData(solarWindData.solarWind?.speed?.value || 400, 'stable')}
              sparklineColor="#3b82f6"
            />
            <StatCard
              title="Proton Density"
              value={solarWindData.solarWind?.density?.value || 0}
              unit="p/cm³"
              icon={Activity}
              trend="stable"
              trendValue={0}
              description="Particle density measurement"
              sparklineData={generateSparklineData(solarWindData.solarWind?.density?.value || 8, 'stable')}
              sparklineColor="#10b981"
            />
            <StatCard
              title="IMF Bz Component"
              value={Math.abs(solarWindData.magneticField?.bz || 0)}
              unit="nT"
              icon={Compass}
              trend="stable"
              trendValue={0}
              description="Interplanetary magnetic field"
              sparklineData={generateSparklineData(Math.abs(solarWindData.magneticField?.bz || 3), 'stable')}
              sparklineColor="#f59e0b"
            />
            <StatCard
              title="IMF Magnitude"
              value={solarWindData.magneticField?.magnitude || 0}
              unit="nT"
              icon={Zap}
              trend="stable"
              trendValue={0}
              description="Magnetic field strength"
              sparklineData={generateSparklineData(solarWindData.magneticField?.magnitude || 5, 'stable')}
              sparklineColor="#ef4444"
            />
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader className="pb-2">
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </CardHeader>
                <CardContent>
                  <div className="h-8 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Enhanced System Status and Recent Events */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Enhanced System Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                System Status
                {wsConnected && (
                  <Badge variant="outline" className="text-green-700 border-green-200 text-xs">
                    Live
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>Current operational status of monitoring systems</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {systemStatus ? (
                <>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">Data Simulation</span>
                        <Badge variant={systemStatus.components?.dataSimulation?.status === 'online' ? 'default' : 'secondary'} 
                               className={systemStatus.components?.dataSimulation?.status === 'online' ? 'bg-green-100 text-green-800 text-xs' : 'text-xs'}>
                          {systemStatus.components?.dataSimulation?.status || 'Unknown'}
                        </Badge>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {systemStatus.components?.dataSimulation?.lastUpdate ? 
                          new Date(systemStatus.components.dataSimulation.lastUpdate).toLocaleTimeString() : 
                          'Unknown'
                        }
                      </span>
                    </div>
                    <Progress value={95} className="h-2" />
                    <span className="text-xs text-muted-foreground">95% uptime</span>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">Anomaly Detection</span>
                        <Badge variant={systemStatus.components?.anomalyDetection?.status === 'online' ? 'default' : 'secondary'} 
                               className={systemStatus.components?.anomalyDetection?.status === 'online' ? 'bg-green-100 text-green-800 text-xs' : 'text-xs'}>
                          {systemStatus.components?.anomalyDetection?.status || 'Unknown'}
                        </Badge>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {systemStatus.components?.anomalyDetection?.lastAnalysis ? 
                          new Date(systemStatus.components.anomalyDetection.lastAnalysis).toLocaleTimeString() : 
                          'Unknown'
                        }
                      </span>
                    </div>
                    <Progress value={98} className="h-2" />
                    <span className="text-xs text-muted-foreground">98% uptime</span>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">Alert System</span>
                        <Badge variant={systemStatus.components?.alertSystem?.status === 'active' ? 'default' : 'secondary'} 
                               className={systemStatus.components?.alertSystem?.status === 'active' ? 'bg-green-100 text-green-800 text-xs' : 'text-xs'}>
                          {systemStatus.components?.alertSystem?.status || 'Unknown'}
                        </Badge>
                      </div>
                      <span className="text-xs text-muted-foreground">Live</span>
                    </div>
                    <Progress value={100} className="h-2" />
                    <span className="text-xs text-muted-foreground">100% uptime</span>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">WebSocket</span>
                        <Badge variant={systemStatus.components?.webSocket?.status === 'online' ? 'default' : 'secondary'} 
                               className={systemStatus.components?.webSocket?.status === 'online' ? 'bg-green-100 text-green-800 text-xs' : 'text-xs'}>
                          {wsConnected ? 'Connected' : 'Disconnected'}
                        </Badge>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {systemStatus.components?.webSocket?.connectedClients || 0} clients
                      </span>
                    </div>
                    <Progress value={wsConnected ? 100 : 0} className="h-2" />
                    <span className="text-xs text-muted-foreground">Real-time updates</span>
                  </div>
                </>
              ) : (
                <div className="space-y-3">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="animate-pulse space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                      </div>
                      <div className="h-2 bg-gray-200 rounded"></div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Enhanced Recent Events */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-orange-500" />
                Recent Events
              </CardTitle>
              <CardDescription>Latest CME detections and solar activity</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentEvents.length > 0 ? (
                  recentEvents.slice(0, 4).map((event, index) => (
                    <div key={event.id || index} className="flex items-center justify-between space-x-4 p-3 rounded-lg border">
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium leading-none">
                            {event.type?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Space Weather Event'}
                          </p>
                          <Badge
                            variant={
                              event.severity === "severe"
                                ? "destructive"
                                : event.severity === "moderate"
                                  ? "default"
                                  : "secondary"
                            }
                            className="text-xs"
                          >
                            {event.severity?.charAt(0).toUpperCase() + event.severity?.slice(1) || 'Unknown'}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {event.timestamp ? new Date(event.timestamp).toLocaleString() : 'Unknown time'}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          {event.parameters?.solarWindSpeed && (
                            <span>Speed: {Math.round(event.parameters.solarWindSpeed)} km/s</span>
                          )}
                          {event.confidence && (
                            <span>Confidence: {event.confidence}%</span>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <Badge
                          variant={
                            event.status === "active"
                              ? "destructive"
                              : event.status === "monitoring"
                                ? "default"
                                : "secondary"
                          }
                          className="text-xs"
                        >
                          {event.status?.charAt(0).toUpperCase() + event.status?.slice(1) || 'Unknown'}
                        </Badge>
                        {event.status === "active" && <Clock className="h-3 w-3 text-orange-500" />}
                      </div>
                    </div>
                  ))
                ) : !isLoading ? (
                  <div className="text-center text-muted-foreground py-4">
                    <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No recent events detected</p>
                    <p className="text-xs">System is monitoring for CME activity</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="animate-pulse p-3 rounded-lg border">
                        <div className="flex items-center justify-between">
                          <div className="space-y-2 flex-1">
                            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                            <div className="h-3 bg-gray-200 rounded w-1/3"></div>
                            <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                          </div>
                          <div className="h-6 bg-gray-200 rounded w-16"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Enhanced Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Mission Control</CardTitle>
            <CardDescription>Quick access to critical dashboard functions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-4">
              <div className="flex flex-col items-center space-y-2 p-4 border rounded-lg hover:bg-accent cursor-pointer transition-colors group">
                <Activity className="h-8 w-8 text-primary group-hover:scale-110 transition-transform" />
                <span className="text-sm font-medium">Real-time Data</span>
                <span className="text-xs text-muted-foreground">Live monitoring</span>
              </div>
              <div className="flex flex-col items-center space-y-2 p-4 border rounded-lg hover:bg-accent cursor-pointer transition-colors group">
                <TrendingUp className="h-8 w-8 text-primary group-hover:scale-110 transition-transform" />
                <span className="text-sm font-medium">Forecasts</span>
                <span className="text-xs text-muted-foreground">Impact predictions</span>
              </div>
              <div className="flex flex-col items-center space-y-2 p-4 border rounded-lg hover:bg-accent cursor-pointer transition-colors group">
                <AlertTriangle className="h-8 w-8 text-primary group-hover:scale-110 transition-transform" />
                <span className="text-sm font-medium">Active Alerts</span>
                <span className="text-xs text-muted-foreground">3 pending</span>
              </div>
              <div className="flex flex-col items-center space-y-2 p-4 border rounded-lg hover:bg-accent cursor-pointer transition-colors group">
                <Activity className="h-8 w-8 text-primary group-hover:scale-110 transition-transform" />
                <span className="text-sm font-medium">Export Data</span>
                <span className="text-xs text-muted-foreground">Download reports</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
