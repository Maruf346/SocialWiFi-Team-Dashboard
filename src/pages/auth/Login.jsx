import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { Icons } from '../../assets/Images'
import { useAuth } from '../../context/useAuth'

const Login = () => {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(true)
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setIsSubmitting(true)

    try {
      await login({ email, password, rememberMe })
      navigate('/verify-otp')
    } catch (err) {
      setError(err.message || 'Unable to log in. Please check your credentials and try again.')
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

          <h1 className="mb-4 text-2xl font-normal text-[#ff823d]">Login</h1>

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
            <input
              type="password"
              placeholder="Password"
              aria-label="Password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              autoComplete="current-password"
              className="mb-3 h-10 bg-white px-3 text-sm text-gray-700 outline-none placeholder:text-gray-400"
            />

            <label className="mb-4 flex items-center gap-2 text-xs text-white">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(event) => setRememberMe(event.target.checked)}
                className="h-4 w-4 accent-white"
              />
              Remember me
            </label>

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
              {isSubmitting ? '...' : 'LOGIN'}
            </button>

            <Link
              to="/forgot-password"
              className="text-center text-xs text-white underline underline-offset-2"
            >
              Forgot Username / Password?
            </Link>
          </form>
        </section>
      </main>
    </div>
  )
}

export default Login