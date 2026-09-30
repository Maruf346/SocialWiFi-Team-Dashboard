import { Menu } from 'lucide-react'
import { useNavigate } from 'react-router'
import { Icons } from '../../assets/Images'
import { useAuth } from '../../context/useAuth'

const Header = ({ onMenuClick }) => {
  const navigate = useNavigate()
  const { logout, user } = useAuth()
  const displayName = user?.full_name || user?.email || 'Team user'

  const handleLogout = async () => {
    await logout()
    navigate('/')
  }

  return (
    <div className="flex h-full w-full items-center justify-between bg-transparent px-4 md:px-8">
      <div className="flex items-center gap-3">
        <button
          type="button"
          className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-white/30 text-white md:hidden"
          onClick={onMenuClick}
          aria-label="Open navigation menu"
        >
          <Menu size={22} />
        </button>
        <img
          src={Icons.headerLogo}
          alt="Right Route"
          className="w-[185px] py-[10px] object-contain"
        />
      </div>

      <nav className="hidden items-center gap-2 text-xs uppercase text-white md:flex lg:text-sm">
        <span>Welcome, {displayName}.</span>
        <a
          href="https://getrightroute.app"
          target="_blank"
          rel="noopener noreferrer"
          className="underline underline-offset-2"
        >
          View site
        </a>

        <span>/</span>
        <button
          type="button"
          onClick={() => navigate('/dashboard/manage/email')}
          className="underline underline-offset-2 cursor-pointer uppercase text-xs lg:text-sm text-white"
        >
          Change password
        </button>
        <span>/</span>
        <button
          type="button"
          onClick={handleLogout}
          className="underline underline-offset-2 cursor-pointer"
        >
          Log out
        </button>
      </nav>
    </div>
  )
}

export default Header