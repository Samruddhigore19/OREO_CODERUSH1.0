"use client"

import { useState } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  AlertTriangle,
  Clock,
  TrendingUp,
  Zap,
  Wind,
  Activity,
  Search,
  Filter,
  Download,
  Eye,
  MapPin,
} from "lucide-react"

// Mock CME event data
const cmeEvents = [
  {
    id: "CME-2024-001",
    timestamp: "2024-01-15 14:23:00",
    detectionTime: "2024-01-15 14:23:15",
    type: "Halo CME",
    severity: "Severe",
    classification: "Fast CME",
    speed: 1250,
    acceleration: 15.2,
    angularWidth: 360,
    direction: "Earth-directed",
    sourceRegion: "AR 3555",
    confidence: 95,
    status: "Active",
    estimatedArrival: "2024-01-17 08:30:00",
    geomagneticImpact: "Major Storm (G3-G4)",
    detectedParameters: {
      speedIncrease: 450,
      densitySpike: 12.5,
      temperatureRise: 85000,
      magneticFieldRotation: 45,
    },
    alerts: ["Satellite Operations", "Power Grid", "Aviation"],
  },
  {
    id: "CME-2024-002",
    timestamp: "2024-01-14 09:15:00",
    detectionTime: "2024-01-14 09:15:30",
    type: "Partial Halo CME",
    severity: "Moderate",
    classification: "Medium CME",
    speed: 650,
    acceleration: 8.7,
    angularWidth: 180,
    direction: "Earth-directed",
    sourceRegion: "AR 3552",
    confidence: 87,
    status: "Resolved",
    estimatedArrival: "2024-01-16 15:45:00",
    geomagneticImpact: "Minor Storm (G1)",
    detectedParameters: {
      speedIncrease: 220,
      densitySpike: 6.8,
      temperatureRise: 45000,
      magneticFieldRotation: 25,
    },
    alerts: ["Research Facilities"],
  },
  {
    id: "CME-2024-003",
    timestamp: "2024-01-13 22:45:00",
    detectionTime: "2024-01-13 22:45:45",
    type: "Narrow CME",
    severity: "Minor",
    classification: "Slow CME",
    speed: 420,
    acceleration: 3.2,
    angularWidth: 45,
    direction: "Off-Earth",
    sourceRegion: "AR 3548",
    confidence: 78,
    status: "Monitoring",
    estimatedArrival: "N/A",
    geomagneticImpact: "No Impact Expected",
    detectedParameters: {
      speedIncrease: 120,
      densitySpike: 3.2,
      temperatureRise: 25000,
      magneticFieldRotation: 12,
    },
    alerts: [],
  },
  {
    id: "CME-2024-004",
    timestamp: "2024-01-12 16:30:00",
    detectionTime: "2024-01-12 16:30:20",
    type: "Halo CME",
    severity: "Moderate",
    classification: "Fast CME",
    speed: 890,
    acceleration: 11.5,
    angularWidth: 320,
    direction: "Earth-directed",
    sourceRegion: "AR 3550",
    confidence: 92,
    status: "Resolved",
    estimatedArrival: "2024-01-14 22:15:00",
    geomagneticImpact: "Moderate Storm (G2)",
    detectedParameters: {
      speedIncrease: 380,
      densitySpike: 9.1,
      temperatureRise: 62000,
      magneticFieldRotation: 38,
    },
    alerts: ["Satellite Operations", "GPS Systems"],
  },
]

const severityConfig = {
  Severe: { color: "destructive", bgColor: "bg-red-50 dark:bg-red-950", icon: AlertTriangle },
  Moderate: { color: "default", bgColor: "bg-yellow-50 dark:bg-yellow-950", icon: TrendingUp },
  Minor: { color: "secondary", bgColor: "bg-green-50 dark:bg-green-950", icon: Activity },
}

const statusConfig = {
  Active: { color: "destructive", icon: AlertTriangle },
  Monitoring: { color: "default", icon: Eye },
  Resolved: { color: "secondary", icon: Clock },
}

