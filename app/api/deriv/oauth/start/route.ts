import { NextResponse } from "next/server";

import { requireAuth } from "@/lib/session";
import {
  generateCodeVerifier,
  generateCodeChallenge,
  generateOAuthState,
  buildDerivAuthorizationUrl,
} from "@/lib/deriv/oauth";

export async function GET() {
  try {
    // 1. Check our website user is logged in
    const user = await requireAuth();

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "You must be logged in.",
        },
        { status: 401 }
      );
    }

    // 2. Generate PKCE verifier
    const codeVerifier = generateCodeVerifier();

    // 3. Generate PKCE challenge
    const codeChallenge =
      generateCodeChallenge(codeVerifier);

    // 4. Generate OAuth state
    const state = generateOAuthState();

    // 5. Build Deriv authorization URL
    const authorizationUrl =
      buildDerivAuthorizationUrl(
        state,
        codeChallenge
      );

    // 6. Redirect user to Deriv
    const response = NextResponse.redirect(
      authorizationUrl
    );

    // 7. Store PKCE verifier temporarily
    response.cookies.set({
      name: "deriv_oauth_verifier",
      value: codeVerifier,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 10 * 60,
    });

    // 8. Store OAuth state temporarily
    response.cookies.set({
      name: "deriv_oauth_state",
      value: state,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 10 * 60,
    });

    // 9. Store our PK user ID
    response.cookies.set({
      name: "deriv_oauth_user",
      value: user.id,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 10 * 60,
    });

    return response;
  } catch (error) {
    console.error(
      "Deriv OAuth start error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message: "Unable to start Deriv OAuth.",
      },
      { status: 500 }
    );
  }
}