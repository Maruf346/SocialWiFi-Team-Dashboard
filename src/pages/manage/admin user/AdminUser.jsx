import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import {
  getAdminUsers,
  deleteAdminUsers,
  lockAdminUsers,
  unlockAdminUsers,
} from '../../../utils/adminStore'

const currentSuperAdminId = 'USR-1001'

const actionButtonClass =
  'rounded-full bg-[#707070] hover:bg-[#5e5e5e] px-4 py-1.5 text-center text-[11px] font-bold text-white tracking-wider cursor-pointer inline-flex items-center gap-1 transition-colors'

const AdminUser = () => {
  const [adminUsers, setAdminUsers] = useState([])
  const [selectedUsers, setSelectedUsers] = useState([])
  const [selectedAction, setSelectedAction] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    setAdminUsers(getAdminUsers())
  }, [])

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
      const updated = deleteAdminUsers(selectedUsers)
      setAdminUsers(updated)
    }

    if (selectedAction === 'lock-user') {
      const updated = lockAdminUsers(selectedUsers)
      setAdminUsers(updated)
    }

    if (selectedAction === 'unlock-user') {
      const updated = unlockAdminUsers(selectedUsers)
      setAdminUsers(updated)
    }

    setSelectedUsers([])
    setSelectedAction('')
  }

  return (
    <div className="min-h-full px-2 py-2 text-[#888] md:px-10 md:py-4">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-xl font-normal text-[#999] md:text-2xl">Admin user list</h1>
        <button
          type="button"
          onClick={() => navigate('/dashboard/manage/admin-users/add-user')}
          className={actionButtonClass}
        >
          ADD ADMIN USER <span className="text-sm font-black leading-none">+</span>
        </button>
      </div>

      <div className="mb-2 flex items-center gap-1.5 text-[11px]">
        <label htmlFor="admin-action">Action:</label>
        <select
          id="admin-action"
          value={selectedAction}
          onChange={(event) => setSelectedAction(event.target.value)}
          className="h-6 w-44 border border-[#ccc] bg-white px-1 text-[11px] text-[#777] outline-none"
        >
          <option value="">-----------</option>
          <option value="delete-user">Delete user</option>
          <option value="lock-user">Lock out user</option>
          <option value="unlock-user">Unlock user</option>
        </select>
        <button
          type="button"
          onClick={applyAction}
          className="h-6 rounded-sm border border-[#ccc] bg-[#f2f2f2] px-2.5 text-[10px] text-[#555] hover:bg-[#e8e8e8] cursor-pointer"
        >
          Go
        </button>
        <span className="ml-2 text-[#777]">
          {selectedUsers.length} of {adminUsers.length} selected
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[650px] border-collapse text-left text-[11px]">
          <thead>
            <tr className="h-7 bg-[#f5f5f5] text-[10px] font-semibold uppercase text-[#999]">
              <th className="w-8 px-2">
                <input
                  type="checkbox"
                  checked={adminUsers.length > 0 && selectedUsers.length === adminUsers.length}
                  onChange={toggleAllUsers}
                  aria-label="Select all admin users"
                />
              </th>
              <th className="px-2 font-bold tracking-wider">ADMIN USERS</th>
              <th className="px-2 font-bold tracking-wider">USER ROLE</th>
              <th className="px-2 font-bold tracking-wider">USER ID</th>
              <th className="px-2 font-bold tracking-wider">ACCESS STATUS</th>
            </tr>
          </thead>
          <tbody>
            {adminUsers.map((user, index) => {
              const isEvenRow = index % 2 === 1
              return (
                <tr
                  key={user.id}
                  className={`h-7 border-b border-[#ececec] ${
                    isEvenRow ? 'bg-[#f5f5f5]' : 'bg-white'
                  }`}
                >
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
                      className="text-[#3b5998] hover:underline cursor-pointer"
                    >
                      {user.name}
                    </button>
                  </td>
                  <td className="px-2 text-[#555]">{user.role}</td>
                  <td className="px-2 text-[#555]">{user.id}</td>
                  <td className="px-2 text-[#555]">{user.status}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <p className="mt-3 border-b border-[#eee] pb-3 text-[11px] text-[#777]">
        {adminUsers.length} admin users
      </p>
    </div>
  )
}

export default AdminUser
