"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, Globe, X } from "lucide-react";
import Logo from "./Logo";
import Button from "./Button";
import { megaMenus, simpleNavItems, languages } from "@/data/navigation";

export default function MobileNav({ onClose }: { onClose: () => void }) {
  const [openKey, setOpenKey] = useState<string | null>(null);
  const [lang, setLang] = useState("EN");

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-bg md:hidden" role="dialog" aria-modal="true">
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <Logo />
        <button
          type="button"
          onClick={onClose}
          aria-label="Close menu"
          className="flex h-10 w-10 items-center justify-center rounded-full border border-border text-text"
        >
          <X size={20} aria-hidden />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto px-5 py-4" aria-label="Mobile">
        <ul className="flex flex-col divide-y divide-border">
          {megaMenus.map((menu) => {
            const isOpen = openKey === menu.key;
            return (
              <li key={menu.key} className="py-1">
                <button
                  type="button"
                  onClick={() => setOpenKey(isOpen ? null : menu.key)}
                  aria-expanded={isOpen}
                  className="flex w-full items-center justify-between py-3 text-left text-base font-semibold text-text"
                >
                  {menu.label}
                  <ChevronDown
                    size={18}
                    className={`transition-transform duration-200 ${isOpen ? "rotate-180 text-accent" : "text-text-faint"}`}
                    aria-hidden
                  />
                </button>
                <div
                  className={`grid overflow-hidden transition-all duration-300 ease-out ${
                    isOpen ? "grid-rows-[1fr] pb-3 opacity-100" : "grid-rows-[0fr] opacity-0"
                  }`}
                >
                  <div className="min-h-0">
                    <ul className="flex flex-col gap-1 pl-1">
                      {menu.columns.flatMap((c) => c.links).map((link) => (
                        <li key={link.label}>
                          <Link
                            href={link.href}
                            onClick={onClose}
                            className="block rounded-lg px-3 py-2 text-sm text-text-muted hover:bg-surface hover:text-text"
                          >
                            {link.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </li>
            );
          })}
          {simpleNavItems.map((item) => (
            <li key={item.label} className="py-1">
              <Link
                href={item.href}
                onClick={onClose}
                className="block py-3 text-base font-semibold text-text"
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>

        <div className="mt-4 flex items-center gap-2 py-3">
          <Globe size={16} className="text-text-faint" aria-hidden />
          <select
            value={lang}
            onChange={(e) => setLang(e.target.value)}
            aria-label="Select language"
            className="rounded-lg border border-border bg-surface px-2 py-1.5 text-sm text-text"
          >
            {languages.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </select>
        </div>
      </nav>

      <div className="flex flex-col gap-3 border-t border-border px-5 py-5">
        <Button href="/login" variant="secondary" className="w-full" onClick={onClose}>
          Log in
        </Button>
        <Button href="/register" variant="primary" className="w-full" onClick={onClose}>
          Open Account
        </Button>
      </div>
    </div>
  );
}
