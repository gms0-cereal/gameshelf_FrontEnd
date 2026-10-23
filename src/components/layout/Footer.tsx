import { Link } from "react-router-dom";

const links = [
  ["About", "/about"],
  ["Contact", "/contact"],
  ["Help", "/help"],
  ["Privacy Policy", "/privacy"],
  ["Terms", "/terms"],
];

export default function Footer() {
  return (
    <footer className="flex min-h-[79px] flex-wrap items-center justify-between gap-6 bg-[#373646] px-5 py-6 text-xs leading-[15px] text-[#b4aec7] md:px-8 xl:px-16">
      <Link
        to="/"
        className="text-base leading-[19px] text-[#e0deeb]"
      >
        GameShelf
      </Link>

      <nav
        aria-label="Footer navigation"
        className="flex flex-wrap items-center gap-[26px]"
      >
        {links.map(([label, to]) => (
          <Link
            key={to}
            to={to}
            className="hover:text-[#e0deeb]"
          >
            {label}
          </Link>
        ))}
      </nav>

      <span>Demo • Sample content</span>
    </footer>
  );
}