export default function CMEEventsPage() {
  const [selectedEvent, setSelectedEvent] = useState(cmeEvents[0])
  const [filterSeverity, setFilterSeverity] = useState("all")
  const [filterStatus, setFilterStatus] = useState("all")
  const [searchTerm, setSearchTerm] = useState("")

  const filteredEvents = cmeEvents.filter((event) => {
    const matchesSeverity = filterSeverity === "all" || event.severity === filterSeverity
    const matchesStatus = filterStatus === "all" || event.status === filterStatus
    const matchesSearch =
      searchTerm === "" ||
      event.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.sourceRegion.toLowerCase().includes(searchTerm.toLowerCase())

    return matchesSeverity && matchesStatus && matchesSearch
  })

  return (
    <DashboardLayout currentPage="events">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">CME Event Detection System</h1>
            <p className="text-muted-foreground">
              Real-time detection and classification of Coronal Mass Ejection events
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon">
              <Download className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon">
              <Filter className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Events</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{cmeEvents.length}</div>
              <p className="text-xs text-muted-foreground">Last 30 days</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Events</CardTitle>
              <AlertTriangle className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">
                {cmeEvents.filter((e) => e.status === "Active").length}
              </div>
              <p className="text-xs text-muted-foreground">Requiring attention</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Earth-Directed</CardTitle>
              <MapPin className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {cmeEvents.filter((e) => e.direction === "Earth-directed").length}
              </div>
              <p className="text-xs text-muted-foreground">Potential impact</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Detection Time</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">2.3</div>
              <p className="text-xs text-muted-foreground">minutes</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Event List */}
          <div className="lg:col-span-1 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Event Timeline</CardTitle>
                <CardDescription>Recent CME detections and classifications</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Filters */}
                <div className="space-y-2">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search events..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-8"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Select value={filterSeverity} onValueChange={setFilterSeverity}>
                      <SelectTrigger className="flex-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Severities</SelectItem>
                        <SelectItem value="Severe">Severe</SelectItem>
                        <SelectItem value="Moderate">Moderate</SelectItem>
                        <SelectItem value="Minor">Minor</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={filterStatus} onValueChange={setFilterStatus}>
                      <SelectTrigger className="flex-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="Active">Active</SelectItem>
                        <SelectItem value="Monitoring">Monitoring</SelectItem>
                        <SelectItem value="Resolved">Resolved</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Event List */}
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {filteredEvents.map((event) => {
                    const severityConfig_ = severityConfig[event.severity as keyof typeof severityConfig]
                    const statusConfig_ = statusConfig[event.status as keyof typeof statusConfig]
                    const isSelected = selectedEvent.id === event.id

                    return (
                      <div
                        key={event.id}
                        className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                          isSelected ? "border-primary bg-primary/5" : "hover:bg-accent"
                        }`}
                        onClick={() => setSelectedEvent(event)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium">{event.id}</span>
                              <Badge variant={severityConfig_.color as any} className="text-xs">
                                {event.severity}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground">{event.timestamp}</p>
                            <p className="text-xs">{event.type}</p>
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            <Badge variant={statusConfig_.color as any} className="text-xs">
                              {event.status}
                            </Badge>
                            <span className="text-xs text-muted-foreground">{event.speed} km/s</span>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Event Details */}
          <div className="lg:col-span-2 space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {selectedEvent.id}
                      <Badge
                        variant={severityConfig[selectedEvent.severity as keyof typeof severityConfig].color as any}
                      >
                        {selectedEvent.severity}
                      </Badge>
                    </CardTitle>
                    <CardDescription>
                      {selectedEvent.type} detected on {selectedEvent.timestamp}
                    </CardDescription>
                  </div>
                  <Badge variant={statusConfig[selectedEvent.status as keyof typeof statusConfig].color as any}>
                    {selectedEvent.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="overview" className="space-y-4">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="parameters">Parameters</TabsTrigger>
                    <TabsTrigger value="impact">Impact</TabsTrigger>
                  </TabsList>

                  <TabsContent value="overview" className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-sm font-medium">Speed:</span>
                          <span className="text-sm">{selectedEvent.speed} km/s</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm font-medium">Angular Width:</span>
                          <span className="text-sm">{selectedEvent.angularWidth}°</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm font-medium">Direction:</span>
                          <span className="text-sm">{selectedEvent.direction}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm font-medium">Source Region:</span>
                          <span className="text-sm">{selectedEvent.sourceRegion}</span>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-sm font-medium">Detection Time:</span>
                          <span className="text-sm">{selectedEvent.detectionTime}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm font-medium">Confidence:</span>
                          <span className="text-sm">{selectedEvent.confidence}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm font-medium">Classification:</span>
                          <span className="text-sm">{selectedEvent.classification}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm font-medium">Acceleration:</span>
                          <span className="text-sm">{selectedEvent.acceleration} m/s²</span>
                        </div>
                      </div>
                    </div>

                    {selectedEvent.alerts.length > 0 && (
                      <div className="space-y-2">
                        <span className="text-sm font-medium">Active Alerts:</span>
                        <div className="flex flex-wrap gap-2">
                          {selectedEvent.alerts.map((alert) => (
                            <Badge key={alert} variant="outline" className="text-xs">
                              {alert}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="parameters" className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base">Detected Anomalies</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Wind className="h-4 w-4 text-blue-500" />
                              <span className="text-sm">Speed Increase</span>
                            </div>
                            <span className="text-sm font-medium">
                              +{selectedEvent.detectedParameters.speedIncrease} km/s
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Activity className="h-4 w-4 text-green-500" />
                              <span className="text-sm">Density Spike</span>
                            </div>
                            <span className="text-sm font-medium">
                              +{selectedEvent.detectedParameters.densitySpike} p/cm³
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Zap className="h-4 w-4 text-red-500" />
                              <span className="text-sm">Temperature Rise</span>
                            </div>
                            <span className="text-sm font-medium">
                              +{selectedEvent.detectedParameters.temperatureRise.toLocaleString()} K
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <TrendingUp className="h-4 w-4 text-orange-500" />
                              <span className="text-sm">Magnetic Field Rotation</span>
                            </div>
                            <span className="text-sm font-medium">
                              {selectedEvent.detectedParameters.magneticFieldRotation}°
                            </span>
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base">Detection Metrics</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span>Confidence Level</span>
                              <span>{selectedEvent.confidence}%</span>
                            </div>
                            <div className="w-full bg-secondary rounded-full h-2">
                              <div
                                className="bg-primary h-2 rounded-full"
                                style={{ width: `${selectedEvent.confidence}%` }}
                              />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span>Detection Speed</span>
                              <span>Fast</span>
                            </div>
                            <div className="w-full bg-secondary rounded-full h-2">
                              <div className="bg-green-500 h-2 rounded-full" style={{ width: "85%" }} />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </TabsContent>

                  <TabsContent value="impact" className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base">Earth Impact Forecast</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="flex justify-between">
                            <span className="text-sm font-medium">Estimated Arrival:</span>
                            <span className="text-sm">{selectedEvent.estimatedArrival}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm font-medium">Geomagnetic Impact:</span>
                            <Badge
                              variant={
                                selectedEvent.geomagneticImpact.includes("Major")
                                  ? "destructive"
                                  : selectedEvent.geomagneticImpact.includes("Moderate")
                                    ? "default"
                                    : "secondary"
                              }
                              className="text-xs"
                            >
                              {selectedEvent.geomagneticImpact}
                            </Badge>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm font-medium">Direction:</span>
                            <span className="text-sm">{selectedEvent.direction}</span>
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base">Affected Systems</CardTitle>
                        </CardHeader>
                        <CardContent>
                          {selectedEvent.alerts.length > 0 ? (
                            <div className="space-y-2">
                              {selectedEvent.alerts.map((alert) => (
                                <div key={alert} className="flex items-center gap-2">
                                  <AlertTriangle className="h-4 w-4 text-orange-500" />
                                  <span className="text-sm">{alert}</span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm text-muted-foreground">No systems affected</p>
                          )}
                        </CardContent>
                      </Card>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
