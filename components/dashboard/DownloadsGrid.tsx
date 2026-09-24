import { Monitor, Smartphone, Globe2, Info, Download as DownloadIcon } from "lucide-react";
import { downloadPlatforms } from "@/data/dashboard";
import type { DownloadPlatform } from "@/types/dashboard";

const categoryIcon = {
  Desktop: Monitor,
  Mobile: Smartphone,
  Web: Globe2,
  Tools: Monitor,
} as const;

function DownloadButton({ platform }: { platform: DownloadPlatform }) {
  if (platform.available && platform.url) {
    return (
      <a
        href={platform.url}
        target="_blank"
        rel="noopener noreferrer"
className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-lg bg-accent-2/10 py-2.5 text-sm font-semibold text-accent-2 transition hover:bg-accent-2/20"      >
        <DownloadIcon size={15} />
        Download
      </a>
    );
  }

  return (
    <button
      type="button"
      disabled
      className="mt-4 w-full rounded-lg bg-surface-2 py-2.5 text-sm font-semibold text-text-muted disabled:cursor-not-allowed"
    >
      Coming soon
    </button>
  );
}

export default function DownloadsGrid() {
  return (
    <div>
      <div className="mb-5">
        <h1 className="font-display text-xl font-semibold text-text">Downloads</h1>
        <p className="text-sm text-text-muted">Get the PK platform on any device.</p>
      </div>

      <p className="mb-4 flex items-start gap-1.5 text-xs text-text-muted">
        <Info size={13} className="mt-0.5 shrink-0" />
        These link out to the official MetaTrader 5 installers/store pages. Once PK has
        its own branded build, these will be replaced with our own hosted downloads.
      </p>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {downloadPlatforms.map((d) => {
          const Icon = categoryIcon[d.category];
          return (
            <div key={d.id} className="flex flex-col rounded-xl border border-border bg-surface p-6">
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-accent-2/10 text-accent-2">
                <Icon size={18} />
              </div>
              <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">{d.category}</p>
              <h2 className="mt-1 font-display text-base font-semibold text-text">{d.name}</h2>
              <p className="mt-2 flex-1 text-sm text-text-muted">{d.description}</p>
              <DownloadButton platform={d} />
            </div>
          );
        })}
      </div>
    </div>
  );
}