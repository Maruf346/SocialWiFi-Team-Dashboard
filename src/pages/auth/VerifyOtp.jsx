import { useNavigate } from 'react-router'
import { Icons } from '../../assets/Images'

const VerifyOtp = () => {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-black text-white">
      <header className="flex h-16 items-center bg-[#0b0d2d] px-5 md:h-[72px] md:px-10">
        <img
          src={Icons.headerLogo}
          alt="Right Route"
          className="h-12 w-auto object-contain md:h-14"
        />
      </header>

      <div className="h-7 bg-[#ff823d]" />

      <main
        className="flex min-h-[calc(100vh-7rem)] items-center justify-center bg-cover bg-center px-4 pb-16"
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
              className="mb-3 h-9 w-24 bg-[#ff823d] text-xs text-white cursor-pointer"
            >
              CONFIRM
            </button>
            <button type="button" className="text-xs text-white underline underline-offset-2 cursor-pointer">
              Resend code
            </button>
          </form>
        </section>
      </main>
    </div>
  )
}

export default VerifyOtp

