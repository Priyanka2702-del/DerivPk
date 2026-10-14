import { NextResponse } from "next/server";

import { alpacaRequest } from "@/lib/alpaca/broker";

export const runtime = "nodejs";

export async function GET() {
  try {
    const accounts = await alpacaRequest("/v1/accounts");

    return NextResponse.json({
      success: true,
      accounts,
    });
  } catch (error) {
    console.error("ALPACA ACCOUNT LIST TEST ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Alpaca request failed",
      },
      { status: 500 }
    );
  }
}