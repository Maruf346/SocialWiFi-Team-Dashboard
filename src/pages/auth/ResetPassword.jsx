import { useState } from 'react'
import { useNavigate } from 'react-router'
import { Icons } from '../../assets/Images'

const ResetPassword = () => {
  const navigate = useNavigate()
  const [passwordError, setPasswordError] = useState('')

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
      <header className="flex h-16 items-center justify-between bg-[#0b0d2d] px-5 md:h-[72px] md:px-10">
        <img
          src={Icons.headerLogo}
          alt="Right Route"
          className="h-12 w-auto object-contain md:h-14"
        />
      </header>

      <div className="h-7 bg-[#ff823d]" />

      <main
        className="flex min-h-[calc(100vh-7rem)] items-center justify-center bg-cover bg-center px-4 pt-20 md:pt-24"
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
            <input
              type="password"
              name="new-password"
              placeholder="New Password"
              aria-label="New Password"
              required
              className="mb-3 h-10 bg-white px-3 text-sm text-gray-700 outline-none placeholder:text-gray-400"
            />
            <input
              type="password"
              name="confirm-password"
              placeholder="Confirm New Password"
              aria-label="Confirm New Password"
              required
              className="mb-2 h-10 bg-white px-3 text-sm text-gray-700 outline-none placeholder:text-gray-400"
            />

            {passwordError && (
              <p className="mb-3 text-center text-xs text-[#ff823d]">{passwordError}</p>
            )}

            <button
              type="submit"
              className="mx-auto mt-2 h-9 w-28 bg-[#ff823d] text-xs text-white cursor-pointer"
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
