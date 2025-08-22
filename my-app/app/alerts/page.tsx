"use client"

import React from "react"

import { useState } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import {
  AlertTriangle,
  Bell,
  BellRing,
  Check,
  Clock,
  Mail,
  MessageSquare,
  Search,
  Settings,
  Smartphone,
  X,
  Zap,
  Filter,
  Download,
  Archive,
} from "lucide-react"

// Mock alert data
const alerts = [
  {
    id: "ALERT-2024-001",
    timestamp: "2024-01-15 14:23:15",
    type: "CME Detection",
    severity: "Critical",
    title: "Fast Halo CME Detected",
    message:
      "High-speed CME (1250 km/s) detected with Earth-directed trajectory. Estimated arrival: Jan 17, 08:30 UTC. Major geomagnetic storm expected (G3-G4).",
    eventId: "CME-2024-001",
    status: "active",
    acknowledged: false,
    acknowledgedBy: null,
    acknowledgedAt: null,
    channels: ["dashboard", "email", "sms", "push"],
    recipients: ["satellite-ops", "power-grid", "aviation"],
    priority: 1,
  },
  {
    id: "ALERT-2024-002",
    timestamp: "2024-01-15 12:45:30",
    type: "System Status",
    severity: "Warning",
    title: "ASPEX Data Processing Delay",
    message:
      "Processing delay detected in ASPEX payload data stream. Current delay: 4.2 minutes. Investigating potential communication issues.",
    eventId: null,
    status: "active",
    acknowledged: true,
    acknowledgedBy: "Dr. Sarah Chen",
    acknowledgedAt: "2024-01-15 13:15:00",
    channels: ["dashboard", "email"],
    recipients: ["technical-team"],
    priority: 2,
  },
  {
    id: "ALERT-2024-003",
    timestamp: "2024-01-15 09:15:45",
    type: "Geomagnetic Activity",
    severity: "Info",
    title: "Minor Geomagnetic Storm Onset",
    message:
      "Minor geomagnetic storm conditions detected (Kp=4.2). Associated with CME arrival from Jan 13 event. Duration expected: 6-12 hours.",
    eventId: "CME-2024-002",
    status: "resolved",
    acknowledged: true,
    acknowledgedBy: "Mission Control",
    acknowledgedAt: "2024-01-15 09:30:00",
    channels: ["dashboard", "push"],
    recipients: ["research-team"],
    priority: 3,
  },
  {
    id: "ALERT-2024-004",
    timestamp: "2024-01-14 22:45:20",
    type: "Forecast Update",
    severity: "Warning",
    title: "CME Arrival Time Revised",
    message:
      "Updated forecast models indicate earlier arrival time for CME-2024-001. New estimated arrival: Jan 17, 06:15 UTC (±2 hours).",
    eventId: "CME-2024-001",
    status: "resolved",
    acknowledged: true,
    acknowledgedBy: "Dr. Michael Rodriguez",
    acknowledgedAt: "2024-01-14 23:00:00",
    channels: ["dashboard", "email", "sms"],
    recipients: ["satellite-ops", "forecasting-team"],
    priority: 2,
  },
  {
    id: "ALERT-2024-005",
    timestamp: "2024-01-14 18:30:10",
    type: "System Maintenance",
    severity: "Info",
    title: "Scheduled Maintenance Complete",
    message:
      "Routine maintenance of ground station communication systems completed successfully. All systems operational.",
    eventId: null,
    status: "resolved",
    acknowledged: true,
    acknowledgedBy: "System Admin",
    acknowledgedAt: "2024-01-14 18:35:00",
    channels: ["dashboard"],
    recipients: ["all-users"],
    priority: 3,
  },
]

const severityConfig = {
  Critical: { color: "destructive", bgColor: "bg-red-50 dark:bg-red-950", icon: AlertTriangle, priority: 1 },
  Warning: { color: "default", bgColor: "bg-yellow-50 dark:bg-yellow-950", icon: Zap, priority: 2 },
  Info: { color: "secondary", bgColor: "bg-blue-50 dark:bg-blue-950", icon: Bell, priority: 3 },
}

const statusConfig = {
  active: { color: "destructive", label: "Active" },
  resolved: { color: "secondary", label: "Resolved" },
}

const notificationSettings = {
  cmeDetection: { enabled: true, email: true, sms: true, push: true },
  geomagneticStorm: { enabled: true, email: true, sms: false, push: true },
  systemStatus: { enabled: true, email: false, sms: false, push: true },
  forecastUpdate: { enabled: true, email: true, sms: true, push: false },
  maintenance: { enabled: false, email: false, sms: false, push: false },
}

