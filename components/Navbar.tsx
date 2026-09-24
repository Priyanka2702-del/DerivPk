"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChevronDown, ExternalLink, Globe, Menu } from "lucide-react";
import Logo from "./Logo";
import MegaMenu from "./MegaMenu";
import MobileNav from "./MobileNav";
import { megaMenus, simpleNavItems, languages } from "@/data/navigation";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [lang, setLang] = useState("EN");
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";

    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  const openWithDelay = (key: string) => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setOpenMenu(key);
  };

  const closeWithDelay = () => {
    closeTimer.current = setTimeout(() => setOpenMenu(null), 120);
  };

  const findMenu = (terms: string[]) => {
    return megaMenus.find((menu) => {
      const value = `${menu.key} ${menu.label}`.toLowerCase();
      return terms.some((term) => value.includes(term.toLowerCase()));
    });
  };

  const pillNavItems = [
    {
      key: "trading",
      label: "Trading",
      menu: findMenu(["trade", "trading"]),
    },
    {
      key: "platforms",
      label: "Platforms",
      menu: findMenu(["platform"]),
    },
    {
      key: "about",
      label: "About",
      menu: findMenu(["about"]),
    },
    {
      key: "learning-support",
      label: "Learning & support",
      menu: findMenu(["support", "learning"]),
    },
  ];

  const partnersHref =
    simpleNavItems.find((item) => item.label.toLowerCase().includes("partner"))?.href ??
    "/partners";

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-50 w-full transition-all duration-300 ${
          scrolled || openMenu || mobileOpen
            ? "border-b border-white/10 bg-[#080b11]/80 shadow-[0_18px_60px_rgba(0,0,0,0.22)] backdrop-blur-xl"
            : "border-b border-transparent bg-transparent"
        }`}
      >
        <div className="pk-container flex h-20 items-center justify-between lg:h-24">
          {/* Left Logo */}
          <div className="flex min-w-0 flex-1 items-center">
            <Logo />
          </div>

          {/* Center Pill Nav */}
          <nav
            className="hidden items-center gap-1 rounded-full border border-white/10 bg-white/25 px-6 py-3.5 text-white shadow-[0_18px_60px_rgba(0,0,0,0.18)] backdrop-blur-xl lg:flex xl:px-7"
            aria-label="Primary"
            onMouseLeave={closeWithDelay}
          >
            {pillNavItems.map((item) => {
              if (!item.menu) {
                return (
                  <Link
                    key={item.key}
                    href="#"
                    className="flex items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 py-2 text-sm font-bold text-white transition hover:bg-white/10 xl:text-base"
                  >
                    {item.label}
                    <ChevronDown size={17} strokeWidth={2.5} aria-hidden />
                  </Link>
                );
              }

              return (
                <div
                  key={item.key}
                  className="relative"
                  onMouseEnter={() => openWithDelay(item.key)}
                >
                  <button
                    type="button"
                    aria-expanded={openMenu === item.key}
                    onClick={() => setOpenMenu(openMenu === item.key ? null : item.key)}
                    className="flex items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 py-2 text-sm font-bold text-white transition hover:bg-white/10 xl:text-base"
                  >
                    {item.label}
                    <ChevronDown
                      size={17}
                      strokeWidth={2.5}
                      className={`transition-transform duration-200 ${
                        openMenu === item.key ? "rotate-180" : ""
                      }`}
                      aria-hidden
                    />
                  </button>

                  {openMenu === item.key && <MegaMenu menu={item.menu} />}
                </div>
              );
            })}

            {/* Partners */}
            <Link
              href={partnersHref}
              className="flex items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 py-2 text-sm font-bold text-white transition hover:bg-white/10 xl:text-base"
            >
              Partners
              <ExternalLink size={16} strokeWidth={2.5} aria-hidden />
            </Link>

            <span className="mx-2 h-6 w-px bg-white/20" />

            {/* Language */}
            <div className="relative flex items-center gap-2 rounded-full px-3 py-2 text-white">
              <Globe size={18} strokeWidth={2.4} aria-hidden />

              <select
                value={lang}
                onChange={(e) => setLang(e.target.value)}
                aria-label="Select language"
                className="cursor-pointer appearance-none bg-transparent pr-6 text-sm font-bold text-white outline-none xl:text-base"
              >
                {languages.map((l) => (
                  <option key={l} value={l} className="bg-[#111827] text-white">
                    {l}
                  </option>
                ))}
              </select>

              <ChevronDown
                size={15}
                strokeWidth={2.5}
                className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-white"
                aria-hidden
              />
            </div>
          </nav>

          {/* Right CTA */}
          <div className="flex flex-1 items-center justify-end gap-3">
            <Link
              href="/register"
              className="hidden rounded-full bg-[#ff3f4e] px-8 py-4 text-base font-extrabold text-white shadow-[0_18px_45px_rgba(255,63,78,0.35)] transition hover:-translate-y-0.5 hover:bg-[#ff5260] lg:inline-flex xl:px-9"
            >
              Trade now
            </Link>

            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
              className="flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white backdrop-blur-md transition hover:bg-white/15 lg:hidden"
            >
              <Menu size={22} aria-hidden />
            </button>
          </div>
        </div>
      </header>

      {mobileOpen && <MobileNav onClose={() => setMobileOpen(false)} />}
    </>
  );
}