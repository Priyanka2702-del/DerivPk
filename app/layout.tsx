import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "PK — Trade Anytime, Anywhere",
    template: "%s | PK",
  },
  description:
    "PK provides modern trading solutions across global markets with powerful platforms, advanced tools and flexible access.",
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