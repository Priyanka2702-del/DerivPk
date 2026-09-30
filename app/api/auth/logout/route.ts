import { NextResponse } from "next/server";
import { cookies } from "next/headers";

import { connectDB } from "@/lib/db";
import Session from "@/models/Session";
import { hashSessionToken } from "@/lib/auth";

export async function POST() {
  try {
    const cookieStore = await cookies();

    const sessionToken = cookieStore.get("pk_session")?.value;

    if (sessionToken) {
      const tokenHash = hashSessionToken(sessionToken);

      await connectDB();

      await Session.deleteOne({ tokenHash });
    }

    const response = NextResponse.json({
      success: true,
      message: "Logged out successfully.",
    });

    response.cookies.set({
      name: "pk_session",
      value: "",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      expires: new Date(0),
    });

    return response;
  } catch (error) {
    console.error("Logout error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Something went wrong while logging out.",
      },
      { status: 500 }
    );
  }
}