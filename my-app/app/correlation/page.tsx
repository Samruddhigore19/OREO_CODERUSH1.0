"use client"

import { useState } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Progress } from "@/components/ui/progress"
import {
  Database,
  ExternalLink,
  RefreshCw,
  Download,
  Search,
  CheckCircle,
  XCircle,
  AlertCircle,
  Send as Sync,
} from "lucide-react"

// Mock external data sources
const dataSources = [
  {
    id: "cactus",
    name: "CACTus CME Catalog",
    provider: "Royal Observatory of Belgium",
    status: "online",
    lastSync: "2024-01-15 14:20:00",
    latency: 2.3,
    reliability: 98.5,
    url: "https://wwwbis.sidc.be/cactus/",
  },
  {
    id: "noaa-swpc",
    name: "NOAA SWPC",
    provider: "NOAA Space Weather Prediction Center",
    status: "online",
    lastSync: "2024-01-15 14:18:00",
    latency: 1.8,
    reliability: 99.2,
    url: "https://www.swpc.noaa.gov/",
  },
  {
    id: "nasa-donki",
    name: "NASA DONKI",
    provider: "NASA Goddard Space Flight Center",
    status: "online",
    lastSync: "2024-01-15 14:15:00",
    latency: 3.1,
    reliability: 97.8,
    url: "https://kauai.ccmc.gsfc.nasa.gov/DONKI/",
  },
  {
    id: "soho-lasco",
    name: "SOHO LASCO",
    provider: "ESA/NASA SOHO Mission",
    status: "maintenance",
    lastSync: "2024-01-15 12:45:00",
    latency: 5.2,
    reliability: 95.1,
    url: "https://soho.nascom.nasa.gov/",
  },
]

// Mock correlation data
const correlationData = [
  {
    adityaId: "CME-2024-001",
    adityaTime: "2024-01-15 14:23:00",
    adityaSpeed: 1250,
    adityaWidth: 360,
    adityaDirection: "Earth-directed",
    cactusId: "20240115_1420_C2_CME",
    cactusTime: "2024-01-15 14:20:00",
    cactusSpeed: 1280,
    cactusWidth: 350,
    cactusDirection: "Halo",
    noaaId: "2024-01-15T14:25:00-CME",
    noaaTime: "2024-01-15 14:25:00",
    noaaSpeed: 1230,
    nasaId: "2024-01-15T14:22:00-CME-001",
    nasaTime: "2024-01-15 14:22:00",
    nasaSpeed: 1265,
    correlation: 95,
    status: "confirmed",
  },
  {
    adityaId: "CME-2024-002",
    adityaTime: "2024-01-14 09:15:00",
    adityaSpeed: 650,
    adityaWidth: 180,
    adityaDirection: "Earth-directed",
    cactusId: "20240114_0912_C2_CME",
    cactusTime: "2024-01-14 09:12:00",
    cactusSpeed: 680,
    cactusWidth: 175,
    cactusDirection: "Partial Halo",
    noaaId: "2024-01-14T09:18:00-CME",
    noaaTime: "2024-01-14 09:18:00",
    noaaSpeed: 645,
    nasaId: "2024-01-14T09:14:00-CME-001",
    nasaTime: "2024-01-14 09:14:00",
    nasaSpeed: 665,
    correlation: 88,
    status: "confirmed",
  },
  {
    adityaId: "CME-2024-003",
    adityaTime: "2024-01-13 22:45:00",
    adityaSpeed: 420,
    adityaWidth: 45,
    adityaDirection: "Off-Earth",
    cactusId: null,
    cactusTime: null,
    cactusSpeed: null,
    cactusWidth: null,
    cactusDirection: null,
    noaaId: null,
    noaaTime: null,
    noaaSpeed: null,
    nasaId: "2024-01-13T22:48:00-CME-001",
    nasaTime: "2024-01-13 22:48:00",
    nasaSpeed: 435,
    correlation: 72,
    status: "partial",
  },
]

