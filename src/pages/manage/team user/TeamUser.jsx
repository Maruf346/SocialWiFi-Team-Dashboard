import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { History, X } from 'lucide-react'
import { useNavigate } from 'react-router'
import { useAuth } from '../../../context/useAuth'
import { teamManageApi } from '../../../services/teamManageApi'

const PAGE_SIZE = 20
const emptyUser = () => ({ id: crypto.randomUUID(), name: '', email: '' })

const filterToApiValue = (filter) => filter === 'Yes' ? 'yes' : filter === 'No' ? 'no' : undefined

const splitCsvRow = (row) => {
  const cells = []
  let cell = ''
  let quoted = false
  for (let index = 0; index < row.length; index += 1) {
    const character = row[index]
    if (character === '"' && quoted && row[index + 1] === '"') {
      cell += '"'
      index += 1
    } else if (character === '"') quoted = !quoted
    else if (character === ',' && !quoted) {
      cells.push(cell.trim())
      cell = ''
    } else cell += character
  }
  cells.push(cell.trim())
  return cells
}

const parseCsvText = (text) => {
  const lines = text.replace(/^\uFEFF/, '').split(/\r?\n/).filter((line) => line.trim())
  if (!lines.length) return []
  const firstRow = splitCsvRow(lines[0])
  const headers = firstRow.map((header) => header.toLowerCase().trim())
  const hasHeaders = headers.some((header) => header.includes('name') || header.includes('mail'))
  const nameIndex = headers.findIndex((header) => ['name', 'full name', 'first last name'].includes(header))
  const firstNameIndex = headers.findIndex((header) => ['first', 'first name', 'firstname'].includes(header))
  const lastNameIndex = headers.findIndex((header) => ['last', 'last name', 'lastname'].includes(header))
  const emailIndex = headers.findIndex((header) => ['email', 'email address', 'e-mail'].includes(header))
  return (hasHeaders ? lines.slice(1) : lines).map(splitCsvRow).map((row) => {
    const emailCellIndex = emailIndex >= 0 ? emailIndex : row.findIndex((cell) => cell.includes('@'))
    const email = emailCellIndex >= 0 ? row[emailCellIndex]?.trim() : ''
    let name = nameIndex >= 0 ? row[nameIndex]?.trim() : ''
    if (!name && firstNameIndex >= 0) name = `${row[firstNameIndex] || ''} ${lastNameIndex >= 0 ? row[lastNameIndex] || '' : ''}`.trim()
    if (!name) name = row.find((cell, index) => index !== emailCellIndex && cell.trim())?.trim() || ''
    return { id: crypto.randomUUID(), name, email }
  }).filter((user) => user.name || user.email)
}

const getRouteHistoryPath = (user) => {
  const params = new URLSearchParams()
  const id = user.user_id || user.id
  if (id) params.set('user_id', id)
  if (user.name) params.set('driver_name', user.name)
  if (user.email) params.set('user_email', user.email)
  return `/dashboard/manage/team-route-history?${params.toString()}`
}

