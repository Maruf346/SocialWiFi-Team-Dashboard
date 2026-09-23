import { useEffect, useRef, useState } from 'react'
import { CheckCircle2, Eye, EyeOff, X } from 'lucide-react'

const Email = () => {
  const [verificationCode, setVerificationCode] = useState(Array(6).fill(''))
  const [timeLeft, setTimeLeft] = useState(600) // 10 minutes countdown
  const [isTimerRunning, setIsTimerRunning] = useState(true)
  const [toastMessage, setToastMessage] = useState('')
  const [showToast, setShowToast] = useState(false)

  // Password visibility toggles
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const codeInputRefs = useRef([])

  // Countdown timer effect
  useEffect(() => {
    if (!isTimerRunning || timeLeft <= 0) return

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [isTimerRunning, timeLeft])

  // Format MM:SS
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
  }

  const triggerToast = (msg) => {
    setToastMessage(msg)
    setShowToast(true)
    setTimeout(() => {
      setShowToast(false)
    }, 4000)
  }

  const handleSendVerificationCode = () => {
    setTimeLeft(600)
    setIsTimerRunning(true)
    triggerToast('Verification code has been sent to johnd@glenbighaul.com')
    codeInputRefs.current[0]?.focus()
  }

  const handleResendCode = () => {
    setTimeLeft(600)
    setIsTimerRunning(true)
    setVerificationCode(Array(6).fill(''))
    triggerToast('A new verification code was sent to your email')
    codeInputRefs.current[0]?.focus()
  }

  const handleCodeChange = (index, value) => {
    const digit = value.replace(/\D/g, '').slice(0, 1)

    setVerificationCode((currentCode) => {
      const nextCode = [...currentCode]
      nextCode[index] = digit
      return nextCode
    })

    if (digit && index < codeInputRefs.current.length - 1) {
      codeInputRefs.current[index + 1]?.focus()
    }
  }

  const handleCodeKeyDown = (index, event) => {
    if (event.key === 'Backspace' && !verificationCode[index] && index > 0) {
      codeInputRefs.current[index - 1]?.focus()
    }
  }

  return (
    <div className="min-h-full px-2 py-2 text-[#888] md:px-10 md:py-4">
      {/* Toast Popup Notification */}
      {showToast && (
        <div className="fixed top-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-lg border border-emerald-500/30 bg-[#0f2d1e] px-4 py-2.5 text-xs md:text-sm font-medium text-emerald-200 shadow-xl backdrop-blur-sm animate-in fade-in slide-in-from-top-4 duration-300">
          <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
          <button
            type="button"
            onClick={() => setShowToast(false)}
            className="ml-2 text-emerald-400 hover:text-emerald-200"
            aria-label="Close notification"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      <h1 className="mb-8 text-xl font-normal text-[#999] md:text-2xl">
        Email/Password
      </h1>

      <div className="grid max-w-[960px] gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        {/* Left Column */}
        <div className="space-y-5">
          {/* Change Email Box */}
          <div className="rounded border border-[#d9d9d9] bg-[#f0f0f0] p-4 md:p-5">
            <h2 className="mb-3.5 text-[14px] font-bold text-[#1f1f1f]">
              Change Email
            </h2>

            <div className="space-y-2.5">
              <div className="grid grid-cols-[135px_1fr] items-center gap-2">
                <label className="text-[12px] font-semibold text-[#555]">Current email</label>
                <input
                  type="text"
                  value="johnd@glenbighaul.com"
                  readOnly
                  className="h-8 rounded border border-[#d0d0d0] bg-white px-2.5 text-[12px] text-[#444] outline-none"
                />
              </div>

              <div className="grid grid-cols-[135px_1fr] items-center gap-2">
                <label className="text-[12px] font-semibold text-[#555]">New email</label>
                <input
                  type="email"
                  placeholder="Enter new email address"
                  className="h-8 rounded border border-[#d0d0d0] bg-white px-2.5 text-[12px] text-[#333] placeholder:text-[#a0a0a0] outline-none focus:border-[#1d2464]"
                />
              </div>

              <div className="grid grid-cols-[135px_1fr] items-center gap-2">
                <label className="text-[12px] font-semibold text-[#555]">Confirm New email</label>
                <input
                  type="email"
                  placeholder="Confirm new email address"
                  className="h-8 rounded border border-[#d0d0d0] bg-white px-2.5 text-[12px] text-[#333] placeholder:text-[#a0a0a0] outline-none focus:border-[#1d2464]"
                />
              </div>
            </div>
          </div>

          {/* Change Password Box */}
          <div className="rounded border border-[#d9d9d9] bg-[#f0f0f0] p-4 md:p-5">
            <h2 className="mb-3.5 text-[14px] font-bold text-[#1f1f1f]">
              Change Password
            </h2>

            <div className="space-y-2.5">
              <div className="grid grid-cols-[135px_1fr] items-center gap-2">
                <label className="text-[12px] font-semibold text-[#555]">Current password</label>
                <div className="relative">
                  <input
                    type={showCurrentPassword ? 'text' : 'password'}
                    placeholder="Enter current password"
                    className="h-8 w-full rounded border border-[#d0d0d0] bg-white px-2.5 pr-8 text-[12px] text-[#333] placeholder:text-[#a0a0a0] outline-none focus:border-[#1d2464]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-[#8a8a8a] hover:text-[#555]"
                  >
                    {showCurrentPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-[135px_1fr] items-center gap-2">
                <label className="text-[12px] font-semibold text-[#555]">New password</label>
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    placeholder="Enter new password"
                    className="h-8 w-full rounded border border-[#d0d0d0] bg-white px-2.5 pr-8 text-[12px] text-[#333] placeholder:text-[#a0a0a0] outline-none focus:border-[#1d2464]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-[#8a8a8a] hover:text-[#555]"
                  >
                    {showNewPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>

              {/* Password requirement helper text flush-left with input fields */}
              <div className="grid grid-cols-[135px_1fr] gap-2">
                <div />
                <p className="text-[10.5px] leading-[13px] text-[#777]">
                  At least 8 characters, including uppercase, lowercase, and a number.
                </p>
              </div>

              <div className="grid grid-cols-[135px_1fr] items-center gap-2">
                <label className="text-[12px] font-semibold text-[#555]">Confirm New password</label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Confirm new password"
                    className="h-8 w-full rounded border border-[#d0d0d0] bg-white px-2.5 pr-8 text-[12px] text-[#333] placeholder:text-[#a0a0a0] outline-none focus:border-[#1d2464]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-[#8a8a8a] hover:text-[#555]"
                  >
                    {showConfirmPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Send Verification Code Action Bar */}
          <div className="flex items-center rounded border border-[#d9d9d9] bg-[#f0f0f0] p-3 md:p-3.5">
            <button
              type="button"
              onClick={handleSendVerificationCode}
              className="rounded-[6px] border-0 bg-[#f39a52] px-4 py-2 text-[12px] font-bold uppercase tracking-[0.02em] text-white transition hover:brightness-95 cursor-pointer"
            >
              Send Verification Code
            </button>
          </div>
        </div>

        {/* Right Column: Verification Code Box */}
        <div>
          <div className="rounded border border-[#d9d9d9] bg-[#f0f0f0] p-4 md:p-5">
            <h2 className="mb-3 text-[14px] font-bold text-[#1f1f1f]">
              Enter Verification Code
            </h2>

            <p className="text-[12px] leading-snug text-[#666]">
              A 6-digit code was sent to your email:
              <span className="mt-0.5 block font-bold text-[#333]">johnd@glenbighaul.com</span>
            </p>

            <div className="mt-3.5 flex gap-2">
              {verificationCode.map((digit, index) => (
                <input
                  key={index}
                  ref={(input) => {
                    codeInputRefs.current[index] = input
                  }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(event) => handleCodeChange(index, event.target.value)}
                  onKeyDown={(event) => handleCodeKeyDown(index, event)}
                  aria-label={`Verification code digit ${index + 1}`}
                  className="h-9 w-9 md:h-10 md:w-10 rounded border border-[#d0d0d0] bg-white text-center text-sm font-semibold text-[#333] outline-none focus:border-[#1d2464]"
                />
              ))}
            </div>

            <div className="mt-3.5 text-[12px] text-[#555]">
              Code expires in: <span className="font-bold text-[#222]">{formatTime(timeLeft)}</span>
            </div>

            <div className="mt-3.5 border-t border-[#d8d8d8] pt-3 text-[12px] text-[#555]">
              Didn't receive the code?{' '}
              <button
                type="button"
                onClick={handleResendCode}
                className="font-bold text-[#1f1f1f] underline decoration-1 underline-offset-2 cursor-pointer"
              >
                Resend Code
              </button>
            </div>

            <button
              type="button"
              onClick={() => {
                if (verificationCode.join('').length === 6) {
                  triggerToast('Changes verified and saved successfully!')
                } else {
                  triggerToast('Please enter the 6-digit verification code')
                }
              }}
              className="mt-5 w-full rounded-[6px] bg-[#f39a52] px-4 py-2.5 text-[12px] font-bold uppercase tracking-[0.02em] text-white shadow-sm transition hover:brightness-95 cursor-pointer"
            >
              Verify and Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Email
