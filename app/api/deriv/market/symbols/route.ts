import { NextResponse } from "next/server";

import { getDerivSymbols } from "@/lib/deriv-market-server";

export const runtime = "nodejs";

export async function GET() {
  try {
    const symbols = await getDerivSymbols();

    const validSymbols = symbols.filter(
      (symbol) =>
        symbol &&
        typeof symbol.underlying_symbol ===
          "string"
    );

    return NextResponse.json({
      success: true,
      count: validSymbols.length,
      symbols: validSymbols,
    });
  } catch (error) {
    console.error(
      "DERIV SYMBOLS API ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Unable to fetch Deriv symbols",
      },
      {
        status: 500,
      }
    );
  }
}