"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  {
    href: "/home",
    label: "Inicio",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
        <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
      </svg>
    ),
  },
  {
    href: "/desks",
    label: "Puestos",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
        <path d="M20 7H4c-1.1 0-2 .9-2 2v6c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V9c0-1.1-.9-2-2-2zm0 8H4V9h16v6zM6 10h2v4H6zm4 0h2v4h-2zm4 0h4v4h-4z" />
      </svg>
    ),
  },
  {
    href: "/parking",
    label: "Parking",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
        <path d="M13 3H6v18h4v-6h3c3.31 0 6-2.69 6-6s-2.69-6-6-6zm.2 8H10V7h3.2c1.1 0 2 .9 2 2s-.9 2-2 2z" />
      </svg>
    ),
  },
  {
    href: "/status",
    label: "Mi Estado",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
        <path d="M17 12h-5v5h5v-5zM16 1v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2h-1V1h-2zm3 18H5V8h14v11z" />
      </svg>
    ),
  },
  {
    href: "/incidentes",
    label: "Incidentes",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
      </svg>
    ),
  },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-dhl-mid-gray safe-bottom z-50">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-2">
        {NAV_ITEMS.map((item) => {
          const isActive = item.href === "/home" ? pathname === "/home" : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-label={item.label}
              aria-current={isActive ? "page" : undefined}
              className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded-xl transition-colors min-w-0 flex-1 min-h-[44px] justify-center ${
                isActive
                  ? "text-dhl-red"
                  : "text-dhl-gray hover:text-dhl-dark"
              }`}
            >
              {item.icon}
              <span className="text-[10px] font-medium truncate">{item.label}</span>
              {isActive && (
                <span className="w-4 h-0.5 rounded-full bg-dhl-yellow mt-0.5" aria-hidden="true" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
