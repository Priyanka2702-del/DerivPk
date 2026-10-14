
import { NextRequest, NextResponse } from "next/server";

import { requireAuth } from "@/lib/session";
import { connectDB } from "@/lib/db";
import { alpacaRequest } from "@/lib/alpaca/broker";

import User from "@/models/User";
import TradingProfile from "@/models/TradingProfile";
import TradingAccount from "@/models/TradingAccount";

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

type AccountType = "paper" | "live";

type AlpacaAccountResponse = {
  id: string;
  account_number?: string;
  status?: string;
  currency?: string;
  buying_power?: string;
  cash?: string;
  portfolio_value?: string;
  equity?: string;
  long_market_value?: string;
  short_market_value?: string;
  initial_margin?: string;
  maintenance_margin?: string;
  daytrade_count?: number;
  pattern_day_trader?: boolean;
  trading_blocked?: boolean;
  transfers_blocked?: boolean;
  account_blocked?: boolean;
  created_at?: string;
  updated_at?: string;
};

type CreateAccountResponse = AlpacaAccountResponse;

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

/**
 * Get the client's IP address.
 *
 * Used for Alpaca agreement signatures.
 */
function getRequestIp(request: NextRequest): string {
  const forwardedFor = request.headers.get("x-forwarded-for");

  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim();
  }

  const realIp = request.headers.get("x-real-ip");

  if (realIp) {
    return realIp.trim();
  }

  return "127.0.0.1";
}

/**
 * Convert a MongoDB Date/string into Alpaca's required:
 *
 * YYYY-MM-DD
 *
 * We intentionally use UTC getters so that timezone conversion does not
 * unexpectedly change the user's calendar date.
 */
function formatDateOfBirth(value: Date | string | unknown): string {
  if (!value) {
    throw new Error("Date of birth is required");
  }

  const date = value instanceof Date ? value : new Date(String(value));

  if (Number.isNaN(date.getTime())) {
    throw new Error("Invalid date of birth");
  }

  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");

  const formatted = `${year}-${month}-${day}`;

  // Final strict YYYY-MM-DD validation.
  if (!/^\d{4}-\d{2}-\d{2}$/.test(formatted)) {
    throw new Error("Invalid date of birth format");
  }

  return formatted;
}

/**
 * Basic ISO alpha-3 country validation.
 *
 * We keep this list aligned with the countries currently offered
 * by the Open Account frontend.
 */
const SUPPORTED_COUNTRIES = new Set([
  "IND",
  "USA",
  "CAN",
  "GBR",
  "AUS",
  "DEU",
  "FRA",
  "SGP",
  "ARE",
]);

/**
 * Validate a required string.
 */
function requiredString(
  value: unknown,
  fieldName: string
): string {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`${fieldName} is required`);
  }

  return value.trim();
}

/**
 * Convert unknown error to a readable message.
 */
function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "string") {
    return error;
  }

  return "Trading account creation failed";
}

/* -------------------------------------------------------------------------- */
/* GET /api/trading/accounts                                                  */
/* -------------------------------------------------------------------------- */

export async function GET() {
  try {
    const user = await requireAuth();

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized",
        },
        { status: 401 }
      );
    }

    await connectDB();

    /*
     * Get accounts created by this website/user.
     */
    const localAccounts = await TradingAccount.find({
      userId: user.id,
    })
      .sort({ createdAt: -1 })
      .lean();

    /*
     * Get current account information from Alpaca.
     */
    const alpacaAccounts =
      await alpacaRequest<AlpacaAccountResponse[]>(
        "/v1/accounts",
        {
          method: "GET",
        }
      );

    /*
     * Only return Alpaca accounts that are mapped to this
     * website user's local TradingAccount records.
     */
    const localProviderAccountIds = new Set(
      localAccounts.map(
        (account) => account.providerAccountId
      )
    );

    const accounts = alpacaAccounts
      .filter((account) =>
        localProviderAccountIds.has(account.id)
      )
      .map((account) => {
        const localAccount = localAccounts.find(
          (item) =>
            item.providerAccountId === account.id
        );

        return {
          id: account.id,
          providerAccountId: account.id,
          accountNumber:
            account.account_number || null,

          provider: "alpaca",

          accountType:
            localAccount?.accountType || "paper",

          status:
            account.status ||
            localAccount?.status ||
            "UNKNOWN",

          currency:
            account.currency || "USD",

          cash: account.cash || "0",
          buyingPower:
            account.buying_power || "0",

          portfolioValue:
            account.portfolio_value || "0",

          equity:
            account.equity || "0",

          longMarketValue:
            account.long_market_value || "0",

          shortMarketValue:
            account.short_market_value || "0",

          initialMargin:
            account.initial_margin || "0",

          maintenanceMargin:
            account.maintenance_margin || "0",

          daytradeCount:
            account.daytrade_count || 0,

          patternDayTrader:
            account.pattern_day_trader || false,

          tradingBlocked:
            account.trading_blocked || false,

          transfersBlocked:
            account.transfers_blocked || false,

          accountBlocked:
            account.account_blocked || false,

          createdAt:
            localAccount?.createdAt || null,

          updatedAt:
            localAccount?.updatedAt || null,
        };
      });

    return NextResponse.json({
      success: true,
      accounts,
    });
  } catch (error) {
    console.error(
      "GET TRADING ACCOUNTS ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message: getErrorMessage(error),
      },
      { status: 500 }
    );
  }
}

