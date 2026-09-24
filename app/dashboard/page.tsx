import AssetsCard from "@/components/dashboard/AssetsCard";
import TradingAccountCard from "@/components/dashboard/TradingAccountCard";
import VerificationBanner from "@/components/dashboard/VerificationBanner";
import DashboardMarketChart from "@/components/dashboard/DashboardMarketChart";
import RiskStatement from "@/components/dashboard/RiskStatement";

export const metadata = {
  title: "Dashboard — PK",
};

export default function DashboardPage() {
  return (
    <>
      <VerificationBanner />

      <div className="mb-6 grid gap-6 lg:grid-cols-2">
        <AssetsCard />
        <TradingAccountCard />
      </div>

      <DashboardMarketChart />

      <RiskStatement />
    </>
  );
}
