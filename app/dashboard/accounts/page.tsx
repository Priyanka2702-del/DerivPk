// // import Link from "next/link";
// // import { Plus, ArrowUpRight, ArrowDownRight, Repeat } from "lucide-react";
// // import { userAccounts } from "@/data/dashboard";

// // export default function AccountsPage() {
// //   return (
// //     <div>
// //       <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
// //         <div>
// //           <h1 className="font-display text-xl font-semibold text-text">Accounts</h1>
// //           <p className="text-sm text-text-muted">Your trading accounts and balances.</p>
// //         </div>
// //         <Link
// //           href="/open-account"
// // className="flex shrink-0 items-center justify-center gap-2 rounded-lg bg-accent-2/10 px-4 py-2.5 text-sm font-semibold text-accent-2 transition hover:bg-accent-2/20"        >
// //           <Plus size={16} /> Open New Account
// //         </Link>
// //       </div>

// //       <div className="space-y-4">
// //         {userAccounts.map((acc) => (
// //           <div key={acc.id} className="rounded-xl border border-border bg-surface p-6">
// //             <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
// //               <div>
// //                 <div className="flex items-center gap-2">
// //                   <span className="rounded bg-accent-2/10 px-2 py-0.5 text-xs font-semibold text-accent-2">
// //                     {acc.platform}
// //                   </span>
// //                   <span className="text-sm font-semibold text-text">{acc.type} Account</span>
// //                 </div>
// //                 <p className="mt-1 num text-xs text-text-muted">#{acc.accountNumber}</p>
// //               </div>
// //               <span
// //                 className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
// //                   acc.status === "Active"
// //                     ? "bg-emerald-50 text-emerald-600"
// //                     : acc.status === "Pending"
// //                       ? "bg-amber-50 text-amber-600"
// //                       : "bg-red-50 text-red-600"
// //                 }`}
// //               >
// //                 {acc.status}
// //               </span>
// //             </div>

// //             <div className="mb-5 grid grid-cols-2 gap-4 sm:grid-cols-4">
// //               {[
// //                 { label: "Balance", value: `${acc.balance} ${acc.currency}` },
// //                 { label: "Equity", value: `${acc.equity} ${acc.currency}` },
// //                 { label: "Leverage", value: acc.leverage },
// //                 { label: "Currency", value: acc.currency },
// //               ].map((f) => (
// //                 <div key={f.label}>
// //                   <p className="text-xs text-text-muted">{f.label}</p>
// //                   <p className="num mt-0.5 text-sm font-semibold text-text">{f.value}</p>
// //                 </div>
// //               ))}
// //             </div>

// //             <div className="flex flex-wrap gap-2">
// //               <Link
// //                 href="/dashboard/funds"
// //                 className="flex items-center gap-1.5 rounded-lg bg-surface-2 px-3.5 py-2 text-sm font-medium text-text hover:bg-border/60"
// //               >
// //                 <ArrowDownRight size={15} /> Deposit
// //               </Link>
// //               <Link
// //                 href="/dashboard/funds"
// //                 className="flex items-center gap-1.5 rounded-lg bg-surface-2 px-3.5 py-2 text-sm font-medium text-text hover:bg-border/60"
// //               >
// //                 <ArrowUpRight size={15} /> Withdraw
// //               </Link>
// //               <Link
// //                 href="/dashboard/funds"
// //                 className="flex items-center gap-1.5 rounded-lg bg-surface-2 px-3.5 py-2 text-sm font-medium text-text hover:bg-border/60"
// //               >
// //                 <Repeat size={15} /> Transfer
// //               </Link>
// //               <Link
// //                 href="/dashboard/trading"
// // className="flex items-center gap-1.5 rounded-lg bg-accent-2/10 px-3.5 py-2 text-sm font-medium text-accent-2 transition hover:bg-accent-2/20"              >
// //                 Trade
// //               </Link>
// //             </div>
// //           </div>
// //         ))}
// //       </div>
// //     </div>
// //   );
// // }
// :::writing{variant="document" id="58341" title="app/dashboard/accounts/page.tsx"}
// "use client";

// import Link from "next/link";
// import { Plus, ArrowUpRight } from "lucide-react";
// import { useEffect, useState } from "react";

// type TradingAccount = {
//   id: string;
//   provider: string;
//   providerAccountId: string;
//   accountType: "paper" | "live";
//   status: string;
//   accountNumber?: string;
//   currency?: string;
//   balance?: string | number;
//   equity?: string | number;
//   createdAt?: string;
// };

