import { NextResponse } from "next/server";

import { connectDB } from "@/lib/db";
import { requireAuth } from "@/lib/session";
import { decryptToken } from "@/lib/deriv/encryption";

import DerivConnection from "@/models/DerivConnection";

export const runtime = "nodejs";

const DERIV_API_BASE = "https://api.derivws.com";

export async function GET() {
  try {
    // 1. Connect to MongoDB
    await connectDB();

    // 2. Check our website session
    const user = await requireAuth();

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "Authentication required",
        },
        { status: 401 }
      );
    }

    // 3. Find this user's Deriv connection
    const connection =
      await DerivConnection.findOne({
        userId: user.id,
      });

    if (!connection) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Deriv account is not connected",
        },
        { status: 400 }
      );
    }

    // 4. Decrypt the stored Deriv access token
    const accessToken = decryptToken(
      connection.accessTokenEncrypted
    );

    // 5. Call Deriv Options Accounts API
    const response = await fetch(
      `${DERIV_API_BASE}/trading/v1/options/accounts`,
      {
        method: "GET",
        headers: {
          Authorization: `${connection.tokenType} ${accessToken}`,
          Accept: "application/json",
        },
        cache: "no-store",
      }
    );

    const data = await response.json();

    // 6. Handle Deriv API error
    if (!response.ok) {
      console.error(
        "❌ Deriv Accounts API Error:",
        data
      );

      return NextResponse.json(
        {
          success: false,
          message:
            data?.errors?.[0]?.message ||
            data?.message ||
            "Unable to fetch Deriv accounts",
        },
        {
          status: response.status,
        }
      );
    }

    // 7. Return account data
    return NextResponse.json({
      success: true,
      accounts: data?.data ?? [],
    });
  } catch (error) {
    console.error(
      "❌ OPTIONS ACCOUNTS API ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Internal server error",
      },
      { status: 500 }
    );
  }
}