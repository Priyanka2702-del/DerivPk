import Image from "next/image";
import Link from "next/link";

export default function Logo({ className = "" }: { className?: string }) {
  return (
    <Link
      href="/"
      aria-label="Deriv PK home"
      className={`inline-flex shrink-0 items-center gap-2 whitespace-nowrap ${className}`}
    >
      {/* Deriv logo */}
      <Image
        src="/images/logo.svg"
        alt="Deriv"
        width={92}
        height={34}
        priority
        className="h-[32px] w-auto shrink-0 object-contain"
      />

      {/* PK side text */}
      <span className="shrink-0 translate-y-[2px] text-[22px] font-black italic leading-none tracking-[-0.06em] text-[#ff3f4e]">
        PK
      </span>
    </Link>
  );
}