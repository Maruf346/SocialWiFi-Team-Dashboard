import { useState } from 'react'
import { useNavigate } from 'react-router'
import { CheckCircle2, X } from 'lucide-react'
import { Icons } from '../../assets/Images'

const VerifyOtp = () => {
  const navigate = useNavigate()
  const [showResentToast, setShowResentToast] = useState(false)

  const handleResendCode = () => {
    setShowResentToast(true)
    setTimeout(() => {
      setShowResentToast(false)
    }, 3500)
  }

  return (
    <div className="relative min-h-screen bg-black text-white">
      {/* Code Resent Toast Popup */}
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
            *****is@gmail.com
          </p>

          <form
            className="flex w-full max-w-[280px] flex-col items-center"
            onSubmit={(event) => {
              event.preventDefault()
              navigate('/reset-password')
            }}
          >
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              placeholder="Enter 6 digit code"
              aria-label="Verification code"
              required
              pattern="[0-9]{6}"
              className="mb-4 h-10 w-full bg-white px-3 text-sm text-gray-700 outline-none placeholder:text-gray-400"
            />
            <button
              type="submit"
              className="mb-3 h-9 w-24 rounded-[6px] bg-[#ff823d] text-xs font-semibold uppercase tracking-wider text-white transition hover:brightness-95 cursor-pointer"
            >
              CONFIRM
            </button>
            <button
              type="button"
              onClick={handleResendCode}
              className="text-xs text-white underline underline-offset-2 cursor-pointer hover:text-[#ff823d] transition-colors"
            >
              Resend code
            </button>
          </form>
        </section>
      </main>
    </div>
  )
}

export default VerifyOtp

