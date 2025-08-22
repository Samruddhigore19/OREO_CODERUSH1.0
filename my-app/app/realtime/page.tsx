"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts"
import { Activity, Wind, Zap, Compass, Play, Pause, RotateCcw, Download } from "lucide-react"

// Generate realistic time-series data
const generateTimeSeriesData = (hours: number) => {
  const data = []
  const now = new Date()
  const interval = (hours * 60) / 100 // 100 data points

  for (let i = 99; i >= 0; i--) {
    const timestamp = new Date(now.getTime() - i * interval * 60000)

    // Solar wind speed: 300-800 km/s with realistic variations
    const baseSpeed = 450 + Math.sin(i * 0.1) * 100
    const speedNoise = (Math.random() - 0.5) * 50
    const solarWindSpeed = Math.max(300, Math.min(800, baseSpeed + speedNoise))

    // Proton density: 1-20 p/cm³
    const baseDensity = 8 + Math.sin(i * 0.15) * 4
    const densityNoise = (Math.random() - 0.5) * 2
    const protonDensity = Math.max(1, Math.min(20, baseDensity + densityNoise))

    // Particle flux: 10^6 to 10^9 particles/cm²/s/sr
    const baseFlux = 1e7 + Math.sin(i * 0.08) * 5e6
    const fluxNoise = (Math.random() - 0.5) * 1e6
    const particleFlux = Math.max(1e6, baseFlux + fluxNoise)

    // IMF components: -20 to +20 nT
    const bx = Math.sin(i * 0.12) * 10 + (Math.random() - 0.5) * 4
    const by = Math.cos(i * 0.09) * 8 + (Math.random() - 0.5) * 3
    const bz = Math.sin(i * 0.11) * 12 + (Math.random() - 0.5) * 5

    // Temperature: 50,000 - 200,000 K
    const baseTemp = 100000 + Math.sin(i * 0.07) * 30000
    const tempNoise = (Math.random() - 0.5) * 10000
    const temperature = Math.max(50000, Math.min(200000, baseTemp + tempNoise))

    data.push({
      timestamp: timestamp.toISOString(),
      time: timestamp.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
      solarWindSpeed: Math.round(solarWindSpeed * 10) / 10,
      protonDensity: Math.round(protonDensity * 100) / 100,
      particleFlux: Math.round(particleFlux),
      bx: Math.round(bx * 100) / 100,
      by: Math.round(by * 100) / 100,
      bz: Math.round(bz * 100) / 100,
      temperature: Math.round(temperature),
    })
  }

  return data
}

const timeRanges = [
  { value: "6h", label: "Last 6 Hours" },
  { value: "12h", label: "Last 12 Hours" },
  { value: "24h", label: "Last 24 Hours" },
  { value: "48h", label: "Last 48 Hours" },
]

