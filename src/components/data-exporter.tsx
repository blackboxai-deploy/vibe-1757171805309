"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { toast } from 'sonner'

interface ExportData {
  roads: any[]
  infrastructure: any[]
  exportDate: string
  totalRecords: number
}

export function DataExporter() {
  const [exportFormat, setExportFormat] = useState('json')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isExporting, setIsExporting] = useState(false)

  const exportData = async () => {
    setIsExporting(true)

    try {
      // Get data from localStorage
      const roads = JSON.parse(localStorage.getItem('roadRecordings') || '[]')
      const infrastructure = JSON.parse(localStorage.getItem('infrastructure') || '[]')

      const exportData: ExportData = {
        roads,
        infrastructure,
        exportDate: new Date().toISOString(),
        totalRecords: roads.length + infrastructure.length
      }

      if (exportData.totalRecords === 0) {
        toast.error('No data to export. Please record some roads or add infrastructure first.')
        setIsExporting(false)
        return
      }

      let fileContent: string
      let filename: string
      let mimeType: string

      switch (exportFormat) {
        case 'json':
          fileContent = JSON.stringify(exportData, null, 2)
          filename = `road-infrastructure-data-${new Date().toISOString().split('T')[0]}.json`
          mimeType = 'application/json'
          break

        case 'csv':
          // Convert to CSV format
          const csvData = convertToCSV(exportData)
          fileContent = csvData
          filename = `road-infrastructure-data-${new Date().toISOString().split('T')[0]}.csv`
          mimeType = 'text/csv'
          break

        case 'geojson':
          // Convert to GeoJSON format
          const geoJsonData = convertToGeoJSON(exportData)
          fileContent = JSON.stringify(geoJsonData, null, 2)
          filename = `road-infrastructure-data-${new Date().toISOString().split('T')[0]}.geojson`
          mimeType = 'application/geo+json'
          break

        default:
          throw new Error('Unsupported export format')
      }

      // Create and download file
      const blob = new Blob([fileContent], { type: mimeType })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      toast.success(`Data exported successfully as ${exportFormat.toUpperCase()}!`)
      setIsDialogOpen(false)
    } catch (error) {
      console.error('Export error:', error)
      toast.error('Failed to export data. Please try again.')
    } finally {
      setIsExporting(false)
    }
  }

  const convertToCSV = (data: ExportData): string => {
    let csv = ''

    // Roads CSV
    if (data.roads.length > 0) {
      csv += 'TYPE,NAME,ROAD_TYPE,DISTANCE_KM,CONDITION,START_TIME,END_TIME,COORDINATES_COUNT,NOTES\n'
      data.roads.forEach(road => {
        csv += `ROAD,"${road.name}","${road.type}",${(road.distance / 1000).toFixed(2)},"${road.condition}","${road.startTime}","${road.endTime || ''}",${road.coordinates.length},"${road.notes || ''}"\n`
      })
      csv += '\n'
    }

    // Infrastructure CSV
    if (data.infrastructure.length > 0) {
      csv += 'TYPE,NAME,INFRASTRUCTURE_TYPE,STATUS,PRIORITY,LATITUDE,LONGITUDE,DESCRIPTION,CONTACT,CREATED_AT,UPDATED_AT,NOTES\n'
      data.infrastructure.forEach(item => {
        csv += `INFRASTRUCTURE,"${item.name}","${item.type}","${item.status}","${item.priority}",${item.coordinates.latitude},${item.coordinates.longitude},"${item.description}","${item.contact || ''}","${item.createdAt}","${item.updatedAt}","${item.notes || ''}"\n`
      })
    }

    return csv
  }

  const convertToGeoJSON = (data: ExportData) => {
    const features: any[] = []

    // Add roads as LineString features
    data.roads.forEach(road => {
      if (road.coordinates && road.coordinates.length > 1) {
        features.push({
          type: 'Feature',
          geometry: {
            type: 'LineString',
            coordinates: road.coordinates.map((coord: any) => [coord.longitude, coord.latitude])
          },
          properties: {
            type: 'road',
            name: road.name,
            roadType: road.type,
            distance: road.distance,
            condition: road.condition,
            startTime: road.startTime,
            endTime: road.endTime,
            notes: road.notes
          }
        })
      }
    })

    // Add infrastructure as Point features
    data.infrastructure.forEach(item => {
      features.push({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [item.coordinates.longitude, item.coordinates.latitude]
        },
        properties: {
          type: 'infrastructure',
          name: item.name,
          infrastructureType: item.type,
          status: item.status,
          priority: item.priority,
          description: item.description,
          contact: item.contact,
          createdAt: item.createdAt,
          updatedAt: item.updatedAt,
          notes: item.notes
        }
      })
    })

    return {
      type: 'FeatureCollection',
      features,
      metadata: {
        exportDate: data.exportDate,
        totalRecords: data.totalRecords,
        roads: data.roads.length,
        infrastructure: data.infrastructure.length
      }
    }
  }

  const getExportDescription = (format: string): string => {
    switch (format) {
      case 'json':
        return 'Complete data export in JSON format. Includes all road recordings and infrastructure with full metadata.'
      case 'csv':
        return 'Spreadsheet-compatible CSV format. Separate sections for roads and infrastructure data.'
      case 'geojson':
        return 'Geographic data format compatible with GIS software like QGIS, ArcGIS, and web mapping libraries.'
      default:
        return 'Export your data in the selected format.'
    }
  }

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full justify-start">
          Export Data
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Export Data</DialogTitle>
          <DialogDescription>
            Export your road recordings and infrastructure data for reporting or backup
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label htmlFor="format" className="text-sm font-medium">
              Export Format
            </label>
            <Select value={exportFormat} onValueChange={setExportFormat}>
              <SelectTrigger>
                <SelectValue placeholder="Select format" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="json">JSON - Complete Data</SelectItem>
                <SelectItem value="csv">CSV - Spreadsheet</SelectItem>
                <SelectItem value="geojson">GeoJSON - Geographic</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Card className="p-3 bg-blue-50 dark:bg-blue-950/20">
            <p className="text-sm text-blue-700 dark:text-blue-300">
              {getExportDescription(exportFormat)}
            </p>
          </Card>

          <div className="flex justify-end space-x-2 pt-2">
            <Button 
              variant="outline" 
              onClick={() => setIsDialogOpen(false)}
              disabled={isExporting}
            >
              Cancel
            </Button>
            <Button 
              onClick={exportData}
              disabled={isExporting}
            >
              {isExporting ? 'Exporting...' : `Export ${exportFormat.toUpperCase()}`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}