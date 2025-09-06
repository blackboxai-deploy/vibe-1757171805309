"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { toast } from 'sonner'

interface Infrastructure {
  id: string
  name: string
  type: 'building' | 'worksite' | 'bridge' | 'utility' | 'sign' | 'light' | 'drain'
  coordinates: {
    latitude: number
    longitude: number
  }
  description: string
  status: 'active' | 'inactive' | 'maintenance' | 'planned'
  priority: 'low' | 'medium' | 'high' | 'critical'
  photos: string[]
  createdAt: Date
  updatedAt: Date
  notes: string
  contact: string
}

interface InfrastructureManagerProps {
  onCountUpdate: (count: number) => void
}

export function InfrastructureManager({ onCountUpdate }: InfrastructureManagerProps) {
  const [infrastructure, setInfrastructure] = useState<Infrastructure[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<Infrastructure | null>(null)
  const [currentLocation, setCurrentLocation] = useState<{latitude: number, longitude: number} | null>(null)
  
  // Form fields
  const [name, setName] = useState('')
  const [type, setType] = useState('')
  const [description, setDescription] = useState('')
  const [status, setStatus] = useState('')
  const [priority, setPriority] = useState('')
  const [notes, setNotes] = useState('')
  const [contact, setContact] = useState('')
  const [customLat, setCustomLat] = useState('')
  const [customLng, setCustomLng] = useState('')
  const [useCurrentLocation, setUseCurrentLocation] = useState(true)

  useEffect(() => {
    // Load existing infrastructure from localStorage
    const saved = localStorage.getItem('infrastructure')
    if (saved) {
      const savedInfrastructure = JSON.parse(saved, (key, value) => {
        if (key === 'createdAt' || key === 'updatedAt') {
          return new Date(value)
        }
        return value
      })
      setInfrastructure(savedInfrastructure)
      onCountUpdate(savedInfrastructure.length)
    }

    // Get current location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCurrentLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          })
        },
        (error) => {
          console.error('Error getting location:', error)
          toast.error('Could not get current location. You can enter coordinates manually.')
        }
      )
    }
  }, [onCountUpdate])

  const resetForm = () => {
    setName('')
    setType('')
    setDescription('')
    setStatus('active')
    setPriority('medium')
    setNotes('')
    setContact('')
    setCustomLat('')
    setCustomLng('')
    setUseCurrentLocation(true)
    setEditingItem(null)
  }

  const openDialog = (item?: Infrastructure) => {
    if (item) {
      setEditingItem(item)
      setName(item.name)
      setType(item.type)
      setDescription(item.description)
      setStatus(item.status)
      setPriority(item.priority)
      setNotes(item.notes)
      setContact(item.contact)
      setCustomLat(item.coordinates.latitude.toString())
      setCustomLng(item.coordinates.longitude.toString())
      setUseCurrentLocation(false)
    } else {
      resetForm()
    }
    setIsDialogOpen(true)
  }

  const handleSave = () => {
    if (!name.trim()) {
      toast.error('Please enter a name for the infrastructure')
      return
    }

    if (!type) {
      toast.error('Please select an infrastructure type')
      return
    }

    let coordinates: {latitude: number, longitude: number}

    if (useCurrentLocation) {
      if (!currentLocation) {
        toast.error('Current location not available. Please enter coordinates manually.')
        return
      }
      coordinates = currentLocation
    } else {
      const lat = parseFloat(customLat)
      const lng = parseFloat(customLng)
      
      if (isNaN(lat) || isNaN(lng)) {
        toast.error('Please enter valid coordinates')
        return
      }

      if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
        toast.error('Please enter valid coordinate ranges (lat: -90 to 90, lng: -180 to 180)')
        return
      }

      coordinates = { latitude: lat, longitude: lng }
    }

    const now = new Date()
    
    if (editingItem) {
      // Update existing item
      const updatedItem: Infrastructure = {
        ...editingItem,
        name: name.trim(),
        type: type as any,
        description: description.trim(),
        status: status as any,
        priority: priority as any,
        notes: notes.trim(),
        contact: contact.trim(),
        coordinates,
        updatedAt: now
      }

      const updatedInfrastructure = infrastructure.map(item => 
        item.id === editingItem.id ? updatedItem : item
      )
      
      setInfrastructure(updatedInfrastructure)
      localStorage.setItem('infrastructure', JSON.stringify(updatedInfrastructure))
      toast.success('Infrastructure updated successfully')
    } else {
      // Create new item
      const newItem: Infrastructure = {
        id: Date.now().toString(),
        name: name.trim(),
        type: type as any,
        description: description.trim(),
        status: status as any || 'active',
        priority: priority as any || 'medium',
        notes: notes.trim(),
        contact: contact.trim(),
        coordinates,
        photos: [],
        createdAt: now,
        updatedAt: now
      }

      const updatedInfrastructure = [...infrastructure, newItem]
      setInfrastructure(updatedInfrastructure)
      localStorage.setItem('infrastructure', JSON.stringify(updatedInfrastructure))
      onCountUpdate(updatedInfrastructure.length)
      toast.success('Infrastructure added successfully')
    }

    setIsDialogOpen(false)
    resetForm()
  }

  const handleDelete = (id: string) => {
    const updatedInfrastructure = infrastructure.filter(item => item.id !== id)
    setInfrastructure(updatedInfrastructure)
    localStorage.setItem('infrastructure', JSON.stringify(updatedInfrastructure))
    onCountUpdate(updatedInfrastructure.length)
    toast.success('Infrastructure deleted')
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'building': return '🏢'
      case 'worksite': return '🚧'
      case 'bridge': return '🌉'
      case 'utility': return '⚡'
      case 'sign': return '🪧'
      case 'light': return '💡'
      case 'drain': return '🚰'
      default: return '📍'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'inactive': return 'bg-gray-100 text-gray-800'
      case 'maintenance': return 'bg-orange-100 text-orange-800'
      case 'planned': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-800'
      case 'high': return 'bg-orange-100 text-orange-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'low': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="space-y-6">
      {/* Add Infrastructure Button */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Infrastructure Items ({infrastructure.length})</h3>
          <p className="text-sm text-gray-600">Manage buildings, work sites, and other infrastructure</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => openDialog()}>
              Add Infrastructure
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingItem ? 'Edit Infrastructure' : 'Add New Infrastructure'}
              </DialogTitle>
              <DialogDescription>
                {editingItem 
                  ? 'Update the infrastructure item details'
                  : 'Add a new infrastructure item to your jurisdiction'
                }
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g., City Hall, Bridge #12"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="type">Type *</Label>
                  <Select value={type} onValueChange={setType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="building">🏢 Building</SelectItem>
                      <SelectItem value="worksite">🚧 Work Site</SelectItem>
                      <SelectItem value="bridge">🌉 Bridge</SelectItem>
                      <SelectItem value="utility">⚡ Utility</SelectItem>
                      <SelectItem value="sign">🪧 Sign</SelectItem>
                      <SelectItem value="light">💡 Street Light</SelectItem>
                      <SelectItem value="drain">🚰 Drain</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select value={status} onValueChange={setStatus}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="maintenance">Maintenance</SelectItem>
                      <SelectItem value="planned">Planned</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="priority">Priority</Label>
                  <Select value={priority} onValueChange={setPriority}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Detailed description of the infrastructure..."
                  rows={3}
                />
              </div>

              {/* Location Section */}
              <div className="space-y-3 border-t pt-4">
                <Label className="text-sm font-medium">Location</Label>
                
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="currentLocation"
                    checked={useCurrentLocation}
                    onChange={() => setUseCurrentLocation(true)}
                    className="w-4 h-4"
                  />
                  <Label htmlFor="currentLocation" className="text-sm">
                    Use current GPS location {currentLocation && 
                      `(${currentLocation.latitude.toFixed(6)}, ${currentLocation.longitude.toFixed(6)})`
                    }
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="customLocation"
                    checked={!useCurrentLocation}
                    onChange={() => setUseCurrentLocation(false)}
                    className="w-4 h-4"
                  />
                  <Label htmlFor="customLocation" className="text-sm">Enter coordinates manually</Label>
                </div>

                {!useCurrentLocation && (
                  <div className="grid grid-cols-2 gap-4 ml-6">
                    <div className="space-y-2">
                      <Label htmlFor="latitude">Latitude</Label>
                      <Input
                        id="latitude"
                        value={customLat}
                        onChange={(e) => setCustomLat(e.target.value)}
                        placeholder="e.g., 40.7128"
                        type="number"
                        step="any"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="longitude">Longitude</Label>
                      <Input
                        id="longitude"
                        value={customLng}
                        onChange={(e) => setCustomLng(e.target.value)}
                        placeholder="e.g., -74.0060"
                        type="number"
                        step="any"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="contact">Contact Information</Label>
                <Input
                  id="contact"
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                  placeholder="Contact person, phone, or email"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Additional Notes</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Any additional observations or notes..."
                  rows={2}
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave}>
                {editingItem ? 'Update' : 'Add'} Infrastructure
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Infrastructure List */}
      <div className="space-y-4">
        {infrastructure.length === 0 ? (
          <Card className="p-8 text-center">
            <div className="text-4xl mb-2">🏗️</div>
            <h3 className="font-medium mb-2">No Infrastructure Items</h3>
            <p className="text-sm text-gray-600 mb-4">
              Start by adding buildings, work sites, or other infrastructure items in your area
            </p>
            <Button onClick={() => openDialog()}>Add Your First Item</Button>
          </Card>
        ) : (
          <div className="grid gap-4">
            {infrastructure.map((item) => (
              <Card key={item.id} className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <span className="text-2xl">{getTypeIcon(item.type)}</span>
                      <div>
                        <h4 className="font-medium text-lg">{item.name}</h4>
                        <div className="flex items-center space-x-2 mt-1">
                          <Badge variant="secondary" className="text-xs capitalize">
                            {item.type}
                          </Badge>
                          <Badge className={`text-xs capitalize ${getStatusColor(item.status)}`}>
                            {item.status}
                          </Badge>
                          <Badge className={`text-xs capitalize ${getPriorityColor(item.priority)}`}>
                            {item.priority} priority
                          </Badge>
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-sm text-gray-600 space-y-1">
                      {item.description && <p><strong>Description:</strong> {item.description}</p>}
                      <p>
                        <strong>Location:</strong> {item.coordinates.latitude.toFixed(6)}, {item.coordinates.longitude.toFixed(6)}
                      </p>
                      {item.contact && <p><strong>Contact:</strong> {item.contact}</p>}
                      {item.notes && <p><strong>Notes:</strong> {item.notes}</p>}
                      <p>
                        <strong>Added:</strong> {item.createdAt.toLocaleDateString()} at {item.createdAt.toLocaleTimeString()}
                      </p>
                      {item.updatedAt > item.createdAt && (
                        <p>
                          <strong>Updated:</strong> {item.updatedAt.toLocaleDateString()} at {item.updatedAt.toLocaleTimeString()}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex space-x-2 ml-4">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => openDialog(item)}
                    >
                      Edit
                    </Button>
                    <Button 
                      variant="destructive" 
                      size="sm"
                      onClick={() => handleDelete(item.id)}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}