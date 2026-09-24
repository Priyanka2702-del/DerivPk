import {
  WatchlistItem, Position, MarketQuote, MarketCategoryKey,
  UserAccount, Transaction, VerificationStep, CopyTrader, Promotion, DownloadPlatform, PammPool,
  TeamLevel,
} from "@/types/dashboard";

export const watchlist: WatchlistItem[] = [
  { symbol: "EUR/USD", price: "1.0842", change: "+0.12%", up: true },
  { symbol: "GBP/USD", price: "1.2716", change: "-0.08%", up: false },
  { symbol: "XAU/USD", price: "2,384.20", change: "+0.44%", up: true },
  { symbol: "BTC/USD", price: "67,210", change: "+1.85%", up: true },
  { symbol: "US500", price: "5,342.1", change: "-0.21%", up: false },
  { symbol: "WTI Oil", price: "78.34", change: "+0.63%", up: true },
];

export const positions: Position[] = [
  { symbol: "EUR/USD", side: "Buy", size: "1.00", entry: "1.0812", current: "1.0842", pnl: "+$300.00", up: true },
  { symbol: "XAU/USD", side: "Sell", size: "0.50", entry: "2,392.10", current: "2,384.20", pnl: "+$395.00", up: true },
  { symbol: "GBP/USD", side: "Buy", size: "0.75", entry: "1.2745", current: "1.2716", pnl: "-$217.50", up: false },
];

// ===== Account summary =====
export const accountSummary = {
  totalAssets: "2,485.60",
  available: "1,985.60",
  inPositions: "500.00",
  currency: "USD",
  mt5Created: true,
  instrumentCount: "1,000+",
};

// ===== Markets panel (tabbed) =====
export const marketTabs: { key: MarketCategoryKey; label: string }[] = [
  { key: "forex", label: "Forex" },
  { key: "crypto", label: "Crypto" },
  { key: "shares", label: "Shares" },
  { key: "indices", label: "Indices" },
  { key: "metals", label: "Metals" },
  { key: "energy", label: "Energy" },
  { key: "etfs", label: "Etfs" },
];

