import Link from "next/link";
import Reveal from "./Reveal";
import HeroBackdrop from "./HeroBackdrop";
import HeroVisual from "./HeroVisual";
import HeroTrustBar from "./HeroTrustBar";

export default function Hero() {
  return (
    <section className="relative isolate flex min-h-[760px] flex-col overflow-hidden bg-[#0a1220] text-white lg:h-[100svh] lg:min-h-0">
      <HeroBackdrop />

      {/* 
        pt is increased because navbar is fixed/overlay.
        This prevents navbar/logo from overlapping hero heading.
      */}
      <div className="pk-container relative z-10 flex min-h-0 flex-1 items-center pb-4 pt-32 sm:pt-36 lg:pb-4 lg:pt-40 xl:pt-44">
        <div className="grid w-full items-center gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:gap-2">
          {/* Left Content */}
          <Reveal className="relative z-20 max-w-[650px]">
            <h1 className="pk-display font-extrabold tracking-[-0.045em] text-white">
              <span className="mb-4 block text-3xl leading-none sm:text-4xl lg:text-[2.2rem] xl:text-[2.35rem]">
                Trading for
              </span>

              <span className="block text-[3.35rem] leading-[0.95] sm:text-[5.2rem] lg:text-[5rem] xl:text-[5.8rem] 2xl:text-[6.2rem]">
                Anyone
              </span>
              <span className="block text-[3.35rem] leading-[0.95] sm:text-[5.2rem] lg:text-[5rem] xl:text-[5.8rem] 2xl:text-[6.2rem]">
                Anywhere
              </span>
              <span className="block text-[3.35rem] leading-[0.95] sm:text-[5.2rem] lg:text-[5rem] xl:text-[5.8rem] 2xl:text-[6.2rem]">
                Anytime
              </span>
            </h1>

            <p className="mt-6 max-w-2xl text-base font-semibold leading-relaxed text-white/90 sm:text-lg lg:text-xl">
              Widest range of products, markets, platforms with 24/7 customer support.
            </p>

            <Link
              href="/register"
              className="mt-8 inline-flex items-center justify-center rounded-full bg-[#ff3f4e] px-8 py-4 text-lg font-bold text-white shadow-[0_18px_45px_rgba(255,63,78,0.35)] transition hover:-translate-y-0.5 hover:bg-[#ff5260]"
            >
              Trade now
            </Link>
          </Reveal>

          {/* Right Visual */}
          <Reveal delay={120} className="relative z-10 lg:-ml-16 xl:-ml-20">
            <HeroVisual />
          </Reveal>
        </div>
      </div>

      <HeroTrustBar />
    </section>
  );
}