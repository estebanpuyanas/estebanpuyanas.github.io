/**
 * TravelsMap — MapTiler Dataviz world map powered by MapLibre GL JS.
 *
 * maplibre-gl ships a UMD bundle that is incompatible with every Vite/esbuild
 * pre-bundling strategy (it has "type":"module" in package.json but is not
 * actual ESM). We avoid the entire module system by loading it as a classic
 * <script> tag via Vite's ?url import, which copies the raw file as a static
 * asset (works in dev and production). Once loaded, the UMD factory runs in
 * global scope and sets window.maplibregl normally.
 */
import { useRef, useEffect, useCallback, useState } from 'react'
import type * as MaplibreGL from 'maplibre-gl'
// ?url gives us the asset path without processing the file as an ES module
import maplibreJSUrl  from 'maplibre-gl/dist/maplibre-gl.js?url'
import maplibreCSSUrl from 'maplibre-gl/dist/maplibre-gl.css?url'
import './TravelsMap.css'

/* ─── Types ──────────────────────────────────────────────────── */
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

/* Extend Window so TypeScript knows maplibregl is a global after script load */
declare global {
  interface Window {
    maplibregl: typeof MaplibreGL
  }
}

/* ─── Config ─────────────────────────────────────────────────── */
const API_KEY   = import.meta.env.VITE_MAPTILER_API_KEY as string
const STYLE_URL = `https://api.maptiler.com/maps/dataviz-v4/style.json?key=${API_KEY}`
const MAX_BOUNDS: [[number, number], [number, number]] = [[-180, -85.05], [180, 85.05]]

/* ─── Load maplibre-gl as a classic script (once per page) ──── */
let maplibreLoaded: Promise<void> | null = null

function loadMaplibre(): Promise<void> {
  if (maplibreLoaded) return maplibreLoaded

  maplibreLoaded = new Promise((resolve, reject) => {
    if (window.maplibregl) { resolve(); return }

    // Inject maplibre-gl CSS
    if (!document.querySelector('link[data-maplibre-css]')) {
      const link = document.createElement('link')
      link.rel = 'stylesheet'
      link.href = maplibreCSSUrl
      link.setAttribute('data-maplibre-css', '')
      document.head.appendChild(link)
    }

    // Inject maplibre-gl JS as a classic script (not type="module")
    // so the UMD factory runs in global scope and sets window.maplibregl
    const script = document.createElement('script')
    script.src = maplibreJSUrl
    script.onload  = () => resolve()
    script.onerror = () => reject(new Error('Failed to load maplibre-gl'))
    document.head.appendChild(script)
  })

  return maplibreLoaded
}

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
  const outerRef  = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLDivElement>(null)
  const mapRef    = useRef<MaplibreGL.Map | null>(null)
  const mtMarkers = useRef<MaplibreGL.Marker[]>([])

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

  /* ── Initialise map ─────────────────────────────────────────── */
  useEffect(() => {
    if (!canvasRef.current || mapRef.current) return

    let cancelled = false
    let ro: ResizeObserver | null = null

    // setTimeout(0) is the standard workaround for React 18 StrictMode:
    // StrictMode runs mount→cleanup→remount synchronously. The cleanup fires
    // before this timer, cancelling it, so only the real (second) mount
    // actually initialises the map — avoiding a double WebGL context error.
    const timer = setTimeout(() => {
      if (cancelled || !canvasRef.current) return

      loadMaplibre()
        .then(() => {
          if (cancelled || !canvasRef.current) return

          const map = new window.maplibregl.Map({
            container:          canvasRef.current,
            style:              STYLE_URL,
            center:             [0, 20],
            zoom:               2,
            minZoom:            1.5,
            maxZoom:            10,
            maxBounds:          MAX_BOUNDS,
            renderWorldCopies:  false,
            attributionControl: { compact: true },
          })

          mapRef.current = map

          ro = new ResizeObserver(() => map.resize())
          ro.observe(canvasRef.current!)
        })
        .catch((err) => console.error('[TravelsMap] init failed:', err))
    }, 0)

    return () => {
      cancelled = true
      clearTimeout(timer)
      ro?.disconnect()
      mapRef.current?.remove()
      mapRef.current = null
    }
  }, [])

  /* Resize after fullscreen transitions settle */
  useEffect(() => {
    const t = setTimeout(() => mapRef.current?.resize(), 150)
    return () => clearTimeout(t)
  }, [fullscreen])

  /* ── Sync markers ───────────────────────────────────────────── */
  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    const attach = () => {
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

        const m = new window.maplibregl.Marker({ element: el, anchor: 'center' })
          .setLngLat([data.lng, data.lat])
          .addTo(map)

        mtMarkers.current.push(m)
      })
    }

    if (map.isStyleLoaded()) attach()
    else map.once('load', attach)

    return () => {
      mtMarkers.current.forEach(m => m.remove())
      mtMarkers.current = []
    }
  }, [markers, onMarkerClick])

  /* ── Zoom buttons ───────────────────────────────────────────── */
  const zoomIn  = useCallback(() => mapRef.current?.zoomIn({ duration: 300 }),  [])
  const zoomOut = useCallback(() => mapRef.current?.zoomOut({ duration: 300 }), [])

  return (
    <div ref={outerRef} className={`tmap-outer${fullscreen ? ' tmap-outer--fs' : ''}`}>

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

      <div ref={canvasRef} className="tmap-canvas" />

    </div>
  )
}
