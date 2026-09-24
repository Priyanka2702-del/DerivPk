import Link from "next/link";

export default function VerificationBanner() {
  return (
    <div className="relative mb-6 overflow-hidden rounded-xl border border-accent-2/15 bg-accent-2/10">
      <div className="relative z-10 flex flex-col items-start justify-between gap-4 px-6 py-8 sm:flex-row sm:items-center sm:px-10">
        <div>
          <h2 className="font-display text-xl font-semibold text-text sm:text-2xl">
            Personal Details Verification
          </h2>
          <p className="mt-1 text-sm text-text-muted">
            Please complete the personal data verification.
          </p>
        </div>
        <Link
          href="/dashboard/verification"
          className="shrink-0 rounded-lg border border-accent-2/20 bg-surface px-5 py-2.5 text-sm font-semibold text-accent-2 transition hover:bg-accent-2/5"
        >
          Verify Now
        </Link>
      </div>
    </div>
  );
}