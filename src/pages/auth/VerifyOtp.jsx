import { useEffect, useState } from 'react'
import { Navigate, useNavigate } from 'react-router'
import { CheckCircle2, X } from 'lucide-react'
import { Icons } from '../../assets/Images'
import { useAuth } from '../../context/useAuth'

const VerifyOtp = () => {
  const navigate = useNavigate()
  const { pendingLogin, resendOtp, verifyOtp, isAuthenticated } = useAuth()
  const [otpCode, setOtpCode] = useState('')
  const [showResentToast, setShowResentToast] = useState(false)
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isResending, setIsResending] = useState(false)

  // Navigate to dashboard AFTER React has committed the session state.
  // Using useEffect guarantees isAuthenticated is already true when
  // DashboardLayout renders, avoiding the race with batched state updates.
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true })
    }
  }, [isAuthenticated, navigate])

  // Only redirect to login when there is truly no pending flow AND no session.
  // Checking !isAuthenticated avoids a stale Navigate-to-/ firing in the same
  // render cycle where pendingLogin is cleared alongside the new session.
  if (!pendingLogin?.email && !isAuthenticated) {
    return <Navigate to="/" replace />
  }

  const handleResendCode = async () => {
    setError('')
    setIsResending(true)

    try {
      await resendOtp(pendingLogin.email)
      setShowResentToast(true)
      setTimeout(() => {
        setShowResentToast(false)
      }, 3500)
    } catch (err) {
      setError(err.message || 'Unable to resend the verification code.')
    } finally {
      setIsResending(false)
    }
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setIsSubmitting(true)

    try {
      // verifyOtp sets the session via React state (setSession).
      // Do NOT call navigate() here — the batched state updates won't be
      // committed yet, so DashboardLayout would see isAuthenticated=false.
      // Navigation is handled by the useEffect above once isAuthenticated=true.
      await verifyOtp({ email: pendingLogin.email, otpCode })
    } catch (err) {
      setError(err.message || 'Invalid or expired verification code.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="relative min-h-screen bg-black text-white">
      {showResentToast && (
        <div className="fixed top-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-950/90 px-4 py-2.5 text-sm font-medium text-emerald-200 shadow-xl backdrop-blur-sm animate-in fade-in slide-in-from-top-4 duration-300">
          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          <span>Code resent successfully</span>
          <button
            type="button"
            onClick={() => setShowResentToast(false)}
            className="ml-2 text-emerald-400 hover:text-emerald-200"
            aria-label="Close notification"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

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

          <h1 className="mb-3 text-2xl font-normal text-[#ff823d]">Verification page</h1>
          <p className="mb-4 max-w-[420px] text-center text-sm leading-5 text-white">
            Enter the verification code sent to:<br />
            {pendingLogin?.maskedEmail || pendingLogin?.email}
          </p>

          <form className="flex w-full max-w-[280px] flex-col items-center" onSubmit={handleSubmit}>
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              placeholder="Enter 6 digit code"
              aria-label="Verification code"
              required
              pattern="[0-9]{6}"
              value={otpCode}
              onChange={(event) => setOtpCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
              autoComplete="one-time-code"
              className="mb-4 h-10 w-full bg-white px-3 text-sm text-gray-700 outline-none placeholder:text-gray-400"
            />

            {error && (
              <p className="mb-3 w-full rounded bg-red-950/80 px-3 py-2 text-center text-xs text-red-100">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="mb-3 h-9 min-w-24 rounded-[6px] bg-[#ff823d] px-3 text-xs font-semibold uppercase tracking-wider text-white transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-70 cursor-pointer"
            >
              {isSubmitting ? '...' : 'CONFIRM'}
            </button>
            <button
              type="button"
              onClick={handleResendCode}
              disabled={isResending}
              className="text-xs text-white underline underline-offset-2 cursor-pointer hover:text-[#ff823d] transition-colors disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isResending ? 'Resending...' : 'Resend code'}
            </button>
          </form>
        </section>
      </main>
    </div>
  )
}

export default VerifyOtp