/**
 * TravelsMap — D3-powered world map (no tiles, no external map libraries).
 *
 * Props:
 *   markers       – array of { id, label, lat, lng, photos }
 *   onMarkerClick – called with the clicked marker object
 */
import {
  useRef, useState, useEffect, useMemo, useCallback, type RefObject,
} from 'react'
import { geoNaturalEarth1, geoPath, geoGraticule } from 'd3-geo'
import { zoom as d3zoom, zoomIdentity } from 'd3-zoom'
import { select } from 'd3-selection'
import 'd3-transition'
import type { ZoomTransform, ZoomBehavior } from 'd3-zoom'
import type { D3ZoomEvent } from 'd3-zoom'
import * as topojson from 'topojson-client'
import type { Topology, GeometryCollection } from 'topojson-specification'
import { COUNTRY_NAMES } from '../data/countryNames'
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

/* ─── Constants ──────────────────────────────────────────────── */
const GEO_URL     = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json'
const ASPECT      = 0.5          // height = width × ASPECT  (Natural Earth ≈ 2:1)
const SCALE_MIN   = 1
const SCALE_MAX   = 8
const HEADER_H    = 41           // px — keep in sync with .tmap-header CSS height

/* Light (vintage atlas) and dark (Kanagawa-wave) palettes */
const PALETTE = {
  light: {
    ocean:         '#A8BFC9',
    sphere:        '#93AFBA',
    graticule:     'rgba(0,0,0,0.07)',
    land:          '#DDD5BC',
    landHover:     '#C9C0A8',
    border:        '#B5A88A',
    markerFill:    '#7A4F2A',
    markerRing:    '#5A3318',
    markerGlow:    'rgba(122,79,42,0.25)',
    labelBg:       'rgba(242,236,188,0.92)',
    labelBorder:   '#C5B97D',
    labelText:     '#1F1F28',
    headerBg:      'rgba(231,222,187,1)',
    headerBorder:  '#D5CA8D',
    controlBg:     'transparent',
    controlBorder: '#C5B97D',
    controlText:   '#8A8980',
    divider:       '#C5B97D',
    counter:       '#8A8980',
  },
  dark: {
    ocean:         '#0C0C18',
    sphere:        '#111120',
    graticule:     'rgba(255,255,255,0.04)',
    land:          '#212130',
    landHover:     '#2C2C40',
    border:        '#141420',
    markerFill:    '#C0A36E',
    markerRing:    '#8A7045',
    markerGlow:    'rgba(192,163,110,0.30)',
    labelBg:       'rgba(22,22,29,0.95)',
    labelBorder:   '#363646',
    labelText:     '#DCD7BA',
    headerBg:      'rgba(22,22,29,1)',
    headerBorder:  '#2A2A37',
    controlBg:     'transparent',
    controlBorder: '#363646',
    controlText:   '#727169',
    divider:       '#363646',
    counter:       '#727169',
  },
}

/* ─── Small SVG icons ────────────────────────────────────────── */
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

/* ─── useTheme ───────────────────────────────────────────────── */
function useTheme(): 'dark' | 'light' {
  const [theme, setTheme] = useState<'dark' | 'light'>(
    () => (document.documentElement.getAttribute('data-theme') ?? 'dark') as 'dark' | 'light',
  )
  useEffect(() => {
    const mo = new MutationObserver(() => {
      setTheme((document.documentElement.getAttribute('data-theme') ?? 'dark') as 'dark' | 'light')
    })
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
    return () => mo.disconnect()
  }, [])
  return theme
}

/* ─── useDimensions ──────────────────────────────────────────── */
function useDimensions(ref: RefObject<HTMLDivElement | null>): { w: number; h: number } {
  const [dims, setDims] = useState({ w: 860, h: 430 })
  useEffect(() => {
    if (!ref.current) return
    const ro = new ResizeObserver(entries => {
      const w = entries[0].contentRect.width
      if (w > 0) setDims({ w, h: Math.round(w * ASPECT) })
    })
    ro.observe(ref.current)
    return () => ro.disconnect()
  }, [ref])
  return dims
}

