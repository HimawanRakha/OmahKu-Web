"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Heart,
  Receipt,
  Star,
  Home,
  Calendar,
  BarChart3,
  List,
} from "lucide-react";

const USER_LINKS = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/wishlist", label: "Wishlist", icon: Heart },
  { href: "/dashboard/transactions", label: "Transaksi", icon: Receipt },
  { href: "/dashboard/reviews", label: "Ulasan", icon: Star },
];

const AGENT_LINKS = [
  { href: "/agent/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/agent/dashboard/listings", label: "Listing", icon: List },
  { href: "/agent/dashboard/bookings", label: "Booking", icon: Calendar },
  { href: "/agent/dashboard/analytics", label: "Analitik", icon: BarChart3 },
];

export function DashboardSidebar({ variant }: { variant: "user" | "agent" }) {
  const pathname = usePathname();
  const links = variant === "agent" ? AGENT_LINKS : USER_LINKS;

  return (
    <aside className="w-64 shrink-0 bg-surface border-r border-gray-200 min-h-[calc(100vh-4rem)]">
      <div className="p-4 border-b border-gray-100">
        <Link href="/" className="flex items-center gap-2 text-primary font-heading font-bold">
          <Home className="h-5 w-5" />
          OmahKu
        </Link>
        <p className="text-xs text-gray-500 mt-1">
          {variant === "agent" ? "Dashboard Agen" : "Dashboard Saya"}
        </p>
      </div>
      <nav className="p-3 space-y-1">
        {links.map((link) => {
          const Icon = link.icon;
          const active = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-primary/10 text-primary"
                  : "text-gray-600 hover:bg-gray-50",
              )}
            >
              <Icon className="h-4 w-4" />
              {link.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
