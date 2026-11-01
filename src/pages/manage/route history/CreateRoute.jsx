import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import {
  MapContainer,
  Marker,
  Polyline,
  TileLayer,
  Tooltip,
  useMapEvents,
} from 'react-leaflet'
import L from 'leaflet'
import { useAuth } from '../../../context/useAuth'
import { teamManageApi } from '../../../services/teamManageApi'

// ─── Fix default leaflet marker icons (Vite asset pipeline) ──────────────────
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

// ─── Coloured circle-letter markers ──────────────────────────────────────────
const makeCircleIcon = (color, label) =>
  L.divIcon({
    className: '',
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    html: `<div style="
      width:30px;height:30px;border-radius:50%;
      background:${color};border:2px solid #fff;
      box-shadow:0 1px 4px rgba(0,0,0,.4);
      display:flex;align-items:center;justify-content:center;
      color:#fff;font-weight:700;font-size:13px;
      font-family:sans-serif;">
      ${label}
    </div>`,
  })

const startIcon  = makeCircleIcon('#22a651', 'S')
const endIcon    = makeCircleIcon('#e53935', 'E')
const pinIcon    = (n) => makeCircleIcon('#444', n)

// ─── Mock initial waypoints (mirror what AI OCR would return) ─────────────────
const MOCK_WAYPOINTS = [
  { id: 'w1', name: 'US-20 S',    lat: 41.605, lng: -93.695 },
  { id: 'w2', name: 'I-29',       lat: 41.567, lng: -93.694 },
  { id: 'w3', name: 'Exit 63A-B', lat: 41.549, lng: -93.70  },
  { id: 'w4', name: 'Exit 63B',   lat: 41.541, lng: -93.70  },
  { id: 'w5', name: 'I-94 W',     lat: 41.525, lng: -93.695 },
  { id: 'w6', name: 'Exit 340',   lat: 41.499, lng: -93.69  },
]

// ─── Map click handler (inner component) ─────────────────────────────────────
const MapClickHandler = ({ onMapClick }) => {
  useMapEvents({ click: onMapClick })
  return null
}

// ─── OSRM road-path fetcher ───────────────────────────────────────────────────
async function fetchRoadPath(points) {
  if (points.length < 2) return []
  const coords = points.map((p) => `${p.lng},${p.lat}`).join(';')
  try {
    const res = await fetch(
      `https://router.project-osrm.org/route/v1/driving/${coords}?overview=full&geometries=geojson`,
    )
    const data = await res.json()
    if (data.routes?.[0]) {
      return data.routes[0].geometry.coordinates.map(([lng, lat]) => [lat, lng])
    }
  } catch { /* silent – fall back to straight lines */ }
  return points.map((p) => [p.lat, p.lng])
}

// ─── Nominatim geocoder ───────────────────────────────────────────────────────
async function geocodePlace(query) {
  const res = await fetch(
    `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`,
  )
  const data = await res.json()
  if (data[0]) return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon), label: data[0].display_name }
  return null
}

