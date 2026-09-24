"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronRight, Copy, Check } from "lucide-react";

// Demo values — swap these for the real referral link/code when ready.
const REFERRAL_LINK = "https://pktrading.com/r/DEMO2026";
const REFERRAL_CODE = "DEMO2026";

function CopyField({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard unavailable — silently ignore for this demo control
    }
  };

  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-surface-2 px-3.5 py-2.5">
      <div className="min-w-0">
        <p className="text-[11px] font-medium text-text-muted">{label}</p>
        <p className="truncate text-sm font-semibold text-text">{value}</p>
      </div>
      <button
        type="button"
        onClick={handleCopy}
        aria-label={`Copy ${label}`}
        className="shrink-0 rounded-md p-1.5 text-text-muted transition hover:bg-surface hover:text-accent-2"
      >
        {copied ? <Check size={15} className="text-emerald-600" /> : <Copy size={15} />}
      </button>
    </div>
  );
}

export default function ReferEarnCard() {
  return (
    <div className="mt-6 rounded-xl border border-border bg-surface p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-display text-base font-semibold text-text">Refer & Earn</h2>
        <Link
          href="/dashboard/referrals"
          className="flex items-center gap-1 text-sm font-medium text-text-muted transition hover:text-text"
        >
          My Customers <ChevronRight size={15} />
        </Link>
      </div>

      <select
        defaultValue=""
        className="mb-4 w-full rounded-lg border border-border px-3.5 py-2.5 text-sm text-text-muted outline-none transition focus:border-accent-2"
      >
        <option value="" disabled>Please select group</option>
        <option value="default">Default Group</option>
      </select>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        {/* QR code */}
        <div className="flex shrink-0 flex-col items-center gap-1.5">
          <div className="overflow-hidden rounded-lg border border-border p-1.5">
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(REFERRAL_LINK)}`}
              alt="Referral QR code"
              width={110}
              height={110}
              className="h-[110px] w-[110px]"
            />
          </div>
          <span className="text-xs font-medium text-text-muted">Save Code</span>
        </div>

        {/* Link + invite code */}
        <div className="flex-1 space-y-2.5">
          <CopyField label="Link" value={REFERRAL_LINK} />
          <CopyField label="Invite Code" value={REFERRAL_CODE} />
        </div>
      </div>
    </div>
  );
}