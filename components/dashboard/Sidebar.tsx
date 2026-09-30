
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import {
  ShieldCheck,
  Download,
  LogOut,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Home,
  Wallet2,
  Banknote,
  LineChart,
  Copy,
  Gift,
  FolderDown,
  Wrench,
  Gem,
  UserCircle,
  Radio,
  TrendingUp,
  ArrowDownToLine,
  ArrowUpFromLine,
  Repeat2,
  LayoutGrid,
  Handshake,
  Users,
} from "lucide-react";

import Logo from "@/components/Logo";
import { logoutUser } from "@/lib/client-auth";

type UserRole = "user" | "admin";

type CurrentUser = {
  id: string;
  name: string;
  email: string;
  role?: UserRole;
};

type NavItem = {
  label: string;
  href: string;
  icon: React.ElementType;
  badge?: string;
};

const accountLinks: NavItem[] = [
  {
    label: "Verification",
    href: "/dashboard/verification",
    icon: ShieldCheck,
  },
  {
    label: "Download",
    href: "/dashboard/download",
    icon: Download,
  },
];

const mainLinks: NavItem[] = [
  {
    label: "Home",
    href: "/dashboard",
    icon: Home,
  },
  {
    label: "My Assets",
    href: "/dashboard/assets",
    icon: LayoutGrid,
  },
  {
    label: "Accounts",
    href: "/dashboard/accounts",
    icon: Wallet2,
  },
  {
    label: "Funds",
    href: "/dashboard/funds",
    icon: Banknote,
  },
  {
    label: "Fast Deposit",
    href: "/dashboard/deposit",
    icon: ArrowDownToLine,
  },
  {
    label: "Withdraw",
    href: "/dashboard/withdraw",
    icon: ArrowUpFromLine,
  },
  {
    label: "Transfer",
    href: "/dashboard/transfer",
    icon: Repeat2,
  },
  {
    label: "Affiliate Program",
    href: "/dashboard/affiliate",
    icon: Handshake,
  },
  {
    label: "Team",
    href: "/dashboard/team",
    icon: Users,
  },
  {
    label: "Deriv PK Trading",
    href: "/dashboard/trading",
    icon: LineChart,
    badge: "NEW",
  },
  {
    label: "Deriv PK Copy",
    href: "/dashboard/copy",
    icon: Copy,
    badge: "NEW",
  },
  {
    label: "Deriv PAMM Invest",
    href: "/dashboard/pamm-invest",
    icon: TrendingUp,
    badge: "NEW",
  },
  {
    label: "Promotions",
    href: "/dashboard/promotions",
    icon: Gift,
  },
  {
    label: "Downloads",
    href: "/dashboard/downloads",
    icon: FolderDown,
  },
  {
    label: "Tools",
    href: "/dashboard/tools",
    icon: Wrench,
  },
  {
    label: "Points Mall",
    href: "/dashboard/points",
    icon: Gem,
  },
  {
    label: "Profile",
    href: "/dashboard/profile",
    icon: UserCircle,
  },
];

function getInitials(name: string) {
  const words = name
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (words.length === 0) {
    return "U";
  }

  if (words.length === 1) {
    return words[0]
      .slice(0, 2)
      .toUpperCase();
  }

  return `${words[0][0]}${words[words.length - 1][0]}`.toUpperCase();
}

/**
 * Temporary display ID.
 *
 * This is NOT the Deriv UID.
 * Later we should replace this with a dedicated
 * public customer UID stored in the User model.
 */
