import { useMemo, useState } from 'react'
import { Eye } from 'lucide-react'
import { useNavigate } from 'react-router'

const routeHistoryData = [
  { id: 10, date: '08/05/2026', name: 'Transformer Move in Cheyenne', waypoints: ['IA-9 EB AT A10', 'US-75 SB', 'IA-9 EB', 'US-59 SB', 'US-18 EB', 'IA-4 SB', 'IA-3 EB', 'US-69 NB', 'B62 AT QUAIL AVE'] },
  { id: 9, date: '08/01/2026', name: 'Excavator Haul to Billings', waypoints: ['I-90 WB', 'US-12 W', 'MP 120', 'Billings Yard'] },
  { id: 8, date: '07/27/2026', name: 'Wind Turbine Blades in Casper', waypoints: ['US-20 W', 'Casper Depot', 'Route 44', 'Site 02'] },
  { id: 7, date: '07/21/2026', name: 'Boiler Transport to Rapid City', waypoints: ['I-25 N', 'ARR Terminal', 'Rapid City', 'Warehouse 6'] },
  { id: 6, date: '07/13/2026', name: 'Mining Loader Move in Gillette', waypoints: ['US-14 E', 'Gillette Spur', 'Pit Access', 'Mine 3'] },
  { id: 5, date: '07/05/2026', name: 'Steel Tanks to Sioux Falls', waypoints: ['I-90 E', 'Sioux Falls', 'South Rail', 'Tank Yard'] },
  { id: 4, date: '06/27/2026', name: 'Generator Haul in Bismarck', waypoints: ['US-83 N', 'Bismarck Depot', 'North Plant', 'Generator Bay'] },
  { id: 3, date: '06/20/2026', name: 'Concrete Beams to Amarillo', waypoints: ['I-40 W', 'Amarillo', 'Concrete Yard', 'Bridge 8'] },
  { id: 2, date: '06/15/2026', name: 'Offfield Compressor in Odessa', waypoints: ['I-20 W', 'Odessa North', 'Compressor Field', 'Route H8'] },
  { id: 1, date: '06/03/2026', name: 'Heavy Crane Move in Lubbock', waypoints: ['US-84 W', 'Lubbock Terminal', 'Crane Pad', 'Loadout'] },
]

const ownerRouteHistoryData = [
  { id: 27, date: '08/05/2026', name: 'Owner route - Site Inspection', waypoints: ['Main Office', 'North Gate', 'Inspection Point', 'Return'] },
  { id: 26, date: '07/28/2026', name: 'Owner route - Logistics Check', waypoints: ['Depot A', 'Service Station', 'Route 9', 'Warehouse'] },
  { id: 25, date: '07/04/2026', name: 'Owner route - City Round', waypoints: ['Central Hub', 'South Loop', 'Park', 'Home Base'] },
]

