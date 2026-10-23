import { Link, NavLink } from "react-router-dom";

export function Navbar() {
  return (
    <nav className="bg-[#191627] border-b border-[#2a263d] px-6 py-3 flex items-center justify-between">
      <div className="flex items-center space-x-6">
        <Link to="/" className="text-purple-400 font-bold tracking-wider text-base flex items-center space-x-2">
          <span>||\ GAMESHELF</span>
        </Link>
        <div className="flex space-x-4 text-xs font-medium text-slate-300">
          <NavLink to="/" className="hover:text-white transition-colors">Home</NavLink>
          <NavLink to="/my-library" className="hover:text-white transition-colors">My Library</NavLink>
        </div>
      </div>

      <div className="flex items-center space-x-4">
        <Link to="/admin" className="text-xs text-purple-400 hover:text-purple-300 font-medium">
          Admin Dashboard →
        </Link>
      </div>
    </nav>
  );
}

export default Navbar;