// export default function AccountsPage() {
//   const [accounts, setAccounts] = useState<TradingAccount[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState("");

//   useEffect(() => {
//     async function loadAccounts() {
//       try {
//         setLoading(true);
//         setError("");

//         const response = await fetch("/api/trading/accounts", {
//           method: "GET",
//           cache: "no-store",
//         });

//         const data = await response.json();

//         if (!response.ok) {
//           throw new Error(data?.error || "Failed to load trading accounts");
//         }

//         setAccounts(data.accounts || []);
//       } catch (err) {
//         console.error("Failed to load accounts:", err);
//         setError(
//           err instanceof Error
//             ? err.message
//             : "Failed to load trading accounts"
//         );
//       } finally {
//         setLoading(false);
//       }
//     }

//     loadAccounts();
//   }, []);

//   function formatMoney(value: string | number | undefined) {
//     const amount = Number(value ?? 0);

//     if (Number.isNaN(amount)) {
//       return "0.00";
//     }

//     return amount.toFixed(2);
//   }

//   function getStatusLabel(status: string) {
//     const normalized = status.toUpperCase();

//     if (
//       normalized === "ACTIVE" ||
//       normalized === "APPROVED" ||
//       normalized === "ACTIVE_TRADING"
//     ) {
//       return "Active";
//     }

//     if (
//       normalized === "SUBMITTED" ||
//       normalized === "PENDING" ||
//       normalized === "APPROVAL_PENDING"
//     ) {
//       return "Pending";
//     }

//     if (
//       normalized === "REJECTED" ||
//       normalized === "CLOSED" ||
//       normalized === "DISABLED"
//     ) {
//       return "Rejected";
//     }

//     return status;
//   }

//   function getStatusClass(status: string) {
//     const label = getStatusLabel(status);

//     if (label === "Active") {
//       return "bg-emerald-50 text-emerald-600";
//     }

//     if (label === "Pending") {
//       return "bg-amber-50 text-amber-600";
//     }

//     return "bg-red-50 text-red-600";
//   }

//   function getAccountTypeLabel(accountType: "paper" | "live") {
//     return accountType === "paper" ? "Paper" : "Live";
//   }

//   return (
//     <div>
//       <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
//         <div>
//           <h1 className="font-display text-xl font-semibold text-text">
//             Accounts
//           </h1>

//           <p className="text-sm text-text-muted">
//             Your trading accounts and balances.
//           </p>
//         </div>

//         <Link
//           href="/open-account"
//           className="flex shrink-0 items-center justify-center gap-2 rounded-lg bg-accent-2/10 px-4 py-2.5 text-sm font-semibold text-accent-2 transition hover:bg-accent-2/20"
//         >
//           <Plus size={16} />
//           Open New Account
//         </Link>
//       </div>

//       {/* Loading */}
//       {loading && (
//         <div className="rounded-xl border border-border bg-surface p-6">
//           <p className="text-sm text-text-muted">
//             Loading your trading accounts...
//           </p>
//         </div>
//       )}

//       {/* Error */}
//       {!loading && error && (
//         <div className="rounded-xl border border-red-200 bg-red-50 p-6">
//           <p className="text-sm font-medium text-red-600">
//             {error}
//           </p>
//         </div>
//       )}

//       {/* No Accounts */}
//       {!loading && !error && accounts.length === 0 && (
//         <div className="rounded-xl border border-border bg-surface p-8 text-center">
//           <h2 className="text-base font-semibold text-text">
//             No trading account found
//           </h2>

//           <p className="mt-1 text-sm text-text-muted">
//             Create your first trading account to start trading.
//           </p>

//           <Link
//             href="/open-account"
//             className="mt-5 inline-flex items-center gap-2 rounded-lg bg-accent-2 px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
//           >
//             <Plus size={16} />
//             Open New Account
//           </Link>
//         </div>
//       )}

//       {/* Real Accounts */}
//       {!loading && !error && accounts.length > 0 && (
//         <div className="space-y-4">
//           {accounts.map((acc) => {
//             const statusLabel = getStatusLabel(acc.status);
//             const currency = acc.currency || "USD";

//             return (
//               <div
//                 key={acc.id}
//                 className="rounded-xl border border-border bg-surface p-6"
//               >
//                 <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
//                   <div>
//                     <div className="flex items-center gap-2">
//                       <span className="rounded bg-accent-2/10 px-2 py-0.5 text-xs font-semibold text-accent-2">
//                         {acc.provider === "alpaca" ? "Alpaca" : acc.provider}
//                       </span>

