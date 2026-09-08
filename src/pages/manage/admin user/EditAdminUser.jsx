import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { useNavigate, useParams } from 'react-router'

const users = {
  "USR-1001": {
    name: "John Doe",
    email: "Johnd@gmail.com",
    phone: "701-555-1234",
    role: "User Management",
  },
  "USR-1785": {
    name: "Suzy Cue",
    email: "suzy@gmail.com",
    phone: "612-123-4567",
    role: "Fleet Acct Mgmt",
  },
  "USR-1513": {
    name: "G. I. Joe",
    email: "gjoe@gmail.com",
    phone: "612-123-4567",
    role: "Customer Support",
  },
  "USR-2549": {
    name: "Tom Thumb",
    email: "tom@gmail.com",
    phone: "612-123-4567",
    role: "Revenue Metrics",
  },
  "USR-8391": {
    name: "Jimmy Hendrix",
    email: "jimmy@gmail.com",
    phone: "612-123-4567",
    role: "Subscription Mgmt",
  },
  "USR-0127": {
    name: "Sponge Bob",
    email: "sponge@gmail.com",
    phone: "612-123-4567",
    role: "Audit Log Mgmt",
  },
  "USR-4567": {
    name: "Robin Hood",
    email: "robin@gmail.com",
    phone: "612-123-4567",
    role: "Marketing",
  },
};

const permissionGroups = [
  {
    title: 'Admin',
    items: ['Admin user list', 'Add admin user'],
  },
  {
    title: 'Support',
    items: ['Contact support', 'Help center', 'Submit a support ticket', 'Resources'],
  },
  {
    title: 'Team Users',
    items: ['Manage'],
  },
  {
    title: 'Route History',
    items: ['My route history', 'Team route history'],
  },
  {
    title: 'Legal',
    items: ['Privacy Policy', 'Terms of Use', 'Disclaimer'],
  },
  {
    title: 'My Plan',
    items: ['Manage'],
  },

  {
    title: 'Security, Logging & Compliance',
    items: ['Logout', 'Data protection', 'Delete account'],
  },
]

const EditAdminUser = () => {
  const navigate = useNavigate()
  const { id } = useParams()
  const user = users[id] || users['USR-1001']
  const [showPassword, setShowPassword] = useState(false)
  const [password, setPassword] = useState('ay4cczbZYOI1uB')

  const generatePassword = () => {
    const randomPassword = 'ay4cczbZYOI1uB'
    setPassword(randomPassword)
  }

  return (
    <div className="min-h-full  px-2 py-2 text-[#888] md:px-10 md:py-4">
      <h1 className="mx-auto mb-8 max-w-5xl text-xl font-normal text-[#999] md:text-2xl">
        Edit admin user
      </h1>

      <form
        className="mx-auto max-w-5xl"
        onSubmit={(event) => event.preventDefault()}
      >
        <div className="space-y-2">
          {[
            ['Name:', user.name, 'text'],
            ['Email:', user.email, 'email'],
            ['Phone:', user.phone, 'tel'],
            ['Role:', user.role, 'text'],
          ].map(([label, value, type]) => (
            <div
              key={label}
              className="flex items-center border-b border-[#e5e5e5] pb-2"
            >
              <label
                className="w-36 px-2 text-xs font-semibold"
                htmlFor={label}
              >
                {label}
              </label>
              <input
                id={label}
                type={type}
                defaultValue={value}
                aria-label={label.replace(':', '')}
                className="h-7 w-60 rounded border border-[#d5d5d5] px-2 text-xs text-gray-600 outline-none focus:border-[#1d2464]"
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
                className="inline-flex items-center gap-1 rounded border border-[#cfcfcf] bg-[#f5f5f5] px-2 py-1 text-[11px] text-[#4a4a4a]"
              >
                Generate
              </button>
            </div>
          </div>
        </div>

        <fieldset className="flex border-b border-[#e5e5e5] py-3">
          <legend className="w-36 px-2 text-xs font-semibold">
            Permissions:
          </legend>
          <div className="grid flex-1 grid-cols-1 gap-x-16 md:grid-cols-2">
            {permissionGroups.map((group) => (
              <div key={group.title} className="mb-1">
                <label className="flex items-center gap-1 text-xs">
                  <input type="checkbox" />
                  {group.title}
                </label>
                <div className="ml-4">
                  {group.items.map((item) => (
                    <label
                      key={item}
                      className="flex items-center gap-1 py-0.5 text-xs"
                    >
                      <input type="checkbox" />
                      {item}
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </fieldset>

        <div className="mt-6 flex items-center justify-between rounded-lg border border-[#e5e5e5] bg-[#fafafa] p-3">
          <div className="flex gap-2">
            <button
              type="submit"
              onClick={() => navigate("/dashboard/manage/admin-users")}
              className="rounded bg-[#1d2464] px-4 py-2 text-xs text-white hover:bg-[#ff823d]"
            >
              SAVE
            </button>
            <button
              type="button"
              onClick={() => navigate("/dashboard/manage/admin-users")}
              className="rounded bg-[#1d2464] px-4 py-2 text-xs text-white hover:bg-[#ff823d] cursor-pointer"
            >
              CANCEL
            </button>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => navigate("/dashboard/manage/admin-users")}
              className="rounded bg-[#b40000] px-4 py-2 text-xs text-white hover:bg-[#ff823d] cursor-pointer"
            >
              LOCK
            </button>
            <button
              type="button"
              onClick={() => navigate("/dashboard/manage/admin-users")}
              className="rounded bg-[#b40000] px-4 py-2 text-xs text-white hover:bg-[#ff823d] cursor-pointer"
            >
              UNLOCK
            </button>
            <button
              type="button"
              onClick={() => navigate("/dashboard/manage/admin-users")}
              className="rounded bg-[#b40000] px-4 py-2 text-xs text-white hover:bg-[#ff823d] cursor-pointer"
            >
              DELETE
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default EditAdminUser;
