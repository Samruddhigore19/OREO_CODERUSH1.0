"use client"

import { useState } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { GaugeChart } from "@/components/gauge-chart"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
  ReferenceLine,
} from "recharts"
import { Clock, Target, Activity, Zap, Globe, Download, RefreshCw } from "lucide-react"

// Mock forecast data
const currentForecasts = [
  {
    id: "CME-2024-001",
    eventName: "Fast Halo CME",
    detectionTime: "2024-01-15 14:23:00",
    predictedArrival: "2024-01-17 08:30:00",
    arrivalWindow: {
      earliest: "2024-01-17 06:15:00",
      latest: "2024-01-17 10:45:00",
    },
    confidence: 87,
    geomagneticIndex: 6.5,
    impactStrength: "Major Storm (G3)",
    speed: 1250,
    travelTime: 42.1,
    models: {
      wsaEnlil: { arrival: "2024-01-17 08:15:00", confidence: 85 },
      dragBased: { arrival: "2024-01-17 08:45:00", confidence: 82 },
      empirical: { arrival: "2024-01-17 08:30:00", confidence: 90 },
    },
  },
  {
    id: "CME-2024-002",
    eventName: "Moderate CME",
    detectionTime: "2024-01-14 09:15:00",
    predictedArrival: "2024-01-16 15:45:00",
    arrivalWindow: {
      earliest: "2024-01-16 13:30:00",
      latest: "2024-01-16 18:00:00",
    },
    confidence: 92,
    geomagneticIndex: 3.2,
    impactStrength: "Minor Storm (G1)",
    speed: 650,
    travelTime: 54.5,
    models: {
      wsaEnlil: { arrival: "2024-01-16 15:30:00", confidence: 90 },
      dragBased: { arrival: "2024-01-16 16:00:00", confidence: 88 },
      empirical: { arrival: "2024-01-16 15:45:00", confidence: 95 },
    },
  },
]

// Historical comparison data
const historicalData = [
  { name: "Jan 10", predicted: 4.2, actual: 4.5, confidence: 85 },
  { name: "Jan 11", predicted: 2.8, actual: 2.6, confidence: 92 },
  { name: "Jan 12", predicted: 6.1, actual: 5.8, confidence: 78 },
  { name: "Jan 13", predicted: 3.5, actual: 3.7, confidence: 88 },
  { name: "Jan 14", predicted: 5.2, actual: 5.0, confidence: 91 },
  { name: "Jan 15", predicted: 6.8, actual: null, confidence: 87 },
  { name: "Jan 16", predicted: 4.1, actual: null, confidence: 83 },
  { name: "Jan 17", predicted: 7.2, actual: null, confidence: 79 },
]

// Probability distribution data
const probabilityData = [
  { hour: -12, probability: 5 },
  { hour: -8, probability: 15 },
  { hour: -4, probability: 35 },
  { hour: 0, probability: 87 },
  { hour: 4, probability: 35 },
  { hour: 8, probability: 15 },
  { hour: 12, probability: 5 },
]

const geomagneticLevels = [
  { level: "G1", name: "Minor", range: "1-2", color: "#10b981" },
  { level: "G2", name: "Moderate", range: "3-4", color: "#f59e0b" },
  { level: "G3", name: "Strong", range: "5-6", color: "#ef4444" },
  { level: "G4", name: "Severe", range: "7-8", color: "#dc2626" },
  { level: "G5", name: "Extreme", range: "9+", color: "#991b1b" },
]