// ─────────────────────────────────────────────────────────────────────────────
const CreateRoute = () => {
  const navigate  = useNavigate()
  const [searchParams] = useSearchParams()
  const { accessToken } = useAuth()
  const driverUserId = searchParams.get('user_id') || ''
  const driverName = searchParams.get('driver_name') || searchParams.get('user_email') || 'Selected driver'
  const routeHistoryPath = `/dashboard/manage/team-route-history${searchParams.toString() ? `?${searchParams.toString()}` : ''}`

  // Step 1 state
  const [step, setStep]                 = useState(1)
  const [routeName, setRouteName]       = useState('')
  const [permitText, setPermitText]     = useState('')
  const [permitFile, setPermitFile]     = useState(null)
  const [startInput, setStartInput]     = useState('')
  const [endInput, setEndInput]         = useState('')
  const [locationTarget, setLocationTarget] = useState('start')
  const [startPoint, setStartPoint]     = useState(null)   // { lat, lng }
  const [endPoint, setEndPoint]         = useState(null)   // { lat, lng }
  const [settingPin, setSettingPin]     = useState(null)   // 'start' | 'end' | null
  const [step1Error, setStep1Error]     = useState('')
  const [geocoding, setGeocoding]       = useState(false)
  const [isSaving, setIsSaving]         = useState(false)
  const [saveMessage, setSaveMessage]   = useState('')
  const [showWaypointExamples, setShowWaypointExamples] = useState(false)
  const [highlightWaypointInput, setHighlightWaypointInput] = useState(false)

  // Step 2 state
  const [permits, setPermits]           = useState([
    { id: 'p1', label: 'Permit 1', waypoints: MOCK_WAYPOINTS },
  ])
  const [routePath, setRoutePath]       = useState([])     // [[lat,lng],…] for polyline
  const fileInputRef                    = useRef(null)
  const waypointHelpRef                 = useRef(null)
  const waypointHighlightTimerRef       = useRef(null)
  const mapRef                          = useRef(null)

  // Default map center (Des Moines, IA as placeholder)
  const defaultCenter = [41.589, -93.62]
  const activeLocationInput = locationTarget === 'start' ? startInput : endInput
  const canContinue = Boolean((permitFile || permitText.trim()) && startPoint && endPoint)

  useEffect(() => {
    if (!showWaypointExamples) return undefined

    const closeWaypointExamples = (event) => {
      if (event.type === 'keydown' && event.key !== 'Escape') return
      if (event.type === 'pointerdown' && waypointHelpRef.current?.contains(event.target)) return
      setShowWaypointExamples(false)
    }

    document.addEventListener('pointerdown', closeWaypointExamples)
    document.addEventListener('keydown', closeWaypointExamples)

    return () => {
      document.removeEventListener('pointerdown', closeWaypointExamples)
      document.removeEventListener('keydown', closeWaypointExamples)
    }
  }, [showWaypointExamples])

  useEffect(() => () => {
    window.clearTimeout(waypointHighlightTimerRef.current)
  }, [])

  const handleWaypointHelp = () => {
    setShowWaypointExamples((visible) => !visible)
    setHighlightWaypointInput(true)
    window.clearTimeout(waypointHighlightTimerRef.current)
    waypointHighlightTimerRef.current = window.setTimeout(() => {
      setHighlightWaypointInput(false)
    }, 2400)
  }

  // ── Fetch road path whenever step-2 waypoints change ─────────────────────
  useEffect(() => {
    if (step !== 2) return
    const allPts = []
    if (startPoint) allPts.push(startPoint)
    permits.forEach((p) => p.waypoints.forEach((w) => allPts.push({ lat: w.lat, lng: w.lng })))
    if (endPoint) allPts.push(endPoint)
    if (allPts.length >= 2) {
      fetchRoadPath(allPts).then(setRoutePath)
    }
  }, [step, startPoint, endPoint, permits])

  // ── Fit map to all markers ────────────────────────────────────────────────
  useEffect(() => {
    if (step !== 2 || !mapRef.current) return
    const allPts = []
    if (startPoint) allPts.push([startPoint.lat, startPoint.lng])
    permits.forEach((p) => p.waypoints.forEach((w) => allPts.push([w.lat, w.lng])))
    if (endPoint) allPts.push([endPoint.lat, endPoint.lng])
    if (allPts.length) {
      mapRef.current.fitBounds(L.latLngBounds(allPts), { padding: [40, 40] })
    }
  }, [step, startPoint, endPoint, permits])

  // ── Map click → set start or end pin ─────────────────────────────────────
  const handleMapClick = useCallback((e) => {
    if (!settingPin) return
    const { lat, lng } = e.latlng
    if (settingPin === 'start') {
      setStartPoint({ lat, lng })
      setStartInput(`${lat.toFixed(5)}, ${lng.toFixed(5)}`)
      setLocationTarget('end')
    } else {
      setEndPoint({ lat, lng })
      setEndInput(`${lat.toFixed(5)}, ${lng.toFixed(5)}`)
    }
    setStep1Error('')
    setSettingPin(null)
  }, [settingPin])

  // ── Geocode start/end inputs and set pins ─────────────────────────────────
  const handleSetLocationPoint = async () => {
    const target = locationTarget
    const query = activeLocationInput.trim()
    if (!query) {
      setStep1Error(`Please enter a ${target} location.`)
      return
    }

    setGeocoding(true)
    setStep1Error('')
    try {
      const result = await geocodePlace(query)
      if (!result) {
        setStep1Error(`Could not geocode ${target} location. Try clicking on the map instead.`)
        return
      }

      const point = { lat: result.lat, lng: result.lng }
      if (target === 'start') {
        setStartPoint(point)
        setLocationTarget('end')
      } else {
        setEndPoint(point)
      }
      setSettingPin(null)
    } catch {
      setStep1Error(`Could not geocode ${target} location. Try clicking on the map instead.`)
    } finally {
      setGeocoding(false)
    }
  }

  const handlePointDrag = useCallback((target, event) => {
    const { lat, lng } = event.target.getLatLng()
    const point = { lat, lng }
    const coordinates = `${lat.toFixed(5)}, ${lng.toFixed(5)}`

    if (target === 'start') {
      setStartPoint(point)
      setStartInput(coordinates)
    } else {
      setEndPoint(point)
      setEndInput(coordinates)
    }
  }, [])

  // ── Step 1 → Step 2 ───────────────────────────────────────────────────────
  const handleContinue = () => {
    if (!routeName.trim())           { setStep1Error('Please enter a route name.'); return }
    if (!permitText && !permitFile)  { setStep1Error('Please enter permit waypoints or upload a permit file.'); return }
    if (!startPoint)                 { setStep1Error('Please set a start point.'); return }
    if (!endPoint)                   { setStep1Error('Please set an end point.'); return }
    setStep1Error('')
    // Mock: parse permit text into first-permit waypoints if entered
    if (permitText.trim()) {
      const names = permitText.split(',').map((s) => s.trim()).filter(Boolean)
      const baseCenter = startPoint ?? { lat: defaultCenter[0], lng: defaultCenter[1] }
      const mocked = names.map((name, i) => ({
        id: `wp-${i}`,
        name,
        lat: baseCenter.lat - i * 0.02,
        lng: baseCenter.lng + i * 0.015,
      }))
      setPermits([{ id: 'p1', label: 'Permit 1', waypoints: mocked.length ? mocked : MOCK_WAYPOINTS }])
    }
    setStep(2)
  }

  // ── Step 2: waypoint CRUD ─────────────────────────────────────────────────
  const updateWaypoint = (permitId, wpId, name) => {
    setPermits((prev) =>
      prev.map((p) =>
        p.id !== permitId ? p
          : { ...p, waypoints: p.waypoints.map((w) => w.id === wpId ? { ...w, name } : w) },
      ),
    )
  }

  const removeWaypoint = (permitId, wpId) => {
    setPermits((prev) =>
      prev.map((p) =>
        p.id !== permitId ? p
          : { ...p, waypoints: p.waypoints.filter((w) => w.id !== wpId) },
      ),
    )
  }

  const addWaypoint = (permitId) => {
    const last = permits.find((p) => p.id === permitId)?.waypoints.at(-1)
    const newPt = {
      id: `wp-${Date.now()}`,
      name: '',
      lat: last ? last.lat - 0.01 : defaultCenter[0],
      lng: last ? last.lng + 0.008 : defaultCenter[1],
    }
    setPermits((prev) =>
      prev.map((p) => p.id !== permitId ? p : { ...p, waypoints: [...p.waypoints, newPt] }),
    )
  }

  const addPermit = () => {
    const lastPermit  = permits.at(-1)
    const lastWp      = lastPermit?.waypoints.at(-1)
    const newStart    = lastWp ?? { lat: defaultCenter[0], lng: defaultCenter[1] }
    setPermits((prev) => [
      ...prev,
      {
        id: `p${Date.now()}`,
        label: `Permit ${prev.length + 1}`,
        waypoints: [
          { id: `wp-${Date.now()}`, name: 'New Start', lat: newStart.lat - 0.01, lng: newStart.lng },
          { id: `wp-${Date.now() + 1}`, name: 'New End', lat: newStart.lat - 0.03, lng: newStart.lng },
        ],
      },
    ])
  }

  // ── Map: add/delete pin via buttons ──────────────────────────────────────
  const handleAddPin = () => {
    // Add a new checkpoint after the last waypoint of the first permit
    addWaypoint(permits[0]?.id)
  }

  const handleDeletePin = () => {
    // Remove last waypoint of first permit
    const p = permits[0]
    if (!p || p.waypoints.length <= 1) return
    const lastId = p.waypoints.at(-1).id
    removeWaypoint(p.id, lastId)
  }

  // ── Save ──────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!driverUserId) {
      setStep1Error('Please open route creation from a team user row.')
      return
    }
    if (!routeName.trim() || !startPoint || !endPoint) {
      setStep1Error('Please provide route name, start point, and end point.')
      return
    }

    setIsSaving(true)
    setStep1Error('')
    setSaveMessage('')

    try {
      const allRouteWaypoints = permits.flatMap((permit) => permit.waypoints)
      const response = await teamManageApi.createDriverRoute(accessToken, driverUserId, {
        name: routeName.trim(),
        description: '',
        start_location: startInput.trim() || 'Start',
        start_latitude: startPoint.lat,
        start_longitude: startPoint.lng,
        end_location: endInput.trim() || allRouteWaypoints.at(-1)?.name || 'End',
        end_latitude: endPoint.lat,
        end_longitude: endPoint.lng,
        permit_text: permitText.trim() || null,
        waypoints: allRouteWaypoints.map((waypoint, index) => ({
          index: index + 1,
          name: waypoint.name || `Waypoint ${index + 1}`,
          waypoint_type: 'CHECKPOINT',
          latitude: waypoint.lat,
          longitude: waypoint.lng,
          description: null,
          eta_minutes: 0,
        })),
      })

      setSaveMessage(response?.message || 'Route created successfully.')
      window.setTimeout(() => navigate(routeHistoryPath), 700)
    } catch (error) {
      setStep1Error(error.message || 'Unable to create route.')
    } finally {
      setIsSaving(false)
    }
  }

  // ── All map points for step-2 rendering ──────────────────────────────────
  const allWaypoints = permits.flatMap((p) => p.waypoints)

  if (!driverUserId) {
    return (
      <main className="min-h-full px-2 py-2 text-[#888] md:px-6 md:py-4">
        <h1 className="mb-5 text-xl font-normal text-[#999] md:text-2xl">Create route</h1>
        <div className="max-w-2xl rounded-lg border border-[#f2c4ad] bg-[#fff7f2] px-5 py-4">
          <h2 className="text-base font-semibold text-[#333]">Select a driver before creating a route</h2>
          <p className="mt-2 text-[13px] leading-5 text-[#666]">
            Open Team Users and choose the route-history icon beside a driver. Their driver ID will then be attached to the new route.
          </p>
          <button
            type="button"
            onClick={() => navigate('/dashboard/manage/team-users')}
            className="mt-4 rounded bg-[#ff823d] px-4 py-2 text-[13px] font-semibold text-white transition hover:bg-[#e56f2d] cursor-pointer"
          >
            Select Driver
          </button>
        </div>
      </main>
    )
  }

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <main className="min-h-full px-2 py-2 text-[#888] md:px-6 md:py-4">
      {/* Page title */}
      <h1 className="mb-1 text-xl font-normal text-[#999] md:text-2xl">
        Create route – step {step}
      </h1>

      {/* Back link */}
      <button
        type="button"
        onClick={() => step === 1 ? navigate(routeHistoryPath) : setStep(1)}
        className="mb-5 inline-flex items-center gap-1 text-[13px] font-medium text-[#ff823d] cursor-pointer"
      >
        <span className="text-lg">&lt;</span>
        <span>{step === 1 ? "Driver's route history" : 'Back to step 1'}</span>
      </button>

      <h2 className="mb-4 text-base font-bold text-[#111]">
        New Route for: <span className="font-bold">{driverName}</span>
      </h2>

      {/* ═══════════════════════════════ STEP 1 ════════════════════════════ */}
      {step === 1 && (
        <div className="flex flex-col gap-4">
          {/* Top 3-column row matching mockup exactly */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3 items-start">
            {/* Column 1: Enter Route Name */}
            <div>
              <label className="mb-1.5 flex items-center text-[14px] font-bold text-[#111]">
                <span>Enter Route Name</span>
                <span
                  title="Enter a route name"
                  className="ml-1.5 inline-flex h-3.5 w-3.5 cursor-help items-center justify-center rounded-[2px] bg-[#606060] text-[10px] font-bold text-white select-none"
                >
                  ?
                </span>
              </label>
              <input
                type="text"
                value={routeName}
                onChange={(e) => setRouteName(e.target.value)}
                className="h-8 w-full rounded-[4px] border border-[#ccc] bg-white px-2.5 text-[13px] text-[#333] outline-none focus:border-[#eb7035]"
              />
              <p className="mt-2 text-[12px] font-bold text-[#8a1c14] leading-tight">
                NOTE: Only one permit can be processed at a time.
              </p>
            </div>

            {/* Column 2: Step 1 - Input Permit */}
            <div>
              <label className="mb-1.5 flex items-center text-[14px] font-bold text-[#111]">
                <span>Step 1 - Input Permit</span>
                <span
                  title="Upload a permit document or type comma-separated waypoints"
                  className="ml-1.5 inline-flex h-3.5 w-3.5 cursor-help items-center justify-center rounded-[2px] bg-[#606060] text-[10px] font-bold text-white select-none"
                >
                  ?
                </span>
              </label>

              {/* Orange icon buttons */}
              <div ref={waypointHelpRef} className="relative mb-2 flex items-center gap-2">
                {/* Document / Permit file upload */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  title="Upload permit file (PDF/Image)"
                  className="flex h-8 w-8 items-center justify-center rounded-[4px] bg-[#eb7035] text-white shadow-sm transition hover:bg-[#d85f24] cursor-pointer"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="12" y1="18" x2="12" y2="12" />
                    <polyline points="9 15 12 18 15 15" />
                  </svg>
                </button>

                {/* Waypoint examples / manual entry helper */}
                <button
                  type="button"
                  onClick={handleWaypointHelp}
                  title="Show waypoint entry examples"
                  aria-label="Show waypoint entry examples"
                  aria-expanded={showWaypointExamples}
                  aria-controls="waypoint-entry-examples"
                  className={`flex h-8 w-8 items-center justify-center rounded-[4px] text-white shadow-sm transition cursor-pointer ${
                    showWaypointExamples ? 'bg-[#c94f18]' : 'bg-[#eb7035] hover:bg-[#d85f24]'
                  }`}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M12 20h9" />
                    <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
                  </svg>
                </button>

                {showWaypointExamples && (
                  <div
                    id="waypoint-entry-examples"
                    role="dialog"
                    aria-label="Waypoint entry examples"
                    className="absolute left-0 top-[calc(100%+50px)] z-[1000] w-[min(360px,calc(100vw-3rem))] rounded-[12px] border border-[#e4e4e4] bg-white px-4 py-3.5 text-[14px] leading-6 text-[#aaa] shadow-[0_12px_35px_rgba(0,0,0,0.24)]"
                  >
                    <button
                      type="button"
                      onClick={() => setShowWaypointExamples(false)}
                      aria-label="Close waypoint examples"
                      className="absolute right-2 top-1.5 flex h-7 w-7 cursor-pointer items-center justify-center rounded-full text-lg text-[#999] hover:bg-[#f3f3f3] hover:text-[#555]"
                    >
                      x
                    </button>
                    <p className="pr-7">Example:</p>
                    <ul aria-label="Example waypoints">
                      <li>IA-9 EB</li>
                      <li>US-18 SB</li>
                      <li>IA-4 SB</li>
                      <li>IA-3 EB</li>
                      <li>US-69 NB</li>
                      <li>B62 at Quail Ave</li>
                    </ul>
                    <span className="absolute -top-2 left-9 h-4 w-4 rotate-45 border-l border-t border-[#e4e4e4] bg-white" />
                  </div>
                )}

                {permitFile && (
                  <span className="max-w-[140px] truncate rounded bg-gray-100 px-1.5 py-0.5 text-[11px] font-medium text-[#444]">
                    📄 {permitFile.name}
                  </span>
                )}
              </div>

              {/* Hidden file inputs */}
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,image/*,.txt"
                className="hidden"
                onChange={(e) => setPermitFile(e.target.files[0] ?? null)}
              />
              {/* Waypoints input */}
              <input
                type="text"
                value={permitText}
                onChange={(e) => setPermitText(e.target.value)}
                placeholder="Type in a waypoints, comma separated."
                aria-describedby={showWaypointExamples ? 'waypoint-entry-examples' : undefined}
                className={`h-8 w-full rounded-[4px] border bg-white px-2.5 text-[13px] text-[#333] placeholder:text-[#999] outline-none transition-[border-color,box-shadow,background-color] duration-300 focus:border-[#eb7035] ${
                  highlightWaypointInput
                    ? 'border-[#eb7035] bg-[#fff8f3] shadow-[0_0_0_4px_rgba(235,112,53,0.28)]'
                    : 'border-[#ccc]'
                }`}
              />
            </div>

            {/* Column 3: Step 2 - Set Start and End Points */}
            <div>
              <label className="mb-1.5 flex items-center text-[14px] font-bold text-[#111]">
                <span>Step 2 - Set Start and End Points</span>
                <span
                  title="Enter location address or click on the map to set points"
                  className="ml-1.5 inline-flex h-3.5 w-3.5 cursor-help items-center justify-center rounded-[2px] bg-[#606060] text-[10px] font-bold text-white select-none"
                >
                  ?
                </span>
              </label>

              {/* Location input */}
              <input
                type="text"
                value={activeLocationInput}
                onChange={(e) => {
                  if (locationTarget === 'start') setStartInput(e.target.value)
                  else setEndInput(e.target.value)
                }}
                onKeyDown={(e) => e.key === 'Enter' && handleSetLocationPoint()}
                placeholder={`Enter ${locationTarget} location or move pin on map.`}
                aria-label={`${locationTarget === 'start' ? 'Start' : 'End'} location`}
                className="h-8 w-full rounded-[4px] border border-[#ccc] bg-white px-2.5 text-[13px] text-[#333] placeholder:text-[#999] outline-none focus:border-[#eb7035]"
              />

              {/* Set active Start / End Point button */}
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleSetLocationPoint}
                  disabled={geocoding}
                  className="inline-flex h-8 items-center justify-center rounded-[4px] bg-[#eb7035] px-3.5 text-[13px] font-bold text-white shadow-sm transition hover:bg-[#d85f24] cursor-pointer disabled:opacity-60"
                >
                  {geocoding ? 'Setting...' : `Set ${locationTarget === 'start' ? 'Start' : 'End'} Point`}
                </button>

                <button
                  type="button"
                  onClick={() => setSettingPin(settingPin === locationTarget ? null : locationTarget)}
                  className={`text-[11px] underline cursor-pointer ${settingPin === locationTarget ? 'text-[#eb7035] font-semibold' : 'text-[#666]'}`}
                >
                  {settingPin === locationTarget
                    ? `Click map for ${locationTarget === 'start' ? 'Start' : 'End'} pin...`
                    : 'Or click map'}
                </button>
              </div>

              {/* Start & End Status feedback */}
              <div className="mt-1 flex flex-col gap-0.5 text-[11px]">
                {startPoint && (
                  <span className="font-medium text-green-700">
                    ✓ Start: {startPoint.lat.toFixed(4)}, {startPoint.lng.toFixed(4)}
                  </span>
                )}
                {endPoint ? (
                  <span className="font-medium text-red-600">
                    ✓ End: {endPoint.lat.toFixed(4)}, {endPoint.lng.toFixed(4)}
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setLocationTarget('end')
                      setSettingPin(settingPin === 'end' ? null : 'end')
                    }}
                    className={`text-left underline cursor-pointer ${settingPin === 'end' ? 'text-[#eb7035] font-semibold' : 'text-[#777]'}`}
                  >
                    {settingPin === 'end' ? '📍 Click map for End pin…' : '+ Click map to place End pin'}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Error message */}
          {step1Error && (
            <p className="text-[13px] font-medium text-[#e53935]">{step1Error}</p>
          )}

          {/* Map */}
          <div
            className={`relative overflow-hidden rounded border border-[#ddd] ${
              settingPin === 'start'
                ? 'cursor-pin-start'
                : settingPin === 'end'
                ? 'cursor-pin-end'
                : ''
            }`}
            style={{ height: 480 }}
          >
            {settingPin && (
              <div className="pointer-events-none absolute inset-x-0 top-2 z-[500] flex justify-center">
                <span className="rounded bg-black/70 px-3 py-1 text-[12px] font-semibold text-white">
                  Click on the map to place the {settingPin === 'start' ? 'Start' : 'End'} pin
                </span>
              </div>
            )}
            <MapContainer
              center={startPoint ? [startPoint.lat, startPoint.lng] : defaultCenter}
              zoom={13}
              style={{ height: '100%', width: '100%' }}
              ref={mapRef}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              />
              <MapClickHandler onMapClick={handleMapClick} />
              {startPoint && (
                <Marker
                  position={[startPoint.lat, startPoint.lng]}
                  icon={startIcon}
                  draggable
                  eventHandlers={{ dragend: (event) => handlePointDrag('start', event) }}
                >
                  <Tooltip permanent direction="top" offset={[0, -16]}>Start</Tooltip>
                </Marker>
              )}
              {endPoint && (
                <Marker
                  position={[endPoint.lat, endPoint.lng]}
                  icon={endIcon}
                  draggable
                  eventHandlers={{ dragend: (event) => handlePointDrag('end', event) }}
                >
                  <Tooltip permanent direction="top" offset={[0, -16]}>End</Tooltip>
                </Marker>
              )}
            </MapContainer>
          </div>

          {/* Continue */}
          <div className="flex justify-center pt-2 pb-4">
            <button
              type="button"
              onClick={handleContinue}
              className={`rounded-full px-16 py-2.5 text-sm font-semibold tracking-wide text-white transition cursor-pointer ${
                canContinue
                  ? 'bg-[#eb7035] hover:bg-[#d85f24]'
                  : 'bg-[#888] hover:bg-[#666]'
              }`}
            >
              CONTINUE
            </button>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════ STEP 2 ════════════════════════════ */}
      {step === 2 && (
        <div className="flex flex-col gap-4">
          {/* Route name */}
          <div>
            <label className="mb-1 block text-[13px] font-semibold text-[#333]">Route Name</label>
            <input
              type="text"
              value={routeName}
              onChange={(e) => setRouteName(e.target.value)}
              className="h-8 w-64 border border-[#ccc] px-2 text-[13px] text-[#444] outline-none focus:border-[#ff823d]"
            />
          </div>

          {/* Map + Edit Waypoints side-by-side */}
          <div className="flex flex-col gap-4 xl:flex-row">
            {/* Map */}
            <div className="flex flex-col min-w-0 flex-1">
              <div
                className="relative overflow-hidden rounded border border-[#ddd]"
                style={{ height: 460 }}
              >
                <MapContainer
                  center={defaultCenter}
                  zoom={12}
                  style={{ height: '100%', width: '100%' }}
                  ref={mapRef}
                >
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  />

                  {/* Road path polyline */}
                  {routePath.length > 1 && (
                    <Polyline positions={routePath} color="#ff823d" weight={4} opacity={0.85} />
                  )}

                  {/* Start marker */}
                  {startPoint && (
                    <Marker
                      position={[startPoint.lat, startPoint.lng]}
                      icon={startIcon}
                      draggable
                      eventHandlers={{ dragend: (event) => handlePointDrag('start', event) }}
                    >
                      <Tooltip permanent direction="top" offset={[0, -16]}>Start</Tooltip>
                    </Marker>
                  )}

                  {/* Intermediate waypoint markers */}
                  {allWaypoints.map((wp, idx) => (
                    <Marker
                      key={wp.id}
                      position={[wp.lat, wp.lng]}
                      icon={pinIcon(idx + 1)}
                    >
                      <Tooltip direction="top" offset={[0, -16]}>{wp.name || `Waypoint ${idx + 1}`}</Tooltip>
                    </Marker>
                  ))}

                  {/* End marker */}
                  {endPoint && (
                    <Marker
                      position={[endPoint.lat, endPoint.lng]}
                      icon={endIcon}
                      draggable
                      eventHandlers={{ dragend: (event) => handlePointDrag('end', event) }}
                    >
                      <Tooltip permanent direction="top" offset={[0, -16]}>End</Tooltip>
                    </Marker>
                  )}
                </MapContainer>
              </div>

              {/* Map control buttons */}
              <div className="mt-2 flex items-center justify-between">
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleAddPin}
                    className="rounded bg-[#ff823d] px-3 py-1.5 text-[12px] font-semibold text-white hover:bg-[#e56f2d] cursor-pointer"
                  >
                    Add Pin
                  </button>
                  <button
                    type="button"
                    onClick={handleDeletePin}
                    className="rounded bg-[#555] px-3 py-1.5 text-[12px] font-semibold text-white hover:bg-[#333] cursor-pointer"
                  >
                    Delete Pin
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    // Re-fetch road path
                    const allPts = []
                    if (startPoint) allPts.push(startPoint)
                    permits.forEach((p) => p.waypoints.forEach((w) => allPts.push({ lat: w.lat, lng: w.lng })))
                    if (endPoint) allPts.push(endPoint)
                    fetchRoadPath(allPts).then(setRoutePath)
                  }}
                  className="rounded bg-[#22a651] px-3 py-1.5 text-[12px] font-semibold text-white hover:bg-[#1a8040] cursor-pointer"
                >
                  Update Map
                </button>
              </div>
            </div>

            {/* Edit Waypoints panel */}
            <div
              className="flex w-full flex-col xl:w-72"
              style={{ maxHeight: 520 }}
            >
              <div className="mb-2 flex items-center gap-2">
                <h3 className="text-[13px] font-bold text-[#333]">Edit Waypoints</h3>
                <span className="inline-flex h-4 w-4 cursor-default items-center justify-center rounded-full bg-[#bbb] text-[10px] text-white">?</span>
              </div>

              <div className="flex-1 overflow-y-auto pr-1">
                {permits.map((permit) => (
                  <div key={permit.id} className="mb-4">
                    {/* Permit header */}
                    <div className="mb-2 flex items-center gap-2">
                      <span className="text-[12px] font-bold text-[#333]">{permit.label}</span>
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#ff823d] text-[10px] font-bold text-white">
                        A
                      </span>
                    </div>

                    {/* Waypoint list */}
                    <div className="space-y-1.5">
                      {permit.waypoints.map((wp, idx) => {
                        const isFirst = idx === 0
                        const isLast  = idx === permit.waypoints.length - 1
                        return (
                          <div key={wp.id} className="flex items-center gap-1">
                            {/* Reorder/add button placeholder */}
                            <button
                              type="button"
                              onClick={() => addWaypoint(permit.id)}
                              title="Insert waypoint below"
                              className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-[#ddd] text-[14px] font-bold text-[#555] hover:bg-[#bbb] cursor-pointer"
                            >
                              +
                            </button>

                            <input
                              type="text"
                              value={wp.name}
                              onChange={(e) => updateWaypoint(permit.id, wp.id, e.target.value)}
                              className={`h-7 flex-1 rounded border px-2 text-[12px] text-[#333] outline-none focus:border-[#ff823d] ${
                                isFirst
                                  ? 'border-[#22a651] bg-[#eafaf1]'
                                  : isLast
                                  ? 'border-[#888] bg-[#f0f0f0]'
                                  : 'border-[#ccc] bg-white'
                              }`}
                            />

                            {/* Delete button (not on first/last) */}
                            {!isFirst && !isLast ? (
                              <button
                                type="button"
                                onClick={() => removeWaypoint(permit.id, wp.id)}
                                className="flex h-5 w-5 flex-shrink-0 items-center justify-center text-[#e53935] hover:text-[#c62828] cursor-pointer"
                                title="Remove waypoint"
                              >
                                ✕
                              </button>
                            ) : (
                              <span className="w-5 flex-shrink-0" />
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ))}

                {/* Add Permit button */}
                <button
                  type="button"
                  onClick={addPermit}
                  className="mt-2 rounded bg-[#ff823d] px-3 py-1.5 text-[12px] font-semibold text-white hover:bg-[#e56f2d] cursor-pointer"
                >
                  Add Permit {permits.length + 1}
                </button>
              </div>
            </div>
          </div>

          {/* SAVE */}
          <div className="flex justify-center py-4">
            {saveMessage && (
              <span className="text-[13px] font-semibold text-green-600">{saveMessage}</span>
            )}
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="rounded-full bg-[#22a651] px-20 py-2.5 text-sm font-bold tracking-widest text-white transition hover:bg-[#1a8040] cursor-pointer"
            >
              {isSaving ? 'SAVING...' : 'SAVE'}
            </button>
          </div>
        </div>
      )}
    </main>
  )
}

export default CreateRoute
