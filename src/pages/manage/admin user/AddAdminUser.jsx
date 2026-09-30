import { useCallback, useEffect, useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { useNavigate } from 'react-router'
import { useAuth } from '../../../context/useAuth'
import { teamManageApi } from '../../../services/teamManageApi'

const defaultFormData = {
  full_name: '',
  email: '',
  phone: '',
  role_label: 'Team Admin',
}

const AddAdminUser = () => {
  const navigate = useNavigate()
  const { accessToken } = useAuth()
  const [showPassword, setShowPassword] = useState(false)
  const [password, setPassword] = useState('')
  const [formData, setFormData] = useState(defaultFormData)
  const [selectedPermissions, setSelectedPermissions] = useState([])
  const [permissionTree, setPermissionTree] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')

  const loadPermissions = useCallback(async (signal) => {
    if (!accessToken) return

    setIsLoading(true)
    setError('')

    try {
      const data = await teamManageApi.getPermissionsTree(accessToken, { signal })
      setPermissionTree(Array.isArray(data.permission_tree) ? data.permission_tree : [])
    } catch (err) {
      if (err.name !== 'AbortError') {
        setError(err.message || 'Unable to load permissions.')
      }
    } finally {
      setIsLoading(false)
    }
  }, [accessToken])

  useEffect(() => {
    const controller = new AbortController()
    const timeoutId = window.setTimeout(() => {
      loadPermissions(controller.signal)
    }, 0)

    return () => {
      window.clearTimeout(timeoutId)
      controller.abort()
    }
  }, [loadPermissions])

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleToggleGroup = (group) => {
    const allGroupKeys = (group.children || []).map((item) => item.key)
    const isGroupChecked = allGroupKeys.length > 0 && allGroupKeys.every((key) =>
      selectedPermissions.includes(key),
    )

    setSelectedPermissions((prev) =>
      isGroupChecked
        ? prev.filter((key) => !allGroupKeys.includes(key))
        : Array.from(new Set([...prev, ...allGroupKeys])),
    )
  }

  const handleToggleItem = (key) => {
    setSelectedPermissions((prev) =>
      prev.includes(key)
        ? prev.filter((permission) => permission !== key)
        : [...prev, key],
    )
  }

  const generatePassword = async () => {
    setError('')

    try {
      const response = await teamManageApi.generateAdminPassword(accessToken)
      setPassword(response.password || '')
    } catch (err) {
      setError(err.message || 'Unable to generate password.')
    }
  }

  const handleAddSubmit = async (event) => {
    event.preventDefault()
    setIsSaving(true)
    setError('')

    try {
      await teamManageApi.createAdminUser(accessToken, {
        ...formData,
        password,
        permissions_json: selectedPermissions,
      })
      navigate('/dashboard/manage/admin-users')
    } catch (err) {
      setError(err.message || 'Unable to add admin user.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="min-h-full px-2 py-2 text-[#888] md:px-10 md:py-4">
      <h1 className="mx-auto mb-8 max-w-5xl text-xl font-normal text-[#999] md:text-2xl">
        Add admin user
      </h1>

      {error && (
        <div className="mx-auto mb-4 max-w-5xl rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <form className="mx-auto max-w-5xl" onSubmit={handleAddSubmit}>
        <div className="space-y-2">
          {[
            ['Name:', 'full_name', formData.full_name, 'text'],
            ['Email:', 'email', formData.email, 'email'],
            ['Phone:', 'phone', formData.phone, 'tel'],
            ['Role:', 'role_label', formData.role_label, 'text'],
          ].map(([label, field, val, type]) => (
            <div key={label} className="flex items-center border-b border-[#e5e5e5] pb-2">
              <label className="w-36 px-2 text-xs font-semibold">{label}</label>
              <input
                type={type}
                value={val}
                onChange={(event) => handleInputChange(field, event.target.value)}
                placeholder={label.replace(':', '')}
                aria-label={label.replace(':', '')}
                className="h-7 w-60 rounded border border-[#d5d5d5] px-2 text-xs text-gray-600 outline-none focus:border-[#1d2464]"
                required={field === 'full_name' || field === 'email'}
              />
            </div>
          ))}

          <div className="flex items-center border-b border-[#e5e5e5] pb-2">
            <label className="w-36 px-2 text-xs font-semibold">Password:</label>
            <div className="flex items-center gap-2">
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  aria-label="Password"
                  className="h-7 w-60 rounded border border-[#d5d5d5] bg-white px-2 pr-8 text-xs text-gray-600 outline-none"
                  required
                  minLength={8}
                />
                <button
                  type="button"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  onClick={() => setShowPassword((value) => !value)}
                  className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center justify-center text-[#666] hover:text-[#1d2464]"
                >
                  {showPassword ? <EyeOff size={14} strokeWidth={2} /> : <Eye size={14} strokeWidth={2} />}
                </button>
              </div>
              <button
                type="button"
                onClick={generatePassword}
                className="inline-flex items-center gap-1 rounded border border-[#cfcfcf] bg-[#f5f5f5] px-2 py-1 text-[11px] text-[#4a4a4a] hover:bg-[#e8e8e8] cursor-pointer"
              >
                Generate
              </button>
            </div>
          </div>
        </div>

        <fieldset className="mt-4 flex border-b border-[#e5e5e5] py-4">
          <legend className="w-36 px-2 text-xs font-semibold text-[#555]">
            Permissions:
          </legend>
          <div className="grid flex-1 grid-cols-1 gap-x-12 gap-y-4 md:grid-cols-2">
            {isLoading ? (
              <p className="text-xs text-[#666]">Loading permissions...</p>
            ) : permissionTree.map((group) => {
              const children = group.children || []
              const childKeys = children.map((item) => item.key)
              const isGroupChecked = childKeys.length > 0 && childKeys.every((key) =>
                selectedPermissions.includes(key),
              )
              return (
                <div key={group.key} className="space-y-1">
                  <div>
                    <label className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#444] cursor-pointer w-max">
                      <input
                        type="checkbox"
                        checked={isGroupChecked}
                        onChange={() => handleToggleGroup(group)}
                        className="accent-[#ff823d] cursor-pointer"
                      />
                      <span>{group.label}</span>
                    </label>
                  </div>
                  <div className="ml-5 space-y-1 flex flex-col items-start">
                    {children.map((item) => (
                      <label key={item.key} className="inline-flex items-center gap-1.5 text-xs text-[#666] cursor-pointer w-max">
                        <input
                          type="checkbox"
                          checked={selectedPermissions.includes(item.key)}
                          onChange={() => handleToggleItem(item.key)}
                          className="accent-[#ff823d] cursor-pointer"
                        />
                        <span>{item.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </fieldset>

        <div className="mt-6 flex gap-2 rounded-lg border border-[#e5e5e5] bg-[#fafafa] p-3">
          <button
            type="submit"
            disabled={isSaving}
            className="rounded bg-[#1d2464] px-4 py-2 text-xs font-bold text-white hover:bg-[#ff823d] transition-colors disabled:opacity-60 cursor-pointer"
          >
            ADD
          </button>
          <button
            type="button"
            onClick={() => navigate('/dashboard/manage/admin-users')}
            className="rounded bg-[#1d2464] px-4 py-2 text-xs font-bold text-white hover:bg-[#ff823d] transition-colors cursor-pointer"
          >
            CANCEL
          </button>
        </div>
      </form>
    </div>
  )
}

export default AddAdminUser