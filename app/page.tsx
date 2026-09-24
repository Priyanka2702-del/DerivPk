import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import CTASection from "@/components/CTASection";
import StatsSection from "@/components/StatsSection";
import TradeAroundClock from "@/components/TradeAroundClock";
import PlatformsSection from "@/components/PlatformsSection";
import TechnologySection from "@/components/TechnologySection";
import PaymentsSection from "@/components/PaymentsSection";
import SupportSection from "@/components/SupportSection";
import StepsSection from "@/components/StepsSection";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
                <CTASection />
        <StatsSection />
        <TradeAroundClock />
        <PlatformsSection />
        <TechnologySection />
        <PaymentsSection />
        <StepsSection />
        <SupportSection />
      </main>
      <Footer />
    </>
  );
}
