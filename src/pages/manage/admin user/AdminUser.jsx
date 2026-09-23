import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import {
  getAdminUsers,
  deleteAdminUsers,
  lockAdminUsers,
  unlockAdminUsers,
} from '../../../utils/adminStore'

const currentSuperAdminId = 'USR-1001'

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

  // Total visible rows should be at least 7 to match mockup
  const emptyRowsCount = Math.max(0, 7 - adminUsers.length)

  return (
    <div className="min-h-full px-2 py-2 text-[#888] md:px-10 md:py-4">
      {/* Title & Add Button */}
      <div className="mb-7 flex items-center justify-between">
        <h1 className="text-[22px] font-normal text-[#999]">Admin user list</h1>
        <button
          type="button"
          onClick={() => navigate('/dashboard/manage/admin-users/add-user')}
          className="inline-flex items-center gap-1.5 rounded-full bg-[#707070] px-3.5 py-1.5 text-[11px] font-bold tracking-wider text-white transition-colors hover:bg-[#5a5a5a] cursor-pointer"
        >
          <span>ADD ADMIN USER</span>
          <span className="text-sm font-black leading-none">+</span>
        </button>
      </div>

      {/* Action Toolbar */}
      <div className="mb-3.5 flex items-center gap-2 text-[12px] text-[#555]">
        <label htmlFor="admin-action" className="font-normal text-[#555]">Action:</label>
        <select
          id="admin-action"
          value={selectedAction}
          onChange={(event) => setSelectedAction(event.target.value)}
          className="h-[26px] w-52 rounded-[2px] border border-[#b5b5b5] bg-white px-2 text-[12px] text-[#555] outline-none"
        >
          <option value="">---------</option>
          <option value="delete-user">Delete user</option>
          <option value="lock-user">Lock out user</option>
          <option value="unlock-user">Unlock user</option>
        </select>
        <button
          type="button"
          onClick={applyAction}
          className="h-[26px] rounded-[3px] border border-[#b5b5b5] bg-[#ebebeb] px-2.5 text-[11px] font-normal text-[#333] transition-colors hover:bg-[#dedede] cursor-pointer"
        >
          Go
        </button>
        <span className="ml-1 text-[12px] text-[#666]">
          {selectedUsers.length} of {adminUsers.length} selected
        </span>
      </div>

      {/* User Table */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[700px] border-collapse text-left text-[12px]">
          <thead>
            <tr className="h-9 bg-[#f5f5f5] text-[11px] font-bold uppercase tracking-wider text-[#777]">
              <th className="w-10 px-3 text-left">
                <input
                  type="checkbox"
                  checked={adminUsers.length > 0 && selectedUsers.length === adminUsers.length}
                  onChange={toggleAllUsers}
                  aria-label="Select all admin users"
                  className="h-4 w-4 rounded-[3px] border-[#ccc] cursor-pointer align-middle"
                />
              </th>
              <th className="px-3 font-bold tracking-wider text-[#777]">ADMIN USERS</th>
              <th className="px-3 font-bold tracking-wider text-[#777]">USER ROLE</th>
              <th className="px-3 font-bold tracking-wider text-[#777]">USER ID</th>
              <th className="px-3 font-bold tracking-wider text-[#777]">ACCESS STATUS</th>
            </tr>
          </thead>
          <tbody>
            {adminUsers.map((user, index) => {
              const isEvenRow = index % 2 === 1
              return (
                <tr
                  key={user.id}
                  className={`h-10 border-b border-[#ececec] transition-colors ${
                    isEvenRow ? 'bg-[#f5f5f5]' : 'bg-white'
                  }`}
                >
                  <td className="px-3 align-middle">
                    <input
                      type="checkbox"
                      checked={selectedUsers.includes(user.id)}
                      onChange={() => toggleUser(user.id)}
                      aria-label={`Select ${user.name}`}
                      className="h-4 w-4 rounded-[3px] border-[#ccc] cursor-pointer align-middle"
                    />
                  </td>
                  <td className="px-3 align-middle">
                    <button
                      type="button"
                      onClick={() => navigate(`/dashboard/manage/admin-users/edit/${user.id}`)}
                      className="text-[12px] font-normal text-[#444] underline underline-offset-2 transition-colors hover:text-[#111] cursor-pointer"
                    >
                      {user.name}
                    </button>
                  </td>
                  <td className="px-3 align-middle text-[12px] text-[#555]">{user.role}</td>
                  <td className="px-3 align-middle text-[12px] text-[#555]">{user.id}</td>
                  <td className="px-3 align-middle text-[12px] text-[#555]">{user.status}</td>
                </tr>
              )
            })}

            {/* Empty filler rows with checkboxes matching mockup */}
            {Array.from({ length: emptyRowsCount }).map((_, index) => {
              const rowIndex = adminUsers.length + index
              const isEvenRow = rowIndex % 2 === 1
              return (
                <tr
                  key={`empty-row-${index}`}
                  className={`h-10 border-b border-[#ececec] ${
                    isEvenRow ? 'bg-[#f5f5f5]' : 'bg-white'
                  }`}
                >
                  <td className="px-3 align-middle">
                    <input
                      type="checkbox"
                      disabled
                      aria-label="Empty row checkbox"
                      className="h-4 w-4 rounded-[3px] border-[#ccc] opacity-30 cursor-default align-middle"
                    />
                  </td>
                  <td className="px-3 align-middle"></td>
                  <td className="px-3 align-middle"></td>
                  <td className="px-3 align-middle"></td>
                  <td className="px-3 align-middle"></td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Row count summary */}
      <p className="mt-4 border-b border-[#e0e0e0] pb-3 text-[12px] text-[#666]">
        {adminUsers.length} admin users
      </p>
    </div>
  )
}

export default AdminUser
