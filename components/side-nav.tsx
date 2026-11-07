"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/app", label: "Impact" },
  { href: "/app/reminders", label: "Reminders" },
  { href: "/app/import", label: "Import" },
  { href: "/app/wallet", label: "Credits" },
  { href: "/app/settings", label: "WhatsApp" },
  { href: "/app/developers", label: "API" },
];

export function SideNav({ showOperator }: { showOperator: boolean }) {
  const pathname = usePathname();
  const items = showOperator
    ? [...links, { href: "/app/operator", label: "Operator" }]
    : links;
  return (
    <nav className="flex gap-1 overflow-x-auto px-3 pb-3 md:flex-col md:px-3">
      {items.map((item) => {
        const active =
          item.href === "/app" ? pathname === "/app" : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={`rounded-full px-3 py-2 text-sm whitespace-nowrap ${
              active ? "bg-ink text-paper" : "text-ink hover:bg-sand"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
