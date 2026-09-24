import type { LucideIcon } from "lucide-react";
import {
  LineChart,
  Layers,
  Globe2,
  Coins,
  Bitcoin,
  BarChart3,
  Monitor,
  Smartphone,
  Copy,
  Bot,
  SlidersHorizontal,
  Calculator,
  CalendarClock,
  Radio,
  Users,
  Shield,
  Newspaper,
  Briefcase,
  LifeBuoy,
  MessageCircle,
  HelpCircle,
} from "lucide-react";

export type MenuLink = {
  label: string;
  description: string;
  href: string;
  icon: LucideIcon;
};

export type MegaMenuData = {
  key: string;
  label: string;
  columns: {
    heading: string;
    links: MenuLink[];
  }[];
  featured?: {
    eyebrow: string;
    title: string;
    description: string;
    cta: string;
    href: string;
  };
};

export const megaMenus: MegaMenuData[] = [
  {
    key: "trade",
    label: "Trade",
    columns: [
      {
        heading: "Instruments",
        links: [
          {
            label: "CFDs",
            description: "Trade with leverage across major asset classes",
            href: "/trade/cfds",
            icon: LineChart,
          },
          {
            label: "Multipliers",
            description: "Amplify exposure while capping your risk",
            href: "/trade/multipliers",
            icon: Layers,
          },
          {
            label: "Trading Specifications",
            description: "Spreads, swaps and contract details",
            href: "/trade/specifications",
            icon: SlidersHorizontal,
          },
        ],
      },
    ],
    featured: {
      eyebrow: "New on PK",
      title: "Derived indices, live 24/7",
      description: "Synthetic markets that move around the clock, unaffected by financial-market hours.",
      cta: "Explore derived indices",
      href: "/markets/derived-indices",
    },
  },
  {
    key: "markets",
    label: "Markets",
    columns: [
      {
        heading: "Markets",
        links: [
          { label: "Forex", description: "60+ currency pairs, majors to exotics", href: "/markets/forex", icon: Globe2 },
          { label: "Derived Indices", description: "Synthetic markets available around the clock", href: "/markets/derived-indices", icon: Radio },
          { label: "Stocks", description: "Fractional exposure to global companies", href: "/markets/stocks", icon: BarChart3 },
          { label: "Stock Indices", description: "Track entire exchanges in a single trade", href: "/markets/stock-indices", icon: Layers },
          { label: "Commodities", description: "Gold, oil, and other core commodities", href: "/markets/commodities", icon: Coins },
          { label: "Cryptocurrencies", description: "Spot price action on major digital assets", href: "/markets/crypto", icon: Bitcoin },
        ],
      },
    ],
  },
  {
    key: "platforms",
    label: "Platforms",
    columns: [
      {
        heading: "Platforms",
        links: [
          { label: "Deriv PK MT5", description: "Professional multi-asset trading", href: "/platforms/mt5", icon: Monitor },
          { label: "Deriv PK Trader", description: "Simple, intuitive trading experience", href: "/platforms/trader", icon: Smartphone },
          { label: "Deriv PK Copy", description: "Follow strategies and mirror trades", href: "/platforms/copy", icon: Copy },
          { label: "Deriv PK Bot", description: "Automated trading strategies", href: "/platforms/bot", icon: Bot },
        ],
      },
    ],
  },
  {
    key: "tools",
    label: "Tools",
    columns: [
      {
        heading: "Tools",
        links: [
          { label: "Trading Signals", description: "Curated market opportunities, updated daily", href: "/tools/signals", icon: Radio },
          { label: "Trading Calculator", description: "Margin, pip value and swap calculations", href: "/tools/calculator", icon: Calculator },
          { label: "Economic Calendar", description: "Track events that move the markets", href: "/tools/calendar", icon: CalendarClock },
        ],
      },
    ],
  },
  {
    key: "about",
    label: "About",
    columns: [
      {
        heading: "About PK",
        links: [
          { label: "Who We Are", description: "Our story and how we got here", href: "/about/who-we-are", icon: Users },
          { label: "Why PK", description: "What sets our platform apart", href: "/about/why-pk", icon: Shield },
          { label: "Our Principles", description: "How we approach trading and risk", href: "/about/principles", icon: Briefcase },
          { label: "Careers", description: "Build the future of trading with us", href: "/about/careers", icon: Briefcase },
          { label: "Newsroom", description: "Announcements and press coverage", href: "/about/newsroom", icon: Newspaper },
        ],
      },
    ],
  },
  {
    key: "support",
    label: "Support",
    columns: [
      {
        heading: "Support",
        links: [
          { label: "Help Centre", description: "Guides and answers to common questions", href: "/support/help-centre", icon: LifeBuoy },
          { label: "FAQs", description: "Quick answers on accounts and trading", href: "/support/faqs", icon: HelpCircle },
          { label: "Contact Support", description: "Reach our team, 24/7", href: "/support/contact", icon: MessageCircle },
          { label: "Community", description: "Connect with other PK traders", href: "/support/community", icon: Users },
        ],
      },
    ],
  },
];

export const simpleNavItems = [{ label: "Payments", href: "/payments" }];

export const languages = ["EN", "ES", "FR", "DE", "PT", "AR"];