/* -------------------------------------------------------------------------- */
/* POST /api/trading/accounts                                                 */
/* -------------------------------------------------------------------------- */

export async function POST(request: NextRequest) {
  try {
    /* ---------------------------------------------------------------------- */
    /* Authentication                                                         */
    /* ---------------------------------------------------------------------- */

    const user = await requireAuth();

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized",
        },
        { status: 401 }
      );
    }

    /* ---------------------------------------------------------------------- */
    /* Request body                                                           */
    /* ---------------------------------------------------------------------- */

    let body: {
      accountType?: AccountType;
    } = {};

    try {
      body = await request.json();
    } catch {
      body = {};
    }

    const requestedAccountType: AccountType =
      body.accountType === "live"
        ? "live"
        : "paper";

    /* ---------------------------------------------------------------------- */
    /* Database                                                               */
    /* ---------------------------------------------------------------------- */

    await connectDB();

    /* ---------------------------------------------------------------------- */
    /* User                                                                    */
    /* ---------------------------------------------------------------------- */

    const dbUser = await User.findById(user.id)
      .select("email")
      .lean();

    if (!dbUser) {
      return NextResponse.json(
        {
          success: false,
          message: "User not found",
        },
        { status: 404 }
      );
    }

    /* ---------------------------------------------------------------------- */
    /* Trading profile                                                        */
    /* ---------------------------------------------------------------------- */

    const tradingProfile =
      await TradingProfile.findOne({
        userId: user.id,
      })
        .select("+taxId")
        .lean();

    if (!tradingProfile) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Trading profile not found. Please complete the account application first.",
        },
        { status: 400 }
      );
    }

    /* ---------------------------------------------------------------------- */
    /* Prevent duplicate account                                              */
    /* ---------------------------------------------------------------------- */

    const existingAccount =
      await TradingAccount.findOne({
        userId: user.id,
        accountType: requestedAccountType,
      }).lean();

    if (existingAccount) {
      return NextResponse.json(
        {
          success: false,
          message: `You already have a ${requestedAccountType} trading account.`,
          account: {
            id: existingAccount.providerAccountId,
            providerAccountId:
              existingAccount.providerAccountId,
            provider: existingAccount.provider,
            accountType:
              existingAccount.accountType,
            status: existingAccount.status,
          },
        },
        { status: 409 }
      );
    }

    /* ---------------------------------------------------------------------- */
    /* Validate profile fields                                                */
    /* ---------------------------------------------------------------------- */

    const givenName = requiredString(
      tradingProfile.givenName,
      "Given name"
    );

    const familyName = requiredString(
      tradingProfile.familyName,
      "Family name"
    );

    const phoneNumber = requiredString(
      tradingProfile.phoneNumber,
      "Phone number"
    );

    const city = requiredString(
      tradingProfile.city,
      "City"
    );

    const state = requiredString(
      tradingProfile.state,
      "State"
    );

    const postalCode = requiredString(
      tradingProfile.postalCode,
      "Postal code"
    );

    const country = requiredString(
      tradingProfile.country,
      "Country"
    ).toUpperCase();

    const countryOfTaxResidence =
      requiredString(
        tradingProfile.countryOfTaxResidence,
        "Country of tax residence"
      ).toUpperCase();

    if (!SUPPORTED_COUNTRIES.has(country)) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Country must be a valid supported ISO alpha-3 country code.",
        },
        { status: 422 }
      );
    }

    if (
      !SUPPORTED_COUNTRIES.has(
        countryOfTaxResidence
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Country of tax residence must be a valid supported ISO alpha-3 country code.",
        },
        { status: 422 }
      );
    }

    /* ---------------------------------------------------------------------- */
    /* Street address                                                         */
    /* ---------------------------------------------------------------------- */

    if (
      !Array.isArray(tradingProfile.streetAddress) ||
      tradingProfile.streetAddress.length === 0 ||
      tradingProfile.streetAddress.some(
        (item) =>
          typeof item !== "string" ||
          !item.trim()
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Street address is required.",
        },
        { status: 422 }
      );
    }

    const streetAddress =
      tradingProfile.streetAddress.map(
        (item) => item.trim()
      );

    /* ---------------------------------------------------------------------- */
    /* Date of birth                                                          */
    /* ---------------------------------------------------------------------- */

    let dateOfBirth: string;

    try {
      dateOfBirth = formatDateOfBirth(
        tradingProfile.dateOfBirth
      );
    } catch (error) {
      return NextResponse.json(
        {
          success: false,
          message: getErrorMessage(error),
        },
        { status: 422 }
      );
    }

    /*
     * Debug information intentionally does NOT print the user's full
     * date of birth. It only confirms the final format.
     */
    console.log(
      "ALPACA DOB FORMAT:",
      dateOfBirth.replace(/\d/g, "X")
    );

    /* ---------------------------------------------------------------------- */
    /* Tax information                                                        */
    /* ---------------------------------------------------------------------- */

    const taxId =
      typeof tradingProfile.taxId === "string"
        ? tradingProfile.taxId.trim()
        : "";

    const taxIdType =
      typeof tradingProfile.taxIdType === "string"
        ? tradingProfile.taxIdType.trim()
        : "";

    if (!taxId) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Tax ID is required to create a trading account.",
        },
        { status: 422 }
      );
    }

    if (!taxIdType) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Tax ID type is required to create a trading account.",
        },
        { status: 422 }
      );
    }

    if (!/[\d]/.test(taxId)) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Tax ID must contain at least one digit.",
        },
        { status: 422 }
      );
    }

    const normalizedTaxResidence =
      countryOfTaxResidence;

    /* ---------------------------------------------------------------------- */
    /* Employment                                                             */
    /* ---------------------------------------------------------------------- */

    const allowedEmploymentStatuses = [
      "EMPLOYED",
      "UNEMPLOYED",
      "RETIRED",
      "STUDENT",
    ];

    const employmentStatus =
      typeof tradingProfile.employmentStatus ===
      "string"
        ? tradingProfile.employmentStatus
            .trim()
            .toUpperCase()
        : "";

    if (
      !allowedEmploymentStatuses.includes(
        employmentStatus
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Employment status must be one of: EMPLOYED, UNEMPLOYED, RETIRED, STUDENT.",
        },
        { status: 422 }
      );
    }

    /* ---------------------------------------------------------------------- */
    /* Funding source                                                         */
    /* ---------------------------------------------------------------------- */

    if (
      !Array.isArray(tradingProfile.fundingSource) ||
      tradingProfile.fundingSource.length === 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "At least one funding source is required.",
        },
        { status: 422 }
      );
    }

    const fundingSource =
      tradingProfile.fundingSource
        .filter(
          (item) =>
            typeof item === "string" &&
            item.trim()
        )
        .map((item) => item.trim());

    if (fundingSource.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message:
            "At least one valid funding source is required.",
        },
        { status: 422 }
      );
    }

    /* ---------------------------------------------------------------------- */
    /* Risk tolerance                                                         */
    /* ---------------------------------------------------------------------- */

    const allowedRiskTolerance = [
      "conservative",
      "moderate",
      "significant_risk",
    ];

    if (
      !allowedRiskTolerance.includes(
        tradingProfile.riskTolerance
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Invalid risk tolerance.",
        },
        { status: 422 }
      );
    }

    /* ---------------------------------------------------------------------- */
    /* Disclosures                                                            */
    /* ---------------------------------------------------------------------- */

    if (!tradingProfile.disclosures) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Required disclosures are missing.",
        },
        { status: 422 }
      );
    }

    const disclosures = {
      is_control_person:
        Boolean(
          tradingProfile.disclosures
            .isControlPerson
        ),

      is_affiliated_exchange_or_finra:
        Boolean(
          tradingProfile.disclosures
            .isAffiliatedExchangeOrFinra
        ),

      is_politically_exposed:
        Boolean(
          tradingProfile.disclosures
            .isPoliticallyExposed
        ),

      immediate_family_exposed:
        Boolean(
          tradingProfile.disclosures
            .immediateFamilyExposed
        ),

      employment_status:
        employmentStatus,
    };

    /* ---------------------------------------------------------------------- */
    /* Agreements                                                             */
    /* ---------------------------------------------------------------------- */

    if (!tradingProfile.agreementsAccepted) {
      return NextResponse.json(
        {
          success: false,
          message:
            "You must accept the required agreements before creating a trading account.",
        },
        { status: 422 }
      );
    }

    const signedAt =
      new Date().toISOString();

    const ipAddress =
      getRequestIp(request);

    const agreements = [
      {
        agreement: "account_agreement",
        signed_at: signedAt,
        ip_address: ipAddress,
      },
      {
        agreement: "customer_agreement",
        signed_at: signedAt,
        ip_address: ipAddress,
      },
      {
        agreement: "margin_agreement",
        signed_at: signedAt,
        ip_address: ipAddress,
      },
    ];

    /* ---------------------------------------------------------------------- */
    /* Logging                                                                */
    /* ---------------------------------------------------------------------- */

    console.log(
      "CREATING ALPACA ACCOUNT FOR USER:",
      {
        userId: user.id,
        email: dbUser.email,
        applicationAccountType:
          requestedAccountType,
        country,
        countryOfTaxResidence:
          normalizedTaxResidence,
        agreementTypes:
          agreements.map(
            (agreement) =>
              agreement.agreement
          ),
      }
    );

    /* ---------------------------------------------------------------------- */
    /* Alpaca account payload                                                 */
    /* ---------------------------------------------------------------------- */

    const alpacaPayload = {
      account_type: "trading",

      contact: {
        email_address: dbUser.email,

        phone_number: phoneNumber,

        street_address:
          streetAddress,

        city,

        state,

        postal_code:
          postalCode,

        country,
      },

      identity: {
        given_name: givenName,

        family_name: familyName,

        /*
         * IMPORTANT:
         * Alpaca expects YYYY-MM-DD.
         *
         * Example:
         * 2003-11-03
         */
        date_of_birth:
          dateOfBirth,

        tax_id: taxId,

        tax_id_type:
          taxIdType,

        country_of_tax_residence:
          normalizedTaxResidence,

        funding_source:
          fundingSource,
      },

      disclosures,

      risk_tolerance:
        tradingProfile.riskTolerance,

      agreements,
    };

    /* ---------------------------------------------------------------------- */
    /* Create account at Alpaca                                               */
    /* ---------------------------------------------------------------------- */

    const alpacaAccount =
      await alpacaRequest<CreateAccountResponse>(
        "/v1/accounts",
        {
          method: "POST",

          body: JSON.stringify(
            alpacaPayload
          ),
        }
      );

    if (!alpacaAccount?.id) {
      throw new Error(
        "Alpaca did not return a valid account ID."
      );
    }

    /* ---------------------------------------------------------------------- */
    /* Save account in MongoDB                                                */
    /* ---------------------------------------------------------------------- */

    const savedAccount =
      await TradingAccount.create({
        userId: user.id,

        provider: "alpaca",

        providerAccountId:
          alpacaAccount.id,

        accountType:
          requestedAccountType,

        status:
          alpacaAccount.status ||
          "SUBMITTED",
      });

    /* ---------------------------------------------------------------------- */
    /* Response                                                               */
    /* ---------------------------------------------------------------------- */

    return NextResponse.json(
      {
        success: true,

        message:
          "Trading account created successfully.",

        account: {
          id: alpacaAccount.id,

          providerAccountId:
            alpacaAccount.id,

          provider: "alpaca",

          accountType:
            savedAccount.accountType,

          status:
            alpacaAccount.status ||
            savedAccount.status ||
            "SUBMITTED",

          accountNumber:
            alpacaAccount.account_number ||
            null,

          currency:
            alpacaAccount.currency ||
            "USD",

          cash:
            alpacaAccount.cash ||
            "0",

          buyingPower:
            alpacaAccount.buying_power ||
            "0",

          portfolioValue:
            alpacaAccount.portfolio_value ||
            "0",

          equity:
            alpacaAccount.equity ||
            "0",
        },
      },
      { status: 201 }
    );
  } catch (error) {
    const message =
      getErrorMessage(error);

    console.error(
      "CREATE TRADING ACCOUNT ERROR:",
      error
    );

    /*
     * Alpaca validation errors are generally 422.
     * Returning 422 to the frontend is more accurate than
     * converting them into a generic 500 error.
     */
    if (
      message.startsWith(
        "422 Unprocessable Entity:"
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          message,
        },
        { status: 422 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message,
      },
      { status: 500 }
    );
  }
}
