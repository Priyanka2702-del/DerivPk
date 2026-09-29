// // // // Lightweight client-side session flag for gating the User Panel in the
// // // // absence of a real backend/auth provider. This is intentionally simple:
// // // // swap the three functions below for real session/cookie/JWT checks once
// // // // an authentication backend is connected — nothing else in the dashboard
// // // // needs to change, since pages only ever call these three functions.

// // // const SESSION_KEY = "pk_session";

// // // export function isLoggedIn(): boolean {
// // //   if (typeof window === "undefined") return true; // avoid SSR/client mismatch flicker
// // //   const value = window.localStorage.getItem(SESSION_KEY);
// // //   // No explicit flag yet (fresh browser) is treated as logged in so the
// // //   // dashboard demo remains browsable; an explicit "false" (set on logout)
// // //   // is what actually locks the panel.
// // //   return value !== "false";
// // // }

// // // export function login() {
// // //   if (typeof window === "undefined") return;
// // //   window.localStorage.setItem(SESSION_KEY, "true");
// // // }

// // // export function logout() {
// // //   if (typeof window === "undefined") return;
// // //   window.localStorage.setItem(SESSION_KEY, "false");
// // // }
// // import { cookies } from "next/headers";
// // //import { Types } from "mongoose";

// // import { connectDB } from "@/lib/db";
// // import Session from "@/models/Session";
// // import User from "@/models/User";
// // import { hashSessionToken } from "@/lib/auth";

// // export async function getCurrentSession() {
// //   const cookieStore = await cookies();

// //   const sessionToken = cookieStore.get("pk_session")?.value;

// //   if (!sessionToken) {
// //     return null;
// //   }

// //   const tokenHash = hashSessionToken(sessionToken);

// //   await connectDB();

// //   const session = await Session.findOne({
// //     tokenHash,
// //     expiresAt: { $gt: new Date() },
// //   }).lean();

// //   if (!session) {
// //     return null;
// //   }

// //   return session;
// // }

// // export async function getCurrentUser() {
// //   const session = await getCurrentSession();

// //   if (!session) {
// //     return null;
// //   }

// //   await connectDB();

// //   const user = await User.findById(session.userId)
// //     .select("_id name email")
// //     .lean();

// //   if (!user) {
// //     return null;
// //   }

// //   return {
// //     id: user._id.toString(),
// //     name: user.name,
// //     email: user.email,
// //   };
// // }

// // export async function requireAuth() {
// //   const user = await getCurrentUser();

// //   if (!user) {
// //     return null;
// //   }

// //   return user;
// // }
// import { cookies } from "next/headers";
// import { connectDB } from "@/lib/db";
// import Session from "@/models/Session";
// import User from "@/models/User";
// import { hashSessionToken } from "@/lib/auth";

// export async function getCurrentSession() {
//   const cookieStore = await cookies();
//   const sessionToken =
//     cookieStore.get("pk_session")?.value;

//   if (!sessionToken) return null;

//   const tokenHash =
//     hashSessionToken(sessionToken);

//   await connectDB();

//   const session = await Session.findOne({
//     tokenHash,
//     expiresAt: { $gt: new Date() },
//   }).lean();

//   if (!session) return null;

//   return session;
// }

// export async function getCurrentUser() {
//   const session = await getCurrentSession();

//   if (!session) return null;

//   await connectDB();

//   const user = await User.findById(
//     session.userId
//   )
//     .select("_id name email role")
//     .lean();

//   if (!user) return null;

//   return {
//     id: user._id.toString(),
//     name: user.name,
//     email: user.email,
//     role: user.role ?? "user",
//   };
// }

// export async function requireAuth() {
//   const user = await getCurrentUser();

//   if (!user) return null;

//   return user;
// }

// export async function requireAdmin() {
//   const user = await getCurrentUser();

//   if (!user) return null;

//   if (user.role !== "admin") {
//     return null;
//   }

//   return user;
// }

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
    role: user.role,
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
