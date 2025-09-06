"use client"

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'

interface Coordinates {
  latitude: number
  longitude: number
  timestamp: number
  accuracy?: number
}

interface RoadRecording {
  id: string
  name: string
  type: 'main' | 'secondary' | 'residential' | 'highway'
  coordinates: Coordinates[]
  startTime: Date
  endTime?: Date
  distance: number
  notes: string
  condition: 'excellent' | 'good' | 'fair' | 'poor'
}

interface RoadRecorderProps {
  onRecordingUpdate: (count: number) => void
}

export function RoadRecorder({ onRecordingUpdate }: RoadRecorderProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [currentRecording, setCurrentRecording] = useState<RoadRecording | null>(null)
  const [recordings, setRecordings] = useState<RoadRecording[]>([])
  const [roadName, setRoadName] = useState('')
  const [roadType, setRoadType] = useState<string>('')
  const [roadCondition, setRoadCondition] = useState<string>('')
  const [notes, setNotes] = useState('')
  const [currentLocation, setCurrentLocation] = useState<Coordinates | null>(null)
  const [distance, setDistance] = useState(0)
  
  const watchIdRef = useRef<number | null>(null)
  const lastPositionRef = useRef<Coordinates | null>(null)

  useEffect(() => {
    // Load existing recordings from localStorage (IndexedDB would be better for production)
    const saved = localStorage.getItem('roadRecordings')
    if (saved) {
      const savedRecordings = JSON.parse(saved)
      setRecordings(savedRecordings)
      onRecordingUpdate(savedRecordings.length)
    }

    return () => {
      if (watchIdRef.current) {
        navigator.geolocation.clearWatch(watchIdRef.current)
      }
    }
  }, [onRecordingUpdate])

  const calculateDistance = (coords1: Coordinates, coords2: Coordinates): number => {
    const R = 6371e3 // Earth's radius in meters
    const φ1 = coords1.latitude * Math.PI/180
    const φ2 = coords2.latitude * Math.PI/180
    const Δφ = (coords2.latitude-coords1.latitude) * Math.PI/180
    const Δλ = (coords2.longitude-coords1.longitude) * Math.PI/180

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))

    return R * c // Distance in meters
  }

  const startRecording = () => {
    if (!roadName.trim()) {
      toast.error('Please enter a road name before starting recording')
      return
    }

    if (!roadType) {
      toast.error('Please select a road type before starting recording')
      return
    }

    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by this browser')
      return
    }

    const newRecording: RoadRecording = {
      id: Date.now().toString(),
      name: roadName.trim(),
      type: roadType as any,
      coordinates: [],
      startTime: new Date(),
      distance: 0,
      notes: notes.trim(),
      condition: roadCondition as any || 'good'
    }

    setCurrentRecording(newRecording)
    setIsRecording(true)
    setDistance(0)
    lastPositionRef.current = null

    // Start watching position
    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const coords: Coordinates = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          timestamp: Date.now(),
          accuracy: position.coords.accuracy
        }

        setCurrentLocation(coords)

        if (currentRecording) {
          const updatedRecording = { ...currentRecording }
          updatedRecording.coordinates.push(coords)

          // Calculate cumulative distance
          if (lastPositionRef.current) {
            const additionalDistance = calculateDistance(lastPositionRef.current, coords)
            setDistance(prev => prev + additionalDistance)
            updatedRecording.distance = distance + additionalDistance
          }

          lastPositionRef.current = coords
          setCurrentRecording(updatedRecording)
        }
      },
      (error) => {
        console.error('GPS Error:', error)
        toast.error(`GPS Error: ${error.message}`)
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 1000
      }
    )

    toast.success('Recording started! Start walking or riding along the road.')
  }

  const stopRecording = () => {
    if (watchIdRef.current) {
      navigator.geolocation.clearWatch(watchIdRef.current)
      watchIdRef.current = null
    }

    if (currentRecording) {
      const finalRecording = {
        ...currentRecording,
        endTime: new Date(),
        distance: distance
      }

      const updatedRecordings = [...recordings, finalRecording]
      setRecordings(updatedRecordings)
      localStorage.setItem('roadRecordings', JSON.stringify(updatedRecordings))
      onRecordingUpdate(updatedRecordings.length)

      toast.success(`Road "${finalRecording.name}" recorded successfully! Distance: ${(finalRecording.distance / 1000).toFixed(2)} km`)
    }

    setIsRecording(false)
    setCurrentRecording(null)
    setCurrentLocation(null)
    setDistance(0)
    setRoadName('')
    setRoadType('')
    setRoadCondition('')
    setNotes('')
    lastPositionRef.current = null
  }

  const deleteRecording = (id: string) => {
    const updatedRecordings = recordings.filter(r => r.id !== id)
    setRecordings(updatedRecordings)
    localStorage.setItem('roadRecordings', JSON.stringify(updatedRecordings))
    onRecordingUpdate(updatedRecordings.length)
    toast.success('Recording deleted')
  }

  return (
    <div className="space-y-6">
      {/* Recording Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <span>GPS Road Recording</span>
            {isRecording && (
              <Badge variant="destructive" className="animate-pulse">
                RECORDING
              </Badge>
            )}
          </CardTitle>
          <CardDescription>
            Enter road details and start recording to automatically track the road path
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="roadName">Road Name *</Label>
              <Input
                id="roadName"
                value={roadName}
                onChange={(e) => setRoadName(e.target.value)}
                placeholder="e.g., Main Street, Highway 101"
                disabled={isRecording}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="roadType">Road Type *</Label>
              <Select value={roadType} onValueChange={setRoadType} disabled={isRecording}>
                <SelectTrigger>
                  <SelectValue placeholder="Select road type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="highway">Highway</SelectItem>
                  <SelectItem value="main">Main Road</SelectItem>
                  <SelectItem value="secondary">Secondary Road</SelectItem>
                  <SelectItem value="residential">Residential Street</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="roadCondition">Road Condition</Label>
              <Select value={roadCondition} onValueChange={setRoadCondition} disabled={isRecording}>
                <SelectTrigger>
                  <SelectValue placeholder="Select condition" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="excellent">Excellent</SelectItem>
                  <SelectItem value="good">Good</SelectItem>
                  <SelectItem value="fair">Fair</SelectItem>
                  <SelectItem value="poor">Poor</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Additional observations..."
                disabled={isRecording}
                rows={3}
              />
            </div>
          </div>

          {/* Recording Status */}
          {isRecording && currentLocation && (
            <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
              <CardContent className="pt-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <div className="font-medium">Coordinates</div>
                    <div className="text-xs text-muted-foreground">
                      {currentLocation.latitude.toFixed(6)}, {currentLocation.longitude.toFixed(6)}
                    </div>
                  </div>
                  <div>
                    <div className="font-medium">Distance</div>
                    <div className="text-xs text-muted-foreground">
                      {(distance / 1000).toFixed(2)} km
                    </div>
                  </div>
                  <div>
                    <div className="font-medium">Points Recorded</div>
                    <div className="text-xs text-muted-foreground">
                      {currentRecording?.coordinates.length || 0}
                    </div>
                  </div>
                  <div>
                    <div className="font-medium">Accuracy</div>
                    <div className="text-xs text-muted-foreground">
                      ±{currentLocation.accuracy?.toFixed(0) || 'N/A'}m
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Control Buttons */}
          <div className="flex space-x-2">
            {!isRecording ? (
              <Button onClick={startRecording} className="flex-1">
                Start Recording
              </Button>
            ) : (
              <Button onClick={stopRecording} variant="destructive" className="flex-1">
                Stop Recording
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Recorded Roads List */}
      <Card>
        <CardHeader>
          <CardTitle>Recorded Roads ({recordings.length})</CardTitle>
          <CardDescription>History of all recorded road segments</CardDescription>
        </CardHeader>
        <CardContent>
          {recordings.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <div className="text-4xl mb-2">🛣️</div>
              <p>No roads recorded yet</p>
              <p className="text-sm">Start your first recording above</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recordings.map((recording) => (
                <Card key={recording.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <h4 className="font-medium">{recording.name}</h4>
                        <Badge variant="outline" className="text-xs capitalize">
                          {recording.type}
                        </Badge>
                        <Badge 
                          variant="secondary" 
                          className={`text-xs capitalize ${
                            recording.condition === 'excellent' ? 'bg-green-100 text-green-800' :
                            recording.condition === 'good' ? 'bg-blue-100 text-blue-800' :
                            recording.condition === 'fair' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}
                        >
                          {recording.condition}
                        </Badge>
                      </div>
                      <div className="text-sm text-gray-600 space-y-1">
                        <div>Distance: {(recording.distance / 1000).toFixed(2)} km</div>
                        <div>Points: {recording.coordinates.length}</div>
                        <div>Recorded: {recording.startTime.toLocaleDateString()} at {recording.startTime.toLocaleTimeString()}</div>
                        {recording.notes && <div>Notes: {recording.notes}</div>}
                      </div>
                    </div>
                    <Button 
                      variant="destructive" 
                      size="sm"
                      onClick={() => deleteRecording(recording.id)}
                    >
                      Delete
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}