"use client"

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { MapView } from '@/components/map-view'
import { RoadRecorder } from '@/components/road-recorder'
import { InfrastructureManager } from '@/components/infrastructure-manager'
import { DataExporter } from '@/components/data-exporter'
import { ThemeToggle } from '@/components/theme-toggle'
import { LocationStatus } from '@/components/location-status'

export default function HomePage() {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [recordingCount, setRecordingCount] = useState(0)
  const [infrastructureCount, setInfrastructureCount] = useState(0)

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-b sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">RM</span>
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900 dark:text-white">Road Monitor</h1>
                <p className="text-xs text-gray-600 dark:text-gray-400">Infrastructure Management</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <LocationStatus />
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-6">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="map">Map</TabsTrigger>
            <TabsTrigger value="record">Record</TabsTrigger>
            <TabsTrigger value="infrastructure">Infrastructure</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Total Roads</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{recordingCount}</div>
                  <p className="text-xs text-muted-foreground">Recorded roads</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Infrastructure</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{infrastructureCount}</div>
                  <p className="text-xs text-muted-foreground">Registered items</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <Badge variant="outline" className="text-green-600">Online</Badge>
                  <p className="text-xs text-muted-foreground mt-1">GPS Active</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Last Update</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-sm font-medium">Just now</div>
                  <p className="text-xs text-muted-foreground">Sync status</p>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                  <CardDescription>Latest road recordings and infrastructure updates</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span className="text-sm">Road recorded on Main Street</span>
                      <Badge variant="secondary" className="text-xs">2 min ago</Badge>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-sm">Infrastructure added: Bridge #001</span>
                      <Badge variant="secondary" className="text-xs">5 min ago</Badge>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                      <span className="text-sm">Work site updated: Construction Zone A</span>
                      <Badge variant="secondary" className="text-xs">15 min ago</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                  <CardDescription>Common tasks for field engineers</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button 
                    className="w-full justify-start" 
                    onClick={() => setActiveTab('record')}
                  >
                    Start Road Recording
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => setActiveTab('infrastructure')}
                  >
                    Add Infrastructure
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => setActiveTab('map')}
                  >
                    View Map
                  </Button>
                  <DataExporter />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="map">
            <Card className="h-[calc(100vh-200px)]">
              <CardHeader>
                <CardTitle>Interactive Map</CardTitle>
                <CardDescription>View all recorded roads and infrastructure</CardDescription>
              </CardHeader>
              <CardContent className="h-full p-0">
                <MapView />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="record">
            <Card>
              <CardHeader>
                <CardTitle>Road Recording</CardTitle>
                <CardDescription>Track and record roads while walking or riding</CardDescription>
              </CardHeader>
              <CardContent>
                <RoadRecorder onRecordingUpdate={setRecordingCount} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="infrastructure">
            <Card>
              <CardHeader>
                <CardTitle>Infrastructure Management</CardTitle>
                <CardDescription>Add and manage infrastructure items in your jurisdiction</CardDescription>
              </CardHeader>
              <CardContent>
                <InfrastructureManager onCountUpdate={setInfrastructureCount} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}