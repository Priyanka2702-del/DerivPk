import type { LucideIcon } from "lucide-react";
import { Globe2, Radio, BarChart3, Layers, Coins, Bitcoin } from "lucide-react";

export type Market = {
  slug: string;
  title: string;
  description: string;
  icon: LucideIcon;
  accent: string;
};

export const markets: Market[] = [
  {
    slug: "forex",
    title: "Forex",
    description: "Trade 60+ currency pairs with tight spreads, from majors to emerging-market exotics.",
    icon: Globe2,
    accent: "#6f83ff",
  },
  {
    slug: "derived-indices",
    title: "Derived Indices",
    description: "Synthetic markets generated around the clock, independent of traditional trading hours.",
    icon: Radio,
    accent: "#c8ff4d",
  },
  {
    slug: "stocks",
    title: "Stocks",
    description: "Get exposure to shares of leading global companies without owning the underlying asset.",
    icon: BarChart3,
    accent: "#34d399",
  },
  {
    slug: "commodities",
    title: "Commodities",
    description: "Trade gold, silver, oil and other core commodities that anchor the global economy.",
    icon: Coins,
    accent: "#f4b942",
  },
  {
    slug: "cryptocurrencies",
    title: "Cryptocurrencies",
    description: "Speculate on price movements of major digital assets, long or short, 24/7.",
    icon: Bitcoin,
    accent: "#f87171",
  },
  {
    slug: "stock-indices",
    title: "Stock Indices",
    description: "Track the performance of entire exchanges and sectors in a single position.",
    icon: Layers,
    accent: "#6f83ff",
  },
];
