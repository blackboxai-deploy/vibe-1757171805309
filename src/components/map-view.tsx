"use client"

import { useEffect, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

// Dynamically import map components to avoid SSR issues
const MapContainer = dynamic(() => import('react-leaflet').then(mod => ({ default: mod.MapContainer })), { ssr: false })
const TileLayer = dynamic(() => import('react-leaflet').then(mod => ({ default: mod.TileLayer })), { ssr: false })
const Marker = dynamic(() => import('react-leaflet').then(mod => ({ default: mod.Marker })), { ssr: false })
const Popup = dynamic(() => import('react-leaflet').then(mod => ({ default: mod.Popup })), { ssr: false })
const Polyline = dynamic(() => import('react-leaflet').then(mod => ({ default: mod.Polyline })), { ssr: false })

interface Road {
  id: string
  name: string
  coordinates: [number, number][]
  recordedAt: Date
  type: 'main' | 'secondary' | 'residential'
}

interface Infrastructure {
  id: string
  name: string
  type: 'building' | 'worksite' | 'bridge' | 'utility'
  coordinates: [number, number]
  description: string
  photos: string[]
  status: 'active' | 'inactive' | 'maintenance'
}

export function MapView() {
  const [currentLocation, setCurrentLocation] = useState<[number, number] | null>(null)
  const [roads, setRoads] = useState<Road[]>([])
  const [infrastructure, setInfrastructure] = useState<Infrastructure[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const mapRef = useRef<any>(null)

  useEffect(() => {
    // Get current location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords: [number, number] = [position.coords.latitude, position.coords.longitude]
          setCurrentLocation(coords)
          setIsLoading(false)
        },
        (error) => {
          console.error('Error getting location:', error)
          // Default to a sample location if geolocation fails
          setCurrentLocation([40.7128, -74.0060]) // New York coordinates as fallback
          setIsLoading(false)
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
      )
    } else {
      setCurrentLocation([40.7128, -74.0060])
      setIsLoading(false)
    }

    // Load sample data (in real app, this would come from IndexedDB)
    loadSampleData()
  }, [])

  const loadSampleData = () => {
    // Sample roads
    const sampleRoads: Road[] = [
      {
        id: '1',
        name: 'Main Street',
        coordinates: [[40.7128, -74.0060], [40.7130, -74.0062], [40.7132, -74.0064]],
        recordedAt: new Date(),
        type: 'main'
      }
    ]

    // Sample infrastructure
    const sampleInfrastructure: Infrastructure[] = [
      {
        id: '1',
        name: 'City Bridge',
        type: 'bridge',
        coordinates: [40.7129, -74.0061],
        description: 'Main bridge connecting downtown',
        photos: [],
        status: 'active'
      },
      {
        id: '2',
        name: 'Construction Site A',
        type: 'worksite',
        coordinates: [40.7131, -74.0063],
        description: 'Road maintenance in progress',
        photos: [],
        status: 'active'
      }
    ]

    setRoads(sampleRoads)
    setInfrastructure(sampleInfrastructure)
  }

  const centerOnCurrentLocation = () => {
    if (currentLocation && mapRef.current) {
      mapRef.current.setView(currentLocation, 16)
    }
  }

  const getInfrastructureIcon = (type: string) => {
    switch (type) {
      case 'building': return '🏢'
      case 'worksite': return '🚧'
      case 'bridge': return '🌉'
      case 'utility': return '⚡'
      default: return '📍'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500'
      case 'inactive': return 'bg-gray-500'
      case 'maintenance': return 'bg-orange-500'
      default: return 'bg-blue-500'
    }
  }

  if (isLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-sm text-gray-600">Loading map...</p>
        </div>
      </div>
    )
  }

  if (!currentLocation) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <h3 className="font-semibold mb-2">Location Access Required</h3>
            <p className="text-sm text-gray-600 mb-4">
              Please enable location services to view the map and start recording roads.
            </p>
            <Button onClick={() => window.location.reload()}>
              Retry Location Access
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="relative w-full h-full">
      {/* Map Controls */}
      <div className="absolute top-4 right-4 z-[1000] space-y-2">
        <Button
          size="sm"
          onClick={centerOnCurrentLocation}
          className="bg-white hover:bg-gray-100 text-gray-900 border shadow-lg"
        >
          📍 My Location
        </Button>
      </div>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 z-[1000]">
        <Card className="p-3 bg-white/95 backdrop-blur-sm">
          <div className="space-y-2 text-xs">
            <div className="font-semibold">Legend</div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-1 bg-blue-500 rounded"></div>
              <span>Recorded Roads</span>
            </div>
            <div className="flex items-center space-x-2">
              <span>🌉</span>
              <span>Infrastructure</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full bg-green-500`}></div>
              <span>Active</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full bg-orange-500`}></div>
              <span>Maintenance</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Map Component */}
      <MapContainer
        ref={mapRef}
        center={currentLocation}
        zoom={15}
        style={{ height: '100%', width: '100%' }}
        className="rounded-lg"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {/* Current Location Marker */}
        <Marker position={currentLocation}>
          <Popup>
            <div className="text-center">
              <strong>Your Current Location</strong>
              <br />
              <small>{currentLocation[0].toFixed(6)}, {currentLocation[1].toFixed(6)}</small>
            </div>
          </Popup>
        </Marker>

        {/* Road Polylines */}
        {roads.map((road) => (
          <Polyline
            key={road.id}
            positions={road.coordinates}
            color="#3b82f6"
            weight={4}
            opacity={0.8}
          >
            <Popup>
              <div>
                <strong>{road.name}</strong>
                <br />
                <Badge variant="outline">{road.type}</Badge>
                <br />
                <small>Recorded: {road.recordedAt.toLocaleDateString()}</small>
              </div>
            </Popup>
          </Polyline>
        ))}

        {/* Infrastructure Markers */}
        {infrastructure.map((item) => (
          <Marker key={item.id} position={item.coordinates}>
            <Popup>
              <div className="min-w-[200px]">
                <div className="flex items-center space-x-2 mb-2">
                  <span className="text-lg">{getInfrastructureIcon(item.type)}</span>
                  <div>
                    <strong>{item.name}</strong>
                    <div className="flex items-center space-x-2 mt-1">
                      <Badge variant="outline" className="text-xs capitalize">
                        {item.type}
                      </Badge>
                      <div className={`w-2 h-2 rounded-full ${getStatusColor(item.status)}`}></div>
                      <span className="text-xs capitalize">{item.status}</span>
                    </div>
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-2">{item.description}</p>
                <small className="text-xs text-gray-500">
                  {item.coordinates[0].toFixed(6)}, {item.coordinates[1].toFixed(6)}
                </small>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  )
}