"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface MobileNavItem {
  href: string;
  label: string;
  soon?: boolean;
  icon: (active: boolean) => React.ReactNode;
}

const navItems: MobileNavItem[] = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: (active: boolean) => (
      <svg className={`w-5 h-5 ${active ? "text-primary" : "text-text-muted"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 2.5 : 2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    href: "/inbox",
    label: "Inbox",
    icon: (active: boolean) => (
      <svg className={`w-5 h-5 ${active ? "text-primary" : "text-text-muted"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 2.5 : 2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
      </svg>
    ),
  },
  {
    href: "/settings",
    label: "Brand Brain",
    icon: (active: boolean) => (
      <svg className={`w-5 h-5 ${active ? "text-primary" : "text-text-muted"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 2.5 : 2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
      </svg>
    ),
  },
  {
    href: "/scheduler",
    label: "Scheduler",
    soon: true,
    icon: (active: boolean) => (
      <svg className={`w-5 h-5 ${active ? "text-primary" : "text-text-muted"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 2.5 : 2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
  },
];

export default function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden border-t border-border bg-surface/90 backdrop-blur-xl">
      <div className="flex items-center justify-around px-4 py-2 safe-area-pb">
        {navItems.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center gap-1 px-4 py-2 min-w-[64px]"
            >
              {item.icon(active)}
              <span className={`text-[10px] font-medium transition-colors ${active ? "text-primary" : "text-text-muted"}`}>
                {item.label}
                {item.soon && <span className="ml-0.5 text-[8px] text-accent-purple align-super">✦</span>}
              </span>
              {active && (
                <span className="absolute bottom-0 w-8 h-0.5 bg-primary rounded-t-full shadow-[0_0_8px_rgba(123,63,242,0.6)]" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