const RouteHistory = () => {
  const navigate = useNavigate()

  const [routes, setRoutes] = useState(routeHistoryData)
  const [ownerRoutes, setOwnerRoutes] = useState(ownerRouteHistoryData)
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [selectedIds, setSelectedIds] = useState([])
  const [selectedRouteId, setSelectedRouteId] = useState(null)
  const [isOwnerView, setIsOwnerView] = useState(false)

  const activeRoutes = isOwnerView ? ownerRoutes : routes

  const visibleRoutes = useMemo(() => {
    return activeRoutes.filter((route) => {
      const query = search.trim().toLowerCase()
      if (!query) return true

      const searchableText = [route.id, route.date, route.name].join(' ').toLowerCase()
      return searchableText.includes(query)
    })
  }, [activeRoutes, search])

  const selectedRoute =
    (selectedRouteId ? visibleRoutes.find((route) => route.id === selectedRouteId) : null) ??
    (selectedRouteId ? activeRoutes.find((route) => route.id === selectedRouteId) : null) ??
    null

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

  const deleteSelected = () => {
    if (!selectedIds.length) return

    const currentCollection = isOwnerView ? ownerRoutes : routes
    const remainingRoutes = currentCollection.filter(
      (route) => !selectedIds.includes(route.id),
    )

    if (isOwnerView) {
      setOwnerRoutes(remainingRoutes)
    } else {
      setRoutes(remainingRoutes)
    }

    setSelectedIds([])
    setSelectedRouteId(null)
  }

  const downloadCsv = () => {
    const csvRows = [
      ['Route Number', 'Date Created', 'Name', 'Waypoints'],
      ...activeRoutes.map((route) => [
        route.id,
        route.date,
        route.name,
        route.waypoints.join(' | '),
      ]),
    ]

    const csvContent = csvRows
      .map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(','))
      .join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)

    link.href = url
    link.download = `${isOwnerView ? 'owner' : 'team-user'}-route-history.csv`
    link.click()

    URL.revokeObjectURL(url)
  }

  const loadOwnerHistory = () => {
    setIsOwnerView(true)
    setSelectedIds([])
    setSelectedRouteId(null)
  }

  const handleRefresh = () => {
    setSelectedIds([])
    setSelectedRouteId(null)
    setSearchInput('')
    setSearch('')
    setRoutes(routeHistoryData)
    setOwnerRoutes(ownerRouteHistoryData)
  }

  const hasSelection = selectedIds.length > 0

  return (
    <main className="team-users-page min-h-full px-2 py-2 text-[#888] md:px-10 md:py-4">
      <h1 className="mb-8 text-xl font-normal text-[#999] md:text-2xl">Team driver route history</h1>

      <button
        type="button"
        onClick={()=>navigate('/dashboard/manage/team-users')}
        className="mb-4 inline-flex items-center gap-1 text-[13px] font-medium text-[#ff823d] cursor-pointer"
      >
        <span className="text-lg">&lt;</span>
        <span>Team users</span>
      </button>

      <p className="mb-5 max-w-[760px] text-[15px] leading-6 text-[#555]">
        To view a user&apos;s route history, click on the icon next to the users name on the{' '}
        <span className="font-semibold text-[#2c2c2c]">Team Users</span> page. If you have a route history, load it by{' '}
        <button
          type="button"
          onClick={loadOwnerHistory}
          className="font-semibold text-[#ff823d] underline underline-offset-2 cursor-pointer"
        >
          clicking here
        </button>
        .
      </p>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-[22px] font-bold text-[#333]">
          Route History of: <span className="font-bold text-[#2d2d2d]">{isOwnerView ? 'Owner' : 'Caleb Brooks'}</span>
        </h2>

        <div className="flex items-center gap-2">
          <label className="text-[14px] text-[#444]">Search:</label>
          <input
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
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
            <table className="w-full min-w-[620px] border-collapse text-left">
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
                  <th className="w-10 px-2">#</th>
                  <th className="px-2">Date created</th>
                  <th className="px-2">Name</th>
                  <th className="w-12 px-1 text-right">View</th>
                </tr>
              </thead>
              <tbody>
                {visibleRoutes.map((route) => (
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
                    <td className="px-2">{String(route.id).padStart(2, '0')}</td>
                    <td className="px-2">{route.date}</td>
                    <td className="px-2">{route.name}</td>
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
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex flex-wrap items-center justify-between border-b border-[#eee] py-2 text-[12px] text-[#666]">
            <span>{`1-${visibleRoutes.length} of ${activeRoutes.length} routes`}</span>
            <span className="underline">
              Previous&nbsp; 1&nbsp; 2&nbsp; 3&nbsp; Next
            </span>
          </div>
        </section>

        <aside className="min-w-0 overflow-hidden border border-[#eee] ">
          <div className="border-b border-[#e0e0e0] bg-[#efefef] px-3 py-2">
            <h3 className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[#666]">
              Route waypoints
            </h3>
          </div>

          <div className="max-h-[430px] overflow-y-auto px-3 py-2">
            {selectedRoute ? (
              <ul className="space-y-1 text-[15px] text-[#555]">
                {selectedRoute.waypoints.map((point) => (
                  <li key={point} className="py-1">
                    {point}
                  </li>
                ))}
              </ul>
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
            className="rounded bg-[#151d56] px-3 py-1.5 text-sm font-medium text-white transition hover:bg-[#1f2b7b] cursor-pointer"
          >
            Refresh
          </button>
          <button
            type="button"
            onClick={deleteSelected}
            disabled={!hasSelection}
            className={`rounded px-3 py-1.5 text-sm font-medium text-white transition ${
              hasSelection
                ? 'bg-[#ff823d] hover:bg-[#e56f2d] cursor-pointer'
                : 'bg-[#ff823d] opacity-40 cursor-not-allowed'
            }`}
          >
            DELETE
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
            disabled={!hasSelection}
            className={`rounded px-3 py-1.5 text-sm font-medium text-white transition ${
              hasSelection
                ? 'bg-[#151d56] hover:bg-[#1f2b7b] cursor-pointer'
                : 'bg-[#151d56] opacity-40 cursor-not-allowed'
            }`}
          >
            Edit Route
          </button>
          <button
            type="button"
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
