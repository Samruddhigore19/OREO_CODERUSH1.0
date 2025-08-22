"use client"

import type React from "react"

import { useState } from "react"
import {
  Satellite,
  Home,
  Activity,
  AlertTriangle,
  TrendingUp,
  Bell,
  Database,
  Settings,
  Search,
  Moon,
  Sun,
  User,
  Menu,
  X,
} from "lucide-react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface DashboardLayoutProps {
  children: React.ReactNode
  currentPage?: string
}

const sidebarItems = [
  { id: "home", label: "Home", icon: Home, href: "/" },
  { id: "realtime", label: "Real-time Data", icon: Activity, href: "/realtime" },
  { id: "events", label: "CME Events", icon: AlertTriangle, href: "/events" },
  { id: "forecasts", label: "Forecasts", icon: TrendingUp, href: "/forecasts" },
  { id: "alerts", label: "Alerts", icon: Bell, href: "/alerts" },
  { id: "correlation", label: "APIs & Correlation", icon: Database, href: "/correlation" },
  { id: "settings", label: "Settings", icon: Settings, href: "/settings" },
]

export function DashboardLayout({ children, currentPage = "home" }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { theme, setTheme } = useTheme()

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-50 h-full w-64 transform bg-sidebar border-r border-sidebar-border transition-transform duration-200 ease-in-out lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        )}
      >
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-16 items-center gap-2 border-b border-sidebar-border px-6">
            <Satellite className="h-8 w-8 text-sidebar-primary" />
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-sidebar-foreground">Aditya-L1</span>
              <span className="text-xs text-sidebar-foreground/70">CME Detection</span>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 p-4">
            {sidebarItems.map((item) => {
              const Icon = item.icon
              const isActive = currentPage === item.id

              return (
                <a
                  key={item.id}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-sidebar-primary text-sidebar-primary-foreground"
                      : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                  {item.id === "alerts" && (
                    <Badge variant="destructive" className="ml-auto h-5 w-5 rounded-full p-0 text-xs">
                      3
                    </Badge>
                  )}
                </a>
              )
            })}
          </nav>

          {/* Status indicator */}
          <div className="border-t border-sidebar-border p-4">
            <div className="flex items-center gap-2 text-xs text-sidebar-foreground/70">
              <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
              <span>System Online</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top navbar */}
        <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-6">
          {/* Mobile menu button */}
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setSidebarOpen(!sidebarOpen)}>
            {sidebarOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </Button>

          {/* Search */}
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input type="search" placeholder="Search events, data, alerts..." className="pl-8" />
            </div>
          </div>

          {/* Right side controls */}
          <div className="flex items-center gap-2">
            {/* Theme toggle */}
            <Button variant="ghost" size="icon" onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
              <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              <span className="sr-only">Toggle theme</span>
            </Button>

            {/* User menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src="/scientist-in-lab.png" alt="User" />
                    <AvatarFallback>SC</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuItem>
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <span>Sign out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  )
}