/* ─── Component ──────────────────────────────────────────────── */
export default function TravelsMap({ markers = [], onMarkerClick }: Props) {
  const wrapRef   = useRef<HTMLDivElement>(null)    // fullscreen target
  const canvasRef = useRef<HTMLDivElement>(null)    // canvas area (below header)
  const svgRef    = useRef<SVGSVGElement>(null)

  const theme     = useTheme()
  const { w, h }  = useDimensions(canvasRef)
  const p         = PALETTE[theme]

  const [xform, setXform]       = useState<ZoomTransform>(zoomIdentity)
  const [hovered, setHovered]   = useState<string | null>(null)   // ISO numeric id
  const [fullscreen, setFs]     = useState(false)
  const [countries, setCountries] = useState<GeoJSON.Feature[]>([])

  const zoomBhv = useRef<ZoomBehavior<SVGSVGElement, unknown> | null>(null)

  /* Sync fullscreen state with browser (handles Esc key) */
  useEffect(() => {
    const fn = () => setFs(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', fn)
    return () => document.removeEventListener('fullscreenchange', fn)
  }, [])

  const toggleFs = useCallback(async () => {
    if (!document.fullscreenElement) await wrapRef.current?.requestFullscreen()
    else await document.exitFullscreen()
  }, [])

  /* Fetch world TopoJSON once */
  useEffect(() => {
    fetch(GEO_URL)
      .then(r => r.json())
      .then((topo: Topology<{ countries: GeometryCollection }>) => {
        const fc = topojson.feature(topo, topo.objects.countries) as GeoJSON.FeatureCollection
        setCountries(fc.features)
      })
      .catch(console.error)
  }, [])

  /* Projection — refitted whenever canvas dimensions change */
  const projection = useMemo(
    () => geoNaturalEarth1().fitExtent([[2, 2], [w - 2, h - 2]], { type: 'Sphere' }),
    [w, h],
  )
  const pathGen    = useMemo(() => geoPath(projection), [projection])
  const graticule  = useMemo(() => geoGraticule()(), [])
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const spherePath = useMemo(() => (pathGen as any)({ type: 'Sphere' }) ?? '', [pathGen])
  const gratPath   = useMemo(() => pathGen(graticule) ?? '', [pathGen, graticule])

  /* d3-zoom — re-attached whenever canvas dimensions change */
  useEffect(() => {
    if (!svgRef.current) return

    const zoom = d3zoom<SVGSVGElement, unknown>()
      .scaleExtent([SCALE_MIN, SCALE_MAX])
      .translateExtent([[0, 0], [w, h]])
      .on('zoom', (e: D3ZoomEvent<SVGSVGElement, unknown>) => setXform(e.transform))

    zoomBhv.current = zoom
    const svg = select(svgRef.current)
    svg.call(zoom)
    /* Reset to identity whenever dimensions change */
    svg.call(zoom.transform, zoomIdentity)

    return () => { svg.on('.zoom', null) }
  }, [w, h])

  const zoomIn = useCallback(() => {
    if (!svgRef.current || !zoomBhv.current) return
    select(svgRef.current)
      .transition().duration(280)
      .call(zoomBhv.current.scaleBy, 1.6)
  }, [])

  const zoomOut = useCallback(() => {
    if (!svgRef.current || !zoomBhv.current) return
    select(svgRef.current)
      .transition().duration(280)
      .call(zoomBhv.current.scaleBy, 1 / 1.6)
  }, [])

  /* Convert a marker's lat/lng → current screen [x, y] */
  const markerScreenPos = useCallback(
    (lat: number, lng: number): [number, number] | null => {
      const pos = projection([lng, lat])
      if (!pos) return null
      return [xform.applyX(pos[0]), xform.applyY(pos[1])]
    },
    [projection, xform],
  )

  const hoveredName = hovered ? COUNTRY_NAMES[hovered] : null

  return (
    <div
      ref={wrapRef}
      className={`tmap-outer${fullscreen ? ' tmap-outer--fs' : ''}`}
      style={{ '--tmap-header-bg': p.headerBg, '--tmap-header-border': p.headerBorder } as React.CSSProperties}
    >
      {/* ── Header bar ── */}
      <div className="tmap-header" style={{ borderBottomColor: p.headerBorder, background: p.headerBg }}>
        <span className="tmap-counter" style={{ color: p.counter }}>
          {markers.length === 0
            ? 'no places logged yet'
            : `${markers.length} place${markers.length === 1 ? '' : 's'} logged`}
        </span>
        <div className="tmap-controls">
          <button
            className="tmap-btn"
            onClick={zoomOut}
            aria-label="Zoom out"
            style={{ borderColor: p.controlBorder, color: p.controlText, background: p.controlBg }}
          >−</button>
          <button
            className="tmap-btn"
            onClick={zoomIn}
            aria-label="Zoom in"
            style={{ borderColor: p.controlBorder, color: p.controlText, background: p.controlBg }}
          >+</button>
          <div className="tmap-divider" style={{ background: p.divider }} />
          <button
            className="tmap-btn"
            onClick={toggleFs}
            aria-label="Toggle fullscreen"
            style={{ borderColor: p.controlBorder, color: p.controlText, background: p.controlBg }}
          >
            {fullscreen ? <IconCompress /> : <IconExpand />}
          </button>
        </div>
      </div>

      {/* ── Map canvas ── */}
      <div ref={canvasRef} className="tmap-canvas" style={{ height: fullscreen ? `calc(100vh - ${HEADER_H}px)` : h }}>

        <svg
          ref={svgRef}
          width={w}
          height={fullscreen ? `calc(100vh - ${HEADER_H}px)` : h}
          style={{ display: 'block', cursor: 'grab', userSelect: 'none' }}
        >
          {/* ── Sphere fill (ocean) ── */}
          <path d={spherePath} fill={p.ocean} />

          {/* ── Zoomed/panned group ── */}
          <g transform={xform.toString()}>

            {/* Graticule (lat/lon grid) */}
            <path
              d={gratPath}
              fill="none"
              stroke={p.graticule}
              strokeWidth={0.5}
              vectorEffect="non-scaling-stroke"
            />

            {/* Country fills */}
            {countries.map(geo => {
              const id = String((geo as GeoJSON.Feature & { id?: unknown }).id ?? '')
              return (
                <path
                  key={id || geo.type + Math.random()}
                  d={pathGen(geo) ?? ''}
                  fill={hovered === id ? p.landHover : p.land}
                  stroke={p.border}
                  strokeWidth={0.4}
                  vectorEffect="non-scaling-stroke"
                  onMouseEnter={() => setHovered(id)}
                  onMouseLeave={() => setHovered(null)}
                  style={{ transition: 'fill 0.12s' }}
                />
              )
            })}
          </g>

          {/* ── Sphere outline (drawn on top, outside transformed group so it doesn't scale) ── */}
          <path
            d={spherePath}
            fill="none"
            stroke={p.sphere}
            strokeWidth={1}
          />

          {/* ── Markers — in screen space so radius stays constant at any zoom ── */}
          {markers.map(marker => {
            const pos = markerScreenPos(marker.lat, marker.lng)
            if (!pos) return null
            const [sx, sy] = pos
            return (
              <g
                key={marker.id}
                transform={`translate(${sx},${sy})`}
                onClick={() => onMarkerClick?.(marker)}
                style={{ cursor: 'pointer' }}
              >
                {/* Glow ring */}
                <circle r={10} fill={p.markerGlow} />
                {/* Pin dot */}
                <circle
                  r={5}
                  fill={p.markerFill}
                  stroke={p.markerRing}
                  strokeWidth={1.5}
                />
              </g>
            )
          })}
        </svg>

        {/* ── Hover country label ── */}
        <div
          className={`tmap-tooltip${hoveredName ? ' tmap-tooltip--visible' : ''}`}
          style={{
            background:   p.labelBg,
            borderColor:  p.labelBorder,
            color:        p.labelText,
          }}
        >
          {hoveredName ?? ''}
        </div>
      </div>
    </div>
  )
}
