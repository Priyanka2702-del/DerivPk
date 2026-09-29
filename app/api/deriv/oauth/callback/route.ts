import { NextResponse } from "next/server";

import { exchangeCodeForToken } from "@/lib/deriv/oauth";
import { encryptToken } from "@/lib/deriv/encryption";
import { connectDB } from "@/lib/db";
import DerivConnection from "@/models/DerivConnection";
import User from "@/models/User";

export async function GET(
  request: Request
) {
  try {
    const url = new URL(request.url);

    const code = url.searchParams.get("code");
    const returnedState =
      url.searchParams.get("state");

    const oauthError =
      url.searchParams.get("error");

    const oauthErrorDescription =
      url.searchParams.get(
        "error_description"
      );

    // ------------------------------------------------
    // 1. Handle OAuth error
    // ------------------------------------------------

    if (oauthError) {
      console.error(
        "Deriv OAuth error:",
        oauthError,
        oauthErrorDescription
      );

      return NextResponse.json(
        {
          success: false,
          message:
            oauthErrorDescription ||
            oauthError,
        },
        { status: 400 }
      );
    }

    // ------------------------------------------------
    // 2. Read temporary OAuth cookies
    // ------------------------------------------------

    const cookieHeader =
      request.headers.get("cookie") || "";

    const cookies = Object.fromEntries(
      cookieHeader
        .split(";")
        .map((cookie) => {
          const [key, ...value] =
            cookie.trim().split("=");

          return [
            key,
            decodeURIComponent(value.join("=")),
          ];
        })
        .filter(([key]) => key)
    );

    const savedState =
      cookies.deriv_oauth_state;

    const codeVerifier =
      cookies.deriv_oauth_verifier;

    const userId =
      cookies.deriv_oauth_user;

    // ------------------------------------------------
    // 3. Validate state
    // ------------------------------------------------

    if (
      !returnedState ||
      !savedState ||
      returnedState !== savedState
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Invalid OAuth state.",
        },
        { status: 400 }
      );
    }

    // ------------------------------------------------
    // 4. Validate required values
    // ------------------------------------------------

    if (!code) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Authorization code is missing.",
        },
        { status: 400 }
      );
    }

    if (!codeVerifier) {
      return NextResponse.json(
        {
          success: false,
          message:
            "PKCE code verifier is missing or expired.",
        },
        { status: 400 }
      );
    }

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Website user information is missing.",
        },
        { status: 400 }
      );
    }

    // ------------------------------------------------
    // 5. Exchange code for Deriv token
    // ------------------------------------------------

    const tokenData =
      await exchangeCodeForToken(
        code,
        codeVerifier
      );

    const accessToken =
      tokenData?.access_token;

    if (!accessToken) {
      throw new Error(
        "Deriv did not return an access token."
      );
    }

    const expiresIn =
      Number(tokenData?.expires_in) || 3600;

    const expiresAt = new Date(
      Date.now() + expiresIn * 1000
    );

    // ------------------------------------------------
    // 6. Encrypt access token
    // ------------------------------------------------

    const encryptedToken =
      encryptToken(accessToken);

    // ------------------------------------------------
    // 7. Save connection
    // ------------------------------------------------

    await connectDB();

    const user = await User.findById(userId);

    if (!user) {
      throw new Error(
        "Website user not found."
      );
    }

    await DerivConnection.findOneAndUpdate(
      { userId: user._id },
      {
        userId: user._id,
        accessTokenEncrypted:
          encryptedToken,
        tokenType:
          tokenData?.token_type || "Bearer",
        expiresAt,
        scopes: ["trade"],
      },
      {
        upsert: true,
        new: true,
      }
    );

    // ------------------------------------------------
    // 8. Success response
    // ------------------------------------------------

    const response = NextResponse.json({
      success: true,
      message:
        "Deriv account connected successfully.",
      expiresAt,
    });

    // ------------------------------------------------
    // 9. Delete temporary OAuth cookies
    // ------------------------------------------------

    response.cookies.delete(
      "deriv_oauth_state"
    );

    response.cookies.delete(
      "deriv_oauth_verifier"
    );

    response.cookies.delete(
      "deriv_oauth_user"
    );

    return response;
  } catch (error) {
    console.error(
      "Deriv OAuth callback error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Deriv OAuth callback failed.",
      },
      { status: 500 }
    );
  }
}