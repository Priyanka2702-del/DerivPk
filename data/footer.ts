export type FooterColumn = {
  heading: string;
  links: { label: string; href: string }[];
};

export const footerColumns: FooterColumn[] = [
  {
    heading: "Trade",
    links: [
      { label: "CFDs", href: "/trade/cfds" },
      { label: "Multipliers", href: "/trade/multipliers" },
      { label: "Trading Specifications", href: "/trade/specifications" },
    ],
  },
  {
    heading: "Markets",
    links: [
      { label: "Forex", href: "/markets/forex" },
      { label: "Derived Indices", href: "/markets/derived-indices" },
      { label: "Stocks", href: "/markets/stocks" },
      { label: "Stock Indices", href: "/markets/stock-indices" },
      { label: "Commodities", href: "/markets/commodities" },
      { label: "Cryptocurrencies", href: "/markets/crypto" },
    ],
  },
  {
    heading: "Platforms",
    links: [
      { label: "Deriv PK MT5", href: "/platforms/mt5" },
      { label: "Deriv PK Trader", href: "/platforms/trader" },
      { label: "Deriv PK Copy", href: "/platforms/copy" },
      { label: "Deriv PK Bot", href: "/platforms/bot" },
    ],
  },
  {
    heading: "Tools",
    links: [
      { label: "Trading Signals", href: "/tools/signals" },
      { label: "Trading Calculator", href: "/tools/calculator" },
      { label: "Economic Calendar", href: "/tools/calendar" },
    ],
  },
  {
    heading: "Payments",
    links: [{ label: "Payment Methods", href: "/payments" }],
  },
  {
    heading: "About",
    links: [
      { label: "Who We Are", href: "/about/who-we-are" },
      { label: "Why PK", href: "/about/why-pk" },
      { label: "Our Principles", href: "/about/principles" },
      { label: "Careers", href: "/about/careers" },
      { label: "Newsroom", href: "/about/newsroom" },
    ],
  },
  {
    heading: "Support",
    links: [
      { label: "Help Centre", href: "/support/help-centre" },
      { label: "Community", href: "/support/community" },
      { label: "Contact Us", href: "/support/contact" },
    ],
  },
  {
    heading: "Legal",
    links: [
      { label: "Regulatory Information", href: "/legal/regulatory-information" },
      { label: "Terms & Conditions", href: "/legal/terms" },
      { label: "Privacy Policy", href: "/legal/privacy" },
      { label: "Risk Disclosure", href: "/legal/risk-disclosure" },
      { label: "Responsible Trading", href: "/legal/responsible-trading" },
    ],
  },
];
