import { Gem } from "lucide-react";

const rewards = [
  { id: 1, name: "$10 Trading Credit", points: 500 },
  { id: 2, name: "$25 Trading Credit", points: 1200 },
  { id: 3, name: "Free Market Analysis Report", points: 300 },
  { id: 4, name: "1-on-1 Strategy Session", points: 2000 },
];

export default function PointsPage() {
  return (
    <div>
      <div className="mb-1 flex items-center gap-2">
        <Gem size={20} className="text-accent-2" />
        <h1 className="font-display text-xl font-semibold text-text">Points Mall</h1>
      </div>
      <p className="mb-4 flex items-start gap-1.5 text-xs text-text-muted">
        
      </p>

      <div className="mb-6 rounded-xl border border-border bg-surface p-6">
        <p className="text-xs text-text-muted">Your balance</p>
        <p className="num mt-1 font-display text-3xl font-bold text-text">0 pts</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {rewards.map((r) => (
          <div key={r.id} className="flex flex-col rounded-xl border border-border bg-surface p-5">
            <p className="text-sm font-semibold text-text">{r.name}</p>
            <p className="num mt-1 text-sm text-text-muted">{r.points} pts</p>
            <button
              type="button"
              disabled
              className="mt-4 w-full rounded-lg bg-surface-2 py-2.5 text-sm font-semibold text-text-muted disabled:cursor-not-allowed"
            >
              Redeem
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