export default function RealtimeDataPage() {
  const [timeRange, setTimeRange] = useState("12h")
  const [isLive, setIsLive] = useState(true)
  const [data, setData] = useState(() => generateTimeSeriesData(12))

  // Simulate live data updates
  useEffect(() => {
    if (!isLive) return

    const interval = setInterval(() => {
      const hours = Number.parseInt(timeRange.replace("h", ""))
      setData(generateTimeSeriesData(hours))
    }, 30000) // Update every 30 seconds

    return () => clearInterval(interval)
  }, [isLive, timeRange])

  const handleTimeRangeChange = (value: string) => {
    setTimeRange(value)
    const hours = Number.parseInt(value.replace("h", ""))
    setData(generateTimeSeriesData(hours))
  }

  const toggleLiveUpdates = () => {
    setIsLive(!isLive)
  }

  const refreshData = () => {
    const hours = Number.parseInt(timeRange.replace("h", ""))
    setData(generateTimeSeriesData(hours))
  }

  const currentValues = data[data.length - 1] || {}

  return (
    <DashboardLayout currentPage="realtime">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Real-time Data Visualization</h1>
            <p className="text-muted-foreground">
              Live solar wind parameters and magnetic field measurements from Aditya-L1 ASPEX payload
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Select value={timeRange} onValueChange={handleTimeRangeChange}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {timeRanges.map((range) => (
                  <SelectItem key={range.value} value={range.value}>
                    {range.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button variant="outline" size="icon" onClick={toggleLiveUpdates}>
              {isLive ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </Button>

            <Button variant="outline" size="icon" onClick={refreshData}>
              <RotateCcw className="h-4 w-4" />
            </Button>

            <Button variant="outline" size="icon">
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Status Bar */}
        <div className="flex items-center gap-4 p-4 bg-card rounded-lg border">
          <div className="flex items-center gap-2">
            <div className={`h-2 w-2 rounded-full ${isLive ? "bg-green-500 animate-pulse" : "bg-gray-400"}`} />
            <span className="text-sm font-medium">{isLive ? "Live Updates" : "Paused"}</span>
          </div>
          <div className="text-sm text-muted-foreground">Last update: {new Date().toLocaleTimeString()}</div>
          <div className="text-sm text-muted-foreground">Data points: {data.length}</div>
          <Badge variant="outline" className="ml-auto">
            ASPEX Active
          </Badge>
        </div>

        {/* Current Values Summary */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Solar Wind Speed</CardTitle>
              <Wind className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{currentValues.solarWindSpeed} km/s</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Proton Density</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{currentValues.protonDensity} p/cm³</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">IMF Bz</CardTitle>
              <Compass className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{currentValues.bz} nT</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Particle Flux</CardTitle>
              <Zap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{(currentValues.particleFlux / 1e6).toFixed(1)}M</div>
              <p className="text-xs text-muted-foreground">particles/cm²/s/sr</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <Tabs defaultValue="solar-wind" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="solar-wind">Solar Wind</TabsTrigger>
            <TabsTrigger value="magnetic-field">Magnetic Field</TabsTrigger>
            <TabsTrigger value="particles">Particle Flux</TabsTrigger>
            <TabsTrigger value="overview">Overview</TabsTrigger>
          </TabsList>

          <TabsContent value="solar-wind" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Solar Wind Speed</CardTitle>
                  <CardDescription>Velocity of solar wind particles (km/s)</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={data}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="time" />
                      <YAxis domain={["dataMin - 50", "dataMax + 50"]} />
                      <Tooltip
                        labelFormatter={(label) => `Time: ${label}`}
                        formatter={(value: any) => [`${value} km/s`, "Speed"]}
                      />
                      <Line type="monotone" dataKey="solarWindSpeed" stroke="#3b82f6" strokeWidth={2} dot={false} />
                      <ReferenceLine y={400} stroke="#ef4444" strokeDasharray="5 5" label="Alert Threshold" />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Proton Density</CardTitle>
                  <CardDescription>Number density of protons (p/cm³)</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={data}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="time" />
                      <YAxis domain={["dataMin - 2", "dataMax + 2"]} />
                      <Tooltip
                        labelFormatter={(label) => `Time: ${label}`}
                        formatter={(value: any) => [`${value} p/cm³`, "Density"]}
                      />
                      <Line type="monotone" dataKey="protonDensity" stroke="#10b981" strokeWidth={2} dot={false} />
                      <ReferenceLine y={15} stroke="#f59e0b" strokeDasharray="5 5" label="High Density" />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="magnetic-field" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Interplanetary Magnetic Field Components</CardTitle>
                <CardDescription>IMF Bx, By, Bz components in nanoTesla (nT)</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis domain={[-25, 25]} />
                    <Tooltip
                      labelFormatter={(label) => `Time: ${label}`}
                      formatter={(value: any, name: string) => [`${value} nT`, name.toUpperCase()]}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="bx" stroke="#3b82f6" strokeWidth={2} name="Bx" dot={false} />
                    <Line type="monotone" dataKey="by" stroke="#10b981" strokeWidth={2} name="By" dot={false} />
                    <Line type="monotone" dataKey="bz" stroke="#ef4444" strokeWidth={2} name="Bz" dot={false} />
                    <ReferenceLine y={0} stroke="#6b7280" strokeDasharray="2 2" />
                    <ReferenceLine y={-10} stroke="#ef4444" strokeDasharray="5 5" label="Bz Critical" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="particles" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Particle Flux</CardTitle>
                <CardDescription>High-energy particle flux (particles/cm²/s/sr)</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis
                      scale="log"
                      domain={["dataMin", "dataMax"]}
                      tickFormatter={(value) => `${(value / 1e6).toFixed(1)}M`}
                    />
                    <Tooltip
                      labelFormatter={(label) => `Time: ${label}`}
                      formatter={(value: any) => [`${(value / 1e6).toFixed(2)}M particles/cm²/s/sr`, "Flux"]}
                    />
                    <Line type="monotone" dataKey="particleFlux" stroke="#f59e0b" strokeWidth={2} dot={false} />
                    <ReferenceLine y={5e7} stroke="#ef4444" strokeDasharray="5 5" label="High Flux Alert" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Multi-Parameter Overview</CardTitle>
                  <CardDescription>Normalized view of key parameters</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={data}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="time" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="solarWindSpeed"
                        stroke="#3b82f6"
                        strokeWidth={1}
                        name="Speed (km/s)"
                        dot={false}
                      />
                      <Line
                        type="monotone"
                        dataKey="protonDensity"
                        stroke="#10b981"
                        strokeWidth={1}
                        name="Density (p/cm³)"
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Temperature Profile</CardTitle>
                  <CardDescription>Solar wind temperature (K)</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={data}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="time" />
                      <YAxis tickFormatter={(value) => `${(value / 1000).toFixed(0)}K`} />
                      <Tooltip formatter={(value: any) => [`${(value / 1000).toFixed(1)}K`, "Temperature"]} />
                      <Line type="monotone" dataKey="temperature" stroke="#ef4444" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