export const marketQuotes: Record<MarketCategoryKey, MarketQuote[]> = {
  forex: [
    { symbol: "EURUSD", label: "Euro / US Dollar", bid: "1.163", change: "-0.000", percentage: "0.000%", up: false, flat: true, spark: [4, 4, 4, 4, 4] },
    { symbol: "EURAUD", label: "Euro / Australian Dollar", bid: "1.615", change: "+0.004", percentage: "+0.240%", up: true, spark: [3, 4, 3, 5, 6] },
    { symbol: "EURJPY", label: "Euro / Japanese Yen", bid: "179.197", change: "+0.623", percentage: "+0.340%", up: true, spark: [2, 3, 4, 4, 6] },
    { symbol: "AUDNZD", label: "Australian Dollar / NZ Dollar", bid: "1.234", change: "-0.001", percentage: "-0.080%", up: false, spark: [5, 4, 5, 3, 4] },
    { symbol: "AUDUSD", label: "Australian Dollar / US Dollar", bid: "0.720", change: "-0.002", percentage: "-0.270%", up: false, spark: [4, 5, 3, 4, 3] },
  ],
  crypto: [
    { symbol: "BTCUSD", label: "Bitcoin / US Dollar", bid: "77871.170", change: "-424.610", percentage: "-0.540%", up: false, spark: [6, 5, 4, 3, 2] },
    { symbol: "BTCEUR", label: "Bitcoin / Euro", bid: "66941.050", change: "-275.220", percentage: "-0.400%", up: false, spark: [5, 4, 4, 3, 2] },
    { symbol: "BTCETH", label: "Bitcoin / Ethereum", bid: "31.593", change: "-0.082", percentage: "-0.250%", up: false, spark: [5, 5, 4, 3, 3] },
    { symbol: "BTCBCH", label: "Bitcoin / Bitcoin Cash", bid: "317.023", change: "+10.850", percentage: "+3.540%", up: true, spark: [2, 3, 3, 5, 6] },
    { symbol: "ETHUSD", label: "Ethereum / US Dollar", bid: "2463.570", change: "-4.610", percentage: "-0.180%", up: false, spark: [4, 5, 4, 3, 3] },
  ],
  shares: [
    { symbol: "AAPL", label: "Apple Inc.", bid: "228.40", change: "+1.12", percentage: "+0.490%", up: true, spark: [3, 4, 3, 5, 6] },
    { symbol: "MSFT", label: "Microsoft Corp.", bid: "417.60", change: "-2.30", percentage: "-0.550%", up: false, spark: [5, 5, 4, 3, 3] },
    { symbol: "TSLA", label: "Tesla Inc.", bid: "252.10", change: "+4.80", percentage: "+1.940%", up: true, spark: [2, 3, 4, 5, 6] },
    { symbol: "NVDA", label: "NVIDIA Corp.", bid: "121.30", change: "-0.65", percentage: "-0.530%", up: false, spark: [4, 4, 5, 3, 3] },
    { symbol: "AMZN", label: "Amazon.com Inc.", bid: "186.90", change: "+0.90", percentage: "+0.480%", up: true, spark: [3, 3, 4, 5, 5] },
  ],
  indices: [
    { symbol: "US500", label: "S&P 500", bid: "5342.1", change: "-11.20", percentage: "-0.210%", up: false, spark: [5, 4, 4, 3, 3] },
    { symbol: "US30", label: "Dow Jones 30", bid: "40120.5", change: "+58.30", percentage: "+0.150%", up: true, spark: [3, 4, 3, 5, 5] },
    { symbol: "NAS100", label: "Nasdaq 100", bid: "18720.4", change: "+94.10", percentage: "+0.500%", up: true, spark: [2, 3, 4, 5, 6] },
    { symbol: "UK100", label: "FTSE 100", bid: "8210.9", change: "-6.40", percentage: "-0.080%", up: false, spark: [4, 4, 5, 4, 3] },
    { symbol: "GER40", label: "DAX 40", bid: "18490.2", change: "+22.60", percentage: "+0.120%", up: true, spark: [3, 3, 4, 4, 5] },
  ],
  metals: [
    { symbol: "XAUUSD", label: "Gold / US Dollar", bid: "2384.20", change: "+10.40", percentage: "+0.440%", up: true, spark: [3, 4, 4, 5, 6] },
    { symbol: "XAGUSD", label: "Silver / US Dollar", bid: "28.41", change: "-0.12", percentage: "-0.420%", up: false, spark: [5, 4, 4, 3, 3] },
    { symbol: "XPTUSD", label: "Platinum / US Dollar", bid: "980.30", change: "+3.10", percentage: "+0.320%", up: true, spark: [2, 3, 4, 4, 5] },
    { symbol: "XPDUSD", label: "Palladium / US Dollar", bid: "1015.70", change: "-4.60", percentage: "-0.450%", up: false, spark: [5, 5, 4, 4, 3] },
    { symbol: "XAUEUR", label: "Gold / Euro", bid: "2196.80", change: "+8.90", percentage: "+0.410%", up: true, spark: [3, 3, 4, 5, 5] },
  ],
  energy: [
    { symbol: "WTIUSD", label: "WTI Crude Oil", bid: "78.34", change: "+0.49", percentage: "+0.630%", up: true, spark: [3, 4, 3, 5, 6] },
    { symbol: "BRENT", label: "Brent Crude Oil", bid: "82.11", change: "+0.38", percentage: "+0.460%", up: true, spark: [2, 3, 4, 4, 5] },
    { symbol: "NATGAS", label: "Natural Gas", bid: "2.31", change: "-0.04", percentage: "-1.700%", up: false, spark: [5, 5, 4, 3, 2] },
    { symbol: "HEATOIL", label: "Heating Oil", bid: "2.54", change: "+0.02", percentage: "+0.790%", up: true, spark: [3, 3, 4, 4, 5] },
    { symbol: "GASOLINE", label: "RBOB Gasoline", bid: "2.28", change: "-0.01", percentage: "-0.440%", up: false, spark: [4, 4, 5, 4, 3] },
  ],
  etfs: [
    { symbol: "SPY", label: "SPDR S&P 500 ETF", bid: "534.20", change: "-1.10", percentage: "-0.210%", up: false, spark: [5, 4, 4, 3, 3] },
    { symbol: "QQQ", label: "Invesco QQQ Trust", bid: "472.80", change: "+2.40", percentage: "+0.510%", up: true, spark: [2, 3, 4, 5, 6] },
    { symbol: "DIA", label: "SPDR Dow Jones ETF", bid: "401.20", change: "+0.60", percentage: "+0.150%", up: true, spark: [3, 3, 4, 4, 5] },
    { symbol: "IWM", label: "iShares Russell 2000 ETF", bid: "204.90", change: "-0.80", percentage: "-0.390%", up: false, spark: [4, 4, 5, 4, 3] },
    { symbol: "EEM", label: "iShares MSCI Emerging Mkts ETF", bid: "42.30", change: "+0.15", percentage: "+0.360%", up: true, spark: [3, 4, 3, 5, 5] },
  ],
};
// ===== Accounts page — development/mock data. Replace with real MT5/MT4
// account data once the trading-platform backend is connected. =====
export const userAccounts: UserAccount[] = [
  {
    id: "acc-1",
    platform: "MT5",
    type: "Standard",
    accountNumber: "3769969",
    currency: "USD",
    balance: "0.00",
    equity: "0.00",
    leverage: "1:500",
    status: "Active",
  },
];

