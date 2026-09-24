import type { Metadata } from "next";
import "./globals.css";

const siteUrl = "https://pk-trading.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "PK — Trade Anytime, Anywhere",
    template: "%s | PK",
  },
  description:
    "PK provides modern trading solutions across global markets with powerful platforms, advanced tools and flexible access.",
  keywords: [
    "PK",
    "online trading",
    "forex trading",
    "CFD trading",
    "trading platform",
    "derived indices",
  ],
  openGraph: {
    title: "PK — Trade Anytime, Anywhere",
    description:
      "PK provides modern trading solutions across global markets with powerful platforms, advanced tools and flexible access.",
    url: siteUrl,
    siteName: "PK",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "PK — Trade Anytime, Anywhere",
    description:
      "PK provides modern trading solutions across global markets with powerful platforms, advanced tools and flexible access.",
  },
  icons: {
    icon: "/favicon.svg",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