export default function AlertsPage() {
  const [selectedAlert, setSelectedAlert] = useState(alerts[0])
  const [filterSeverity, setFilterSeverity] = useState("all")
  const [filterStatus, setFilterStatus] = useState("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [settings, setSettings] = useState(notificationSettings)

  const filteredAlerts = alerts.filter((alert) => {
    const matchesSeverity = filterSeverity === "all" || alert.severity === filterSeverity
    const matchesStatus = filterStatus === "all" || alert.status === filterStatus
    const matchesSearch =
      searchTerm === "" ||
      alert.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      alert.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
      alert.type.toLowerCase().includes(searchTerm.toLowerCase())

    return matchesSeverity && matchesStatus && matchesSearch
  })

  const activeAlerts = alerts.filter((alert) => alert.status === "active")
  const unacknowledgedAlerts = alerts.filter((alert) => !alert.acknowledged && alert.status === "active")

  const handleAcknowledge = (alertId: string) => {
    // In a real app, this would make an API call
    console.log(`Acknowledging alert: ${alertId}`)
  }

  const handleDismiss = (alertId: string) => {
    // In a real app, this would make an API call
    console.log(`Dismissing alert: ${alertId}`)
  }

  const updateNotificationSetting = (category: string, setting: string, value: boolean) => {
    setSettings((prev) => ({
      ...prev,
      [category]: {
        ...prev[category as keyof typeof prev],
        [setting]: value,
      },
    }))
  }

  return (
    <DashboardLayout currentPage="alerts">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Alert Management System</h1>
            <p className="text-muted-foreground">
              Real-time notifications and alert management for CME events and system status
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon">
              <Archive className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon">
              <Download className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon">
              <Filter className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Alert Summary */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Alerts</CardTitle>
              <BellRing className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">{activeAlerts.length}</div>
              <p className="text-xs text-muted-foreground">Requiring attention</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Unacknowledged</CardTitle>
              <AlertTriangle className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-500">{unacknowledgedAlerts.length}</div>
              <p className="text-xs text-muted-foreground">Need acknowledgment</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Alerts</CardTitle>
              <Bell className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{alerts.length}</div>
              <p className="text-xs text-muted-foreground">Last 24 hours</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Response Time</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">3.2</div>
              <p className="text-xs text-muted-foreground">minutes average</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="alerts" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="alerts">Active Alerts</TabsTrigger>
            <TabsTrigger value="history">Alert History</TabsTrigger>
            <TabsTrigger value="settings">Notification Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="alerts" className="space-y-4">
            <div className="grid gap-6 lg:grid-cols-3">
              {/* Alert List */}
              <div className="lg:col-span-1 space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Alert Queue</CardTitle>
                    <CardDescription>Current active and recent alerts</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Filters */}
                    <div className="space-y-2">
                      <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Search alerts..."
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
                            <SelectItem value="Critical">Critical</SelectItem>
                            <SelectItem value="Warning">Warning</SelectItem>
                            <SelectItem value="Info">Info</SelectItem>
                          </SelectContent>
                        </Select>
                        <Select value={filterStatus} onValueChange={setFilterStatus}>
                          <SelectTrigger className="flex-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Status</SelectItem>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="resolved">Resolved</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Alert List */}
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {filteredAlerts.map((alert) => {
                        const severityConfig_ = severityConfig[alert.severity as keyof typeof severityConfig]
                        const statusConfig_ = statusConfig[alert.status as keyof typeof statusConfig]
                        const isSelected = selectedAlert.id === alert.id

                        return (
                          <div
                            key={alert.id}
                            className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                              isSelected ? "border-primary bg-primary/5" : "hover:bg-accent"
                            } ${!alert.acknowledged && alert.status === "active" ? "ring-2 ring-orange-200" : ""}`}
                            onClick={() => setSelectedAlert(alert)}
                          >
                            <div className="flex items-start justify-between">
                              <div className="space-y-1 flex-1">
                                <div className="flex items-center gap-2">
                                  <severityConfig_.icon className="h-3 w-3" />
                                  <span className="text-sm font-medium">{alert.title}</span>
                                </div>
                                <p className="text-xs text-muted-foreground">{alert.timestamp}</p>
                                <div className="flex items-center gap-2">
                                  <Badge variant={severityConfig_.color as any} className="text-xs">
                                    {alert.severity}
                                  </Badge>
                                  <Badge variant={statusConfig_.color as any} className="text-xs">
                                    {statusConfig_.label}
                                  </Badge>
                                </div>
                              </div>
                              {!alert.acknowledged && alert.status === "active" && (
                                <div className="h-2 w-2 rounded-full bg-orange-500 animate-pulse" />
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Alert Details */}
              <div className="lg:col-span-2 space-y-4">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          {React.createElement(
                            severityConfig[selectedAlert.severity as keyof typeof severityConfig].icon,
                            { className: "h-5 w-5" },
                          )}
                          {selectedAlert.title}
                        </CardTitle>
                        <CardDescription>{selectedAlert.timestamp}</CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={severityConfig[selectedAlert.severity as keyof typeof severityConfig].color as any}
                        >
                          {selectedAlert.severity}
                        </Badge>
                        <Badge variant={statusConfig[selectedAlert.status as keyof typeof statusConfig].color as any}>
                          {statusConfig[selectedAlert.status as keyof typeof statusConfig].label}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="p-4 bg-muted rounded-lg">
                      <p className="text-sm">{selectedAlert.message}</p>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-sm font-medium">Alert ID:</span>
                          <span className="text-sm">{selectedAlert.id}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm font-medium">Type:</span>
                          <span className="text-sm">{selectedAlert.type}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm font-medium">Priority:</span>
                          <span className="text-sm">P{selectedAlert.priority}</span>
                        </div>
                        {selectedAlert.eventId && (
                          <div className="flex justify-between">
                            <span className="text-sm font-medium">Related Event:</span>
                            <span className="text-sm">{selectedAlert.eventId}</span>
                          </div>
                        )}
                      </div>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-sm font-medium">Status:</span>
                          <span className="text-sm">
                            {statusConfig[selectedAlert.status as keyof typeof statusConfig].label}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm font-medium">Acknowledged:</span>
                          <span className="text-sm">{selectedAlert.acknowledged ? "Yes" : "No"}</span>
                        </div>
                        {selectedAlert.acknowledged && (
                          <>
                            <div className="flex justify-between">
                              <span className="text-sm font-medium">Acknowledged By:</span>
                              <span className="text-sm">{selectedAlert.acknowledgedBy}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm font-medium">Acknowledged At:</span>
                              <span className="text-sm">{selectedAlert.acknowledgedAt}</span>
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-3">
                      <h4 className="text-sm font-medium">Notification Channels</h4>
                      <div className="flex flex-wrap gap-2">
                        {selectedAlert.channels.map((channel) => (
                          <Badge key={channel} variant="outline" className="text-xs">
                            {channel}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <h4 className="text-sm font-medium">Recipients</h4>
                      <div className="flex flex-wrap gap-2">
                        {selectedAlert.recipients.map((recipient) => (
                          <Badge key={recipient} variant="outline" className="text-xs">
                            {recipient}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {!selectedAlert.acknowledged && selectedAlert.status === "active" && (
                      <div className="flex gap-2 pt-4">
                        <Button onClick={() => handleAcknowledge(selectedAlert.id)} className="flex-1">
                          <Check className="h-4 w-4 mr-2" />
                          Acknowledge
                        </Button>
                        <Button variant="outline" onClick={() => handleDismiss(selectedAlert.id)} className="flex-1">
                          <X className="h-4 w-4 mr-2" />
                          Dismiss
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="history" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Alert History</CardTitle>
                <CardDescription>Complete timeline of all alerts and notifications</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {alerts.map((alert) => {
                    const severityConfig_ = severityConfig[alert.severity as keyof typeof severityConfig]
                    const statusConfig_ = statusConfig[alert.status as keyof typeof statusConfig]

                    return (
                      <div key={alert.id} className="flex items-start gap-4 p-4 border rounded-lg">
                        <div className="flex-shrink-0">
                          <severityConfig_.icon className="h-5 w-5 mt-0.5" />
                        </div>
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center justify-between">
                            <h3 className="font-medium">{alert.title}</h3>
                            <div className="flex items-center gap-2">
                              <Badge variant={severityConfig_.color as any} className="text-xs">
                                {alert.severity}
                              </Badge>
                              <Badge variant={statusConfig_.color as any} className="text-xs">
                                {statusConfig_.label}
                              </Badge>
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground">{alert.message}</p>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span>{alert.timestamp}</span>
                            <span>•</span>
                            <span>{alert.type}</span>
                            {alert.acknowledged && (
                              <>
                                <span>•</span>
                                <span>Acknowledged by {alert.acknowledgedBy}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-4">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Notification Preferences
                  </CardTitle>
                  <CardDescription>Configure how and when you receive alerts</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {Object.entries(settings).map(([category, config]) => (
                    <div key={category} className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-medium capitalize">{category.replace(/([A-Z])/g, " $1").trim()}</h4>
                        <Switch
                          checked={config.enabled}
                          onCheckedChange={(checked) => updateNotificationSetting(category, "enabled", checked)}
                        />
                      </div>
                      {config.enabled && (
                        <div className="ml-4 space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Mail className="h-4 w-4" />
                              <span className="text-sm">Email</span>
                            </div>
                            <Switch
                              checked={config.email}
                              onCheckedChange={(checked) => updateNotificationSetting(category, "email", checked)}
                            />
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <MessageSquare className="h-4 w-4" />
                              <span className="text-sm">SMS</span>
                            </div>
                            <Switch
                              checked={config.sms}
                              onCheckedChange={(checked) => updateNotificationSetting(category, "sms", checked)}
                            />
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Smartphone className="h-4 w-4" />
                              <span className="text-sm">Push</span>
                            </div>
                            <Switch
                              checked={config.push}
                              onCheckedChange={(checked) => updateNotificationSetting(category, "push", checked)}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Contact Information</CardTitle>
                  <CardDescription>Update your contact details for notifications</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Email Address</label>
                    <Input type="email" placeholder="your.email@isro.gov.in" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Phone Number</label>
                    <Input type="tel" placeholder="+91 XXXXX XXXXX" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Department</label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select department" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="mission-control">Mission Control</SelectItem>
                        <SelectItem value="satellite-ops">Satellite Operations</SelectItem>
                        <SelectItem value="research">Research Team</SelectItem>
                        <SelectItem value="forecasting">Forecasting Team</SelectItem>
                        <SelectItem value="technical">Technical Team</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button className="w-full">Update Contact Information</Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