// ===== Funds page — development/mock transaction history. No real
// money movement happens on the frontend; wire this up to the payments
// backend when available. =====
export const transactions: Transaction[] = [
  { id: "tx-1", type: "Deposit", method: "Bank Card", amount: "$500.00", status: "Completed", date: "2026-08-14" },
  { id: "tx-2", type: "Withdrawal", method: "Bank Transfer", amount: "$120.00", status: "Pending", date: "2026-08-22" },
  { id: "tx-3", type: "Transfer", method: "Internal", amount: "$50.00", status: "Completed", date: "2026-09-01" },
];

export const fundingMethods = ["Bank Card", "Bank Transfer", "Crypto (USDT)", "Skrill", "Neteller"];

// ===== Verification / KYC — development-only state, no documents are
// actually uploaded/stored without a real backend in place. =====
export const verificationSteps: VerificationStep[] = [
  { key: "personal", label: "Personal Information", status: "approved" },
  { key: "identity", label: "Identity Verification", status: "pending" },
  { key: "address", label: "Address Verification", status: "not_started" },
];

// ===== PK Copy — development/mock trader data. No real copy-trading
// backend is connected; nobody is actually being copied yet. =====
export const copyTraders: CopyTrader[] = [
  { id: "ct-1", name: "Trader Alpha", riskLevel: "Low", roi30d: "+6.2%", followers: 842, winRate: "68%", up: true },
  { id: "ct-2", name: "Trader Meridian", riskLevel: "Medium", roi30d: "+11.8%", followers: 1290, winRate: "61%", up: true },
  { id: "ct-3", name: "Trader Vantage", riskLevel: "High", roi30d: "-3.4%", followers: 356, winRate: "52%", up: false },
  { id: "ct-4", name: "Trader Horizon", riskLevel: "Medium", roi30d: "+4.9%", followers: 701, winRate: "59%", up: true },
];

// ===== Promotions =====
export const promotions: Promotion[] = [
  {
    id: "promo-1",
    title: "Up to 50% Rewards for New Users",
    description: "Open your first live account and unlock bonus trading credit on your initial deposit.",
    tag: "New Users",
  },
  {
    id: "promo-2",
    title: "Refer a Friend",
    description: "Invite a friend to PK and earn rewards once their account is verified and funded.",
    tag: "Referral",
  },
  {
    id: "promo-3",
    title: "Trading Points",
    description: "Earn points on every lot you trade and redeem them for rewards in the Points Mall.",
    tag: "Ongoing",
  },
];