//                       <span className="text-sm font-semibold text-text">
//                         {getAccountTypeLabel(acc.accountType)} Account
//                       </span>
//                     </div>

//                     <p className="mt-1 num text-xs text-text-muted">
//                       #
//                       {acc.accountNumber ||
//                         acc.providerAccountId ||
//                         "Account ID unavailable"}
//                     </p>
//                   </div>

//                   <span
//                     className={`rounded-full px-2.5 py-1 text-xs font-semibold ${getStatusClass(
//                       acc.status
//                     )}`}
//                   >
//                     {statusLabel}
//                   </span>
//                 </div>

//                 <div className="mb-5 grid grid-cols-2 gap-4 sm:grid-cols-4">
//                   {[
//                     {
//                       label: "Balance",
//                       value: `${formatMoney(acc.balance)} ${currency}`,
//                     },
//                     {
//                       label: "Equity",
//                       value: `${formatMoney(acc.equity)} ${currency}`,
//                     },
//                     {
//                       label: "Account Type",
//                       value: getAccountTypeLabel(acc.accountType),
//                     },
//                     {
//                       label: "Currency",
//                       value: currency,
//                     },
//                   ].map((field) => (
//                     <div key={field.label}>
//                       <p className="text-xs text-text-muted">
//                         {field.label}
//                       </p>

//                       <p className="num mt-0.5 text-sm font-semibold text-text">
//                         {field.value}
//                       </p>
//                     </div>
//                   ))}
//                 </div>

//                 <div className="flex flex-wrap gap-2">
//                   <Link
//                     href="/dashboard/live-trading"
//                     className="flex items-center gap-1.5 rounded-lg bg-accent-2/10 px-3.5 py-2 text-sm font-medium text-accent-2 transition hover:bg-accent-2/20"
//                   >
//                     Trade
//                     <ArrowUpRight size={15} />
//                   </Link>
//                 </div>
//               </div>
//             );
//           })}
//         </div>
//       )}
//     </div>
//   );
// }


"use client";

import Link from "next/link";
import { Plus, ArrowUpRight } from "lucide-react";
import { useEffect, useState } from "react";

type TradingAccount = {
id: string;
provider: string;
providerAccountId: string;
accountType: "paper" | "live";
status: string;
accountNumber?: string;
currency?: string;
balance?: string | number;
equity?: string | number;
};

