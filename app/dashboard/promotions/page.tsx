import Link from "next/link";
import { Gift } from "lucide-react";
import { promotions } from "@/data/dashboard";

export default function PromotionsPage() {
  return (
    <div>
      <div className="mb-5">
        <h1 className="font-display text-xl font-semibold text-text">Promotions</h1>
        <p className="text-sm text-text-muted">Current offers and rewards for PK clients.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {promotions.map((p) => (
          <div
            key={p.id}
            className="flex flex-col rounded-xl border border-border bg-gradient-to-br from-surface to-surface-2 p-6"
          >
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-accent-2 text-white">
              <Gift size={18} />
            </div>
            {p.tag && (
              <span className="mb-2 w-fit rounded-full bg-text-muted/10 px-2.5 py-0.5 text-xs font-semibold text-text-muted">
                {p.tag}
              </span>
            )}
            <h2 className="font-display text-base font-semibold bg-gradient-to-r from-accent to-accent-2 bg-clip-text text-transparent">
              {p.title}
            </h2>
            <p className="mt-2 flex-1 text-sm text-text-muted">{p.description}</p>
            <Link
              href="/dashboard/funds"
              className="mt-4 text-sm font-semibold bg-gradient-to-r from-accent to-accent-2 bg-clip-text text-transparent transition hover:opacity-80"
            >
              Learn more →
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}