// ===== Downloads =====
export const downloadPlatforms: DownloadPlatform[] = [
  {
    id: "mt5-desktop",
    name: "MT5 for Windows",
    description: "The full MetaTrader 5 desktop terminal.",
    category: "Desktop",
    available: true,
    url: "https://download.mql5.com/cdn/web/metaquotes.software.corp/mt5/mt5setup.exe",
  },
  {
    id: "mt5-mac",
    name: "MT5 for macOS",
    description: "MetaTrader 5 terminal for Mac.",
    category: "Desktop",
    available: true,
    url: "https://download.mql5.com/cdn/web/metaquotes.software.corp/mt5/MetaTrader5.dmg",
  },
  {
    id: "mt5-ios",
    name: "MT5 for iOS",
    description: "Trade on the go from your iPhone or iPad.",
    category: "Mobile",
    available: true,
    url: "https://download.mql5.com/cdn/mobile/mt5/ios",
  },
  {
    id: "mt5-android",
    name: "MT5 for Android",
    description: "Trade on the go from your Android device.",
    category: "Mobile",
    available: true,
    url: "https://download.mql5.com/cdn/mobile/mt5/android",
  },
  {
    id: "mt5-web",
    name: "MT5 WebTrader",
    description: "Trade directly from your browser, no install required.",
    category: "Web",
    available: true,
    url: "https://web.metatrader.app/terminal?mode=demo&lang=en",
  },
];

// ===== Tools =====
export const dashboardTools = [
  { key: "pip", label: "Pip Calculator", description: "Work out the value of a single pip for your position size." },
  { key: "margin", label: "Margin Calculator", description: "Estimate the margin required to open a position." },
  { key: "pnl", label: "Profit / Loss Calculator", description: "Estimate potential profit or loss before you trade." },
  { key: "position", label: "Position Size Calculator", description: "Size your position based on account risk %." },
] as const;

// ===== PAMM Invest — development/mock data. No real pooled-fund backend
// is connected yet; wallet balance and positions shown here are placeholder
// until the PAMM engine is wired up. =====
export const pammSummary = {
  walletBalance: "$0.00",
  yourInvestment: "$0.00",
  totalProfitReceived: "$0.00",
};

// ===== Copy trading (Smart Follow) investment — development/mock data =====
export const copySummary = {
  invested: "0.00",
};

export const pammPools: PammPool[] = [
  {
    id: "pk-momentum",
    name: "PK Momentum",
    status: "Active",
    totalAUM: "$1,400,000.00",
    baseCapital: "$5,000.00",
    monthlyReturn: "+7.20%",
    monthlyReturnUp: true,
    activeStrategies: 4,
    riskMode: "Balanced",
    profitReporting: "Daily",
    allocation: [
      { label: "Metals", percent: 66 },
      { label: "Indices", percent: 18 },
      { label: "Crypto", percent: 16 },
    ],
  },
  {
    id: "pk-algo-fx",
    name: "PK Algo FX",
    status: "Active",
    totalAUM: "$2,500,000.00",
    baseCapital: "$100,000.00",
    monthlyReturn: "+4.70%",
    monthlyReturnUp: true,
    activeStrategies: 4,
    riskMode: "Balanced",
    profitReporting: "Daily",
    allocation: [
      { label: "FX Basket", percent: 42 },
      { label: "Metals", percent: 24 },
      { label: "Indices", percent: 18 },
      { label: "Crypto", percent: 16 },
    ],
  },
  {
    id: "pk-diversified",
    name: "PK Diversified",
    status: "Active",
    totalAUM: "$2,500,000.00",
    baseCapital: "$100,000.00",
    monthlyReturn: "+6.80%",
    monthlyReturnUp: true,
    activeStrategies: 4,
    riskMode: "Balanced",
    profitReporting: "Daily",
    allocation: [
      { label: "FX Basket", percent: 42 },
      { label: "Metals", percent: 24 },
      { label: "Indices", percent: 18 },
      { label: "Crypto", percent: 16 },
    ],
  },
  {
    id: "pk-growth",
    name: "PK Growth Pool",
    status: "Active",
    totalAUM: "$250,500.00",
    baseCapital: "$1,000,000.00",
    monthlyReturn: "+12.30%",
    monthlyReturnUp: true,
    activeStrategies: 3,
    riskMode: "Aggressive",
    profitReporting: "Daily",
    allocation: [
      { label: "FX Basket", percent: 42 },
      { label: "Metals", percent: 24 },
      { label: "Indices", percent: 18 },
      { label: "Crypto", percent: 16 },
    ],
  },
  {
    id: "pk-steady-yield",
    name: "PK Steady Yield",
    status: "Active",
    totalAUM: "$1,239.98",
    baseCapital: "$2,300,000.00",
    monthlyReturn: "+16.30%",
    monthlyReturnUp: true,
    activeStrategies: 10,
    riskMode: "Conservative",
    profitReporting: "Daily",
    allocation: [
      { label: "FX Basket", percent: 42 },
      { label: "Metals", percent: 24 },
      { label: "Indices", percent: 18 },
      { label: "Crypto", percent: 16 },
    ],
  },
];

