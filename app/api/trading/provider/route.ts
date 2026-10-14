import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/session";
import { alpacaRequest } from "@/lib/alpaca/broker";

export const runtime = "nodejs";

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

    const assets = await alpacaRequest<unknown[]>(
      "/v1/assets"
    );

    return NextResponse.json({
      success: true,
      provider: "alpaca",
      environment: "sandbox",
      connected: true,
      assetCount: Array.isArray(assets)
        ? assets.length
        : 0,
    });
  } catch (error) {
    console.error(
      "ALPACA PROVIDER TEST ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Alpaca connection failed",
      },
      { status: 500 }
    );
  }
}