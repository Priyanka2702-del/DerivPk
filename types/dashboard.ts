export type WatchlistItem = {
  symbol: string;
  price: string;
  change: string;
  up: boolean;
};

export type Position = {
  symbol: string;
  side: "Buy" | "Sell";
  size: string;
  entry: string;
  current: string;
  pnl: string;
  up: boolean;
};

export type MarketQuote = {
  symbol: string;
  label: string;
  bid: string;
  change: string;
  percentage: string;
  up: boolean;
  flat?: boolean;
  spark: number[]; // relative points for the mini sparkline, e.g. [3,5,2,6,4]
};

export type MarketCategoryKey =
  | "forex" | "crypto" | "shares" | "indices" | "metals" | "energy" | "etfs";

export type SidebarLink = {
  label: string;
  href: string;
  icon: string; // lucide icon name, mapped in Sidebar.tsx
  badge?: "NEW";
};

// ===== User trading accounts (Accounts page) =====
export type UserAccount = {
  id: string;
  platform: "MT5" | "MT4";
  type: string;
  accountNumber: string;
  currency: string;
  balance: string;
  equity: string;
  leverage: string;
  status: "Active" | "Pending" | "Disabled";
};

// ===== Funds / transactions =====
export type Transaction = {
  id: string;
  type: "Deposit" | "Withdrawal" | "Transfer";
  method: string;
  amount: string;
  status: "Completed" | "Pending" | "Failed";
  date: string;
};

// ===== Verification / KYC =====
export type VerificationStep = {
  key: "personal" | "identity" | "address";
  label: string;
  status: "approved" | "pending" | "rejected" | "not_started";
};

// ===== PK Copy (copy trading) =====
export type CopyTrader = {
  id: string;
  name: string;
  riskLevel: "Low" | "Medium" | "High";
  roi30d: string;
  followers: number;
  winRate: string;
  up: boolean;
};

// ===== Promotions =====
export type Promotion = {
  id: string;
  title: string;
  description: string;
  tag?: string;
};

// ===== Downloads =====
export type DownloadPlatform = {
  id: string;
  name: string;
  description: string;
  category: "Desktop" | "Mobile" | "Web" | "Tools";
  available: boolean;
  url?: string;
};
// ===== PAMM Invest =====
export type PammAllocation = { label: string; percent: number };

export type PammPool = {
  id: string;
  name: string;
  status: "Active" | "Paused";
  totalAUM: string;
  baseCapital: string;
  monthlyReturn: string;
  monthlyReturnUp: boolean;
  activeStrategies: number;
  riskMode: "Conservative" | "Balanced" | "Aggressive";
  profitReporting: "Daily" | "Weekly" | "Monthly";
  allocation: PammAllocation[];
};

// ===== Team (5-level referral network) =====
export type TeamMember = {
  id: string;
  name: string;
  joinedDate: string;
  status: "Active" | "Inactive";
};

export type TeamLevel = {
  level: number;
  limit: number;
  members: TeamMember[];
};