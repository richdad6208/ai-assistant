"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/svg", label: "SVG 변환기" },
  { href: "/props", label: "Props 주입기" },
];

export default function Header() {
  const pathname = usePathname();

  return (
    <header className="fixed top-0 left-0 w-full bg-white border-b border-gray-200 z-50">
      <nav className="flex gap-4 px-6 py-3">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`px-3 py-1 rounded ${
              pathname === item.href
                ? "bg-[#0091bc] text-white"
                : "hover:bg-gray-100"
            }`}
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
