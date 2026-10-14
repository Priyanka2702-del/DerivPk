import { NextResponse } from "next/server";

import { connectDB } from "@/lib/db";
import { requireAuth } from "@/lib/session";
import TradingProfile from "@/models/TradingProfile";

export const runtime = "nodejs";

type TradingProfileBody = {
  givenName?: unknown;
  familyName?: unknown;

  phoneNumber?: unknown;
  dateOfBirth?: unknown;

  streetAddress?: unknown;
  city?: unknown;
  state?: unknown;
  postalCode?: unknown;
  country?: unknown;

  taxId?: unknown;
  taxIdType?: unknown;
  countryOfTaxResidence?: unknown;

  employmentStatus?: unknown;
  employerName?: unknown;
  occupation?: unknown;

  fundingSource?: unknown;

  riskTolerance?: unknown;

  disclosures?: unknown;

  agreementsAccepted?: unknown;
};

function cleanString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function cleanStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((item) => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean);
}

/*
 * GET
 * Load current user's trading profile
 */
export async function GET() {
  try {
    const user = await requireAuth();

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized.",
        },
        { status: 401 }
      );
    }

    await connectDB();

    const profile =
      await TradingProfile.findOne({
        userId: user.id,
      })
        .select("-taxId")
        .lean();

    return NextResponse.json({
      success: true,
      profile: profile || null,
    });
  } catch (error) {
    console.error(
      "GET TRADING PROFILE ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Unable to load trading profile.",
      },
      { status: 500 }
    );
  }
}

/*
 * POST
 * Create or update current user's trading profile
 */
export async function POST(
  request: Request
) {
  try {
    const user = await requireAuth();

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized.",
        },
        { status: 401 }
      );
    }

    const body =
      (await request.json()) as TradingProfileBody;

    // Identity
    const givenName = cleanString(
      body.givenName
    );

    const familyName = cleanString(
      body.familyName
    );

    // Contact
    const phoneNumber = cleanString(
      body.phoneNumber
    );

    // Personal information
    const dateOfBirth = cleanString(
      body.dateOfBirth
    );

    // Address
    const streetAddress =
      cleanStringArray(body.streetAddress);

    const city = cleanString(body.city);
    const state = cleanString(body.state);

    const postalCode = cleanString(
      body.postalCode
    );

    const country = cleanString(
      body.country
    );

    // Tax information
    const taxId = cleanString(body.taxId);

    const taxIdType = cleanString(
      body.taxIdType
    );

    const countryOfTaxResidence =
      cleanString(
        body.countryOfTaxResidence
      );

    // Employment
    const employmentStatus =
      cleanString(body.employmentStatus);

    const employerName = cleanString(
      body.employerName
    );

    const occupation = cleanString(
      body.occupation
    );

    // Financial information
    const fundingSource =
      cleanStringArray(body.fundingSource);

    const riskTolerance =
      body.riskTolerance;

    // Regulatory disclosures
    const disclosures =
      body.disclosures;

    const agreementsAccepted =
      body.agreementsAccepted;

    /*
     * Validation
     */

    if (!givenName) {
      return NextResponse.json(
        {
          success: false,
          message: "First name is required.",
        },
        { status: 400 }
      );
    }

    if (!familyName) {
      return NextResponse.json(
        {
          success: false,
          message: "Last name is required.",
        },
        { status: 400 }
      );
    }

    if (!phoneNumber) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Phone number is required.",
        },
        { status: 400 }
      );
    }

    if (!dateOfBirth) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Date of birth is required.",
        },
        { status: 400 }
      );
    }

    const parsedDateOfBirth =
      new Date(dateOfBirth);

    if (
      Number.isNaN(
        parsedDateOfBirth.getTime()
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Invalid date of birth.",
        },
        { status: 400 }
      );
    }

    if (streetAddress.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Street address is required.",
        },
        { status: 400 }
      );
    }

    if (!city) {
      return NextResponse.json(
        {
          success: false,
          message: "City is required.",
        },
        { status: 400 }
      );
    }

    if (!state) {
      return NextResponse.json(
        {
          success: false,
          message: "State is required.",
        },
        { status: 400 }
      );
    }

    if (!postalCode) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Postal code is required.",
        },
        { status: 400 }
      );
    }

    if (!country) {
      return NextResponse.json(
        {
          success: false,
          message: "Country is required.",
        },
        { status: 400 }
      );
    }

    if (!employmentStatus) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Employment status is required.",
        },
        { status: 400 }
      );
    }

    if (fundingSource.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Funding source is required.",
        },
        { status: 400 }
      );
    }

    if (
      riskTolerance !==
        "conservative" &&
      riskTolerance !== "moderate" &&
      riskTolerance !==
        "significant_risk"
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Invalid risk tolerance.",
        },
        { status: 400 }
      );
    }

    if (
      typeof disclosures !== "object" ||
      disclosures === null
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Disclosure information is required.",
        },
        { status: 400 }
      );
    }

    const disclosureData =
      disclosures as Record<
        string,
        unknown
      >;

    const requiredDisclosureFields = [
      "isControlPerson",
      "isAffiliatedExchangeOrFinra",
      "isPoliticallyExposed",
      "immediateFamilyExposed",
    ];

    for (const field of
      requiredDisclosureFields) {
      if (
        typeof disclosureData[field] !==
        "boolean"
      ) {
        return NextResponse.json(
          {
            success: false,
            message: `Invalid disclosure field: ${field}.`,
          },
          { status: 400 }
        );
      }
    }

    if (agreementsAccepted !== true) {
      return NextResponse.json(
        {
          success: false,
          message:
            "You must accept the required agreements.",
        },
        { status: 400 }
      );
    }

    /*
     * Save profile
     */

    await connectDB();

    const profile =
      await TradingProfile.findOneAndUpdate(
        {
          userId: user.id,
        },
        {
          $set: {
            givenName,
            familyName,

            phoneNumber,

            dateOfBirth:
              parsedDateOfBirth,

            streetAddress,
            city,
            state,
            postalCode,
            country,

            taxId:
              taxId || undefined,

            taxIdType:
              taxIdType || undefined,

            countryOfTaxResidence:
              countryOfTaxResidence ||
              undefined,

            employmentStatus,

            employerName:
              employerName || undefined,

            occupation:
              occupation || undefined,

            fundingSource,

            riskTolerance,

            disclosures: {
              isControlPerson:
                disclosureData
                  .isControlPerson,

              isAffiliatedExchangeOrFinra:
                disclosureData
                  .isAffiliatedExchangeOrFinra,

              isPoliticallyExposed:
                disclosureData
                  .isPoliticallyExposed,

              immediateFamilyExposed:
                disclosureData
                  .immediateFamilyExposed,
            },

            agreementsAccepted: true,

            agreementsAcceptedAt:
              new Date(),
          },
        },
        {
          new: true,
          upsert: true,
          runValidators: true,
          setDefaultsOnInsert: true,
        }
      )
        .select("-taxId")
        .lean();

    return NextResponse.json({
      success: true,
      message:
        "Trading profile saved successfully.",
      profile,
    });
  } catch (error) {
    console.error(
      "SAVE TRADING PROFILE ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Unable to save trading profile.",
      },
      { status: 500 }
    );
  }
}

