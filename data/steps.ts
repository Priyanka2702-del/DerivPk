import type { LucideIcon } from "lucide-react";
import { UserPlus, Wallet, TrendingUp } from "lucide-react";

export type Step = {
  number: string;
  title: string;
  description: string;
  icon: LucideIcon;
};

export const steps: Step[] = [
  {
    number: "01",
    title: "Sign up",
    description: "Create your PK account in minutes with just an email and a few details.",
    icon: UserPlus,
  },
  {
    number: "02",
    title: "Deposit",
    description: "Fund your account using a payment method available in your region.",
    icon: Wallet,
  },
  {
    number: "03",
    title: "Trade",
    description: "Choose your market, set your risk, and place your first trade.",
    icon: TrendingUp,
  },
];
