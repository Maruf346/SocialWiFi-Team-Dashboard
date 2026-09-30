import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { History, Pencil, Upload, X } from 'lucide-react'
import { useNavigate } from 'react-router'
import { useAuth } from '../../../context/useAuth'
import { teamManageApi } from '../../../services/teamManageApi'

const PAGE_SIZE = 20

const filterToApiValue = (filter) => {
  if (filter === 'Yes') return 'true'
  if (filter === 'No') return 'false'
  return undefined
}


const getRouteHistoryPath = (user) => {
  const params = new URLSearchParams()
  const driverUserId = user.user_id || user.id

  if (driverUserId) params.set('user_id', driverUserId)
  if (user.name) params.set('driver_name', user.name)
  if (user.email) params.set('user_email', user.email)

  const query = params.toString()
  return `/dashboard/manage/team-route-history${query ? `?${query}` : ''}`
}
const downloadFile = (content, filename) => {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

const TeamUser = () => {
  const navigate = useNavigate()
  const fileInputRef = useRef(null)
  const { accessToken } = useAuth()

  const [users, setUsers] = useState([])
  const [planStats, setPlanStats] = useState(null)
  const [pagination, setPagination] = useState(null)
  const [selectedIds, setSelectedIds] = useState([])
  const [activeUserId, setActiveUserId] = useState(null)

  const [filterInput, setFilterInput] = useState('All')
  const [filter, setFilter] = useState('All')
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [currentPage, setCurrentPage] = useState(1)

  const [importOpen, setImportOpen] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  const [addFormData, setAddFormData] = useState({
    name: '',
    email: '',
  })

  const [editFormData, setEditFormData] = useState({
    name: '',
    email: '',
  })

  const activeUser = useMemo(() => {
    return users.find((user) => user.id === activeUserId) || null
  }, [users, activeUserId])

  const totalUsers = pagination?.total_count ?? planStats?.total_in_list ?? users.length
  const totalPages = pagination?.total_pages ?? 1
  const maxMembers = planStats?.max_members ?? 'Not available'
  const enrolledTotal = planStats?.enrolled_count ?? users.filter((user) => user.is_enrolled).length
  const slotsRemaining = planStats?.slots_remaining ?? 'Not available'

  const showToast = (message) => {
    setToastMessage(message)
    setTimeout(() => setToastMessage(''), 2500)
  }

  const loadUsers = useCallback(async (signal) => {
    if (!accessToken) return

    setIsLoading(true)
    setError('')

    try {
      const data = await teamManageApi.listTeamUsers(
        accessToken,
        {
          page: currentPage,
          page_size: PAGE_SIZE,
          search,
          enrolled: filterToApiValue(filter),
        },
        { signal },
      )

      setUsers(Array.isArray(data.results) ? data.results : [])
      setPlanStats(data.plan_stats || null)
      setPagination(data.pagination || null)
      setSelectedIds([])
      setActiveUserId(null)
    } catch (err) {
      if (err.name !== 'AbortError') {
        setError(err.message || 'Unable to load team users.')
      }
    } finally {
      setIsLoading(false)
    }
  }, [accessToken, currentPage, filter, search])

  useEffect(() => {
    const controller = new AbortController()
    const timeoutId = window.setTimeout(() => {
      loadUsers(controller.signal)
    }, 0)

    return () => {
      window.clearTimeout(timeoutId)
      controller.abort()
    }
  }, [loadUsers])

  const handleSelectUser = (user) => {
    setActiveUserId(user.id)
    setEditFormData({
      name: user.name || '',
      email: user.email || '',
    })
    if (!selectedIds.includes(user.id)) {
      setSelectedIds([user.id])
    }
  }

  const isAllVisibleSelected = users.length > 0 && users.every((user) => selectedIds.includes(user.id))

  const handleToggleSelectAll = (checked) => {
    if (checked) {
      setSelectedIds(users.map((user) => user.id))
    } else {
      setSelectedIds([])
      setActiveUserId(null)
    }
  }

  const handleToggleSelectRow = (id, event) => {
    event.stopPropagation()
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    )
  }

  const handleDelete = async () => {
    if (selectedIds.length === 0) {
      showToast('No users selected to delete')
      return
    }

    setIsSaving(true)
    setError('')

    try {
      await teamManageApi.removeTeamUsers(accessToken, selectedIds)
      showToast('Selected users removed successfully')
      await loadUsers()
    } catch (err) {
      setError(err.message || 'Unable to remove selected users.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDownload = async () => {
    setIsSaving(true)
    setError('')

    try {
      const result = await teamManageApi.downloadTeamUsers(accessToken)
      const content = typeof result === 'string' ? result : JSON.stringify(result, null, 2)
      downloadFile(content, 'team_users_export.csv')
      showToast('User list downloaded')
    } catch (err) {
      setError(err.message || 'Unable to download team users.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    setFilterInput('All')
    setFilter('All')
    setSearchInput('')
    setSearch('')
    setSelectedIds([])
    setActiveUserId(null)
    setCurrentPage(1)
    showToast('Selection and filters reset')
  }

  const handleAddUser = async (event) => {
    event.preventDefault()
    if (!addFormData.name.trim() || !addFormData.email.trim()) {
      showToast('Please provide both name and email')
      return
    }

    setIsSaving(true)
    setError('')

    try {
      const response = await teamManageApi.addTeamUsers(accessToken, [
        {
          name: addFormData.name.trim(),
          email: addFormData.email.trim(),
        },
      ])
      setAddFormData({ name: '', email: '' })
      showToast(response.message || 'Invitation sent and user added successfully')
      await loadUsers()
    } catch (err) {
      setError(err.message || 'Unable to add team user.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleSaveUserInfo = async (event) => {
    event.preventDefault()
    if (!activeUser) return

    setIsSaving(true)
    setError('')

    try {
      await teamManageApi.updateTeamUser(accessToken, activeUser.id, {
        name: editFormData.name.trim(),
        email: editFormData.email.trim(),
      })
      showToast('User details saved successfully')
      await loadUsers()
    } catch (err) {
      setError(err.message || 'Unable to save user details.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancelUserInfo = () => {
    setActiveUserId(null)
    setSelectedIds([])
    showToast('Closed edit mode')
  }

  const handleImportCsv = async (event) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    setIsSaving(true)
    setError('')

    try {
      const response = await teamManageApi.importTeamUsers(accessToken, file)
      setImportOpen(false)
      showToast(response.message || `${response.added_count || 0} users imported successfully`)
      await loadUsers()
    } catch (err) {
      setError(err.message || 'Unable to import team users.')
    } finally {
      setIsSaving(false)
    }
  }

  const applyFilter = () => {
    setCurrentPage(1)
    setFilter(filterInput)
  }

  const applySearch = () => {
    setCurrentPage(1)
    setSearch(searchInput.trim())
  }

  return (
    <main className="team-users-page min-h-full px-2 py-2 text-[#888] md:px-10 md:py-4">
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 rounded bg-[#151d56] px-4 py-2.5 text-sm text-white shadow-lg transition-all">
          {toastMessage}
        </div>
      )}

      <h1 className="mb-4 text-xl font-normal text-[#999] md:text-2xl">
        Manage team users
      </h1>

      <div className="mb-4 space-y-0.5 text-xs font-bold text-[#333]">
        <p>Plan: Up to {maxMembers} users</p>
        <p>Total in list: {totalUsers}</p>
        <p>Enrolled user total: {enrolledTotal}</p>
        <p>Slots remaining: {slotsRemaining}</p>
      </div>

      {error && (
        <div className="mb-4 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-7 xl:grid-cols-[1.75fr_0.9fr] 2xl:grid-cols-[1.85fr_0.9fr]">
        <section className="flex flex-col min-w-0">
          <div className="mb-2.5 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="text-[#666]">Filter:</span>
              <select
                value={filterInput}
                onChange={(event) => setFilterInput(event.target.value)}
                className="h-6 rounded border border-[#ccc] bg-white px-1 text-xs outline-none"
              >
                <option value="All">All</option>
                <option value="Yes">Enrolled (Yes)</option>
                <option value="No">Not Enrolled (No)</option>
              </select>
              <button
                type="button"
                onClick={applyFilter}
                className="h-6 rounded border border-[#ccc] bg-[#efefef] px-2.5 text-xs font-normal text-[#333] hover:bg-[#e4e4e4] active:bg-[#d5d5d5] cursor-pointer"
              >
                Go
              </button>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-[#666]">Search:</span>
              <input
                type="text"
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                onKeyDown={(event) => event.key === 'Enter' && applySearch()}
                placeholder="Search by name or email"
                className="h-6 w-36 rounded border border-[#ccc] bg-white px-2 text-xs outline-none md:w-44"
              />
              <button
                type="button"
                onClick={applySearch}
                className="h-6 rounded border border-[#ccc] bg-[#efefef] px-2.5 text-xs font-normal text-[#333] hover:bg-[#e4e4e4] active:bg-[#d5d5d5] cursor-pointer"
              >
                Go
              </button>
            </div>
          </div>

          <div className="overflow-x-auto border border-[#eee]">
            <table className="w-full min-w-[620px] border-collapse text-left text-xs">
              <thead>
                <tr className="h-8 border-b border-[#eee] bg-[#f3f3f3] uppercase text-[#888] font-normal">
                  <th className="w-8 px-2 text-center">
                    <input
                      type="checkbox"
                      checked={isAllVisibleSelected}
                      onChange={(event) => handleToggleSelectAll(event.target.checked)}
                      className="cursor-pointer accent-[#ff823d]"
                      aria-label="Select all team users"
                    />
                  </th>
                  <th className="px-3 py-1 font-semibold tracking-wider">NAME</th>
                  <th className="px-3 py-1 font-semibold tracking-wider">EMAIL</th>
                  <th className="px-3 py-1 font-semibold tracking-wider">ENROLLED</th>
                  <th className="w-20 px-4 py-1 text-center font-semibold tracking-wider">
                    EDIT/<br className="sm:hidden" />VIEW
                  </th>
                  <th className="w-28 px-4 py-1 text-center font-semibold tracking-wider">
                    ROUTE <br className="sm:hidden" />HISTORY
                  </th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-[#888]">
                      Loading team users...
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-[#888]">
                      No team users found matching criteria.
                    </td>
                  </tr>
                ) : (
                  users.map((user) => {
                    const isSelected = selectedIds.includes(user.id)
                    const isActive = activeUserId === user.id
                    return (
                      <tr
                        key={user.id}
                        onClick={() => handleSelectUser(user)}
                        className={`h-8 border-b border-[#f0f0f0] cursor-pointer transition-colors ${
                          isActive
                            ? 'bg-[#fff3eb]'
                            : isSelected
                            ? 'bg-[#fef8f4]'
                            : 'even:bg-[#f9f9f9] hover:bg-[#f5f5f5]'
                        }`}
                      >
                        <td className="px-2 text-center" onClick={(event) => event.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(event) => handleToggleSelectRow(user.id, event)}
                            className="cursor-pointer accent-[#ff823d]"
                            aria-label={`Select ${user.name}`}
                          />
                        </td>
                        <td className="px-3 py-1 font-normal text-[#444] whitespace-nowrap">
                          {user.name}
                        </td>
                        <td className="px-3 py-1 text-[#666] whitespace-nowrap">
                          {user.email}
                        </td>
                        <td className="px-3 py-1 text-[#666] whitespace-nowrap">
                          {user.enrolled_display || (user.is_enrolled ? 'Yes' : 'No')}
                        </td>
                        <td className="px-4 py-1 text-center" onClick={(event) => event.stopPropagation()}>
                          <button
                            type="button"
                            onClick={() => handleSelectUser(user)}
                            className="text-[#777] hover:text-[#ff823d] p-0.5 cursor-pointer inline-flex items-center justify-center"
                            aria-label={`Edit ${user.name}`}
                          >
                            <Pencil size={15} />
                          </button>
                        </td>
                        <td className="px-4 py-1 text-center" onClick={(event) => event.stopPropagation()}>
                          <button
                            type="button"
                            onClick={() => navigate(getRouteHistoryPath(user))}
                            className="text-[#777] hover:text-[#ff823d] p-0.5 cursor-pointer inline-flex items-center justify-center"
                            aria-label={`Route history for ${user.name}`}
                          >
                            <History size={16} />
                          </button>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="flex flex-wrap items-center justify-between border-b border-[#eee] py-2 text-xs text-[#777]">
            <span>{selectedIds.length} of {totalUsers} selected</span>
            <span>Page {currentPage} of {totalPages}</span>
            <div className="flex items-center gap-1.5 underline cursor-pointer">
              <button
                type="button"
                disabled={!pagination?.has_previous || isLoading}
                onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                className="hover:text-black cursor-pointer disabled:cursor-not-allowed disabled:opacity-40"
              >
                Previous
              </button>
              <span className="px-0.5 font-bold text-black">{currentPage}</span>
              <button
                type="button"
                disabled={!pagination?.has_next || isLoading}
                onClick={() => setCurrentPage((page) => page + 1)}
                className="hover:text-black cursor-pointer disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2.5 rounded-lg border border-[#e7e7e7] bg-[#fafafa] p-2.5">
            <button
              type="button"
              onClick={handleDelete}
              disabled={isSaving}
              className="rounded bg-[#ff823d] px-4 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-[#e56f2d] disabled:opacity-60 cursor-pointer"
            >
              DELETE
            </button>
            <button
              type="button"
              onClick={handleDownload}
              disabled={isSaving}
              className="rounded bg-[#151d56] px-4 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-[#0e143d] disabled:opacity-60 cursor-pointer"
            >
              DOWNLOAD
            </button>
            <button
              type="button"
              onClick={handleCancel}
              disabled={isSaving}
              className="rounded bg-[#151d56] px-4 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-[#0e143d] disabled:opacity-60 cursor-pointer"
            >
              CANCEL
            </button>
          </div>
        </section>

        <section className="flex flex-col min-w-0">
          <div className="mb-2 text-xs font-bold uppercase tracking-wider text-[#999]">
            {activeUser ? 'ADD/EDIT USER' : 'ADD/EDIT USERS'}
          </div>

          <div className="flex-1 overflow-y-auto border border-[#ccc] bg-white p-3.5 min-h-[380px] max-h-[610px] text-xs space-y-3">
            <div className="border border-[#e2e2e2] bg-[#f8f8f8] px-3 py-2 rounded-sm">
              <p className="text-[11px] font-bold uppercase tracking-wide text-[#555]">
                TYPE OR IMPORT USERS: FIRST LAST NAME, EMAIL
              </p>
            </div>

            {activeUser ? (
              <form onSubmit={handleSaveUserInfo} id="teamUserEditForm" className="space-y-3 text-[#555]">
                <h2 className="text-sm font-bold text-[#222]">
                  Edit: {activeUser.name}
                </h2>

                <div className="flex flex-col gap-1">
                  <label className="font-bold text-[#333]">Name:</label>
                  <input
                    type="text"
                    value={editFormData.name}
                    onChange={(event) => setEditFormData({ ...editFormData, name: event.target.value })}
                    className="h-7 w-full rounded-sm border border-[#ccc] px-2 text-xs text-[#444] outline-none focus:border-[#ff823d]"
                    required
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="font-bold text-[#333]">Email:</label>
                  <input
                    type="email"
                    value={editFormData.email}
                    onChange={(event) => setEditFormData({ ...editFormData, email: event.target.value })}
                    className="h-7 w-full rounded-sm border border-[#ccc] px-2 text-xs text-[#444] outline-none focus:border-[#ff823d]"
                    required
                  />
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <label className="font-bold text-[#333]">Enrolled:</label>
                  <span>{activeUser.is_enrolled ? 'Yes (Enrolled)' : 'No (Not enrolled)'}</span>
                </div>
              </form>
            ) : (
              <form onSubmit={handleAddUser} id="teamUserAddForm" className="space-y-3 text-[#555]">
                <h2 className="text-sm font-bold text-[#222]">
                  Add New Team User
                </h2>

                <div className="flex flex-col gap-1">
                  <label className="font-bold text-[#333]">First & Last Name:</label>
                  <input
                    type="text"
                    placeholder="e.g. John Doe"
                    value={addFormData.name}
                    onChange={(event) => setAddFormData({ ...addFormData, name: event.target.value })}
                    className="h-7 w-full rounded-sm border border-[#ccc] px-2 text-xs text-[#444] outline-none focus:border-[#ff823d]"
                    required
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="font-bold text-[#333]">Email Address:</label>
                  <input
                    type="email"
                    placeholder="e.g. johndoe@company.com"
                    value={addFormData.email}
                    onChange={(event) => setAddFormData({ ...addFormData, email: event.target.value })}
                    className="h-7 w-full rounded-sm border border-[#ccc] px-2 text-xs text-[#444] outline-none focus:border-[#ff823d]"
                    required
                  />
                </div>
              </form>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-between border-b border-[#eee] py-2 text-xs text-[#777]">
            <span>{slotsRemaining} users remaining</span>
            <button
              type="button"
              onClick={() => navigate('/dashboard/manage/plan')}
              className="text-[#1d2464] font-medium underline hover:text-[#ff823d] cursor-pointer"
            >
              Upgrade plan
            </button>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2.5 rounded-lg border border-[#e7e7e7] bg-[#fafafa] p-2.5">
            {activeUser ? (
              <>
                <button
                  type="submit"
                  form="teamUserEditForm"
                  disabled={isSaving}
                  className="rounded bg-[#ff823d] px-5 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-[#e56f2d] disabled:opacity-60 cursor-pointer"
                >
                  SAVE
                </button>
                <button
                  type="button"
                  onClick={handleCancelUserInfo}
                  disabled={isSaving}
                  className="rounded bg-[#151d56] px-5 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-[#0e143d] disabled:opacity-60 cursor-pointer"
                >
                  CANCEL
                </button>
              </>
            ) : (
              <>
                <button
                  type="submit"
                  form="teamUserAddForm"
                  disabled={isSaving}
                  className="rounded bg-[#ff823d] px-5 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-[#e56f2d] disabled:opacity-60 cursor-pointer"
                >
                  SEND INVITE
                </button>
                <button
                  type="button"
                  onClick={() => setImportOpen(true)}
                  disabled={isSaving}
                  className="rounded bg-[#151d56] px-4 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-[#0e143d] disabled:opacity-60 cursor-pointer flex items-center gap-1.5"
                >
                  <Upload size={13} />
                  IMPORT
                </button>
                <button
                  type="button"
                  onClick={() => setAddFormData({ name: '', email: '' })}
                  disabled={isSaving}
                  className="rounded bg-[#666] px-4 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-[#555] disabled:opacity-60 cursor-pointer"
                >
                  CANCEL
                </button>
              </>
            )}
          </div>
        </section>
      </div>

      {importOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div
            role="dialog"
            aria-modal="true"
            className="w-full max-w-sm rounded border border-[#ccc] bg-white p-5 shadow-lg"
          >
            <div className="mb-4 flex justify-between">
              <h2 className="font-semibold text-[#444]">Import team users</h2>
              <button
                type="button"
                onClick={() => setImportOpen(false)}
                aria-label="Close import dialog"
                className="text-[#666] hover:text-[#111] cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>
            <p className="mb-4 text-xs text-[#666]">
              Choose a CSV file containing name and email columns.
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 rounded bg-[#ff823d] px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-[#e56f2d] cursor-pointer"
              >
                <Upload size={14} />
                Choose CSV
              </button>
              <button
                type="button"
                onClick={() => setImportOpen(false)}
                className="cursor-pointer rounded border border-[#bbb] px-3.5 py-1.5 text-xs font-semibold text-[#555] hover:bg-[#f0f0f0]"
              >
                Cancel
              </button>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,text/csv"
              onChange={handleImportCsv}
              className="hidden"
            />
          </div>
        </div>
      )}
    </main>
  )
}

export default TeamUser