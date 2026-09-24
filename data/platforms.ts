import type { LucideIcon } from "lucide-react";
import { Monitor, Smartphone, Copy, Bot } from "lucide-react";

export type Platform = {
  slug: string;
  name: string;
  tagline: string;
  description: string;
  icon: LucideIcon;
  href: string;
};

export const platforms: Platform[] = [
  {
    slug: "mt5",
    name: "PK MT5",
    tagline: "Professional multi-asset trading",
    description:
      "Full-depth charting, algorithmic trading support and access to every asset class from one professional-grade terminal.",
    icon: Monitor,
    href: "/platforms/mt5",
  },
  {
    slug: "trader",
    name: "PK Trader",
    tagline: "Simple and intuitive trading experience",
    description:
      "A streamlined web and mobile app built for fast decisions — clean charts, one-tap orders, no clutter.",
    icon: Smartphone,
    href: "/platforms/trader",
  },
  {
    slug: "copy",
    name: "Deriv PK Copy",
    tagline: "Follow strategies and mirror trades",
    description:
      "Browse verified strategy providers and automatically mirror their positions in your own account.",
    icon: Copy,
    href: "/platforms/copy",
  },
  {
    slug: "bot",
    name: "PK Bot",
    tagline: "Automated trading strategies",
    description:
      "Build or import rules-based strategies and let them run — no coding experience required.",
    icon: Bot,
    href: "/platforms/bot",
  },
];
