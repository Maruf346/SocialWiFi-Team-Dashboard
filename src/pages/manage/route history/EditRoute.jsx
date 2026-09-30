import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router'
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

// ─── Fix default leaflet marker icons ────────────────────────────────────────
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

// ─── Icon helpers ─────────────────────────────────────────────────────────────
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

// ─── Mock route store (keyed by route id) ────────────────────────────────────
const MOCK_ROUTES = {
  10: {
    name: 'Transformer Move in Cheyenne',
    startPoint: { lat: 41.620, lng: -93.675 },
    endPoint:   { lat: 41.499, lng: -93.69  },
    permits: [
      {
        id: 'p1', label: 'Permit 1',
        waypoints: [
          { id: 'w1', name: 'IA-9 EB AT A10', lat: 41.605, lng: -93.695 },
          { id: 'w2', name: 'US-75 SB',       lat: 41.585, lng: -93.69  },
          { id: 'w3', name: 'IA-9 EB',        lat: 41.567, lng: -93.694 },
          { id: 'w4', name: 'US-59 SB',       lat: 41.549, lng: -93.700 },
          { id: 'w5', name: 'US-18 EB',       lat: 41.532, lng: -93.697 },
          { id: 'w6', name: 'IA-4 SB',        lat: 41.518, lng: -93.695 },
          { id: 'w7', name: 'IA-3 EB',        lat: 41.510, lng: -93.693 },
          { id: 'w8', name: 'US-69 NB',       lat: 41.504, lng: -93.691 },
          { id: 'w9', name: 'B62 AT QUAIL AVE', lat: 41.499, lng: -93.69 },
        ],
      },
    ],
  },
}

// Fallback for routes not in mock store
const makeFallbackRoute = (id, name) => ({
  name: name || `Route #${id}`,
  startPoint: { lat: 41.590, lng: -93.62 },
  endPoint:   { lat: 41.550, lng: -93.62 },
  permits: [
    {
      id: 'p1', label: 'Permit 1',
      waypoints: [
        { id: 'w1', name: 'Waypoint 1', lat: 41.580, lng: -93.62 },
        { id: 'w2', name: 'Waypoint 2', lat: 41.565, lng: -93.62 },
        { id: 'w3', name: 'Waypoint 3', lat: 41.552, lng: -93.62 },
      ],
    },
  ],
})


const normalizePermit = (permit = {}, index = 0) => ({
  id: permit.id ?? `permit-${index + 1}`,
  label: permit.name || `Permit ${index + 1}`,
  name: permit.name || `Permit ${index + 1}`,
  startLocation: permit.start_location || 'Start',
  startPoint: {
    lat: Number(permit.start_latitude ?? 41.59),
    lng: Number(permit.start_longitude ?? -93.62),
  },
  endLocation: permit.end_location || 'End',
  endPoint: {
    lat: Number(permit.end_latitude ?? 41.55),
    lng: Number(permit.end_longitude ?? -93.62),
  },
  permitText: permit.permit_text || '',
  waypoints: Array.isArray(permit.waypoints) && permit.waypoints.length
    ? permit.waypoints.map((waypoint, waypointIndex) => ({
        id: waypoint.id ?? `wp-${index}-${waypointIndex}`,
        name: waypoint.name || `Waypoint ${waypointIndex + 1}`,
        lat: Number(waypoint.latitude ?? waypoint.lat ?? permit.start_latitude ?? 41.58),
        lng: Number(waypoint.longitude ?? waypoint.lng ?? permit.start_longitude ?? -93.62),
        waypointType: waypoint.waypoint_type || 'CHECKPOINT',
        description: waypoint.description || null,
        etaMinutes: waypoint.eta_minutes ?? 0,
      }))
    : [],
})

const normalizeRouteDetail = (response, fallback) => {
  const route = response?.data || response?.route || response
  const permits = Array.isArray(route?.permits) && route.permits.length
    ? route.permits.map(normalizePermit)
    : fallback.permits

  const firstPermit = permits[0]
  const lastPermit = permits.at(-1) || firstPermit

  return {
    name: route?.name || fallback.name,
    startPoint: firstPermit?.startPoint || fallback.startPoint,
    endPoint: lastPermit?.endPoint || firstPermit?.endPoint || fallback.endPoint,
    permits,
  }
}

// ─── OSRM road-path ───────────────────────────────────────────────────────────
async function fetchRoadPath(points) {
  if (points.length < 2) return []
  const coords = points.map((p) => `${p.lng},${p.lat}`).join(';')
  try {
    const res  = await fetch(
      `https://router.project-osrm.org/route/v1/driving/${coords}?overview=full&geometries=geojson`,
    )
    const data = await res.json()
    if (data.routes?.[0]) {
      return data.routes[0].geometry.coordinates.map(([lng, lat]) => [lat, lng])
    }
  } catch { /* silent */ }
  return points.map((p) => [p.lat, p.lng])
}

