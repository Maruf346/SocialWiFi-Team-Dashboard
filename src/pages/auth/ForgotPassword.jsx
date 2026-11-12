import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { Icons } from '../../assets/Images'
import { useAuth } from '../../context/useAuth'

const ForgotPassword = () => {
  const navigate = useNavigate()
  const { forgotPassword } = useAuth()
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setIsSubmitting(true)

    try {
      await forgotPassword(email.trim())
      navigate('/verify-otp', { state: { redirectTo: '/dashboard/manage/email' } })
    } catch (err) {
      setError(err.message || 'Unable to send verification code. Please check your email and try again.')
    } finally {
      setIsSubmitting(false)
    }
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

          <h1 className="mb-4 text-2xl font-normal text-[#ff823d]">Forgot Password</h1>

          <form className="flex w-full max-w-[245px] flex-col" onSubmit={handleSubmit}>
            <input
              type="email"
              placeholder="Email"
              aria-label="Email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              autoComplete="email"
              className="mb-3 h-10 bg-white px-3 text-sm text-gray-700 outline-none placeholder:text-gray-400"
            />

            {error && (
              <p className="mb-3 rounded bg-red-950/80 px-3 py-2 text-center text-xs text-red-100">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="mx-auto mb-4 h-9 min-w-20 rounded-[6px] bg-[#ff823d] px-3 text-xs font-semibold uppercase tracking-wider text-white transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-70 cursor-pointer"
            >
              {isSubmitting ? '...' : 'SUBMIT'}
            </button>

            <Link
              to="/"
              className="text-center text-xs text-white underline underline-offset-2"
            >
              Back to Login
            </Link>
          </form>
        </section>
      </main>
    </div>
  )
}

export default ForgotPassword
