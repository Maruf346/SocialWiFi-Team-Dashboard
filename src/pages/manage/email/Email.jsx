import { useRef, useState } from 'react'

const Email = () => {
  const [verificationCode, setVerificationCode] = useState(Array(6).fill(''))
  const codeInputRefs = useRef([])

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
    <div className="min-h-full px-1 py-2 text-[#2d2d2d]">
      <h1 className="mb-5 text-[1.8rem] font-light leading-none tracking-[-0.04em] text-[#2d2d2d]">
        Email/Password
      </h1>

      <div className="grid gap-5 xl:grid-cols-[1.02fr_0.98fr]">
        <div className="space-y-4">
          <div className="rounded-xl border border-[#d3d3d3] bg-[#efefef] p-4">
            <h2 className="mb-3 text-[1.6rem] font-bold leading-none tracking-[-0.04em] text-[#1f1f1f]">
              Change Email
            </h2>

            <div className="space-y-3">
              <div className="grid grid-cols-[1.2fr_2fr] items-center gap-3">
                <label className="text-[0.95rem] font-medium text-[#1f1f1f]">Current email</label>
                <input
                  type="text"
                  placeholder="Enter current email address"
                  readOnly
                  className="h-10 rounded-md border border-[#cfcfcf] bg-[#f7f7f7] px-3 text-[0.95rem] text-[#3a3a3a] outline-none"
                />
              </div>

              <div className="grid grid-cols-[1.2fr_2fr] items-center gap-3">
                <label className="text-[0.95rem] font-medium text-[#1f1f1f]">New email</label>
                <input
                  type="email"
                  placeholder="Enter new email address"
                  className="h-10 rounded-md border border-[#cfcfcf] bg-[#f8f8f8] px-3 text-[0.95rem] text-[#3a3a3a] placeholder:text-[#8d8d8d] outline-none focus:border-[#1d2464]"
                />
              </div>

              <div className="grid grid-cols-[1.2fr_2fr] items-center gap-3">
                <label className="text-[0.95rem] font-medium text-[#1f1f1f]">Confirm New email</label>
                <input
                  type="email"
                  placeholder="Confirm new email address"
                  className="h-10 rounded-md border border-[#cfcfcf] bg-[#f8f8f8] px-3 text-[0.95rem] text-[#3a3a3a] placeholder:text-[#8d8d8d] outline-none focus:border-[#1d2464]"
                />
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-[#d3d3d3] bg-[#efefef] p-4">
            <h2 className="mb-3 text-[1.6rem] font-bold leading-none tracking-[-0.04em] text-[#1f1f1f]">
              Change Password
            </h2>

            <div className="space-y-3">
              <div className="grid grid-cols-[1.2fr_2fr] items-center gap-3">
                <label className="text-[0.95rem] font-medium text-[#1f1f1f]">Current password</label>
                <div className="relative">
                  <input
                    type="password"
                    placeholder="Enter current password"
                    className="h-10 w-full rounded-md border border-[#cfcfcf] bg-[#f8f8f8] px-3 pr-8 text-[0.95rem] text-[#3a3a3a] placeholder:text-[#8d8d8d] outline-none focus:border-[#1d2464]"
                  />
                  <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[0.75rem] text-[#8a8a8a]">
                    
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-[1.2fr_2fr] items-center gap-3">
                <label className="text-[0.95rem] font-medium text-[#1f1f1f]">New password</label>
                <div className="relative">
                  <input
                    type="password"
                    placeholder="Enter new password"
                    className="h-10 w-full rounded-md border border-[#cfcfcf] bg-[#f8f8f8] px-3 pr-8 text-[0.95rem] text-[#3a3a3a] placeholder:text-[#8d8d8d] outline-none focus:border-[#1d2464]"
                  />
                  <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[0.75rem] text-[#8a8a8a]">
                  
                  </span>
                </div>
              </div>

              <div className="ml-auto w-[66.5%]">
                <p className="text-[0.7rem] leading-5 text-[#686868]">
                  At least 8 characters, including uppercase, lowercase, and a number.
                </p>
              </div>

              <div className="grid grid-cols-[1.2fr_2fr] items-center gap-3">
                <label className="text-[0.95rem] font-medium text-[#1f1f1f]">Confirm New password</label>
                <div className="relative">
                  <input
                    type="password"
                    placeholder="Confirm new password"
                    className="h-10 w-full rounded-md border border-[#cfcfcf] bg-[#f8f8f8] px-3 pr-8 text-[0.95rem] text-[#3a3a3a] placeholder:text-[#8d8d8d] outline-none focus:border-[#1d2464]"
                  />
                  <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[0.75rem] text-[#8a8a8a]">
                    
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 flex items-center pl-4 rounded-xl border border-[#d3d3d3] h-16 bg-[#f0f0f0] p-0 overflow-hidden">
            <button
              type="button"
              className="w-max rounded-xl border-0 bg-[#f39a52] px-4 py-2 text-[1rem] font-bold uppercase tracking-[0.02em] text-white transition hover:brightness-95 cursor-pointer"
            >
              Send Verification Code
            </button>
          </div>
        </div>

        <div className="rounded-xl border border-[#d3d3d3] bg-[#efefef] p-4">
          <h2 className="mb-3 text-[1.6rem] font-bold leading-none tracking-[-0.04em] text-[#1f1f1f]">
            Enter Verification Code
          </h2>

          <p className="text-[0.95rem] leading-6 text-[#4d4d4d]">
            A 6-digit code was sent to your email:
            <span className="mt-1 block font-medium text-[#2e2e2e]">johnd@glengbihgmail.com</span>
          </p>

          <div className="mt-4 flex gap-2">
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
                className="h-10 w-10 rounded-md border border-[#cfcfcf] bg-[#f7f7f7] text-center text-base text-[#3a3a3a] shadow-inner outline-none focus:border-[#1d2464]"
              />
            ))}
          </div>

          <div className="mt-4 text-[0.95rem] text-[#4a4a4a]">
            Code expires in: <span className="font-bold">10:00</span>
          </div>

          <div className="mt-4 border-t border-[#d1d1d1] pt-3 text-[0.95rem] text-[#4a4a4a]">
            Didn't receive the code?
            <button type="button" className="ml-2 font-bold text-[#1f1f1f] underline decoration-1 underline-offset-2 cursor-pointer">
              Resend Code
            </button>
          </div>

          <button
            type="button"
            className="mt-5 w-full rounded-xl bg-[#f39a52] px-4 py-3 text-[1rem] font-bold uppercase tracking-[0.02em] text-white shadow-sm transition hover:brightness-95 cursor-pointer"
          >
            Verify and Save Changes
          </button>
        </div>
      </div>
    </div>
  )
}

export default Email
