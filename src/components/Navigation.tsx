"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";

const navItems = [
  { href: "/", label: "Dashboard" },
  { href: "/vehicles", label: "Vozidla" },
  { href: "/fuel", label: "Tankování" },
  { href: "/expenses", label: "Náklady" },
  { href: "/maintenance", label: "Údržba" },
];

export default function Navigation() {
  const pathname = usePathname();
  const { data: session } = useSession();

  if (!session) return null;

  return (
    <nav className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-1">
            <Link href="/" className="text-xl font-bold text-emerald-400 mr-8">
              TankRide
            </Link>
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  pathname === item.href
                    ? "bg-gray-700 text-white"
                    : "text-gray-300 hover:bg-gray-700 hover:text-white"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-400">
              {session.user.name}
            </span>
            <button
              onClick={() => signOut()}
              className="text-sm text-gray-300 hover:text-white transition-colors"
            >
              Odhlásit
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
