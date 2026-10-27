
import { cookies } from "next/headers";

import { connectDB } from "@/lib/db";
import { hashSessionToken } from "@/lib/auth";

import Session from "@/models/Session";
import User from "@/models/User";

export async function getCurrentSession() {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("pk_session")?.value;

    console.info(
      "[AUTH DEBUG] Session cookie present:",
      Boolean(sessionToken)
    );

    if (!sessionToken) {
      console.warn("[AUTH DEBUG] No session cookie found.");
      return null;
    }

    const tokenHash = hashSessionToken(sessionToken);

    await connectDB();

    console.info("[AUTH DEBUG] Database connection ready.");

    const session = await Session.findOne({
      tokenHash,
      expiresAt: { $gt: new Date() },
    }).lean();

    console.info(
      "[AUTH DEBUG] Valid session found:",
      Boolean(session)
    );

    if (!session) {
      console.warn(
        "[AUTH DEBUG] Session not found or expired."
      );
      return null;
    }

    return session;
  } catch (error) {
    console.error(
      "[AUTH DEBUG] Session lookup failed:",
      error instanceof Error ? error.message : "Unknown error"
    );
    return null;
  }
}

export async function getCurrentUser() {
  try {
    const session = await getCurrentSession();

    if (!session) {
      console.warn("[AUTH DEBUG] No valid session for user lookup.");
      return null;
    }

    await connectDB();

    const user = await User.findById(session.userId)
      .select("_id name email role")
      .lean();

    console.info(
      "[AUTH DEBUG] User record found:",
      Boolean(user)
    );

    if (!user) {
      console.warn(
        "[AUTH DEBUG] Session exists but user record is missing."
      );
      return null;
    }

    return {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role ?? "user",
    };
  } catch (error) {
    console.error(
      "[AUTH DEBUG] User lookup failed:",
      error instanceof Error ? error.message : "Unknown error"
    );
    return null;
  }
}

export async function requireAuth() {
  return await getCurrentUser();
}

export async function requireAdmin() {
  const user = await getCurrentUser();

  if (!user || user.role !== "admin") {
    return null;
  }

  return user;
}