// Mock API status
const apiStatus = {
  cactus: { status: "success", lastFetch: "2024-01-15 14:20:00", records: 156 },
  noaa: { status: "success", lastFetch: "2024-01-15 14:18:00", records: 89 },
  nasa: { status: "success", lastFetch: "2024-01-15 14:15:00", records: 203 },
  soho: { status: "error", lastFetch: "2024-01-15 12:45:00", records: 0 },
}

export default function CorrelationPage() {
  const [selectedSource, setSelectedSource] = useState("all")
  const [correlationThreshold, setCorrelationThreshold] = useState("80")
  const [searchTerm, setSearchTerm] = useState("")
  const [isRefreshing, setIsRefreshing] = useState(false)

  const filteredData = correlationData.filter((item) => {
    const matchesSearch =
      searchTerm === "" ||
      item.adityaId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.cactusId && item.cactusId.toLowerCase().includes(searchTerm.toLowerCase()))

    const matchesThreshold = item.correlation >= Number.parseInt(correlationThreshold)

    return matchesSearch && matchesThreshold
  })

  const handleRefreshData = async (sourceId: string) => {
    setIsRefreshing(true)
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 2000))
    setIsRefreshing(false)
  }

  const handleSyncAll = async () => {
    setIsRefreshing(true)
    // Simulate syncing all sources
    await new Promise((resolve) => setTimeout(resolve, 3000))
    setIsRefreshing(false)
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "online":
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "maintenance":
      case "warning":
        return <AlertCircle className="h-4 w-4 text-yellow-500" />
      case "offline":
      case "error":
        return <XCircle className="h-4 w-4 text-red-500" />
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />
    }
  }

  const getCorrelationColor = (correlation: number) => {
    if (correlation >= 90) return "text-green-600"
    if (correlation >= 75) return "text-yellow-600"
    return "text-red-600"
  }

  return (
    <DashboardLayout currentPage="correlation">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">External Data Correlation</h1>
            <p className="text-muted-foreground">
              Cross-validation with international space weather data sources and CME catalogs
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleSyncAll} disabled={isRefreshing}>
              <Sync className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
              Sync All
            </Button>
            <Button variant="outline" size="icon">
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Data Sources Status */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {dataSources.map((source) => (
            <Card key={source.id}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{source.name}</CardTitle>
                {getStatusIcon(source.status)}
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{source.reliability}%</div>
                <p className="text-xs text-muted-foreground">Reliability</p>
                <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
                  <span>Latency: {source.latency}s</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRefreshData(source.id)}
                    disabled={isRefreshing}
                  >
                    <RefreshCw className={`h-3 w-3 ${isRefreshing ? "animate-spin" : ""}`} />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Main Content */}
        <Tabs defaultValue="correlation" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="correlation">Data Correlation</TabsTrigger>
            <TabsTrigger value="sources">External Sources</TabsTrigger>
            <TabsTrigger value="validation">Validation Results</TabsTrigger>
          </TabsList>

          <TabsContent value="correlation" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <CardTitle>CME Event Correlation</CardTitle>
                    <CardDescription>Cross-reference Aditya-L1 detections with external catalogs</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search events..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-8 w-64"
                      />
                    </div>
                    <Select value={correlationThreshold} onValueChange={setCorrelationThreshold}>
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="50">≥50% Match</SelectItem>
                        <SelectItem value="70">≥70% Match</SelectItem>
                        <SelectItem value="80">≥80% Match</SelectItem>
                        <SelectItem value="90">≥90% Match</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Aditya-L1 Event</TableHead>
                        <TableHead>Speed (km/s)</TableHead>
                        <TableHead>Width (°)</TableHead>
                        <TableHead>CACTus Match</TableHead>
                        <TableHead>NOAA Match</TableHead>
                        <TableHead>NASA Match</TableHead>
                        <TableHead>Correlation</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredData.map((item) => (
                        <TableRow key={item.adityaId}>
                          <TableCell className="font-medium">{item.adityaId}</TableCell>
                          <TableCell>{item.adityaSpeed}</TableCell>
                          <TableCell>{item.adityaWidth}</TableCell>
                          <TableCell>
                            {item.cactusId ? (
                              <div className="space-y-1">
                                <div className="text-sm font-medium">{item.cactusId}</div>
                                <div className="text-xs text-muted-foreground">
                                  {item.cactusSpeed} km/s, {item.cactusWidth}°
                                </div>
                              </div>
                            ) : (
                              <span className="text-muted-foreground">No match</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {item.noaaId ? (
                              <div className="space-y-1">
                                <div className="text-sm font-medium">{item.noaaId}</div>
                                <div className="text-xs text-muted-foreground">{item.noaaSpeed} km/s</div>
                              </div>
                            ) : (
                              <span className="text-muted-foreground">No match</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {item.nasaId ? (
                              <div className="space-y-1">
                                <div className="text-sm font-medium">{item.nasaId}</div>
                                <div className="text-xs text-muted-foreground">{item.nasaSpeed} km/s</div>
                              </div>
                            ) : (
                              <span className="text-muted-foreground">No match</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <span className={`font-medium ${getCorrelationColor(item.correlation)}`}>
                              {item.correlation}%
                            </span>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                item.status === "confirmed"
                                  ? "default"
                                  : item.status === "partial"
                                    ? "secondary"
                                    : "destructive"
                              }
                            >
                              {item.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sources" className="space-y-4">
            <div className="grid gap-6 md:grid-cols-2">
              {dataSources.map((source) => (
                <Card key={source.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <Database className="h-5 w-5" />
                          {source.name}
                        </CardTitle>
                        <CardDescription>{source.provider}</CardDescription>
                      </div>
                      {getStatusIcon(source.status)}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-3 text-sm">
                      <div className="flex justify-between">
                        <span className="font-medium">Status:</span>
                        <Badge
                          variant={
                            source.status === "online"
                              ? "default"
                              : source.status === "maintenance"
                                ? "secondary"
                                : "destructive"
                          }
                        >
                          {source.status}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium">Last Sync:</span>
                        <span>{source.lastSync}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium">Latency:</span>
                        <span>{source.latency}s</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium">Reliability:</span>
                        <span>{source.reliability}%</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Connection Quality</span>
                        <span>{source.reliability}%</span>
                      </div>
                      <Progress value={source.reliability} className="h-2" />
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRefreshData(source.id)}
                        disabled={isRefreshing}
                        className="flex-1"
                      >
                        <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
                        Refresh
                      </Button>
                      <Button variant="outline" size="sm" asChild>
                        <a href={source.url} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="validation" className="space-y-4">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Validation Summary</CardTitle>
                  <CardDescription>Cross-validation results with external sources</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Total Events Validated:</span>
                      <span className="text-sm">{correlationData.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Confirmed Matches:</span>
                      <span className="text-sm text-green-600">
                        {correlationData.filter((item) => item.status === "confirmed").length}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Partial Matches:</span>
                      <span className="text-sm text-yellow-600">
                        {correlationData.filter((item) => item.status === "partial").length}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Average Correlation:</span>
                      <span className="text-sm">
                        {Math.round(
                          correlationData.reduce((sum, item) => sum + item.correlation, 0) / correlationData.length,
                        )}
                        %
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Validation Accuracy</span>
                      <span>87%</span>
                    </div>
                    <Progress value={87} className="h-2" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>API Status</CardTitle>
                  <CardDescription>External API connection and data fetch status</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {Object.entries(apiStatus).map(([source, status]) => (
                    <div key={source} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(status.status)}
                        <div>
                          <div className="text-sm font-medium capitalize">{source}</div>
                          <div className="text-xs text-muted-foreground">Last fetch: {status.lastFetch}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">{status.records}</div>
                        <div className="text-xs text-muted-foreground">records</div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Data Quality Metrics</CardTitle>
                <CardDescription>Assessment of data consistency and reliability</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Speed Correlation</span>
                      <span>92%</span>
                    </div>
                    <Progress value={92} className="h-2" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Timing Accuracy</span>
                      <span>85%</span>
                    </div>
                    <Progress value={85} className="h-2" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Direction Match</span>
                      <span>78%</span>
                    </div>
                    <Progress value={78} className="h-2" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
