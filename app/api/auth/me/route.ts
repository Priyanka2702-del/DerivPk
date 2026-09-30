import { NextResponse } from "next/server";

import { requireAuth } from "@/lib/session";

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

    return NextResponse.json({
      success: true,
      user,
    });
  } catch (error) {
    console.error("Get current user error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to load user profile.",
      },
      { status: 500 }
    );
  }
}