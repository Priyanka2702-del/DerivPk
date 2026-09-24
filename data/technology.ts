import type { LucideIcon } from "lucide-react";
import { CandlestickChart, Gauge, Zap, LineChart, ShieldCheck, Cpu } from "lucide-react";

export type TechFeature = {
  title: string;
  description: string;
  icon: LucideIcon;
};

export const techFeatures: TechFeature[] = [
  {
    title: "Advanced charts",
    description: "Layer indicators, drawing tools and multiple timeframes on fully customisable charts.",
    icon: CandlestickChart,
  },
  {
    title: "Market analysis",
    description: "Daily insights and technical breakdowns to help you read the market before you trade it.",
    icon: LineChart,
  },
  {
    title: "Fast execution",
    description: "Orders routed with low latency infrastructure, built to keep up with fast-moving markets.",
    icon: Zap,
  },
  {
    title: "Trading indicators",
    description: "A full library of built-in and custom indicators for every trading style.",
    icon: Gauge,
  },
  {
    title: "Risk management",
    description: "Stop-loss, take-profit and exposure controls that keep risk where you set it.",
    icon: ShieldCheck,
  },
  {
    title: "Automated strategies",
    description: "Turn your rules into always-on strategies with PK Bot's visual builder.",
    icon: Cpu,
  },
];
