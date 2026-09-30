import { useCallback, useEffect, useMemo, useState } from 'react'
import { Eye } from 'lucide-react'
import { useNavigate } from 'react-router'
import { useAuth } from '../../../context/useAuth'
import { teamManageApi } from '../../../services/teamManageApi'

const formatRouteDate = (route) => {
  if (route.created_at_formatted) return route.created_at_formatted
  if (!route.created_at) return '-'

  const date = new Date(route.created_at)
  if (Number.isNaN(date.getTime())) return route.created_at

  return date.toLocaleDateString(undefined, {
    month: '2-digit',
    day: '2-digit',
    year: 'numeric',
  })
}

const normalizeRoute = (route = {}) => ({
  ...route,
  id: route.id,
  routeNumber: route.route_number || route.id,
  date: formatRouteDate(route),
  name: route.name || `Route #${route.id}`,
  driverName: route.driver_name || 'Team driver route history',
  driverEmail: route.driver_email || '',
  status: route.status || (route.is_completed ? 'Completed' : 'In progress'),
  totalDistanceKm: route.total_distance_km,
  totalWaypoints: route.total_waypoints,
})

const normalizeWaypoint = (waypoint = {}, index) => ({
  ...waypoint,
  id: waypoint.id ?? `${index}-${waypoint.name}`,
  index: waypoint.index ?? index + 1,
  name: waypoint.name || waypoint.description || `Waypoint ${index + 1}`,
  waypointType: waypoint.waypoint_type || '',
  latitude: waypoint.latitude,
  longitude: waypoint.longitude,
  etaMinutes: waypoint.eta_minutes,
  description: waypoint.description,
})

const downloadTextFile = (content, filename, type = 'text/csv;charset=utf-8;') => {
  const blob = new Blob([content], { type })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)

  link.href = url
  link.download = filename
  link.click()

  URL.revokeObjectURL(url)
}

