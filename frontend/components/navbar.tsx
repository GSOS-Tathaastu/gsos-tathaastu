"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/", label: "Home" },
  { href: "/how-it-works", label: "How it works" },
  { href: "/modules", label: "Modules" },
  { href: "/survey", label: "Survey" },
  { href: "/contact", label: "Contact" }
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <header className="border-b bg-white sticky top-0 z-50">
      <div className="max-w-6xl mx-auto flex items-center justify-between px-4 py-3">
        <Link href="/" className="text-xl font-bold text-indigo-700">
          GSOS&nbsp;TATHAASTU
        </Link>
        <nav className="flex gap-6">
          {navItems.map((item) => {
            const active = pathname === item.href || (item.href !== "/" && pathname?.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`hover:text-indigo-600 transition ${active ? "text-indigo-600 font-medium" : "text-gray-700"}`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
