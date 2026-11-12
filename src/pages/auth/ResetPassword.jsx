import { useState } from 'react'
import { useNavigate } from 'react-router'
import { Eye, EyeOff } from 'lucide-react'
import { Icons } from '../../assets/Images'

const ResetPassword = () => {
  const navigate = useNavigate()
  const [passwordError, setPasswordError] = useState('')
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const handleSubmit = (event) => {
    event.preventDefault()

    const formData = new FormData(event.currentTarget)
    const newPassword = formData.get('new-password')
    const confirmPassword = formData.get('confirm-password')

    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match')
      return
    }

    setPasswordError('')
    navigate('/')
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <main
        className="flex min-h-screen items-center justify-center bg-cover bg-center px-4 py-8"
        style={{ backgroundImage: `url(${Icons.authBg})` }}
      >
        <section className="flex w-full max-w-[390px] flex-col items-center">
          <img
            src={Icons.authMainLogo}
            alt="Right Route"
            className="mb-3 h-auto w-40 object-contain md:w-44"
          />

          <h1 className="mb-4 text-2xl font-normal text-[#ff823d]">Reset Password</h1>

          <form className="flex w-full max-w-[245px] flex-col" onSubmit={handleSubmit}>
            <div className="relative mb-3 w-full">
              <input
                type={showNewPassword ? 'text' : 'password'}
                name="new-password"
                placeholder="New Password"
                aria-label="New Password"
                required
                className="h-10 w-full bg-white pl-3 pr-9 text-sm text-gray-700 outline-none placeholder:text-gray-400"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword((prev) => !prev)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none cursor-pointer"
                aria-label={showNewPassword ? 'Hide new password' : 'Show new password'}
              >
                {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            <div className="relative mb-2 w-full">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                name="confirm-password"
                placeholder="Confirm New Password"
                aria-label="Confirm New Password"
                required
                className="h-10 w-full bg-white pl-3 pr-9 text-sm text-gray-700 outline-none placeholder:text-gray-400"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword((prev) => !prev)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none cursor-pointer"
                aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            {passwordError && (
              <p className="mb-3 text-center text-xs text-[#ff823d]">{passwordError}</p>
            )}

            <button
              type="submit"
              className="mx-auto mt-2 h-9 w-28 rounded-[6px] bg-[#ff823d] text-xs font-semibold uppercase tracking-wider text-white transition hover:brightness-95 cursor-pointer"
            >
              RESET PASSWORD
            </button>
          </form>
        </section>
      </main>
    </div>
  )
}

export default ResetPassword
