import { useNavigate } from 'react-router'
import { Icons } from '../../assets/Images'

const ForgotPassword = () => {
  const navigate = useNavigate()

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

          <form
            className="flex w-full max-w-[245px] flex-col"
            onSubmit={(event) => {
              event.preventDefault()
              navigate('/verify-otp')
            }}
          >
            <input
              type="email"
              placeholder="Email"
              aria-label="Email"
              required
              className="mb-4 h-10 bg-white px-3 text-sm text-gray-700 outline-none placeholder:text-gray-400"
            />

            <button
              type="submit"
              className="mx-auto h-9 w-20 rounded-[6px] bg-[#ff823d] text-xs font-semibold uppercase tracking-wider text-white transition hover:brightness-95 cursor-pointer"
            >
              SUBMIT
            </button>
          </form>
        </section>
      </main>
    </div>
  )
}

export default ForgotPassword