const RouteHistory = () => {
  const navigate = useNavigate()
  const { accessToken } = useAuth()

  const [routes, setRoutes] = useState([])
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [selectedIds, setSelectedIds] = useState([])
  const [selectedRouteId, setSelectedRouteId] = useState(null)
  const [waypoints, setWaypoints] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isWaypointsLoading, setIsWaypointsLoading] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState('')
  const [waypointsError, setWaypointsError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  const routeScopeLabel = 'Team driver route history'

  const fetchRoutes = useCallback(async (signal) => {
    if (!accessToken) return

    await Promise.resolve()

    setIsLoading(true)
    setError('')
    setSuccessMessage('')

    try {
      const response = await teamManageApi.listRouteHistory(accessToken, {}, { signal })
      const nextRoutes = Array.isArray(response) ? response.map(normalizeRoute) : []
      setRoutes(nextRoutes)
      setSelectedIds([])
      setSelectedRouteId(nextRoutes[0]?.id ?? null)
    } catch (fetchError) {
      if (fetchError.name !== 'AbortError') {
        setRoutes([])
        setSelectedIds([])
        setSelectedRouteId(null)
        setError(fetchError.message || 'Unable to load route history.')
      }
    } finally {
      setIsLoading(false)
    }
  }, [accessToken])

  useEffect(() => {
    const controller = new AbortController()
    void Promise.resolve().then(() => fetchRoutes(controller.signal))
    return () => controller.abort()
  }, [fetchRoutes])

  useEffect(() => {
    if (!accessToken || !selectedRouteId) {
      return undefined
    }

    const controller = new AbortController()

    const fetchWaypoints = async () => {
      setIsWaypointsLoading(true)
      setWaypointsError('')

      try {
        const response = await teamManageApi.getRouteWaypoints(accessToken, selectedRouteId, {
          signal: controller.signal,
        })
        setWaypoints(Array.isArray(response) ? response.map(normalizeWaypoint) : [])
      } catch (fetchError) {
        if (fetchError.name !== 'AbortError') {
          setWaypoints([])
          setWaypointsError(fetchError.message || 'Unable to load waypoints.')
        }
      } finally {
        setIsWaypointsLoading(false)
      }
    }

    fetchWaypoints()
    return () => controller.abort()
  }, [accessToken, selectedRouteId])

  const visibleRoutes = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return routes

    return routes.filter((route) => {
      const searchableText = [
        route.routeNumber,
        route.date,
        route.name,
        route.driverName,
        route.driverEmail,
        route.status,
      ].join(' ').toLowerCase()

      return searchableText.includes(query)
    })
  }, [routes, search])

  const selectedRoute =
    (selectedRouteId ? routes.find((route) => route.id === selectedRouteId) : null) ?? null

  const allVisibleSelected =
    visibleRoutes.length > 0 &&
    visibleRoutes.every((route) => selectedIds.includes(route.id))

  const handleRowClick = (routeId) => {
    setSelectedRouteId(routeId)
    setSelectedIds([routeId])
  }

  const toggleRoute = (routeId) => {
    setSelectedIds((current) => {
      const isSelected = current.includes(routeId)
      const next = isSelected
        ? current.filter((id) => id !== routeId)
        : [...current, routeId]

      if (isSelected && selectedRouteId === routeId) {
        setSelectedRouteId(next[0] ?? null)
      } else if (!isSelected) {
        setSelectedRouteId(routeId)
      }

      return next
    })
  }

  const toggleAllRoutes = (checked) => {
    const nextIds = checked ? visibleRoutes.map((route) => route.id) : []
    setSelectedIds(nextIds)
    setSelectedRouteId(checked && visibleRoutes.length ? visibleRoutes[0].id : null)
  }

  const deleteSelected = async () => {
    if (!selectedIds.length || isDeleting) return

    setIsDeleting(true)
    setError('')
    setSuccessMessage('')

    try {
      await teamManageApi.bulkDeleteRoutes(accessToken, selectedIds)
      setSuccessMessage('Selected routes deleted.')
      await fetchRoutes()
    } catch (deleteError) {
      setError(deleteError.message || 'Unable to delete selected routes.')
    } finally {
      setIsDeleting(false)
    }
  }

  const downloadCsv = async () => {
    setError('')
    setSuccessMessage('')

    try {
      const response = await teamManageApi.downloadRouteHistory(accessToken)
      const content = typeof response === 'string' ? response : JSON.stringify(response, null, 2)
      downloadTextFile(content, 'team_route_history.csv')
    } catch (downloadError) {
      setError(downloadError.message || 'Unable to download route history.')
    }
  }

  const handleRefresh = () => {
    setSearchInput('')
    setSearch('')
    fetchRoutes()
  }

  const hasSelection = selectedIds.length > 0

  return (
    <main className="team-users-page min-h-full px-2 py-2 text-[#888] md:px-10 md:py-4">
      <h1 className="mb-8 text-xl font-normal text-[#999] md:text-2xl">Team driver route history</h1>

      <button
        type="button"
        onClick={() => navigate('/dashboard/manage/team-users')}
        className="mb-4 inline-flex items-center gap-1 text-[13px] font-medium text-[#ff823d] cursor-pointer"
      >
        <span className="text-lg">&lt;</span>
        <span>Team users</span>
      </button>

      <p className="mb-5 max-w-[760px] text-[15px] leading-6 text-[#555]">
        To view a user&apos;s route history, click on the icon next to the user&apos;s name on the{' '}
        <span className="font-semibold text-[#2c2c2c]">Team Users</span> page.
      </p>

      {error && (
        <div className="mb-4 rounded border border-red-200 bg-red-50 px-3 py-2 text-[13px] text-red-700">
          {error}
        </div>
      )}

      {successMessage && (
        <div className="mb-4 rounded border border-green-200 bg-green-50 px-3 py-2 text-[13px] text-green-700">
          {successMessage}
        </div>
      )}

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-[22px] font-bold text-[#333]">
          Route History of: <span className="font-bold text-[#2d2d2d]">{selectedRoute?.driverName || routeScopeLabel}</span>
        </h2>

        <div className="flex items-center gap-2">
          <label className="text-[14px] text-[#444]">Search:</label>
          <input
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') setSearch(searchInput.trim())
            }}
            className="h-8 w-40 border border-[#ccc] bg-white px-2 text-[14px] outline-none md:w-48"
          />
          <button
            type="button"
            onClick={() => setSearch(searchInput.trim())}
            className="h-8 rounded border border-[#ccc] bg-[#f4f4f4] px-2 text-[12px] text-[#444] cursor-pointer"
          >
            Go
          </button>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.45fr_1fr]">
        <section className="min-w-0">
          <div className="overflow-x-auto border border-[#eee]">
            <table className="w-full min-w-[760px] border-collapse text-left">
              <thead>
                <tr className="h-8 bg-[#f3f3f3] uppercase text-[#999]">
                  <th className="w-7 px-1">
                    <input
                      type="checkbox"
                      checked={allVisibleSelected}
                      onChange={(event) => toggleAllRoutes(event.target.checked)}
                      aria-label="Select all routes"
                    />
                  </th>
                  <th className="w-16 px-2">#</th>
                  <th className="px-2">Date created</th>
                  <th className="px-2">Name</th>
                  <th className="px-2">Driver</th>
                  <th className="px-2">Status</th>
                  <th className="w-12 px-1 text-right">View</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan="7" className="px-3 py-8 text-center text-[14px] text-[#777]">
                      Loading route history...
                    </td>
                  </tr>
                ) : visibleRoutes.length ? (
                  visibleRoutes.map((route) => (
                    <tr
                      key={route.id}
                      onClick={() => handleRowClick(route.id)}
                      className={`h-8 border-b border-white cursor-pointer transition-colors even:bg-[#f7f7f7] hover:bg-[#eaeaea] ${
                        selectedRouteId === route.id || selectedIds.includes(route.id)
                          ? 'bg-[#f1f1f1]'
                          : ''
                      }`}
                    >
                      <td className="px-1" onClick={(event) => event.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(route.id)}
                          onChange={() => toggleRoute(route.id)}
                          aria-label={`Select route ${route.name}`}
                          className="cursor-pointer"
                        />
                      </td>
                      <td className="px-2">{route.routeNumber}</td>
                      <td className="px-2">{route.date}</td>
                      <td className="px-2">{route.name}</td>
                      <td className="px-2">{route.driverName}</td>
                      <td className="px-2">{route.status}</td>
                      <td className="px-1 text-right" onClick={(event) => event.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => handleRowClick(route.id)}
                          aria-label={`View route ${route.name}`}
                          className="inline-flex items-center justify-center text-[#666] transition hover:text-[#ff823d] cursor-pointer"
                        >
                          <Eye size={16} />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="px-3 py-8 text-center text-[14px] text-[#777]">
                      No routes found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="flex flex-wrap items-center justify-between border-b border-[#eee] py-2 text-[12px] text-[#666]">
            <span>{`Showing ${visibleRoutes.length} of ${routes.length} routes`}</span>
          </div>
        </section>

        <aside className="min-w-0 overflow-hidden border border-[#eee] ">
          <div className="border-b border-[#e0e0e0] bg-[#efefef] px-3 py-2">
            <h3 className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[#666]">
              Route waypoints
            </h3>
          </div>

          <div className="max-h-[430px] overflow-y-auto px-3 py-2">
            {isWaypointsLoading ? (
              <p className="py-3 text-[14px] text-[#888] italic">Loading waypoints...</p>
            ) : waypointsError ? (
              <p className="py-3 text-[14px] text-red-600">{waypointsError}</p>
            ) : selectedRoute ? (
              waypoints.length ? (
                <ul className="space-y-1 text-[15px] text-[#555]">
                  {waypoints.map((point) => (
                    <li key={point.id} className="py-1">
                      <span className="font-semibold text-[#444]">{point.index}. </span>
                      {point.name}
                      {point.waypointType && (
                        <span className="ml-1 text-[12px] text-[#888]">({point.waypointType})</span>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="py-3 text-[14px] text-[#888] italic">No waypoints found for this route.</p>
              )
            ) : (
              <p className="py-3 text-[14px] text-[#888] italic">
                Select a route to view waypoints.
              </p>
            )}
          </div>
        </aside>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[#e7e7e7] bg-[#fafafa] p-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleRefresh}
            disabled={isLoading}
            className="rounded bg-[#151d56] px-3 py-1.5 text-sm font-medium text-white transition hover:bg-[#1f2b7b] disabled:opacity-50 cursor-pointer"
          >
            Refresh
          </button>
          <button
            type="button"
            onClick={deleteSelected}
            disabled={!hasSelection || isDeleting}
            className={`rounded px-3 py-1.5 text-sm font-medium text-white transition ${
              hasSelection && !isDeleting
                ? 'bg-[#ff823d] hover:bg-[#e56f2d] cursor-pointer'
                : 'bg-[#ff823d] opacity-40 cursor-not-allowed'
            }`}
          >
            {isDeleting ? 'DELETING...' : 'DELETE'}
          </button>
          <button
            type="button"
            onClick={downloadCsv}
            className="rounded bg-[#151d56] px-3 py-1.5 text-sm font-medium text-white transition hover:bg-[#1f2b7b] cursor-pointer"
          >
            DOWNLOAD
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={!selectedRouteId}
            onClick={() => {
              if (!selectedRouteId) return
              navigate(`/dashboard/manage/team-route-history/edit/${selectedRouteId}`)
            }}
            className={`rounded px-3 py-1.5 text-sm font-medium text-white transition ${
              selectedRouteId
                ? 'bg-[#151d56] hover:bg-[#1f2b7b] cursor-pointer'
                : 'bg-[#151d56] opacity-40 cursor-not-allowed'
            }`}
          >
            Edit Route
          </button>
          <button
            type="button"
            onClick={() => navigate('/dashboard/manage/team-route-history/create')}
            className="rounded bg-[#ff823d] px-3 py-1.5 text-sm font-medium text-white transition hover:bg-[#e56f2d] cursor-pointer"
          >
            Create New Route
          </button>
        </div>
      </div>
    </main>
  )
}

export default RouteHistory