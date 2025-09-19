"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

export default function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const nav = [
    { href: "/", label: "Home" },
    { href: "/how-it-works", label: "How it works" },
    { href: "/modules", label: "Modules" },
    { href: "/start", label: "Survey" },
    { href: "/contact", label: "Contact" },
    { href: "/investors", label: "Investors" },
    { href: "/admin/health", label: "Admin" },
  ];

  function isActive(href: string) {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 md:py-4">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-xl font-extrabold tracking-tight text-indigo-700">
            GSOS TATHAASTU
          </span>
        </Link>

        <nav className="hidden gap-6 md:flex">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={
                "text-sm transition-colors " +
                (isActive(item.href)
                  ? "text-indigo-700 font-semibold"
                  : "text-gray-700 hover:text-black")
              }
            >
              {item.label}
            </Link>
          ))}
          <span className="text-xs text-gray-400">🔒 Admin & Investors</span>
        </nav>

        <button
          className="md:hidden inline-flex items-center justify-center rounded-lg border px-3 py-2 text-sm"
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          {open ? "Close" : "Menu"}
        </button>
      </div>

      {open && (
        <div className="md:hidden border-t">
          <nav className="mx-auto flex max-w-6xl flex-col px-4 py-3">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={
                  "rounded-lg px-3 py-2 text-sm " +
                  (isActive(item.href)
                    ? "bg-indigo-50 text-indigo-700 font-semibold"
                    : "text-gray-700 hover:bg-gray-50")
                }
              >
                {item.label}
              </Link>
            ))}
            <div className="px-3 py-2 text-xs text-gray-400">🔒 Admin & Investors</div>
          </nav>
        </div>
      )}
    </header>
  );
}