export default function AccountsPage() {
const [accounts, setAccounts] = useState<TradingAccount[]>([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState("");

useEffect(() => {
async function loadAccounts() {
try {
setLoading(true);
setError("");


    const response = await fetch("/api/trading/accounts", {
      method: "GET",
      cache: "no-store",
      headers: {
        Accept: "application/json",
      },
    });

    // Read response as text first.
    // This prevents "Unexpected end of JSON input"
    // when the API returns an empty/non-JSON response.
    const rawText = await response.text();

    console.log("TRADING ACCOUNTS API:", {
      status: response.status,
      statusText: response.statusText,
      contentType: response.headers.get("content-type"),
      body: rawText,
    });

    let data: any = null;

    if (rawText.trim()) {
      try {
        data = JSON.parse(rawText);
      } catch {
        throw new Error(
          `Trading accounts API returned invalid JSON. HTTP ${response.status}. Response: ${rawText.slice(
            0,
            300
          )}`
        );
      }
    }

    if (!response.ok) {
      throw new Error(
        data?.error ||
          data?.message ||
          `Failed to load trading accounts. HTTP ${response.status}`
      );
    }

    if (!data) {
      throw new Error(
        "Trading accounts API returned an empty response."
      );
    }

    setAccounts(Array.isArray(data.accounts) ? data.accounts : []);
  } catch (err) {
    console.error("Failed to load accounts:", err);

    setError(
      err instanceof Error
        ? err.message
        : "Failed to load trading accounts"
    );
  } finally {
    setLoading(false);
  }
}

loadAccounts();


}, []);

function formatMoney(value: string | number | undefined) {
const amount = Number(value ?? 0);


if (Number.isNaN(amount)) {
  return "0.00";
}

return amount.toFixed(2);


}

function getStatusLabel(status: string) {
const normalized = status.toUpperCase();


if (
  normalized === "ACTIVE" ||
  normalized === "APPROVED" ||
  normalized === "ACTIVE_TRADING"
) {
  return "Active";
}

if (
  normalized === "SUBMITTED" ||
  normalized === "PENDING" ||
  normalized === "APPROVAL_PENDING"
) {
  return "Pending";
}

if (
  normalized === "REJECTED" ||
  normalized === "CLOSED" ||
  normalized === "DISABLED"
) {
  return "Rejected";
}

return status;


}

function getStatusClass(status: string) {
const label = getStatusLabel(status);


if (label === "Active") {
  return "bg-emerald-50 text-emerald-600";
}

if (label === "Pending") {
  return "bg-amber-50 text-amber-600";
}

return "bg-red-50 text-red-600";


}

function getAccountTypeLabel(accountType: "paper" | "live") {
return accountType === "paper" ? "Paper" : "Live";
}

return ( <div> <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-center"> <div> <h1 className="font-display text-xl font-semibold text-text">
Accounts </h1>


      <p className="text-sm text-text-muted">
        Your trading accounts and balances.
      </p>
    </div>

    <Link
      href="/open-account"
      className="flex shrink-0 items-center justify-center gap-2 rounded-lg bg-accent-2/10 px-4 py-2.5 text-sm font-semibold text-accent-2 transition hover:bg-accent-2/20"
    >
      <Plus size={16} />
      Open New Account
    </Link>
  </div>

  {loading && (
    <div className="rounded-xl border border-border bg-surface p-6">
      <p className="text-sm text-text-muted">
        Loading your trading accounts...
      </p>
    </div>
  )}

  {!loading && error && (
    <div className="rounded-xl border border-red-200 bg-red-50 p-6">
      <p className="text-sm font-semibold text-red-600">
        Failed to load trading accounts
      </p>

      <p className="mt-2 break-words text-sm text-red-500">
        {error}
      </p>
    </div>
  )}

  {!loading && !error && accounts.length === 0 && (
    <div className="rounded-xl border border-border bg-surface p-8 text-center">
      <h2 className="text-base font-semibold text-text">
        No trading account found
      </h2>

      <p className="mt-1 text-sm text-text-muted">
        Create your first trading account to start trading.
      </p>

      <Link
        href="/open-account"
        className="mt-5 inline-flex items-center gap-2 rounded-lg bg-accent-2 px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
      >
        <Plus size={16} />
        Open New Account
      </Link>
    </div>
  )}

  {!loading && !error && accounts.length > 0 && (
    <div className="space-y-4">
      {accounts.map((acc) => {
        const statusLabel = getStatusLabel(acc.status);
        const currency = acc.currency || "USD";

        return (
          <div
            key={acc.id}
            className="rounded-xl border border-border bg-surface p-6"
          >
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="rounded bg-accent-2/10 px-2 py-0.5 text-xs font-semibold text-accent-2">
                    {acc.provider === "alpaca"
                      ? "Alpaca"
                      : acc.provider}
                  </span>

                  <span className="text-sm font-semibold text-text">
                    {getAccountTypeLabel(acc.accountType)} Account
                  </span>
                </div>

                <p className="mt-1 num text-xs text-text-muted">
                  #
                  {acc.accountNumber ||
                    acc.providerAccountId ||
                    "Account ID unavailable"}
                </p>
              </div>

              <span
                className={`rounded-full px-2.5 py-1 text-xs font-semibold ${getStatusClass(
                  acc.status
                )}`}
              >
                {statusLabel}
              </span>
            </div>

            <div className="mb-5 grid grid-cols-2 gap-4 sm:grid-cols-4">
              {[
                {
                  label: "Balance",
                  value: `${formatMoney(acc.balance)} ${currency}`,
                },
                {
                  label: "Equity",
                  value: `${formatMoney(acc.equity)} ${currency}`,
                },
                {
                  label: "Account Type",
                  value: getAccountTypeLabel(acc.accountType),
                },
                {
                  label: "Currency",
                  value: currency,
                },
              ].map((field) => (
                <div key={field.label}>
                  <p className="text-xs text-text-muted">
                    {field.label}
                  </p>

                  <p className="num mt-0.5 text-sm font-semibold text-text">
                    {field.value}
                  </p>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap gap-2">
              <Link
                href="/dashboard/live-trading"
                className="flex items-center gap-1.5 rounded-lg bg-accent-2/10 px-3.5 py-2 text-sm font-medium text-accent-2 transition hover:bg-accent-2/20"
              >
                Trade
                <ArrowUpRight size={15} />
              </Link>
            </div>
          </div>
        );
      })}
    </div>
  )}
</div>


);
}
