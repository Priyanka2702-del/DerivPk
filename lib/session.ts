import { cookies } from "next/headers";

import { connectDB } from "@/lib/db";
import { hashSessionToken } from "@/lib/auth";

import Session from "@/models/Session";
import User from "@/models/User";

export async function getCurrentSession() {
  const cookieStore = await cookies();

  const sessionToken =
    cookieStore.get("pk_session")?.value;

  if (!sessionToken) {
    return null;
  }

  const tokenHash =
    hashSessionToken(sessionToken);

  await connectDB();

  const session = await Session.findOne({
    tokenHash,
    expiresAt: {
      $gt: new Date(),
    },
  }).lean();

  if (!session) {
    return null;
  }

  return session;
}

export async function getCurrentUser() {
  const session =
    await getCurrentSession();

  if (!session) {
    return null;
  }

  await connectDB();

  const user = await User.findById(
    session.userId
  )
    .select("_id name email role")
    .lean();

  if (!user) {
    return null;
  }

  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role ?? "user",
  };
}

export async function requireAuth() {
  const user =
    await getCurrentUser();

  if (!user) {
    return null;
  }

  return user;
}

export async function requireAdmin() {
  const user =
    await getCurrentUser();

  if (!user) {
    return null;
  }

  if (user.role !== "admin") {
    return null;
  }

  return user;
}