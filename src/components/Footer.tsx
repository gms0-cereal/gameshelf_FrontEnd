import { Link } from "react-router-dom";

const links = [
  { to: "/", label: "Home" },
  { to: "/discover", label: "Discover Games" },
  { to: "/mygamelist", label: "My Game List" },
  { to: "/about", label: "About" },
  { to: "/contact", label: "Contact" },
  { to: "/privacy", label: "Privacy Policy" },
  { to: "/terms", label: "Terms" },
];

const Footer = () => {
  return (
    <footer className="border-t border-[#3a3750] bg-[#35334a]">
      <div className="mx-auto flex max-w-[1200px] flex-col items-center gap-4 px-4 py-6 text-center sm:px-6 md:h-16 md:flex-row md:justify-between md:py-0 md:text-left lg:px-[52px]">
        <Link to="/" className="text-base text-[#e6e3f5]">
          GameShelf
        </Link>
        <nav aria-label="Footer">
          <ul className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
            {links.map((l) => (
              <li key={l.label}>
                <Link to={l.to} className="text-xs text-[#b4b1cc] transition-colors hover:text-white">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <p className="text-xs text-[#b4b1cc]">
          © {new Date().getFullYear()} GameShelf • Sample content
        </p>
      </div>
    </footer>
  );
};

export default Footer;