import { Star } from "lucide-react";

export default function HeroTrustBar() {
  return (
    <div className="relative z-20 mt-auto shrink-0 border-t border-white/10 bg-[#111827]/95 py-4 backdrop-blur-md">
      <div className="pk-container flex flex-col items-center justify-center gap-3 text-center sm:flex-row sm:flex-wrap sm:gap-5">
        <div className="flex items-center gap-1" aria-hidden>
          {Array.from({ length: 5 }).map((_, i) => (
            <span
              key={i}
              className={`grid h-8 w-8 place-items-center rounded-[2px] ${
                i === 4 ? "bg-[#00B67A]/75" : "bg-[#00B67A]"
              }`}
            >
              <Star size={18} className="fill-white text-white" strokeWidth={0} />
            </span>
          ))}
        </div>

        <p className="text-sm font-medium text-white sm:text-base">
          <span className="font-bold">PK</span> scores{" "}
          <span className="font-bold">4.3 out of 5</span> based on{" "}
          <span className="font-bold">71,887 reviews</span>
        </p>

        <div className="hidden h-5 w-px bg-white/20 sm:block" />

        <div className="flex items-center gap-1.5 text-lg font-bold text-white">
          <Star size={24} className="fill-[#00B67A] text-[#00B67A]" strokeWidth={0} />
          Trustpilot
        </div>
      </div>
    </div>
  );
}