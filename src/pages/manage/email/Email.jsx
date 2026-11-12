import { useEffect, useRef, useState } from 'react'
import { CheckCircle2, Eye, EyeOff, X } from 'lucide-react'
import { useAuth } from '../../../context/useAuth'
import { teamManageApi } from '../../../services/teamManageApi'

const PASSWORD_REQUIREMENTS_MESSAGE =
  'New password must be at least 8 characters and include an uppercase letter, a lowercase letter, and a number.'

const getPasswordFormatError = (password) => {
  if (
    password.length < 8 ||
    !/[A-Z]/.test(password) ||
    !/[a-z]/.test(password) ||
    !/[0-9]/.test(password)
  ) {
    return PASSWORD_REQUIREMENTS_MESSAGE
  }

  return ''
}

const Email = () => {
  const { accessToken, user, refreshSession } = useAuth()
  const [verificationCode, setVerificationCode] = useState('')
  const [timeLeft, setTimeLeft] = useState(600)
  const [isTimerRunning, setIsTimerRunning] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const [showToast, setShowToast] = useState(false)
  const [error, setError] = useState('')
  const [isSendingCode, setIsSendingCode] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [pendingAction, setPendingAction] = useState('CHANGE_EMAIL')

  const [emailForm, setEmailForm] = useState({
    newEmail: '',
    confirmEmail: '',
    currentPassword: '',
  })
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })

  const [showEmailPassword, setShowEmailPassword] = useState(false)
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const codeInputRef = useRef(null)
  const currentEmail = user?.email || 'Not available'

  const otpCode = verificationCode.trim()
  const passwordFormatError = passwordForm.newPassword
    ? getPasswordFormatError(passwordForm.newPassword)
    : ''
  const passwordConfirmationError =
    passwordForm.confirmPassword && passwordForm.newPassword !== passwordForm.confirmPassword
      ? 'New password and confirmation password must match.'
      : ''

  useEffect(() => {
    if (!isTimerRunning || timeLeft <= 0) return

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          setIsTimerRunning(false)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [isTimerRunning, timeLeft])

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

  const inferAction = () => {
    const hasEmailChange = emailForm.newEmail.trim() || emailForm.confirmEmail.trim()
    const hasPasswordChange = passwordForm.newPassword || passwordForm.confirmPassword
    return hasPasswordChange && !hasEmailChange ? 'CHANGE_PASSWORD' : 'CHANGE_EMAIL'
  }

  const validatePasswordFields = () => {
    if (!passwordForm.currentPassword) return 'Please enter your current password.'
    if (!passwordForm.newPassword) return 'Please enter a new password.'

    const formatError = getPasswordFormatError(passwordForm.newPassword)
    if (formatError) return formatError
    if (!passwordForm.confirmPassword) return 'Please confirm your new password.'
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      return 'New password and confirmation password must match.'
    }

    return ''
  }

  const handleSendVerificationCode = async (action = inferAction()) => {
    setError('')

    if (action === 'CHANGE_PASSWORD') {
      const validationError = validatePasswordFields()
      if (validationError) {
        setError(validationError)
        return
      }
    }

    setIsSendingCode(true)

    try {
      await teamManageApi.sendEmailPasswordCode(accessToken, action)
      setPendingAction(action)
      setTimeLeft(600)
      setIsTimerRunning(true)
      setVerificationCode('')
      triggerToast(`Verification code sent for ${action === 'CHANGE_PASSWORD' ? 'password' : 'email'} change`)
      codeInputRef.current?.focus()
    } catch (err) {
      setError(err.message || 'Unable to send verification code.')
    } finally {
      setIsSendingCode(false)
    }
  }

  const handleResendCode = () => {
    handleSendVerificationCode(pendingAction)
  }

  const validateChange = () => {
    if (pendingAction === 'CHANGE_EMAIL') {
      if (otpCode.length !== 6) return 'Please enter the 6-digit verification code.'
      if (!emailForm.newEmail.trim()) return 'Please enter a new email address.'
      if (emailForm.newEmail.trim() !== emailForm.confirmEmail.trim()) return 'New email and confirmation email must match.'
      if (!emailForm.currentPassword) return 'Please enter your current password for email change.'
      return ''
    }

    const passwordFieldsError = validatePasswordFields()
    if (passwordFieldsError) return passwordFieldsError
    if (otpCode.length !== 6) return 'Please enter the 6-digit verification code.'
    return ''
  }

  const handleVerifyAndSave = async () => {
    const validationError = validateChange()
    if (validationError) {
      setError(validationError)
      return
    }

    setIsSaving(true)
    setError('')

    try {
      if (pendingAction === 'CHANGE_EMAIL') {
        await teamManageApi.changeEmail(accessToken, {
          new_email: emailForm.newEmail.trim(),
          current_password: emailForm.currentPassword,
          otp_code: otpCode,
        })
        setEmailForm({ newEmail: '', confirmEmail: '', currentPassword: '' })
        await refreshSession()
        triggerToast('Email changed successfully')
      } else {
        await teamManageApi.changePassword(accessToken, {
          current_password: passwordForm.currentPassword,
          new_password: passwordForm.newPassword,
          confirm_password: passwordForm.confirmPassword,
          otp_code: otpCode,
        })
        setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
        triggerToast('Password changed successfully')
      }

      setVerificationCode('')
      setIsTimerRunning(false)
      setTimeLeft(600)
    } catch (err) {
      setError(err.message || 'Unable to save changes.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="min-h-full px-2 py-2 text-[#888] md:px-10 md:py-4">
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

      {error && (
        <div className="mb-4 max-w-[960px] rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid max-w-[960px] gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="space-y-5">
          <div className="rounded border border-[#d9d9d9] bg-[#f0f0f0] p-4 md:p-5">
            <h2 className="mb-3.5 text-[14px] font-bold text-[#1f1f1f]">
              Change Email
            </h2>

            <div className="space-y-2.5">
              <div className="grid grid-cols-[135px_1fr] items-center gap-2">
                <label className="text-[12px] font-semibold text-[#555]">Current email</label>
                <input
                  type="text"
                  value={currentEmail}
                  readOnly
                  className="h-8 rounded border border-[#d0d0d0] bg-white px-2.5 text-[12px] text-[#444] outline-none"
                />
              </div>

              <div className="grid grid-cols-[135px_1fr] items-center gap-2">
                <label className="text-[12px] font-semibold text-[#555]">New email</label>
                <input
                  type="email"
                  value={emailForm.newEmail}
                  onChange={(event) => setEmailForm((prev) => ({ ...prev, newEmail: event.target.value }))}
                  placeholder="Enter new email address"
                  className="h-8 rounded border border-[#d0d0d0] bg-white px-2.5 text-[12px] text-[#333] placeholder:text-[#a0a0a0] outline-none focus:border-[#1d2464]"
                />
              </div>

              <div className="grid grid-cols-[135px_1fr] items-center gap-2">
                <label className="text-[12px] font-semibold text-[#555]">Confirm New email</label>
                <input
                  type="email"
                  value={emailForm.confirmEmail}
                  onChange={(event) => setEmailForm((prev) => ({ ...prev, confirmEmail: event.target.value }))}
                  placeholder="Confirm new email address"
                  className="h-8 rounded border border-[#d0d0d0] bg-white px-2.5 text-[12px] text-[#333] placeholder:text-[#a0a0a0] outline-none focus:border-[#1d2464]"
                />
              </div>

              <div className="grid grid-cols-[135px_1fr] items-center gap-2">
                <label className="text-[12px] font-semibold text-[#555]">Current password</label>
                <div className="relative">
                  <input
                    type={showEmailPassword ? 'text' : 'password'}
                    value={emailForm.currentPassword}
                    onChange={(event) => setEmailForm((prev) => ({ ...prev, currentPassword: event.target.value }))}
                    placeholder="Confirm with current password"
                    className="h-8 w-full rounded border border-[#d0d0d0] bg-white px-2.5 pr-8 text-[12px] text-[#333] placeholder:text-[#a0a0a0] outline-none focus:border-[#1d2464]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowEmailPassword(!showEmailPassword)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-[#8a8a8a] hover:text-[#555]"
                  >
                    {showEmailPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>
            </div>
          </div>

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
                    value={passwordForm.currentPassword}
                    onChange={(event) => setPasswordForm((prev) => ({ ...prev, currentPassword: event.target.value }))}
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
                    value={passwordForm.newPassword}
                    onChange={(event) => {
                      setPasswordForm((prev) => ({ ...prev, newPassword: event.target.value }))
                      setError('')
                    }}
                    placeholder="Enter new password"
                    minLength={8}
                    aria-invalid={Boolean(passwordFormatError)}
                    aria-describedby={
                      passwordFormatError
                        ? 'new-password-requirements new-password-error'
                        : 'new-password-requirements'
                    }
                    className={`h-8 w-full rounded border bg-white px-2.5 pr-8 text-[12px] text-[#333] placeholder:text-[#a0a0a0] outline-none ${
                      passwordFormatError
                        ? 'border-red-400 focus:border-red-500'
                        : 'border-[#d0d0d0] focus:border-[#1d2464]'
                    }`}
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

              <div className="grid grid-cols-[135px_1fr] gap-2">
                <div />
                <p id="new-password-requirements" className="text-[10.5px] leading-[13px] text-[#777]">
                  At least 8 characters, including uppercase, lowercase, and a number.
                </p>
              </div>

              {passwordFormatError && (
                <div className="grid grid-cols-[135px_1fr] gap-2">
                  <div />
                  <p id="new-password-error" role="alert" className="text-[11px] leading-4 text-red-600">
                    {passwordFormatError}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-[135px_1fr] items-center gap-2">
                <label className="text-[12px] font-semibold text-[#555]">Confirm New password</label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={passwordForm.confirmPassword}
                    onChange={(event) => {
                      setPasswordForm((prev) => ({ ...prev, confirmPassword: event.target.value }))
                      setError('')
                    }}
                    placeholder="Confirm new password"
                    minLength={8}
                    aria-invalid={Boolean(passwordConfirmationError)}
                    aria-describedby={passwordConfirmationError ? 'confirm-password-error' : undefined}
                    className={`h-8 w-full rounded border bg-white px-2.5 pr-8 text-[12px] text-[#333] placeholder:text-[#a0a0a0] outline-none ${
                      passwordConfirmationError
                        ? 'border-red-400 focus:border-red-500'
                        : 'border-[#d0d0d0] focus:border-[#1d2464]'
                    }`}
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

              {passwordConfirmationError && (
                <div className="grid grid-cols-[135px_1fr] gap-2">
                  <div />
                  <p id="confirm-password-error" role="alert" className="text-[11px] leading-4 text-red-600">
                    {passwordConfirmationError}
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 rounded border border-[#d9d9d9] bg-[#f0f0f0] p-3 md:p-3.5">
            <button
              type="button"
              onClick={() => handleSendVerificationCode('CHANGE_EMAIL')}
              disabled={isSendingCode}
              className="rounded-[6px] border-0 bg-[#f39a52] px-4 py-2 text-[12px] font-bold uppercase tracking-[0.02em] text-white transition hover:brightness-95 disabled:opacity-60 cursor-pointer"
            >
              Send Email Code
            </button>
            <button
              type="button"
              onClick={() => handleSendVerificationCode('CHANGE_PASSWORD')}
              disabled={isSendingCode}
              className="rounded-[6px] border-0 bg-[#1d2464] px-4 py-2 text-[12px] font-bold uppercase tracking-[0.02em] text-white transition hover:brightness-95 disabled:opacity-60 cursor-pointer"
            >
              Send Password Code
            </button>
          </div>
        </div>

        <div>
          <div className="rounded border border-[#d9d9d9] bg-[#f0f0f0] p-4 md:p-5">
            <h2 className="mb-3 text-[14px] font-bold text-[#1f1f1f]">
              Enter Verification Code
            </h2>

            <p className="text-[12px] leading-snug text-[#666]">
              A 6-digit code will be sent to your email:
              <span className="mt-0.5 block font-bold text-[#333]">{currentEmail}</span>
              <span className="mt-0.5 block text-[#555]">
                Pending action: {pendingAction === 'CHANGE_PASSWORD' ? 'Change password' : 'Change email'}
              </span>
            </p>

            <div className="mt-3.5">
              <input
                ref={codeInputRef}
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={verificationCode}
                onChange={(event) =>
                  setVerificationCode(event.target.value.replace(/\D/g, '').slice(0, 6))
                }
                placeholder="Enter 6-digit code"
                aria-label="Verification code"
                autoComplete="one-time-code"
                className="h-9 w-full rounded border border-[#d0d0d0] bg-white px-3 text-[13px] font-medium tracking-wide text-[#333] placeholder:font-normal placeholder:tracking-normal placeholder:text-[#a0a0a0] outline-none focus:border-[#1d2464]"
              />
            </div>

            <div className="mt-3.5 text-[12px] text-[#555]">
              Code expires in: <span className="font-bold text-[#222]">{formatTime(timeLeft)}</span>
            </div>

            <div className="mt-3.5 border-t border-[#d8d8d8] pt-3 text-[12px] text-[#555]">
              Didn't receive the code?{' '}
              <button
                type="button"
                onClick={handleResendCode}
                disabled={isSendingCode}
                className="font-bold text-[#1f1f1f] underline decoration-1 underline-offset-2 disabled:opacity-60 cursor-pointer"
              >
                Resend Code
              </button>
            </div>

            <button
              type="button"
              onClick={handleVerifyAndSave}
              disabled={isSaving}
              className="mt-5 w-full rounded-[6px] bg-[#f39a52] px-4 py-2.5 text-[12px] font-bold uppercase tracking-[0.02em] text-white shadow-sm transition hover:brightness-95 disabled:opacity-60 cursor-pointer"
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
