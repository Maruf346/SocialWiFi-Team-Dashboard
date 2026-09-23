import { Link, useNavigate } from 'react-router'
import { Icons } from '../../assets/Images'

const Login = () => {
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

          <h1 className="mb-4 text-2xl font-normal text-[#ff823d]">Login</h1>

          <form
            className="flex w-full max-w-[245px] flex-col"
            onSubmit={(event) => {
              event.preventDefault()
              navigate('/otp')
            }}
          >
            <input
              type="email"
              placeholder="Email"
              aria-label="Email"
             
              className="mb-3 h-10 bg-white px-3 text-sm text-gray-700 outline-none placeholder:text-gray-400"
            />
            <input
              type="password"
              placeholder="Password"
              aria-label="Password"
             
              className="mb-3 h-10 bg-white px-3 text-sm text-gray-700 outline-none placeholder:text-gray-400"
            />

            <label className="mb-4 flex items-center gap-2 text-xs text-white">
              <input type="checkbox" defaultChecked className="h-4 w-4 accent-white" />
              Remember me
            </label>

            <button
              type="submit"
              className="mx-auto mb-4 h-9 w-20 rounded-[6px] bg-[#ff823d] text-xs font-semibold uppercase tracking-wider text-white transition hover:brightness-95 cursor-pointer"
            >
              LOGIN
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
