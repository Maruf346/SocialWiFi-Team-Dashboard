import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import {
  MapContainer,
  Marker,
  Polyline,
  TileLayer,
  Tooltip,
  useMap,
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

const startIcon = makeCircleIcon('#22a651', 'S')
const endIcon   = makeCircleIcon('#e53935', 'E')
const pinIcon   = (n) => makeCircleIcon('#444', n)

// ─── Helper: Interpolate realistic coordinates between two points ─────────────
// Guarantees waypoints are strictly in the user's intended route region (e.g. Nebraska),
// NEVER placing them in hardcoded Iowa or North Dakota.
const interpolateWaypoints = (start, end, names = []) => {
  if (!start || !end) return []
  const count = names.length ? names.length : 3
  return Array.from({ length: count }, (_, i) => {
    const fraction = (i + 1) / (count + 1)
    const name = names[i]?.trim() || `Waypoint ${i + 1}`
    return {
      id: `wp-${Date.now()}-${i}-${Math.random().toString(36).slice(2, 6)}`,
      name,
      lat: Number((start.lat + (end.lat - start.lat) * fraction).toFixed(6)),
      lng: Number((start.lng + (end.lng - start.lng) * fraction).toFixed(6)),
    }
  })
}

// ─── Map click handler (inner component) ─────────────────────────────────────
const MapClickHandler = ({ onMapClick }) => {
  useMapEvents({ click: onMapClick })
  return null
}

// ─── Map view syncer (inner component) ───────────────────────────────────────
const MapCenterSync = ({ center, shouldSync }) => {
  const map = useMap()
  useEffect(() => {
    if (shouldSync && center && center.length === 2) {
      map.setView(center, 13)
    }
  }, [center, shouldSync, map])
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
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { accessToken } = useAuth()
  const driverUserId = searchParams.get('user_id') || ''
  const driverName = searchParams.get('driver_name') || searchParams.get('user_email') || 'Selected driver'
  const routeHistoryPath = `/dashboard/manage/team-route-history${searchParams.toString() ? `?${searchParams.toString()}` : ''}`

  // Step 1 state
  const [step, setStep]                             = useState(1)
  const [routeName, setRouteName]                   = useState('')
  const [permitText, setPermitText]                 = useState('')
  const [permitFile, setPermitFile]                 = useState(null)
  const [isParsingPermit, setIsParsingPermit]       = useState(false)
  const [startInput, setStartInput]                 = useState('')
  const [endInput, setEndInput]                     = useState('')
  const [locationTarget, setLocationTarget]         = useState('start')
  const [startPoint, setStartPoint]                 = useState(null)   // overall route start
  const [endPoint, setEndPoint]                     = useState(null)     // current active end
  const [settingPin, setSettingPin]                 = useState(null)   // 'start' | 'end' | null
  const [step1Error, setStep1Error]                 = useState('')
  const [geocoding, setGeocoding]                   = useState(false)
  const [isSaving, setIsSaving]                     = useState(false)
  const [saveMessage, setSaveMessage]               = useState('')
  const [showWaypointExamples, setShowWaypointExamples] = useState(false)
  const [highlightWaypointInput, setHighlightWaypointInput] = useState(false)

  // Tutorial overlay modal state
  const [showTutorialOverlay, setShowTutorialOverlay] = useState(() => {
    try {
      return localStorage.getItem('hideCreateRouteTutorial') !== 'true'
    } catch {
      return true
    }
  })
  const [dontShowAgain, setDontShowAgain]             = useState(() => {
    try {
      return localStorage.getItem('hideCreateRouteTutorial') === 'true'
    } catch {
      return false
    }
  })

  const handleCloseTutorial = () => {
    if (dontShowAgain) {
      try {
        localStorage.setItem('hideCreateRouteTutorial', 'true')
      } catch { /* ignore */ }
    }
    setShowTutorialOverlay(false)
  }

  const handleToggleDontShow = (checked) => {
    setDontShowAgain(checked)
    try {
      if (checked) {
        localStorage.setItem('hideCreateRouteTutorial', 'true')
      } else {
        localStorage.removeItem('hideCreateRouteTutorial')
      }
    } catch { /* ignore */ }
  }

  // Multi-permit workflow tracker
  // When addingPermit is non-null, Step 1 operates in "Add Permit N" mode
  const [addingPermit, setAddingPermit]             = useState(null)

  // Step 2 state: multi-permit container
  const [permits, setPermits]                       = useState([])
  const [routePath, setRoutePath]                   = useState([])

  const fileInputRef              = useRef(null)
  const waypointHelpRef           = useRef(null)
  const waypointHighlightTimerRef = useRef(null)
  const mapRef                    = useRef(null)

  // Flag to auto-fit bounds ONCE upon transitioning to Step 2
  // Subsequent pin deletions/additions will NOT trigger fitBounds, preserving zoom level!
  const shouldFitStep2Ref         = useRef(false)

  // Default map center (defaults to current user location, with fallback)
  const [defaultCenter, setDefaultCenter] = useState([41.589, -93.62])
  const [hasDetectedLocation, setHasDetectedLocation] = useState(false)

  // Fetch current user location on mount so map defaults to where the manager/user is located
  useEffect(() => {
    if (typeof window !== 'undefined' && 'geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude
          const lng = position.coords.longitude
          setDefaultCenter([lat, lng])
          setHasDetectedLocation(true)
          if (mapRef.current && !startPoint) {
            mapRef.current.setView([lat, lng], 13)
          }
        },
        (error) => {
          console.warn('Geolocation unavailable or denied:', error.message)
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
      )
    }
  }, [startPoint])

  const activeLocationInput = locationTarget === 'start' ? startInput : endInput
  const canContinue = addingPermit
    ? Boolean((permitFile || permitText.trim()) && endPoint)
    : Boolean(routeName.trim() && (permitFile || permitText.trim()) && startPoint && endPoint)

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

  // ── Fit map to all markers ONLY on initial entry to Step 2 ─────────────────
  // Pin deletions and edits will NOT cause the map to zoom out!
  useEffect(() => {
    if (step !== 2 || !mapRef.current) return
    if (!shouldFitStep2Ref.current) return

    const allPts = []
    if (startPoint) allPts.push([startPoint.lat, startPoint.lng])
    permits.forEach((p) => {
      p.waypoints.forEach((w) => allPts.push([w.lat, w.lng]))
      if (p.endPoint) allPts.push([p.endPoint.lat, p.endPoint.lng])
    })
    if (endPoint) allPts.push([endPoint.lat, endPoint.lng])

    if (allPts.length) {
      mapRef.current.fitBounds(L.latLngBounds(allPts), { padding: [40, 40] })
      shouldFitStep2Ref.current = false
    }
  }, [step, startPoint, endPoint, permits])

  // ── Map click → set start or end pin in Step 1 ────────────────────────────
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

  // ── Drag handler for intermediate waypoints in Step 2 ────────────────────
  const handleWaypointDrag = (permitId, wpId, event) => {
    const { lat, lng } = event.target.getLatLng()
    setPermits((prev) =>
      prev.map((p) =>
        p.id !== permitId
          ? p
          : {
              ...p,
              waypoints: p.waypoints.map((w) =>
                w.id === wpId ? { ...w, lat: Number(lat.toFixed(6)), lng: Number(lng.toFixed(6)) } : w
              ),
            }
      )
    )
  }

  // ── Step 1 → Step 2 (Continue) ───────────────────────────────────────────
  const handleContinue = async () => {
    if (!addingPermit && !routeName.trim()) {
      setStep1Error('Please enter a route name.')
      return
    }
    if (!permitText && !permitFile) {
      setStep1Error('Please enter permit waypoints or upload a permit file.')
      return
    }

    const currentStart = addingPermit ? addingPermit.startPoint : startPoint
    if (!currentStart) {
      setStep1Error('Please set a start point.')
      return
    }
    if (!endPoint) {
      setStep1Error('Please set an end point.')
      return
    }

    setStep1Error('')
    setIsParsingPermit(true)

    let parsedWaypoints = []

    // 1. If permit file is uploaded, attempt to call backend parser API
    if (permitFile) {
      try {
        const response = await teamManageApi.parsePermitDocument(accessToken, permitFile)
        if (response?.waypoints && Array.isArray(response.waypoints) && response.waypoints.length > 0) {
          parsedWaypoints = response.waypoints.map((wp, i) => ({
            id: `wp-parsed-${i}-${Date.now()}`,
            name: wp.name || wp.instruction || `Waypoint ${i + 1}`,
            lat: Number(wp.latitude ?? wp.lat ?? (currentStart.lat + (i + 1) * 0.02)),
            lng: Number(wp.longitude ?? wp.lng ?? (currentStart.lng + (i + 1) * 0.02)),
          }))
        }
      } catch {
        // Backend OCR endpoint not available or not yet deployed; fall back to client interpolation
      }
    }

    // 2. If no backend waypoints obtained, parse permit text or interpolate along start->end
    if (parsedWaypoints.length === 0) {
      let names = []
      if (permitText.trim()) {
        names = permitText
          .split(/[,\n]/)
          .map((s) => s.trim())
          .filter(Boolean)
      }
      parsedWaypoints = interpolateWaypoints(currentStart, endPoint, names)
    }

    setIsParsingPermit(false)

    if (addingPermit) {
      // Adding Permit N (e.g. Permit 2)
      const newPermit = {
        id: `p${Date.now()}`,
        label: addingPermit.label,
        startLocation: addingPermit.startLocation,
        startPoint: addingPermit.startPoint,
        endLocation: endInput.trim() || 'End',
        endPoint,
        permitText: permitText.trim(),
        permitFile,
        waypoints: parsedWaypoints,
      }
      setPermits((prev) => [...prev, newPermit])
      setAddingPermit(null)
    } else {
      // Adding initial Permit 1
      setPermits([
        {
          id: 'p1',
          label: 'Permit 1',
          startLocation: startInput.trim() || 'Start',
          startPoint: currentStart,
          endLocation: endInput.trim() || 'End',
          endPoint,
          permitText: permitText.trim(),
          permitFile,
          waypoints: parsedWaypoints,
        },
      ])
    }

    // Trigger bounds fit once when entering Step 2
    shouldFitStep2Ref.current = true
    setStep(2)
  }

  // ── Step 2: Waypoint CRUD ─────────────────────────────────────────────────
  const updateWaypoint = (permitId, wpId, name) => {
    setPermits((prev) =>
      prev.map((p) =>
        p.id !== permitId
          ? p
          : { ...p, waypoints: p.waypoints.map((w) => (w.id === wpId ? { ...w, name } : w)) }
      )
    )
  }

  // Deleting a waypoint does NOT reset map zoom!
  const removeWaypoint = (permitId, wpId) => {
    setPermits((prev) =>
      prev.map((p) =>
        p.id !== permitId
          ? p
          : { ...p, waypoints: p.waypoints.filter((w) => w.id !== wpId) }
      )
    )
  }

  // Inserting a waypoint directly AFTER the clicked index
  const addWaypoint = (permitId, insertIndex) => {
    setPermits((prev) =>
      prev.map((p) => {
        if (p.id !== permitId) return p
        const wps = [...p.waypoints]
        const pStart = p.startPoint || startPoint || { lat: defaultCenter[0], lng: defaultCenter[1] }
        const pEnd = p.endPoint || endPoint || { lat: defaultCenter[0], lng: defaultCenter[1] }

        let lat, lng
        if (insertIndex !== undefined && insertIndex >= 0 && insertIndex < wps.length) {
          const prevPt = wps[insertIndex]
          const nextPt = insertIndex < wps.length - 1 ? wps[insertIndex + 1] : pEnd
          lat = Number(((prevPt.lat + nextPt.lat) / 2).toFixed(6))
          lng = Number(((prevPt.lng + nextPt.lng) / 2).toFixed(6))
          const newPt = {
            id: `wp-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            name: '',
            lat,
            lng,
          }
          wps.splice(insertIndex + 1, 0, newPt)
        } else {
          // Append to end: interpolate between last point and permit end
          const lastPt = wps.at(-1) || pStart
          lat = Number(((lastPt.lat + pEnd.lat) / 2).toFixed(6))
          lng = Number(((lastPt.lng + pEnd.lng) / 2).toFixed(6))
          const newPt = {
            id: `wp-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            name: '',
            lat,
            lng,
          }
          wps.push(newPt)
        }
        return { ...p, waypoints: wps }
      })
    )
  }

  // ── "Add Permit N" Flow ───────────────────────────────────────────────────
  // Returns back to Step 1 to import the next permit, locking the Start Point
  // to the previous permit's End Point and requiring ONLY the End Point to be set.
  const handleAddPermitClick = () => {
    const lastPermit = permits.at(-1)
    const chainedStart = lastPermit?.endPoint || endPoint || (lastPermit?.waypoints.at(-1) ? { lat: lastPermit.waypoints.at(-1).lat, lng: lastPermit.waypoints.at(-1).lng } : startPoint)
    const chainedLocation = lastPermit?.endLocation || endInput || `${chainedStart?.lat.toFixed(5)}, ${chainedStart?.lng.toFixed(5)}`

    setAddingPermit({
      index: permits.length + 1,
      label: `Permit ${permits.length + 1}`,
      startPoint: chainedStart,
      startLocation: chainedLocation,
    })

    // Reset fields for the new permit
    setPermitText('')
    setPermitFile(null)
    setStartPoint(chainedStart)
    setStartInput(chainedLocation)
    setEndPoint(null)
    setEndInput('')
    setLocationTarget('end')
    setSettingPin(null)
    setStep1Error('')
    setStep(1)
  }

  // ── Step 2: Add / Delete Pin buttons ─────────────────────────────────────
  const handleAddPin = () => {
    // Add pin at current map center (or active permit end) without zooming out
    const center = mapRef.current ? mapRef.current.getCenter() : (endPoint || { lat: defaultCenter[0], lng: defaultCenter[1] })
    const targetPermit = permits[0]
    if (!targetPermit) return

    const newPt = {
      id: `wp-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name: `Pin ${targetPermit.waypoints.length + 1}`,
      lat: Number(center.lat.toFixed(6)),
      lng: Number(center.lng.toFixed(6)),
    }

    setPermits((prev) =>
      prev.map((p, idx) => (idx === 0 ? { ...p, waypoints: [...p.waypoints, newPt] } : p))
    )
  }

  const handleDeletePin = () => {
    // Remove the last waypoint of the first permit without resetting zoom
    setPermits((prev) => {
      const p = prev[0]
      if (!p || p.waypoints.length === 0) return prev
      const updatedWps = p.waypoints.slice(0, -1)
      return prev.map((item, idx) => (idx === 0 ? { ...item, waypoints: updatedWps } : item))
    })
  }

  // ── Save Route ────────────────────────────────────────────────────────────
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
        // Flat waypoints list for backward compatibility
        waypoints: allRouteWaypoints.map((waypoint, index) => ({
          index: index + 1,
          name: waypoint.name || `Waypoint ${index + 1}`,
          waypoint_type: 'CHECKPOINT',
          latitude: waypoint.lat,
          longitude: waypoint.lng,
          description: null,
          eta_minutes: 0,
        })),
        // Structured multi-permit payload
        permits: permits.map((permit, permitIndex) => {
          const permitStart = permit.startPoint || startPoint
          const permitEnd = permit.endPoint || endPoint
          return {
            index: permitIndex + 1,
            name: permit.label,
            start_location: permit.startLocation || 'Start',
            start_latitude: permitStart.lat,
            start_longitude: permitStart.lng,
            end_location: permit.endLocation || 'End',
            end_latitude: permitEnd.lat,
            end_longitude: permitEnd.lng,
            permit_text: permit.permitText || null,
            waypoints: permit.waypoints.map((waypoint, waypointIndex) => ({
              index: waypointIndex + 1,
              name: waypoint.name || `Waypoint ${waypointIndex + 1}`,
              waypoint_type: 'CHECKPOINT',
              latitude: waypoint.lat,
              longitude: waypoint.lng,
              description: null,
              eta_minutes: 0,
            })),
          }
        }),
      })

      setSaveMessage(response?.message || 'Route created successfully.')
      window.setTimeout(() => navigate(routeHistoryPath), 700)
    } catch (error) {
      setStep1Error(error.message || 'Unable to create route.')
    } finally {
      setIsSaving(false)
    }
  }

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
        {addingPermit
          ? `Create route – Import ${addingPermit.label}`
          : `Create route – step ${step}`}
      </h1>

      {/* Back link & Video Tutorial action */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => {
            if (addingPermit) {
              setAddingPermit(null)
              setStep(2)
            } else if (step === 1) {
              navigate(routeHistoryPath)
            } else {
              setStep(1)
            }
          }}
          className="inline-flex items-center gap-1 text-[13px] font-medium text-[#ff823d] cursor-pointer"
        >
          <span className="text-lg">&lt;</span>
          <span>
            {addingPermit
              ? 'Cancel and return to route review'
              : step === 1
              ? "Driver's route history"
              : 'Back to step 1'}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setShowTutorialOverlay(true)}
          className="inline-flex items-center gap-1.5 rounded border border-[#ddd] bg-white px-2.5 py-1 text-[12px] font-medium text-[#555] shadow-xs hover:border-[#ff823d] hover:text-[#ff823d] cursor-pointer"
        >
          <span className="text-sm text-[#ff823d]">▶</span>
          <span>Video Tutorial</span>
        </button>
      </div>

      <h2 className="mb-4 text-base font-bold text-[#111]">
        New Route for: <span className="font-bold">{driverName}</span>
      </h2>

      {/* ═══════════════════════════════ STEP 1 ════════════════════════════ */}
      {step === 1 && (
        <div className="flex flex-col gap-4">
          {/* Top 3-column row matching mockup */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3 items-start">
            {/* Column 1: Enter Route Name */}
            <div>
              <label className="mb-1.5 block text-[14px] font-bold text-[#111]">
                Enter Route Name
              </label>
              <input
                type="text"
                value={routeName}
                disabled={Boolean(addingPermit)}
                onChange={(e) => setRouteName(e.target.value)}
                placeholder="e.g. Nebraska Heavy Haul"
                className={`h-8 w-full rounded-[4px] border px-2.5 text-[13px] outline-none ${
                  addingPermit
                    ? 'border-[#ddd] bg-[#f9f9f9] text-[#777]'
                    : 'border-[#ccc] bg-white text-[#333] focus:border-[#eb7035]'
                }`}
              />
              <p className="mt-2 text-[12px] font-bold text-[#8a1c14] leading-tight">
                {addingPermit
                  ? `Adding ${addingPermit.label} to this route.`
                  : 'NOTE: Only one permit can be processed at a time.'}
              </p>
            </div>

            {/* Column 2: Step 1 - Input Permit */}
            <div>
              <label className="mb-1.5 block text-[14px] font-bold text-[#111]">
                {addingPermit ? `Import ${addingPermit.label}` : 'Step 1 - Input Permit'}
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
                    <p className="pr-7 text-[#555] font-semibold">Example Permit Waypoints:</p>
                    <ul aria-label="Example waypoints" className="mt-1 space-y-0.5 text-[#666]">
                      <li>US-30 EB at Grand Island</li>
                      <li>I-80 EB Exit 412</li>
                      <li>US-77 SB to Lincoln</li>
                      <li>NE-2 EB at Syracuse</li>
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

              {/* Hidden file input */}
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
                placeholder="Type in waypoints, comma or newline separated."
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
              <label className="mb-1.5 block text-[14px] font-bold text-[#111]">
                {addingPermit
                  ? `Step 2 - Set End Point for ${addingPermit.label}`
                  : 'Step 2 - Set Start and End Points'}
              </label>

              {/* If adding subsequent permit, Start Point is locked from previous permit */}
              {addingPermit ? (
                <div className="mb-2 rounded-[4px] border border-green-300 bg-green-50 px-2.5 py-1.5 text-[12px] text-green-900">
                  <span className="font-bold">✓ Start Point:</span> Locked from previous permit end (
                  {addingPermit.startPoint.lat.toFixed(4)}, {addingPermit.startPoint.lng.toFixed(4)})
                </div>
              ) : null}

              {/* Location input for active target */}
              <input
                type="text"
                value={addingPermit ? endInput : activeLocationInput}
                onChange={(e) => {
                  if (addingPermit || locationTarget === 'end') {
                    setEndInput(e.target.value)
                  } else {
                    setStartInput(e.target.value)
                  }
                }}
                onKeyDown={(e) => e.key === 'Enter' && handleSetLocationPoint()}
                placeholder={
                  addingPermit
                    ? `Enter ${addingPermit.label} End location or click on map.`
                    : `Enter ${locationTarget} location or move pin on map.`
                }
                aria-label="Location"
                className="h-8 w-full rounded-[4px] border border-[#ccc] bg-white px-2.5 text-[13px] text-[#333] placeholder:text-[#999] outline-none focus:border-[#eb7035]"
              />

              {/* Set Point button */}
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleSetLocationPoint}
                  disabled={geocoding}
                  className="inline-flex h-8 items-center justify-center rounded-[4px] bg-[#eb7035] px-3.5 text-[13px] font-bold text-white shadow-sm transition hover:bg-[#d85f24] cursor-pointer disabled:opacity-60"
                >
                  {geocoding
                    ? 'Setting...'
                    : addingPermit
                    ? `Set End Point for ${addingPermit.label}`
                    : `Set ${locationTarget === 'start' ? 'Start' : 'End'} Point`}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const target = addingPermit ? 'end' : locationTarget
                    setSettingPin(settingPin === target ? null : target)
                  }}
                  className={`text-[11px] underline cursor-pointer ${
                    settingPin === (addingPermit ? 'end' : locationTarget)
                      ? 'text-[#eb7035] font-semibold'
                      : 'text-[#666]'
                  }`}
                >
                  {settingPin === (addingPermit ? 'end' : locationTarget)
                    ? 'Click map to place pin...'
                    : 'Or click map'}
                </button>
              </div>

              {/* Point status feedback */}
              <div className="mt-1 flex flex-col gap-0.5 text-[11px]">
                {startPoint && !addingPermit && (
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
                    className={`text-left underline cursor-pointer ${
                      settingPin === 'end' ? 'text-[#eb7035] font-semibold' : 'text-[#777]'
                    }`}
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
              settingPin ? 'cursor-crosshair' : ''
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
              <MapCenterSync center={defaultCenter} shouldSync={hasDetectedLocation && !startPoint} />

              {/* Start marker */}
              {startPoint && (
                <Marker
                  position={[startPoint.lat, startPoint.lng]}
                  icon={startIcon}
                  draggable={!addingPermit}
                  eventHandlers={{ dragend: (event) => handlePointDrag('start', event) }}
                >
                  <Tooltip permanent direction="top" offset={[0, -16]}>
                    {addingPermit ? `${addingPermit.label} Start (Locked)` : 'Start'}
                  </Tooltip>
                </Marker>
              )}

              {/* End marker */}
              {endPoint && (
                <Marker
                  position={[endPoint.lat, endPoint.lng]}
                  icon={endIcon}
                  draggable
                  eventHandlers={{ dragend: (event) => handlePointDrag('end', event) }}
                >
                  <Tooltip permanent direction="top" offset={[0, -16]}>
                    {addingPermit ? `${addingPermit.label} End` : 'End'}
                  </Tooltip>
                </Marker>
              )}
            </MapContainer>
          </div>

          {/* Continue button */}
          <div className="flex justify-center pt-2 pb-4">
            <button
              type="button"
              onClick={handleContinue}
              disabled={isParsingPermit}
              className={`rounded-full px-16 py-2.5 text-sm font-semibold tracking-wide text-white transition cursor-pointer ${
                canContinue
                  ? 'bg-[#eb7035] hover:bg-[#d85f24]'
                  : 'bg-[#888] hover:bg-[#666]'
              }`}
            >
              {isParsingPermit
                ? 'PARSING PERMIT...'
                : addingPermit
                ? `CONTINUE WITH ${addingPermit.label.toUpperCase()}`
                : 'CONTINUE'}
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

                  {/* Intermediate waypoint markers across all permits - Draggable */}
                  {permits.map((permit) =>
                    permit.waypoints.map((wp, idx) => (
                      <Marker
                        key={wp.id}
                        position={[wp.lat, wp.lng]}
                        icon={pinIcon(idx + 1)}
                        draggable
                        eventHandlers={{
                          dragend: (event) => handleWaypointDrag(permit.id, wp.id, event),
                        }}
                      >
                        <Tooltip direction="top" offset={[0, -16]}>
                          {wp.name || `Waypoint ${idx + 1}`}
                        </Tooltip>
                      </Marker>
                    ))
                  )}

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
              className="flex w-full flex-col xl:w-80"
              style={{ maxHeight: 520 }}
            >
              <div className="mb-2 flex items-center gap-2">
                <h3 className="text-[13px] font-bold text-[#333]">Edit Waypoints</h3>
                <span className="inline-flex h-4 w-4 cursor-default items-center justify-center rounded-full bg-[#bbb] text-[10px] text-white">?</span>
              </div>

              <div className="flex-1 overflow-y-auto pr-1">
                {permits.map((permit, pIdx) => (
                  <div key={permit.id} className="mb-5 rounded border border-[#e5e5e5] bg-[#fafafa] p-2.5">
                    {/* Permit header */}
                    <div className="mb-2 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-[13px] font-bold text-[#222]">{permit.label}</span>
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#ff823d] text-[10px] font-bold text-white">
                          {String.fromCharCode(65 + pIdx)}
                        </span>
                      </div>
                      {permit.permitFile && (
                        <span className="max-w-[110px] truncate text-[10px] text-[#777]" title={permit.permitFile.name}>
                          📄 {permit.permitFile.name}
                        </span>
                      )}
                    </div>

                    {/* Start point representation for this permit */}
                    <div className="mb-2 flex items-center gap-2 rounded bg-green-50 px-2 py-1 text-[11px] font-semibold text-green-800">
                      <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[#22a651] text-[9px] text-white">S</span>
                      <span className="truncate">
                        {pIdx === 0
                          ? `Start: ${permit.startLocation || 'Route Start'}`
                          : `Start: Locked from Permit ${pIdx} End`}
                      </span>
                    </div>

                    {/* Intermediate Waypoint list */}
                    <div className="space-y-1.5">
                      {permit.waypoints.map((wp, idx) => (
                        <div key={wp.id} className="flex items-center gap-1">
                          {/* Insert waypoint button */}
                          <button
                            type="button"
                            onClick={() => addWaypoint(permit.id, idx)}
                            title="Insert waypoint below"
                            className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-[#ddd] text-[14px] font-bold text-[#555] hover:bg-[#bbb] cursor-pointer"
                          >
                            +
                          </button>

                          {/* Waypoint name input */}
                          <input
                            type="text"
                            value={wp.name}
                            placeholder={`Waypoint ${idx + 1}`}
                            onChange={(e) => updateWaypoint(permit.id, wp.id, e.target.value)}
                            className="h-7 flex-1 rounded border border-[#ccc] bg-white px-2 text-[12px] text-[#333] outline-none focus:border-[#ff823d]"
                          />

                          {/* Delete button: available on ALL intermediate waypoints! */}
                          <button
                            type="button"
                            onClick={() => removeWaypoint(permit.id, wp.id)}
                            className="flex h-5 w-5 flex-shrink-0 items-center justify-center text-[#e53935] hover:text-[#c62828] cursor-pointer"
                            title="Remove waypoint"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>

                    {/* End point representation for this permit */}
                    <div className="mt-2 flex items-center gap-2 rounded bg-red-50 px-2 py-1 text-[11px] font-semibold text-red-800">
                      <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[#e53935] text-[9px] text-white">E</span>
                      <span className="truncate">End: {permit.endLocation || 'Permit End'}</span>
                    </div>
                  </div>
                ))}

                {/* Add Next Permit button */}
                <button
                  type="button"
                  onClick={handleAddPermitClick}
                  className="mt-1 w-full rounded bg-[#ff823d] py-2 text-[12px] font-semibold text-white shadow-sm transition hover:bg-[#e56f2d] cursor-pointer"
                >
                  + Add Permit {permits.length + 1}
                </button>
              </div>
            </div>
          </div>

          {/* SAVE */}
          <div className="flex flex-col items-center justify-center py-4">
            {saveMessage && (
              <span className="mb-2 text-[13px] font-semibold text-green-600">{saveMessage}</span>
            )}
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="rounded-full bg-[#22a651] px-20 py-2.5 text-sm font-bold tracking-widest text-white transition hover:bg-[#1a8040] cursor-pointer disabled:opacity-60"
            >
              {isSaving ? 'SAVING...' : 'SAVE'}
            </button>
          </div>
        </div>
      )}

      {/* ═══════════════ Video Tutorial Overlay Modal ═══════════════ */}
      {showTutorialOverlay && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 p-4"
          onClick={handleCloseTutorial}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Build a Route for a Driver Tutorial"
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-3xl rounded border-2 border-black bg-[#cfcfcf] p-4 shadow-2xl md:p-6"
          >
            {/* Top CLOSE link */}
            <div className="mb-2.5">
              <button
                type="button"
                onClick={handleCloseTutorial}
                className="text-base font-bold text-black underline uppercase tracking-wide hover:text-[#eb7035] cursor-pointer"
              >
                CLOSE
              </button>
            </div>

            {/* Embedded YouTube video (No autoplay) */}
            <div className="relative w-full overflow-hidden rounded bg-black shadow-md aspect-video">
              <iframe
                src="https://www.youtube.com/embed/PCb9BEpqdF8?rel=0&autoplay=0"
                title="Build a Route for a Driver - RightRoute Tutorial"
                className="absolute inset-0 h-full w-full border-0"
                allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            </div>

            {/* Bottom checkbox */}
            <div className="mt-3.5 flex items-center gap-2">
              <input
                type="checkbox"
                id="dontShowAgainCheckbox"
                checked={dontShowAgain}
                onChange={(e) => handleToggleDontShow(e.target.checked)}
                className="h-4 w-4 rounded border-gray-600 text-[#eb7035] accent-[#eb7035] cursor-pointer"
              />
              <label
                htmlFor="dontShowAgainCheckbox"
                className="text-[13px] font-medium text-black cursor-pointer select-none"
              >
                Don&apos;t show this again.
              </label>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}

export default CreateRoute
