import { Menu } from "lucide-react";
import { Icons } from "../../assets/Images";
import { useNavigate } from "react-router";

const Header = ({ onMenuClick }) => {
  const navigate = useNavigate();
  return (
    <div className="flex h-full w-full items-center justify-between bg-[#0b0d2d] px-4 md:px-8">
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
          className="h-11 w-auto object-contain md:h-14"
        />
      </div>

      <nav className="hidden items-center gap-2 text-xs uppercase text-white md:flex lg:text-sm">
        <span>Welcome, admin@gmail.com.</span>
        <a href="#view-site" className="underline underline-offset-2">
          View site
        </a>
        <span>/</span>
        <a href="#change-password" className="underline underline-offset-2">
          Change password
        </a>
        <span>/</span>
        <button
          onClick={() => navigate("/")}
          className="underline underline-offset-2 cursor-pointer"
        >
          Log out
        </button>
      </nav>
    </div>
  );
};

export default Header;
