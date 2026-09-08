
import { useState } from 'react'
import { useNavigate } from 'react-router'

const initialAdminUsers = [
  { name: 'John Doe', role: 'Super Admin', id: 'USR-1001', status: 'Allowed', isSuperAdmin: true },
  { name: 'Suzy Cue', role: 'Fleet Acct Mgmt', id: 'USR-1785', status: 'Allowed', isSuperAdmin: false },
  { name: 'G. I. Joe', role: 'Customer Support', id: 'USR-1513', status: 'Locked', isSuperAdmin: false },
  { name: 'Tom Thumb', role: 'Revenue Metrics', id: 'USR-2549', status: 'Allowed', isSuperAdmin: false },
  { name: 'Jimmy Hendrix', role: 'Subscription Mgmt', id: 'USR-8391', status: 'Allowed', isSuperAdmin: false },
  { name: 'Sponge Bob', role: 'Audit Log Mgmt', id: 'USR-0127', status: 'Allowed', isSuperAdmin: false },
  { name: 'Robin Hood', role: 'Marketing', id: 'USR-4567', status: 'Allowed', isSuperAdmin: false },
]

const currentSuperAdminId = 'USR-1001'

const actionButtonClass =
  'w-36 rounded-full bg-[#888] px-3 py-1 text-center text-[10px] text-white  cursor-pointer'

const AdminUser = () => {
  const [adminUsers, setAdminUsers] = useState(initialAdminUsers)
  const [selectedUsers, setSelectedUsers] = useState([])
  const [selectedAction, setSelectedAction] = useState('')
  const navigate = useNavigate()

  const toggleUser = (userId) => {
    setSelectedUsers((currentUsers) =>
      currentUsers.includes(userId)
        ? currentUsers.filter((selectedId) => selectedId !== userId)
        : [...currentUsers, userId],
    )
  }

  const toggleAllUsers = () => {
    setSelectedUsers((currentUsers) =>
      currentUsers.length === adminUsers.length ? [] : adminUsers.map((user) => user.id),
    )
  }

  const applyAction = () => {
    if (!selectedAction) {
      alert('Please choose an action first.')
      return
    }

    if (!selectedUsers.length) {
      alert('Please select at least one user.')
      return
    }

    const selectedItems = adminUsers.filter((user) => selectedUsers.includes(user.id))

    const superAdminSelfProtection = selectedItems.some(
      (user) => user.id === currentSuperAdminId && ['delete-user', 'lock-user'].includes(selectedAction),
    )

    if (superAdminSelfProtection) {
      alert('A Super Admin user cannot delete himself or lock himself out of the dashboard.')
      return
    }

    const currentSuperAdmin = adminUsers.find((user) => user.id === currentSuperAdminId)
    const nonSuperAdminCanNotAffectSuperAdmin =
      currentSuperAdmin &&
      !currentSuperAdmin.isSuperAdmin &&
      selectedItems.some((user) => user.isSuperAdmin)

    if (nonSuperAdminCanNotAffectSuperAdmin) {
      alert('A Super Admin user cannot be deleted or locked out by any user who is not a Super Admin.')
      return
    }

    if (selectedAction === 'delete-user') {
      setAdminUsers((currentUsers) => currentUsers.filter((user) => !selectedUsers.includes(user.id)))
    }

    if (selectedAction === 'lock-user') {
      setAdminUsers((currentUsers) =>
        currentUsers.map((user) =>
          selectedUsers.includes(user.id) ? { ...user, status: 'Locked' } : user,
        ),
      )
    }

    if (selectedAction === 'unlock-user') {
      setAdminUsers((currentUsers) =>
        currentUsers.map((user) =>
          selectedUsers.includes(user.id) ? { ...user, status: 'Allowed' } : user,
        ),
      )
    }

    setSelectedUsers([])
    setSelectedAction('')
  }

  return (
    <div className="min-h-full  px-2 py-2 text-[#888] md:px-10 md:py-4">
      <div className="mb-16 flex items-center justify-between">
        <h1 className="text-xl font-normal text-[#999] md:text-2xl">Admin user list</h1>
        <button
          type="button"
          onClick={() => navigate('/dashboard/manage/admin-users/add-user')}
          className={actionButtonClass}
        >
          ADD ADMIN USER <span className="font-bold">+</span>
        </button>
      </div>

      <div className="mb-2 flex items-center gap-1 text-[11px]">
        <label htmlFor="admin-action">Action:</label>
        <select
          id="admin-action"
          value={selectedAction}
          onChange={(event) => setSelectedAction(event.target.value)}
          className="h-6 w-48 border border-[#ccc] bg-white px-1 text-[11px] text-[#777]"
        >
          <option value="">-----------</option>
          <option value="delete-user">Delete user</option>
          <option value="lock-user">Lock out user</option>
          <option value="unlock-user">Unlock user</option>
        </select>
        <button type="button" onClick={applyAction} className="h-6 border border-[#ccc] bg-[#f2f2f2] px-2 text-[10px]">
          Go
        </button>
        <span className="ml-2">{selectedUsers.length} of {adminUsers.length} selected</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[650px] border-collapse text-left text-[11px]">
          <thead>
            <tr className="h-7 bg-[#f5f5f5] text-[10px] font-semibold uppercase text-[#999]">
              <th className="w-8 px-2">
                <input
                  type="checkbox"
                  checked={selectedUsers.length === adminUsers.length}
                  onChange={toggleAllUsers}
                  aria-label="Select all admin users"
                />
              </th>
              <th className="px-2">Admin users</th>
              <th className="px-2">User role</th>
              <th className="px-2">User ID</th>
              <th className="px-2">Access status</th>
            </tr>
          </thead>
          <tbody>
            {adminUsers.map((user) => (
              <tr key={user.id} className="h-7 border-b border-white bg-[#f5f5f5] even:bg-[#fafafa]">
                <td className="px-2">
                  <input
                    type="checkbox"
                    checked={selectedUsers.includes(user.id)}
                    onChange={() => toggleUser(user.id)}
                    aria-label={`Select ${user.name}`}
                  />
                </td>
                <td className="px-2">
                  <button
                    type="button"
                    onClick={() => navigate(`/dashboard/manage/admin-users/edit/${user.id}`)}
                    className="underline underline-offset-2 cursor-pointer"
                  >
                    {user.name}
                  </button>
                </td>
                <td className="px-2">{user.role}</td>
                <td className="px-2">{user.id}</td>
                <td className="px-2">{user.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-3 border-b border-[#eee] pb-3 text-[11px]">{adminUsers.length} admin users</p>
    </div>
  )
}

export default AdminUser