export default function ForecastsPage() {
  const [selectedForecast, setSelectedForecast] = useState(currentForecasts[0])
  const [forecastModel, setForecastModel] = useState("ensemble")

  const timeToArrival = () => {
    const now = new Date()
    const arrival = new Date(selectedForecast.predictedArrival)
    const diff = arrival.getTime() - now.getTime()
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    return { hours, minutes, total: diff }
  }

  const { hours, minutes, total } = timeToArrival()

  return (
    <DashboardLayout currentPage="forecasts">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">CME Impact Forecasting</h1>
            <p className="text-muted-foreground">
              Predictive models for CME arrival times and geomagnetic impact assessment
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Select value={forecastModel} onValueChange={setForecastModel}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ensemble">Ensemble Model</SelectItem>
                <SelectItem value="wsaEnlil">WSA-ENLIL</SelectItem>
                <SelectItem value="dragBased">Drag-Based</SelectItem>
                <SelectItem value="empirical">Empirical</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon">
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon">
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Current Forecast Summary */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Next Arrival</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{total > 0 ? `${hours}h ${minutes}m` : "Arrived"}</div>
              <p className="text-xs text-muted-foreground">
                {new Date(selectedForecast.predictedArrival).toLocaleString()}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Impact Strength</CardTitle>
              <Zap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{selectedForecast.geomagneticIndex}</div>
              <p className="text-xs text-muted-foreground">{selectedForecast.impactStrength}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Confidence</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{selectedForecast.confidence}%</div>
              <Progress value={selectedForecast.confidence} className="mt-2 h-2" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Forecasts</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{currentForecasts.length}</div>
              <p className="text-xs text-muted-foreground">CME events tracked</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Forecast Content */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Forecast Details */}
          <div className="lg:col-span-2 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  Earth Impact Forecast
                </CardTitle>
                <CardDescription>Predicted arrival time and geomagnetic impact assessment</CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="timeline" className="space-y-4">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="timeline">Timeline</TabsTrigger>
                    <TabsTrigger value="probability">Probability</TabsTrigger>
                    <TabsTrigger value="models">Models</TabsTrigger>
                  </TabsList>

                  <TabsContent value="timeline" className="space-y-4">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 bg-primary/5 rounded-lg border">
                        <div>
                          <h3 className="font-semibold">{selectedForecast.eventName}</h3>
                          <p className="text-sm text-muted-foreground">Detected: {selectedForecast.detectionTime}</p>
                        </div>
                        <Badge variant="outline">{selectedForecast.speed} km/s</Badge>
                      </div>

                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-3">
                          <div className="flex justify-between">
                            <span className="text-sm font-medium">Predicted Arrival:</span>
                            <span className="text-sm">
                              {new Date(selectedForecast.predictedArrival).toLocaleString()}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm font-medium">Earliest Arrival:</span>
                            <span className="text-sm">
                              {new Date(selectedForecast.arrivalWindow.earliest).toLocaleString()}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm font-medium">Latest Arrival:</span>
                            <span className="text-sm">
                              {new Date(selectedForecast.arrivalWindow.latest).toLocaleString()}
                            </span>
                          </div>
                        </div>
                        <div className="space-y-3">
                          <div className="flex justify-between">
                            <span className="text-sm font-medium">Travel Time:</span>
                            <span className="text-sm">{selectedForecast.travelTime} hours</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm font-medium">Geomagnetic Index:</span>
                            <span className="text-sm">{selectedForecast.geomagneticIndex}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm font-medium">Impact Level:</span>
                            <Badge
                              variant={
                                selectedForecast.geomagneticIndex >= 7
                                  ? "destructive"
                                  : selectedForecast.geomagneticIndex >= 5
                                    ? "default"
                                    : "secondary"
                              }
                            >
                              {selectedForecast.impactStrength}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="probability" className="space-y-4">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base">Arrival Probability Distribution</CardTitle>
                        <CardDescription>Likelihood of arrival relative to predicted time</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <ResponsiveContainer width="100%" height={200}>
                          <AreaChart data={probabilityData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="hour" tickFormatter={(value) => `${value > 0 ? "+" : ""}${value}h`} />
                            <YAxis tickFormatter={(value) => `${value}%`} />
                            <Tooltip
                              formatter={(value: any) => [`${value}%`, "Probability"]}
                              labelFormatter={(label) => `${label > 0 ? "+" : ""}${label} hours from prediction`}
                            />
                            <Area
                              type="monotone"
                              dataKey="probability"
                              stroke="#3b82f6"
                              fill="#3b82f6"
                              fillOpacity={0.3}
                            />
                            <ReferenceLine x={0} stroke="#ef4444" strokeDasharray="5 5" label="Predicted Time" />
                          </AreaChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="models" className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-3">
                      {Object.entries(selectedForecast.models).map(([model, data]) => (
                        <Card key={model}>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-base capitalize">
                              {model.replace(/([A-Z])/g, " $1").trim()}
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-2">
                            <div className="text-sm">
                              <span className="font-medium">Arrival:</span>
                              <br />
                              {new Date(data.arrival).toLocaleString()}
                            </div>
                            <div className="space-y-1">
                              <div className="flex justify-between text-sm">
                                <span>Confidence:</span>
                                <span>{data.confidence}%</span>
                              </div>
                              <Progress value={data.confidence} className="h-2" />
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>

          {/* Impact Gauges */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Impact Strength</CardTitle>
                <CardDescription>Geomagnetic storm intensity forecast</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <GaugeChart
                  value={selectedForecast.geomagneticIndex}
                  max={9}
                  title="Kp Index"
                  color={
                    selectedForecast.geomagneticIndex >= 7
                      ? "#ef4444"
                      : selectedForecast.geomagneticIndex >= 5
                        ? "#f59e0b"
                        : "#10b981"
                  }
                />

                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Geomagnetic Storm Levels</h4>
                  {geomagneticLevels.map((level) => (
                    <div key={level.level} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: level.color }} />
                        <span>
                          {level.level} - {level.name}
                        </span>
                      </div>
                      <span className="text-muted-foreground">Kp {level.range}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Forecast Accuracy</CardTitle>
                <CardDescription>Model performance metrics</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Overall Accuracy:</span>
                    <span>84%</span>
                  </div>
                  <Progress value={84} className="h-2" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Timing Precision:</span>
                    <span>±2.3 hours</span>
                  </div>
                  <Progress value={78} className="h-2" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Impact Prediction:</span>
                    <span>91%</span>
                  </div>
                  <Progress value={91} className="h-2" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Historical Comparison */}
        <Card>
          <CardHeader>
            <CardTitle>Historical Forecast Performance</CardTitle>
            <CardDescription>Comparison of predicted vs actual geomagnetic indices</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={historicalData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis domain={[0, 8]} />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="predicted"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  name="Predicted"
                  strokeDasharray="5 5"
                />
                <Line type="monotone" dataKey="actual" stroke="#10b981" strokeWidth={2} name="Actual" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
