import Image from "next/image";

export default function HeroBackdrop() {
  return (
    <div aria-hidden className="absolute inset-0 -z-10 overflow-hidden bg-[#08111e]">
      <Image
        src="/images/bg-skyline.webp"
        alt=""
        fill
        priority
        sizes="100vw"
        className="scale-105 object-cover opacity-90 blur-[1.5px]"
      />

      {/* Main dark + blue cinematic overlay */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(90deg, rgba(2,6,12,0.96) 0%, rgba(2,6,12,0.82) 24%, rgba(7,35,62,0.52) 48%, rgba(6,42,72,0.45) 72%, rgba(5,18,32,0.62) 100%), radial-gradient(circle at 70% 28%, rgba(0,127,205,0.38) 0%, rgba(0,127,205,0.16) 28%, rgba(0,0,0,0) 55%)",
        }}
      />

      {/* Left readability shadow */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(90deg, rgba(0,0,0,0.62) 0%, rgba(0,0,0,0.35) 28%, rgba(0,0,0,0.04) 58%, rgba(0,0,0,0.15) 100%)",
        }}
      />

      {/* Bottom fade */}
      <div
        className="absolute inset-x-0 bottom-0 h-56"
        style={{
          background:
            "linear-gradient(180deg, rgba(10,18,32,0) 0%, rgba(10,18,32,0.55) 58%, rgba(10,18,32,0.9) 100%)",
        }}
      />
    </div>
  );
}