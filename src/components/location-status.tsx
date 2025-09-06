"use client"

import { useState, useEffect } from 'react'
import { Badge } from '@/components/ui/badge'

export function LocationStatus() {
  const [locationStatus, setLocationStatus] = useState<'checking' | 'granted' | 'denied' | 'unavailable'>('checking')
  const [accuracy, setAccuracy] = useState<number | null>(null)

  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationStatus('unavailable')
      return
    }

    // Check permission status
    if ('permissions' in navigator) {
      navigator.permissions.query({ name: 'geolocation' }).then((result) => {
        if (result.state === 'granted') {
          setLocationStatus('granted')
          // Get current position to check accuracy
          navigator.geolocation.getCurrentPosition(
            (position) => {
              setAccuracy(position.coords.accuracy)
            },
            () => {
              setLocationStatus('denied')
            },
            { timeout: 5000 }
          )
        } else if (result.state === 'denied') {
          setLocationStatus('denied')
        } else {
          // Try to get position to trigger permission request
          navigator.geolocation.getCurrentPosition(
            (position) => {
              setLocationStatus('granted')
              setAccuracy(position.coords.accuracy)
            },
            () => {
              setLocationStatus('denied')
            },
            { timeout: 5000 }
          )
        }
      }).catch(() => {
        // Fallback for browsers without permissions API
        navigator.geolocation.getCurrentPosition(
          (position) => {
            setLocationStatus('granted')
            setAccuracy(position.coords.accuracy)
          },
          () => {
            setLocationStatus('denied')
          },
          { timeout: 5000 }
        )
      })
    } else {
      // Fallback for browsers without permissions API
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocationStatus('granted')
          setAccuracy(position.coords.accuracy)
        },
        () => {
          setLocationStatus('denied')
        },
        { timeout: 5000 }
      )
    }
  }, [])

  const getStatusBadge = () => {
    switch (locationStatus) {
      case 'checking':
        return (
          <Badge variant="secondary" className="text-xs">
            📍 Checking GPS...
          </Badge>
        )
      case 'granted':
        return (
          <Badge variant="outline" className="text-green-600 border-green-600 text-xs">
            📍 GPS Active {accuracy && `(±${Math.round(accuracy)}m)`}
          </Badge>
        )
      case 'denied':
        return (
          <Badge variant="destructive" className="text-xs">
            📍 GPS Denied
          </Badge>
        )
      case 'unavailable':
        return (
          <Badge variant="secondary" className="text-xs">
            📍 GPS Unavailable
          </Badge>
        )
    }
  }

  return getStatusBadge()
}