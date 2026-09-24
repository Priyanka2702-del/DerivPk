import { positions } from "@/data/dashboard";

export default function PositionsTable() {
  return (
    <div className="border border-border bg-surface">
      <div className="border-b border-border px-4 py-3 text-sm font-semibold text-text">Open Positions</div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs text-text-muted">
              <th className="px-4 py-3 font-medium">Symbol</th>
              <th className="px-4 py-3 font-medium">Side</th>
              <th className="px-4 py-3 font-medium">Size</th>
              <th className="px-4 py-3 font-medium">Entry</th>
              <th className="px-4 py-3 font-medium">Current</th>
              <th className="px-4 py-3 text-right font-medium">P&amp;L</th>
            </tr>
          </thead>
          <tbody>
            {positions.map((p) => (
              <tr key={p.symbol + p.side} className="border-b border-border last:border-b-0 hover:bg-surface-2">
                <td className="px-4 py-3 font-medium text-text">{p.symbol}</td>
                <td className="px-4 py-3">
                  <span
                    className={`px-2 py-0.5 text-xs font-semibold ${
                      p.side === "Buy" ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"
                    }`}
                  >
                    {p.side}
                  </span>
                </td>
                <td className="num px-4 py-3 text-text">{p.size}</td>
                <td className="num px-4 py-3 text-text">{p.entry}</td>
                <td className="num px-4 py-3 text-text">{p.current}</td>
                <td className={`num px-4 py-3 text-right font-semibold ${p.up ? "text-emerald-600" : "text-red-600"}`}>
                  {p.pnl}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
