/**
 * TravelsMap — MapTiler SDK world map.
 *
 * Props
 *   markers       { id, label, lat, lng, photos[] }[]
 *   onMarkerClick called when a marker is clicked
 */
import { useRef, useEffect, useCallback, useState } from 'react'
import * as maptilersdk from '@maptiler/sdk'
import '@maptiler/sdk/dist/maptiler-sdk.css'
import './TravelsMap.css'

/* ─── Public types ───────────────────────────────────────────── */
export interface TravelMarker {
  id:     string
  label:  string
  lat:    number
  lng:    number
  photos: string[]
}

interface Props {
  markers?:       TravelMarker[]
  onMarkerClick?: (marker: TravelMarker) => void
}

/* ─── Config ─────────────────────────────────────────────────── */
const API_KEY = import.meta.env.VITE_MAPTILER_API_KEY as string

// MapTiler Dataviz — clean, label-forward cartographic style
const STYLE_URL = `https://api.maptiler.com/maps/dataviz-v4/style.json?key=${API_KEY}`

const MAX_BOUNDS: maptilersdk.LngLatBoundsLike = [[-180, -85.05], [180, 85.05]]

/* ─── Icons ──────────────────────────────────────────────────── */
function IconExpand() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
      <path d="M0 0h4v1.5H1.5V4H0zm8 0h4v4h-1.5V1.5H8zM0 8h1.5v2.5H4V12H0zm10.5 0H12v4H8v-1.5h2.5z"/>
    </svg>
  )
}
function IconCompress() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
      <path d="M4 0v4H0V2.5h2.5V0zm8 4H8V0h1.5v2.5H12zM4 12H2.5V9.5H0V8h4zm8-4v1.5H9.5V12H8V8z"/>
    </svg>
  )
}

/* ─── Component ──────────────────────────────────────────────── */
export default function TravelsMap({ markers = [], onMarkerClick }: Props) {
  const outerRef  = useRef<HTMLDivElement>(null)   // fullscreen target
  const canvasRef = useRef<HTMLDivElement>(null)   // MapTiler mounts here
  const mapRef    = useRef<maptilersdk.Map | null>(null)
  const mtMarkers = useRef<maptilersdk.Marker[]>([])

  const [fullscreen, setFs] = useState(false)

  /* Track browser-level fullscreen (handles Escape key exit) */
  useEffect(() => {
    const fn = () => setFs(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', fn)
    return () => document.removeEventListener('fullscreenchange', fn)
  }, [])

  const toggleFs = useCallback(async () => {
    if (!document.fullscreenElement) await outerRef.current?.requestFullscreen()
    else await document.exitFullscreen()
  }, [])

  /* ── Initialise map (runs once) ────────────────────────────── */
  useEffect(() => {
    if (!canvasRef.current || mapRef.current) return

    maptilersdk.config.apiKey = API_KEY

    const map = new maptilersdk.Map({
      container:          canvasRef.current,
      style:              STYLE_URL,
      center:             [0, 20],
      zoom:               2,
      minZoom:            1.5,
      maxZoom:            10,
      maxBounds:          MAX_BOUNDS,
      renderWorldCopies:  false,
      // Disable built-in controls — we provide our own zoom buttons
      navigationControl:  false,
      geolocateControl:   false,
      // Keep attribution compact (required by OSM licence)
      attributionControl: { compact: true },
    })

    mapRef.current = map

    /* Resize map whenever the canvas div changes size (window resize, etc.) */
    const ro = new ResizeObserver(() => map.resize())
    ro.observe(canvasRef.current)

    return () => {
      ro.disconnect()
      map.remove()
      mapRef.current = null
    }
  }, []) // intentionally empty — map is created once

  /* Resize after fullscreen CSS transitions settle */
  useEffect(() => {
    const t = setTimeout(() => mapRef.current?.resize(), 150)
    return () => clearTimeout(t)
  }, [fullscreen])

  /* ── Sync markers whenever the prop changes ────────────────── */
  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    const attach = () => {
      // Remove any existing markers
      mtMarkers.current.forEach(m => m.remove())
      mtMarkers.current = []

      markers.forEach(data => {
        const el = document.createElement('div')
        el.className = 'tmap-marker-dot'
        el.setAttribute('title', data.label)
        el.addEventListener('click', e => {
          e.stopPropagation()
          onMarkerClick?.(data)
        })

        const m = new maptilersdk.Marker({ element: el, anchor: 'center' })
          .setLngLat([data.lng, data.lat])
          .addTo(map)

        mtMarkers.current.push(m)
      })
    }

    // Map style might not be loaded yet on first render
    if (map.isStyleLoaded()) {
      attach()
    } else {
      map.once('load', attach)
    }

    return () => {
      mtMarkers.current.forEach(m => m.remove())
      mtMarkers.current = []
    }
  }, [markers, onMarkerClick])

  /* ── Zoom buttons ──────────────────────────────────────────── */
  const zoomIn  = useCallback(() => mapRef.current?.zoomIn({ duration: 300 }),  [])
  const zoomOut = useCallback(() => mapRef.current?.zoomOut({ duration: 300 }), [])

  return (
    <div ref={outerRef} className={`tmap-outer${fullscreen ? ' tmap-outer--fs' : ''}`}>

      {/* ── Header ── */}
      <div className="tmap-header">
        <span className="tmap-counter">
          {markers.length === 0
            ? 'no places logged yet'
            : `${markers.length} place${markers.length === 1 ? '' : 's'} logged`}
        </span>
        <div className="tmap-controls">
          <button className="tmap-btn" onClick={zoomOut} aria-label="Zoom out">−</button>
          <button className="tmap-btn" onClick={zoomIn}  aria-label="Zoom in">+</button>
          <div className="tmap-divider" />
          <button className="tmap-btn" onClick={toggleFs} aria-label="Toggle fullscreen">
            {fullscreen ? <IconCompress /> : <IconExpand />}
          </button>
        </div>
      </div>

      {/* ── Map canvas — MapTiler mounts inside this div ── */}
      <div ref={canvasRef} className="tmap-canvas" />

    </div>
  )
}