// ─── Map click handler ────────────────────────────────────────────────────────
const MapClickHandler = ({ onMapClick }) => {
  useMapEvents({ click: onMapClick })
  return null
}

// ─────────────────────────────────────────────────────────────────────────────
const EditRoute = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { routeId } = useParams()
  const { accessToken } = useAuth()
  const driverName = location.state?.driverName || 'Selected driver'

  // Load mock data
  const initial = useMemo(() => MOCK_ROUTES[Number(routeId)] ?? makeFallbackRoute(routeId), [routeId])

  const [routeName,   setRouteName]   = useState(initial.name)
  const [startPoint,  setStartPoint]  = useState(initial.startPoint)
  const [endPoint,    setEndPoint]    = useState(initial.endPoint)
  const [permits,     setPermits]     = useState(initial.permits)
  const [routePath,   setRoutePath]   = useState([])
  const [settingPin,  setSettingPin]  = useState(null)  // 'start' | 'end' | null
  const [saved,       setSaved]       = useState(false)
  const [error,       setError]       = useState('')
  const [isLoading,   setIsLoading]   = useState(true)
  const [isSaving,    setIsSaving]    = useState(false)
  const mapRef = useRef(null)

  useEffect(() => {
    if (!accessToken || !routeId) return undefined

    const controller = new AbortController()

    const loadRoute = async () => {
      await Promise.resolve()
      setIsLoading(true)
      setError('')

      try {
        const response = await teamManageApi.getRoute(accessToken, routeId, {
          signal: controller.signal,
        })
        const nextRoute = normalizeRouteDetail(response, initial)
        setRouteName(nextRoute.name)
        setStartPoint(nextRoute.startPoint)
        setEndPoint(nextRoute.endPoint)
        setPermits(nextRoute.permits)
      } catch (loadError) {
        if (loadError.name !== 'AbortError') {
          setError(loadError.message || 'Unable to load route detail.')
        }
      } finally {
        setIsLoading(false)
      }
    }

    void loadRoute()
    return () => controller.abort()
  }, [accessToken, initial, routeId])

  // ── Fetch road path ─────────────────────────────────────────────────────
  useEffect(() => {
    const allPts = []
    if (startPoint) allPts.push(startPoint)
    permits.forEach((p) => p.waypoints.forEach((w) => allPts.push({ lat: w.lat, lng: w.lng })))
    if (endPoint) allPts.push(endPoint)
    if (allPts.length >= 2) fetchRoadPath(allPts).then(setRoutePath)
  }, [startPoint, endPoint, permits])

  // ── Fit map on mount ────────────────────────────────────────────────────
  useEffect(() => {
    if (!mapRef.current) return
    const allPts = []
    if (startPoint) allPts.push([startPoint.lat, startPoint.lng])
    permits.forEach((p) => p.waypoints.forEach((w) => allPts.push([w.lat, w.lng])))
    if (endPoint) allPts.push([endPoint.lat, endPoint.lng])
    if (allPts.length) {
      mapRef.current.fitBounds(L.latLngBounds(allPts), { padding: [40, 40] })
    }
  }, [startPoint, endPoint, permits])

  // ── Map click for pin placement ─────────────────────────────────────────
  const handleMapClick = useCallback((e) => {
    if (!settingPin) return
    const { lat, lng } = e.latlng
    if (settingPin === 'start') setStartPoint({ lat, lng })
    else setEndPoint({ lat, lng })
    setSettingPin(null)
  }, [settingPin])

  // ── Waypoint CRUD ───────────────────────────────────────────────────────
  const updateWaypoint = (permitId, wpId, name) =>
    setPermits((prev) =>
      prev.map((p) =>
        p.id !== permitId ? p
          : { ...p, waypoints: p.waypoints.map((w) => w.id === wpId ? { ...w, name } : w) },
      ),
    )

  const removeWaypoint = (permitId, wpId) =>
    setPermits((prev) =>
      prev.map((p) =>
        p.id !== permitId ? p
          : { ...p, waypoints: p.waypoints.filter((w) => w.id !== wpId) },
      ),
    )

  const addWaypoint = (permitId) => {
    const last = permits.find((p) => p.id === permitId)?.waypoints.at(-1)
    setPermits((prev) =>
      prev.map((p) =>
        p.id !== permitId ? p
          : {
              ...p,
              waypoints: [
                ...p.waypoints,
                {
                  id: `wp-${Date.now()}`,
                  name: '',
                  lat: last ? last.lat - 0.01 : 41.58,
                  lng: last ? last.lng + 0.008 : -93.62,
                },
              ],
            },
      ),
    )
  }

  const addPermit = () => {
    const lastWp = permits.at(-1)?.waypoints.at(-1)
    setPermits((prev) => [
      ...prev,
      {
        id: `p${Date.now()}`,
        label: `Permit ${prev.length + 1}`,
        waypoints: [
          { id: `wp-${Date.now()}`,     name: 'New Start', lat: (lastWp?.lat ?? 41.58) - 0.01, lng: lastWp?.lng ?? -93.62 },
          { id: `wp-${Date.now() + 1}`, name: 'New End',   lat: (lastWp?.lat ?? 41.58) - 0.03, lng: lastWp?.lng ?? -93.62 },
        ],
      },
    ])
  }

  const handleSave = async () => {
    setIsSaving(true)
    setSaved(false)
    setError('')

    try {
      await teamManageApi.updateRouteMap(accessToken, routeId, {
        name: routeName.trim(),
        description: '',
        status: 'DRAFT',
        is_completed: false,
        permits: permits.map((permit, permitIndex) => {
          const permitStart = permit.startPoint || startPoint
          const permitEnd = permit.endPoint || endPoint

          return {
            id: Number.isInteger(permit.id) ? permit.id : undefined,
            index: permitIndex + 1,
            name: permit.name || permit.label || `Permit ${permitIndex + 1}`,
            start_location: permit.startLocation || 'Start',
            start_latitude: permitStart.lat,
            start_longitude: permitStart.lng,
            end_location: permit.endLocation || permit.waypoints.at(-1)?.name || 'End',
            end_latitude: permitEnd.lat,
            end_longitude: permitEnd.lng,
            permit_text: permit.permitText || null,
            waypoints: permit.waypoints.map((waypoint, waypointIndex) => ({
              id: Number.isInteger(waypoint.id) ? waypoint.id : undefined,
              index: waypointIndex + 1,
              name: waypoint.name || `Waypoint ${waypointIndex + 1}`,
              waypoint_type: waypoint.waypointType || 'CHECKPOINT',
              latitude: waypoint.lat,
              longitude: waypoint.lng,
              description: waypoint.description || null,
              eta_minutes: waypoint.etaMinutes ?? 0,
            })),
          }
        }),
        delete_missing_permits: false,
        replace_waypoints: true,
      })

      setSaved(true)
      window.setTimeout(() => navigate('/dashboard/manage/team-route-history'), 900)
    } catch (saveError) {
      setError(saveError.message || 'Unable to save route.')
    } finally {
      setIsSaving(false)
    }
  }

  const allWaypoints = permits.flatMap((p) => p.waypoints)

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <main className="min-h-full px-2 py-2 text-[#888] md:px-6 md:py-4">
      {/* Header */}
      <h1 className="mb-1 text-xl font-normal text-[#999] md:text-2xl">Edit Route</h1>

      <button
        type="button"
        onClick={() => navigate('/dashboard/manage/team-route-history')}
        className="mb-5 inline-flex items-center gap-1 text-[13px] font-medium text-[#ff823d] cursor-pointer"
      >
        <span className="text-lg">&lt;</span>
        <span>Driver&apos;s route history</span>
      </button>

      {error && (
        <div className="mb-4 rounded border border-red-200 bg-red-50 px-3 py-2 text-[13px] text-red-700">{error}</div>
      )}

      {isLoading && (
        <div className="mb-4 rounded border border-[#d9d9d9] bg-[#f0f0f0] px-3 py-2 text-[13px] text-[#666]">Loading route detail...</div>
      )}

      <h2 className="mb-4 text-base font-semibold text-[#333]">
        Editing Route for: <span className="font-bold">{driverName}</span>
      </h2>

      {/* Route name */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <label className="text-[13px] font-semibold text-[#333]">Route Name</label>
        <input
          type="text"
          value={routeName}
          onChange={(e) => setRouteName(e.target.value)}
          className="h-8 w-64 border border-[#ccc] px-2 text-[13px] text-[#444] outline-none focus:border-[#ff823d]"
        />
        {/* Pin placement toggles */}
        <button
          type="button"
          onClick={() => setSettingPin(settingPin === 'start' ? null : 'start')}
          className={`rounded border px-2.5 py-1 text-[12px] font-semibold transition cursor-pointer ${
            settingPin === 'start'
              ? 'border-[#22a651] bg-[#eafaf1] text-[#22a651]'
              : 'border-[#ccc] bg-white text-[#555] hover:bg-[#f0f0f0]'
          }`}
        >
          {settingPin === 'start' ? '📍 Click map for Start…' : 'Move Start Pin'}
        </button>
        <button
          type="button"
          onClick={() => setSettingPin(settingPin === 'end' ? null : 'end')}
          className={`rounded border px-2.5 py-1 text-[12px] font-semibold transition cursor-pointer ${
            settingPin === 'end'
              ? 'border-[#e53935] bg-[#fdecea] text-[#e53935]'
              : 'border-[#ccc] bg-white text-[#555] hover:bg-[#f0f0f0]'
          }`}
        >
          {settingPin === 'end' ? '📍 Click map for End…' : 'Move End Pin'}
        </button>
      </div>

      {/* Map + Edit panel */}
      <div className="flex flex-col gap-4 xl:flex-row">
        {/* Map column */}
        <div className="flex flex-col min-w-0 flex-1">
          <div
            className={`relative overflow-hidden rounded border border-[#ddd] ${
              settingPin === 'start'
                ? 'cursor-pin-start'
                : settingPin === 'end'
                ? 'cursor-pin-end'
                : ''
            }`}
            style={{ height: 460 }}
          >
            {settingPin && (
              <div className="pointer-events-none absolute inset-x-0 top-2 z-[500] flex justify-center">
                <span className="rounded bg-black/70 px-3 py-1 text-[12px] font-semibold text-white">
                  Click on the map to move the {settingPin === 'start' ? 'Start' : 'End'} pin
                </span>
              </div>
            )}

            <MapContainer
              center={[startPoint.lat, startPoint.lng]}
              zoom={12}
              style={{ height: '100%', width: '100%' }}
              ref={mapRef}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              />
              <MapClickHandler onMapClick={handleMapClick} />

              {/* Road polyline */}
              {routePath.length > 1 && (
                <Polyline positions={routePath} color="#ff823d" weight={4} opacity={0.85} />
              )}

              {/* Start */}
              <Marker position={[startPoint.lat, startPoint.lng]} icon={startIcon}>
                <Tooltip permanent direction="top" offset={[0, -16]}>Start</Tooltip>
              </Marker>

              {/* Intermediate waypoints */}
              {allWaypoints.map((wp, idx) => (
                <Marker key={wp.id} position={[wp.lat, wp.lng]} icon={pinIcon(idx + 1)}>
                  <Tooltip direction="top" offset={[0, -16]}>{wp.name || `Waypoint ${idx + 1}`}</Tooltip>
                </Marker>
              ))}

              {/* End */}
              <Marker position={[endPoint.lat, endPoint.lng]} icon={endIcon}>
                <Tooltip permanent direction="top" offset={[0, -16]}>End</Tooltip>
              </Marker>
            </MapContainer>
          </div>

          {/* Map controls */}
          <div className="mt-2 flex items-center justify-between">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => addWaypoint(permits[0]?.id)}
                className="rounded bg-[#ff823d] px-3 py-1.5 text-[12px] font-semibold text-white hover:bg-[#e56f2d] cursor-pointer"
              >
                Add Pin
              </button>
              <button
                type="button"
                onClick={() => {
                  const p = permits[0]
                  if (p && p.waypoints.length > 1)
                    removeWaypoint(p.id, p.waypoints.at(-1).id)
                }}
                className="rounded bg-[#555] px-3 py-1.5 text-[12px] font-semibold text-white hover:bg-[#333] cursor-pointer"
              >
                Delete Pin
              </button>
            </div>
            <button
              type="button"
              onClick={() => {
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
        <div className="flex w-full flex-col xl:w-72" style={{ maxHeight: 520 }}>
          <div className="mb-2 flex items-center gap-2">
            <h3 className="text-[13px] font-bold text-[#333]">Edit Waypoints</h3>
            <span className="inline-flex h-4 w-4 cursor-default items-center justify-center rounded-full bg-[#bbb] text-[10px] text-white">?</span>
          </div>

          <div className="flex-1 overflow-y-auto pr-1">
            {permits.map((permit) => (
              <div key={permit.id} className="mb-4">
                <div className="mb-2 flex items-center gap-2">
                  <span className="text-[12px] font-bold text-[#333]">{permit.label}</span>
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#ff823d] text-[10px] font-bold text-white">A</span>
                </div>

                <div className="space-y-1.5">
                  {permit.waypoints.map((wp, idx) => {
                    const isFirst = idx === 0
                    const isLast  = idx === permit.waypoints.length - 1
                    return (
                      <div key={wp.id} className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => addWaypoint(permit.id)}
                          title="Insert waypoint"
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
      <div className="flex items-center justify-center gap-4 py-4">
        {saved && (
          <span className="text-[13px] font-semibold text-green-600">✓ Route saved!</span>
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
    </main>
  )
}

export default EditRoute
