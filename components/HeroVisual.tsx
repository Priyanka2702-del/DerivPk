import Image from "next/image";

export default function HeroVisual() {
  return (
    <div className="relative mx-auto h-[340px] w-full max-w-[390px] sm:h-[520px] sm:max-w-[560px] lg:h-[clamp(500px,calc(100svh-330px),620px)] lg:w-[700px] lg:max-w-none xl:h-[clamp(540px,calc(100svh-330px),660px)] xl:w-[780px]">
      {/* Phone behind person */}
      <div className="absolute bottom-[6%] left-[3%] z-0 h-[88%] w-[47%] sm:left-[9%] sm:w-[44%] lg:left-[8%] lg:h-[88%] lg:w-[43%]">
        <Image
          src="/images/phone-mockup.webp"
          alt="PK app showing trading dashboard"
          fill
          sizes="(min-width: 1280px) 330px, (min-width: 1024px) 290px, (min-width: 640px) 240px, 180px"
          className="object-contain object-bottom drop-shadow-[0_35px_70px_rgba(0,0,0,0.45)]"
          priority
        />
      </div>

      {/* Person */}
      <div className="absolute bottom-0 right-[-8%] z-10 h-full w-[82%] sm:right-[-6%] sm:w-[78%] lg:right-[-5%] lg:w-[80%] xl:right-[-7%]">
        <Image
          src="/images/person.webp"
          alt="Trader checking the PK app on their phone"
          fill
          sizes="(min-width: 1280px) 640px, (min-width: 1024px) 560px, (min-width: 640px) 430px, 320px"
          className="object-contain object-bottom drop-shadow-[0_40px_80px_rgba(0,0,0,0.45)]"
          priority
        />
      </div>
    </div>
  );
}