function getDisplayAccountId(id: string) {
  return `PK-${id.slice(-6).toUpperCase()}`;
}

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const [collapsed, setCollapsed] =
    useState(false);

  const [accountOpen, setAccountOpen] =
    useState(true);

  const [user, setUser] =
    useState<CurrentUser | null>(null);

  const [loadingUser, setLoadingUser] =
    useState(true);

  /*
   * Load currently authenticated user.
   */
  useEffect(() => {
    let cancelled = false;

    async function loadUser() {
      try {
        setLoadingUser(true);

        const response = await fetch(
          "/api/auth/me",
          {
            method: "GET",
            credentials: "include",
            cache: "no-store",
          }
        );

        const data = await response.json();

        if (
          cancelled
        ) {
          return;
        }

        if (
          !response.ok ||
          !data.success ||
          !data.user
        ) {
          setUser(null);
          return;
        }

        setUser(data.user);
      } catch (error) {
        if (!cancelled) {
          console.error(
            "SIDEBAR USER LOAD ERROR:",
            error
          );

          setUser(null);
        }
      } finally {
        if (!cancelled) {
          setLoadingUser(false);
        }
      }
    }

    loadUser();

    return () => {
      cancelled = true;
    };
  }, []);

  /*
   * Active navigation state.
   */
  const isActive = (href: string) => {
    if (href === "/dashboard") {
      return pathname === "/dashboard";
    }

    return (
      pathname === href ||
      pathname.startsWith(`${href}/`)
    );
  };

  /*
   * User display information.
   */
  const userInitials = useMemo(() => {
    if (!user?.name) {
      return "U";
    }

    return getInitials(user.name);
  }, [user?.name]);

  const displayAccountId = useMemo(() => {
    if (!user?.id) {
      return "PK-USER";
    }

    return getDisplayAccountId(user.id);
  }, [user?.id]);

  /*
   * Logout.
   */
  const handleLogout = async () => {
    try {
      const success = await logoutUser();

      if (success) {
        router.replace("/login");
        router.refresh();
      }
    } catch (error) {
      console.error(
        "SIDEBAR LOGOUT ERROR:",
        error
      );
    }
  };

  /*
   * Profile navigation.
   */
  const handleProfileClick = () => {
    if (collapsed) {
      setCollapsed(false);
    }

    router.push("/dashboard/profile");
  };

  return (
    <aside
      className={[
        "relative hidden shrink-0 flex-col",
        "border-r border-border bg-surface",
        "py-5 transition-all duration-200",
        "lg:flex",
        collapsed
          ? "w-[76px] px-3"
          : "w-64 px-5",
      ].join(" ")}
    >
      {/* Sidebar collapse button */}

      <button
        type="button"
        onClick={() =>
          setCollapsed(
            (value) => !value
          )
        }
        className="absolute -right-3 top-6 z-20 flex h-6 w-6 items-center justify-center rounded-full border border-border bg-surface text-text-muted shadow-sm transition hover:text-text"
        aria-label={
          collapsed
            ? "Expand sidebar"
            : "Collapse sidebar"
        }
      >
        {collapsed ? (
          <ChevronRight size={14} />
        ) : (
          <ChevronLeft size={14} />
        )}
      </button>

      {/* Logo */}

      <div className="mb-6 flex items-center">
        <Logo />
      </div>

      {/* Live Trading */}

      <Link
        href="/dashboard/live-trading"
        title={
          collapsed
            ? "Live Trading"
            : undefined
        }
        className={[
          "mb-4 flex items-center gap-3",
          "rounded-lg px-3 py-2.5",
          "bg-accent-2/10",
          "text-sm font-semibold text-accent-2",
          "transition hover:bg-accent-2/20",
          collapsed
            ? "justify-center"
            : "",
        ].join(" ")}
      >
        <Radio
          size={17}
          className="shrink-0"
        />

        {!collapsed && (
          <span>Live Trading</span>
        )}
      </Link>

      {/* User / Account card */}

      <button
        type="button"
        onClick={handleProfileClick}
        title={
          collapsed
            ? "Open Profile"
            : undefined
        }
        className={[
          "mb-4 flex w-full items-center gap-3",
          "rounded-lg border border-border",
          "px-3 py-2.5 text-left",
          "transition hover:bg-surface-2",
          collapsed
            ? "justify-center"
            : "",
        ].join(" ")}
      >
        {/* Avatar */}

        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent-2/10 font-display text-sm font-bold text-accent-2">
          {loadingUser
            ? "..."
            : userInitials}
        </div>

        {!collapsed && (
          <>
            <div className="min-w-0 flex-1">
              {loadingUser ? (
                <>
                  <div className="truncate text-sm font-semibold text-text">
                    Loading...
                  </div>

                  <div className="text-xs text-text-muted">
                    Individual Account
                  </div>
                </>
              ) : user ? (
                <>
                  <div className="truncate text-sm font-semibold text-text">
                    {user.name}
                  </div>

                  <div className="truncate text-xs text-text-muted">
                    UID: {displayAccountId}
                  </div>
                </>
              ) : (
                <>
                  <div className="truncate text-sm font-semibold text-text">
                    User
                  </div>

                  <div className="text-xs text-text-muted">
                    Individual Account
                  </div>
                </>
              )}
            </div>

            <ChevronUp
              size={16}
              className="shrink-0 text-text-muted"
            />
          </>
        )}
      </button>

      {/* Account navigation */}

      {accountOpen &&
        !collapsed && (
          <nav className="mb-4 flex flex-col gap-0.5 border-b border-border pb-4">
            {accountLinks.map(
              (link) => {
                const Icon = link.icon;

                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={[
                      "flex items-center gap-3",
                      "rounded-lg px-3 py-2.5",
                      "text-sm font-medium",
                      "transition",
                      isActive(link.href)
                        ? "bg-accent-2/10 text-accent-2"
                        : "text-text-muted hover:bg-surface-2 hover:text-text",
                    ].join(" ")}
                  >
                    <Icon size={17} />

                    <span>
                      {link.label}
                    </span>
                  </Link>
                );
              }
            )}

            {/* Logout */}

            <button
              type="button"
              onClick={handleLogout}
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-text-muted transition hover:bg-surface-2 hover:text-text"
            >
              <LogOut size={17} />

              <span>Logout</span>
            </button>
          </nav>
        )}

      {/* Main navigation */}

      <nav
        className="flex flex-1 flex-col gap-0.5 overflow-y-auto"
        aria-label="Main navigation"
      >
        {mainLinks.map((link) => {
          const Icon = link.icon;
          const active = isActive(
            link.href
          );

          return (
            <Link
              key={link.href}
              href={link.href}
              title={
                collapsed
                  ? link.label
                  : undefined
              }
              className={[
                "flex items-center gap-3",
                "rounded-lg px-3 py-2.5",
                "text-sm font-medium",
                "transition",
                active
                  ? "bg-accent-2/10 text-accent-2"
                  : "text-text-muted hover:bg-surface-2 hover:text-text",
                collapsed
                  ? "justify-center"
                  : "",
              ].join(" ")}
              aria-current={
                active
                  ? "page"
                  : undefined
              }
            >
              <Icon
                size={17}
                className="shrink-0"
              />

              {!collapsed && (
                <span className="flex min-w-0 flex-1 items-center justify-between gap-2">
                  <span className="truncate">
                    {link.label}
                  </span>

                  {link.badge && (
                    <span className="shrink-0 rounded bg-red-500 px-1.5 py-0.5 text-[10px] font-bold leading-none text-white">
                      {link.badge}
                    </span>
                  )}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Logout for collapsed sidebar */}

      {collapsed && (
        <button
          type="button"
          onClick={handleLogout}
          title="Logout"
          aria-label="Logout"
          className="mt-2 flex items-center justify-center rounded-lg px-3 py-2.5 text-text-muted transition hover:bg-surface-2 hover:text-text"
        >
          <LogOut size={17} />
        </button>
      )}
    </aside>
  );
}

