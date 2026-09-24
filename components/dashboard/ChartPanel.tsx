export default function ChartPanel() {
  return (
    <div className="border border-border bg-surface p-4">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <div className="text-sm font-semibold text-text">EUR/USD</div>
          <div className="num text-2xl font-semibold text-text">1.0842</div>
        </div>
        <span className="text-sm font-semibold text-emerald-600">+0.34% today</span>
      </div>
      <svg viewBox="0 0 800 240" className="h-56 w-full">
        <polyline
          fill="none"
          stroke="#6f83ff"
          strokeWidth="2"
          points="0,150 40,140 80,160 120,120 160,135 200,90 240,110 280,70 320,95 360,55 400,75 440,50 480,65 520,40 560,58 600,35 640,48 680,25 720,42 760,20 800,38"
        />
      </svg>
    </div>
  );
}