// ===== Affiliate Program — development/mock data. No real referral/
// commission backend is connected yet. =====
export const affiliateSummary = {
  totalCommission: "0.75",
  totalCommissionChangePct: "+12.5%",
  availableBalance: "0.00",
  registrationLink: "https://pktrading.com/register/EUDHs0R1",
  referralId: "EUDHs0R1",
  totalReferrals: 128,
  totalReferralsChangePct: "+18%",
  activeReferrals: 5,
  activeReferralsChangePct: "+2",
};

export const affiliatePerformance = [
  { label: "01 Sep", value: 0.15 },
  { label: "03 Sep", value: 0.22 },
  { label: "05 Sep", value: 0.28 },
  { label: "07 Sep", value: 0.24 },
  { label: "09 Sep", value: 0.35 },
  { label: "11 Sep", value: 0.55 },
  { label: "13 Sep", value: 0.48 },
  { label: "15 Sep", value: 0.6 },
  { label: "17 Sep", value: 0.55 },
  { label: "19 Sep", value: 0.75 },
];

// ===== Team — development/mock data for the 5-level referral network.
// Each level holds up to 10 members. No real referral backend is
// connected yet. =====
export const teamLevels: TeamLevel[] = [
  {
    level: 1,
    limit: 10,
    members: [
      { id: "t1-1", name: "Rahul Mehta", joinedDate: "2026-07-02", status: "Active" },
      { id: "t1-2", name: "Sana Iqbal", joinedDate: "2026-07-10", status: "Active" },
      { id: "t1-3", name: "Arjun Verma", joinedDate: "2026-07-18", status: "Active" },
      { id: "t1-4", name: "Neha Kapoor", joinedDate: "2026-08-01", status: "Inactive" },
      { id: "t1-5", name: "Vikram Rao", joinedDate: "2026-08-14", status: "Active" },
      { id: "t1-6", name: "Ayesha Khan", joinedDate: "2026-08-29", status: "Active" },
    ],
  },
  {
    level: 2,
    limit: 10,
    members: [
      { id: "t2-1", name: "Karan Malhotra", joinedDate: "2026-08-05", status: "Active" },
      { id: "t2-2", name: "Priya Nair", joinedDate: "2026-08-20", status: "Active" },
      { id: "t2-3", name: "Rohit Sharma", joinedDate: "2026-09-02", status: "Inactive" },
    ],
  },
  {
    level: 3,
    limit: 10,
    members: [
      { id: "t3-1", name: "Divya Menon", joinedDate: "2026-09-10", status: "Active" },
    ],
  },
  { level: 4, limit: 10, members: [] },
  { level: 5, limit: 10, members: [] },
];