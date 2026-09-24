"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Wallet, Bell, Globe, UserCircle, LogOut, Settings } from "lucide-react";
import Link from "next/link";
import MobileNav from "@/components/dashboard/MobileNav";
import { logout } from "@/lib/session";

const notifications = [
  { id: 1, text: "Your identity verification is pending review.", time: "2h ago" },
  { id: 2, text: "Deposit of $500.00 was completed.", time: "1d ago" },
];

export default function TopBar() {
  const [openMenu, setOpenMenu] = useState<"notifications" | "profile" | null>(null);
  const router = useRouter();

  const toggle = (menu: "notifications" | "profile") =>
    setOpenMenu((m) => (m === menu ? null : menu));

  const handleLogout = () => {
    logout();
    setOpenMenu(null);
    router.push("/login");
  };

  return (
    <div className="flex h-16 items-center justify-between gap-3 border-b border-border bg-surface px-4 sm:px-6 lg:justify-end lg:px-8">
      <MobileNav />

      <div className="flex items-center gap-3">
        <Link
          href="/dashboard/accounts"
          aria-label="Wallet"
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-border text-text-muted hover:text-text"
        >
          <Wallet size={17} />
        </Link>

        <Link
          href="/dashboard/funds"
className="rounded-lg bg-accent-2/10 px-4 py-2 text-sm font-semibold text-accent-2 transition hover:bg-accent-2/20"        >
          Deposit
        </Link>

        <div className="mx-1 hidden h-6 w-px bg-border sm:block" />

        {/* Notifications */}
        <div className="relative">
          <button
            type="button"
            aria-label="Notifications"
            onClick={() => toggle("notifications")}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-text-muted hover:text-text"
          >
            <Bell size={18} />
          </button>
          {openMenu === "notifications" && (
            <div className="absolute right-0 top-11 z-40 w-72 rounded-xl border border-border bg-surface p-2 shadow-lg">
              <p className="px-2 py-1.5 text-xs font-semibold uppercase tracking-wider text-text-muted">
                Notifications
              </p>
              {notifications.map((n) => (
                <div key={n.id} className="rounded-lg px-2 py-2 hover:bg-surface-2">
                  <p className="text-sm text-text">{n.text}</p>
                  <p className="mt-0.5 text-xs text-text-muted">{n.time}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Language — visual placeholder only; not wired to real translations yet */}
        <button
          type="button"
          aria-label="Language"
          className="flex h-9 w-9 items-center justify-center rounded-lg text-text-muted hover:text-text"
        >
          <Globe size={18} />
        </button>

        {/* Profile */}
        <div className="relative">
          <button
            type="button"
            aria-label="Profile menu"
            onClick={() => toggle("profile")}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-accent-2/10 text-accent-2"
          >
            <UserCircle size={20} />
          </button>
          {openMenu === "profile" && (
            <div className="absolute right-0 top-11 z-40 w-52 rounded-xl border border-border bg-surface p-1.5 shadow-lg">
              <Link
                href="/dashboard/profile"
                onClick={() => setOpenMenu(null)}
                className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-text hover:bg-surface-2"
              >
                <Settings size={16} /> Profile settings
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm text-text hover:bg-surface-2"
              >
                <LogOut size={16} /> Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}