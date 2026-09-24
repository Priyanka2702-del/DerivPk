import { watchlist } from "@/data/dashboard";

export default function Watchlist() {
  return (
    <div className="border border-border bg-surface">
      <div className="border-b border-border px-4 py-3 text-sm font-semibold text-text">Watchlist</div>
      <ul>
        {watchlist.map((w) => (
          <li
            key={w.symbol}
            className="flex items-center justify-between border-b border-border px-4 py-3 text-sm last:border-b-0 hover:bg-surface-2"
          >
            <span className="font-medium text-text">{w.symbol}</span>
            <div className="text-right">
              <div className="num text-text">{w.price}</div>
              <div className={`text-xs ${w.up ? "text-emerald-600" : "text-red-600"}`}>{w.change}</div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