const downloadFile = (content) => {
  const url = URL.createObjectURL(new Blob([content], { type: 'text/csv;charset=utf-8;' }))
  const link = document.createElement('a')
  link.href = url
  link.download = 'team_users_export.csv'
  document.body.appendChild(link)
  link.click()
  link.remove()
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
  const [entryRows, setEntryRows] = useState([emptyUser()])
  const [filterInput, setFilterInput] = useState('All')
  const [filter, setFilter] = useState('All')
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [toastMessage, setToastMessage] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  const displayedUsers = useMemo(() => [...users].sort((a, b) => (a.name || '').localeCompare(b.name || '', undefined, { sensitivity: 'base' })), [users])
  const activeUser = useMemo(() => users.find((user) => user.id === activeUserId) || null, [users, activeUserId])
  const totalUsers = pagination?.total_count ?? planStats?.total_in_list ?? users.length
  const totalPages = pagination?.total_pages ?? 1
  const maxMembers = planStats?.max_members ?? '—'
  const enrolledTotal = planStats?.enrolled_count ?? users.filter((user) => user.is_enrolled).length
  const slotsRemaining = planStats?.slots_remaining ?? '—'
  const allVisibleSelected = displayedUsers.length > 0 && displayedUsers.every((user) => selectedIds.includes(user.id))

  const showToast = (message) => {
    setToastMessage(message)
    window.setTimeout(() => setToastMessage(''), 2500)
  }
  const resetEntryPanel = () => {
    setActiveUserId(null)
    setEntryRows([emptyUser()])
  }

  const loadUsers = useCallback(async (signal) => {
    if (!accessToken) return
    setIsLoading(true)
    setError('')
    try {
      const data = await teamManageApi.listTeamUsers(accessToken, {
        page: currentPage, page_size: PAGE_SIZE, search,
        enrolled: filterToApiValue(filter), ordering: 'first_name',
      }, { signal })
      setUsers(Array.isArray(data.results) ? data.results : [])
      setPlanStats(data.plan_stats || null)
      setPagination(data.pagination || null)
      setSelectedIds([])
    } catch (loadError) {
      if (loadError.name !== 'AbortError') setError(loadError.message || 'Unable to load team users.')
    } finally { setIsLoading(false) }
  }, [accessToken, currentPage, filter, search])

  useEffect(() => {
    const controller = new AbortController()
    const timeoutId = window.setTimeout(() => loadUsers(controller.signal), 0)
    return () => {
      window.clearTimeout(timeoutId)
      controller.abort()
    }
  }, [loadUsers])

  const openUserForEdit = (user) => {
    setActiveUserId(user.id)
    setEntryRows([{ id: user.id, name: user.name || '', email: user.email || '' }])
  }
  const updateEntry = (id, field, value) => setEntryRows((rows) => rows.map((row) => row.id === id ? { ...row, [field]: value } : row))
  const removeEntry = (id) => {
    if (activeUserId) return resetEntryPanel()
    setEntryRows((rows) => rows.length === 1 ? [emptyUser()] : rows.filter((row) => row.id !== id))
  }

  const handleDelete = async () => {
    if (!selectedIds.length) return showToast('Select at least one user to remove')
    setIsSaving(true); setError('')
    try {
      await teamManageApi.removeTeamUsers(accessToken, selectedIds)
      showToast('Selected users removed')
      await loadUsers()
    } catch (saveError) { setError(saveError.message || 'Unable to remove selected users.') }
    finally { setIsSaving(false) }
  }

  const handleDownload = async () => {
    setIsSaving(true); setError('')
    try {
      const result = await teamManageApi.downloadTeamUsers(accessToken)
      downloadFile(typeof result === 'string' ? result : JSON.stringify(result, null, 2))
      showToast('User list downloaded')
    } catch (downloadError) { setError(downloadError.message || 'Unable to download team users.') }
    finally { setIsSaving(false) }
  }

  const handleListCancel = () => {
    setFilterInput('All'); setFilter('All'); setSearchInput(''); setSearch('')
    setSelectedIds([]); setCurrentPage(1)
  }

  const handleSendInvites = async () => {
    if (!selectedIds.length) return showToast('Select at least one user to invite')
    setIsSaving(true); setError('')
    try {
      const response = await teamManageApi.sendTeamUserInvites(accessToken, selectedIds)
      showToast(response?.message || `Invite${selectedIds.length === 1 ? '' : 's'} sent`)
      await loadUsers()
    } catch (inviteError) { setError(inviteError.message || 'Unable to send invitations.') }
    finally { setIsSaving(false) }
  }

  const handleSubmitEntries = async () => {
    const prepared = entryRows.map(({ name, email }) => ({ name: name.trim(), email: email.trim() }))
    if (prepared.some((user) => !user.name || !user.email)) return showToast('Every row needs a name and email')
    setIsSaving(true); setError('')
    try {
      if (activeUser) {
        await teamManageApi.updateTeamUser(accessToken, activeUser.id, prepared[0])
        showToast('User details saved')
      } else {
        const response = await teamManageApi.addTeamUsers(accessToken, prepared)
        showToast(response?.message || `${prepared.length} user${prepared.length === 1 ? '' : 's'} added`)
      }
      resetEntryPanel()
      await loadUsers()
    } catch (saveError) { setError(saveError.message || `Unable to ${activeUser ? 'save' : 'add'} team users.`) }
    finally { setIsSaving(false) }
  }

  const handleImportCsv = async (event) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    setError('')
    try {
      const imported = parseCsvText(await file.text())
      if (!imported.length) throw new Error('No users found. Use CSV columns named Name and Email.')
      setActiveUserId(null)
      setEntryRows(imported)
      showToast(`${imported.length} user${imported.length === 1 ? '' : 's'} ready to add`)
    } catch (importError) { setError(importError.message || 'Unable to read the CSV file.') }
  }

  const applySearch = () => { setCurrentPage(1); setSearch(searchInput.trim()) }

  return (
    <main className="min-h-full px-1 py-1 text-[11px] text-[#777] sm:px-3 lg:px-5">
      {toastMessage && <div className="fixed bottom-5 right-5 z-50 rounded bg-[#202060] px-4 py-2 text-xs text-white shadow-lg">{toastMessage}</div>}
      <h1 className="mb-4 text-[18px] font-normal text-[#999]">Manage team users</h1>
      <div className="mb-3 leading-[17px] font-semibold text-[#202020]">
        <p>Plan: Up to {maxMembers} users</p><p>Total in list: {totalUsers}</p><p>Enrolled user total: {enrolledTotal}</p><p>Slots remaining: {slotsRemaining}</p>
      </div>
      {error && <div role="alert" className="mb-3 border border-red-200 bg-red-50 px-3 py-2 text-red-700">{error}</div>}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(570px,1.35fr)_minmax(390px,1fr)]">
        <section className="min-w-0">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-1.5">
              <label htmlFor="team-user-filter">Filter:</label>
              <select id="team-user-filter" value={filterInput} onChange={(event) => setFilterInput(event.target.value)} className="h-6 w-28 border border-[#cfcfcf] bg-white px-1 outline-none"><option value="All">All</option><option value="Yes">Enrolled</option><option value="No">Not enrolled</option></select>
              <button type="button" onClick={() => { setCurrentPage(1); setFilter(filterInput) }} className="h-6 border border-[#ccc] bg-[#eee] px-2 hover:bg-[#e3e3e3]">Go</button>
            </div>
            <div className="flex items-center gap-1.5">
              <label htmlFor="team-user-search">Search:</label>
              <input id="team-user-search" value={searchInput} onChange={(event) => setSearchInput(event.target.value)} onKeyDown={(event) => event.key === 'Enter' && applySearch()} className="h-6 w-44 border border-[#cfcfcf] px-2 outline-none" />
              <button type="button" onClick={applySearch} className="h-6 border border-[#ccc] bg-[#eee] px-2 hover:bg-[#e3e3e3]">Go</button>
            </div>
          </div>
          <div className="min-h-[488px] overflow-x-auto border border-[#e4e4e4] bg-white">
            <table className="w-full min-w-[565px] border-collapse text-left">
              <thead className="bg-[#f2f2f2] text-[10px] uppercase text-[#999]"><tr className="h-8 border-b border-[#ddd]">
                <th className="w-8 text-center"><input type="checkbox" checked={allVisibleSelected} onChange={(event) => setSelectedIds(event.target.checked ? displayedUsers.map((user) => user.id) : [])} className="accent-[#f28a43]" aria-label="Select all team users" /></th>
                <th className="px-2 font-semibold">Name</th><th className="px-2 font-semibold">Email</th><th className="px-2 font-semibold">Enrolled</th><th className="w-16 px-2 text-center font-semibold">Route<br />history</th>
              </tr></thead>
              <tbody>{isLoading ? <tr><td colSpan="5" className="py-10 text-center">Loading team users…</td></tr> : displayedUsers.length === 0 ? <tr><td colSpan="5" className="py-10 text-center">No team users found.</td></tr> : displayedUsers.map((user) => {
                const selected = selectedIds.includes(user.id)
                return <tr key={user.id} className={`h-[29px] border-b border-[#e8e8e8] ${selected ? 'bg-[#fff3eb]' : 'even:bg-[#f7f7f7]'}`}>
                  <td className="text-center"><input type="checkbox" checked={selected} onChange={() => setSelectedIds((ids) => ids.includes(user.id) ? ids.filter((id) => id !== user.id) : [...ids, user.id])} className="accent-[#f28a43]" aria-label={`Select ${user.name}`} /></td>
                  <td className="px-2"><button type="button" onClick={() => openUserForEdit(user)} className="text-left text-[#666] hover:text-[#ef7d36] hover:underline">{user.name}</button></td>
                  <td className="px-2">{user.email}</td><td className="px-2">{user.enrolled_display || (user.is_enrolled ? 'Yes' : 'No')}</td>
                  <td className="text-center"><button type="button" onClick={() => navigate(getRouteHistoryPath(user))} className="inline-flex text-[#999] hover:text-[#ef7d36]" aria-label={`Route history for ${user.name}`}><History size={17} /></button></td>
                </tr>
              })}</tbody>
            </table>
          </div>
          <div className="flex items-center justify-between py-2">
            <span>{selectedIds.length} of {totalUsers} selected</span><span>{totalUsers ? Math.min((currentPage - 1) * PAGE_SIZE + 1, totalUsers) : 0}-{Math.min(currentPage * PAGE_SIZE, totalUsers)} of {totalUsers} users</span>
            <div className="flex gap-2"><button type="button" disabled={!pagination?.has_previous || isLoading} onClick={() => setCurrentPage((page) => page - 1)} className="underline disabled:opacity-40">Previous</button><span>{currentPage}</span><span>of {totalPages}</span><button type="button" disabled={!pagination?.has_next || isLoading} onClick={() => setCurrentPage((page) => page + 1)} className="underline disabled:opacity-40">Next</button></div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2 rounded-lg border border-[#e7e7e7] bg-[#fafafa] p-3">
            <button type="button" onClick={handleDelete} disabled={isSaving} className="rounded bg-[#f18a43] px-4 py-2 font-medium text-white disabled:opacity-50">REMOVE</button>
            <button type="button" onClick={handleDownload} disabled={isSaving} className="rounded bg-[#232064] px-4 py-2 font-medium text-white disabled:opacity-50">DOWNLOAD</button>
            <button type="button" onClick={handleListCancel} disabled={isSaving} className="rounded bg-[#232064] px-4 py-2 font-medium text-white disabled:opacity-50">CANCEL</button>
            <button type="button" onClick={handleSendInvites} disabled={isSaving || !selectedIds.length} className="rounded bg-[#f18a43] px-4 py-2 font-medium text-white disabled:opacity-50">SEND INVITE</button>
          </div>
        </section>

        <section className="min-w-0">
          <div className="mb-2 flex h-6 items-center justify-between font-semibold text-[#333]">
            <span>{activeUser ? 'EDIT USER' : 'ADD/EDIT USERS'}</span>
            {!activeUser && <button type="button" onClick={() => setEntryRows((rows) => [...rows, emptyUser()])} className="rounded border border-[#bbb] bg-[#eee] px-2 py-1 text-[10px] font-normal text-[#777] hover:bg-[#e4e4e4]">Add Field</button>}
          </div>
          <div className="h-[488px] overflow-y-auto border border-[#dedede] bg-white p-3">
            <p className="mb-4 text-[10px] font-semibold uppercase tracking-wide text-[#aaa]">TYPE OR IMPORT USERS: FIRST LAST NAME, EMAIL</p>
            <div className="space-y-2">{entryRows.map((row) => <div key={row.id} className="grid grid-cols-[minmax(120px,0.9fr)_minmax(170px,1.2fr)_18px] items-center gap-2">
              <input type="text" value={row.name} onChange={(event) => updateEntry(row.id, 'name', event.target.value)} placeholder="First Last Name" className="h-7 rounded-lg border border-[#ccc] px-3 outline-none focus:border-[#ef7d36]" />
              <input type="email" value={row.email} onChange={(event) => updateEntry(row.id, 'email', event.target.value)} placeholder="Email" className="h-7 rounded-lg border border-[#ccc] px-3 outline-none focus:border-[#ef7d36]" />
              <button type="button" onClick={() => removeEntry(row.id)} className="text-red-600 hover:text-red-800" aria-label="Remove field"><X size={15} strokeWidth={3} /></button>
            </div>)}</div>
          </div>
          <div className="flex items-center gap-1 border-b border-[#e8e8e8] py-2"><span>{slotsRemaining} of {maxMembers} total users remaining</span><button type="button" onClick={() => navigate('/dashboard/manage/plan')} className="underline hover:text-[#ef7d36]">Upgrade plan</button></div>
          <div className="mt-4 flex gap-2 rounded-lg border border-[#e7e7e7] bg-[#fafafa] p-3">
            <button type="button" onClick={() => fileInputRef.current?.click()} disabled={isSaving || Boolean(activeUser)} className="rounded bg-[#f18a43] px-4 py-2 font-medium text-white disabled:opacity-50">IMPORT</button>
            <button type="button" onClick={handleSubmitEntries} disabled={isSaving} className="rounded bg-[#f18a43] px-5 py-2 font-medium text-white disabled:opacity-50">{activeUser ? 'SAVE' : 'ADD'}</button>
            <button type="button" onClick={resetEntryPanel} disabled={isSaving} className="rounded bg-[#232064] px-4 py-2 font-medium text-white disabled:opacity-50">CANCEL</button>
            <input ref={fileInputRef} type="file" accept=".csv,text/csv" onChange={handleImportCsv} className="hidden" />
          </div>
        </section>
      </div>
    </main>
  )
}

export default TeamUser
