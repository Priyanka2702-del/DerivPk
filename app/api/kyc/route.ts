// import { NextResponse } from "next/server";
// import { Types } from "mongoose";

// import { connectDB } from "@/lib/db";
// import { requireAuth } from "@/lib/session";

// import KYC from "@/models/KYC";

// export const runtime = "nodejs";

// export async function GET() {
//   try {
//     await connectDB();

//     const user = await requireAuth();

//     if (!user) {
//       return NextResponse.json(
//         {
//           success: false,
//           message: "Authentication required",
//         },
//         { status: 401 }
//       );
//     }

//     if (!user.id || !Types.ObjectId.isValid(user.id)) {
//       console.error("Invalid user ID:", user.id);

//       return NextResponse.json(
//         {
//           success: false,
//           message: "Invalid user ID",
//         },
//         { status: 401 }
//       );
//     }

//     let kyc = await KYC.findOne({
//       userId: new Types.ObjectId(user.id),
//     }).lean();

//     if (!kyc) {
//       kyc = await KYC.create({
//         userId: new Types.ObjectId(user.id),

//         identityStatus: "not_started",

//         addressStatus: "not_started",

//         overallStatus: "not_started",
//       });

//       kyc = kyc.toObject();
//     }

//     return NextResponse.json({
//       success: true,
//       kyc,
//     });
//   } catch (error) {
//     console.error("GET KYC ERROR:", error);

//     return NextResponse.json(
//       {
//         success: false,
//         message:
//           error instanceof Error
//             ? error.message
//             : "Unable to fetch KYC",
//       },
//       { status: 500 }
//     );
//   }
// }

import { NextResponse } from "next/server";
import { Types } from "mongoose";

import { connectDB } from "@/lib/db";
import { requireAuth } from "@/lib/session";

import KYC from "@/models/KYC";

export const runtime = "nodejs";

export async function GET() {
  try {
    await connectDB();

    const user = await requireAuth();

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "Authentication required",
        },
        {
          status: 401,
        }
      );
    }

    if (
      !user.id ||
      !Types.ObjectId.isValid(user.id)
    ) {
      console.error(
        "Invalid user ID:",
        user.id
      );

      return NextResponse.json(
        {
          success: false,
          message: "Invalid user ID",
        },
        {
          status: 401,
        }
      );
    }

    const userId = new Types.ObjectId(user.id);

    /*
     * First try to find the existing KYC record.
     */
    let kyc = await KYC.findOne({
      userId,
    }).lean();

    /*
     * If no KYC record exists, create one.
     *
     * userId has a unique index, so two parallel
     * requests can theoretically try to create the
     * same document at the same time.
     *
     * We handle duplicate-key error below by
     * fetching the already-created document.
     */
    if (!kyc) {
      try {
        const createdKYC = await KYC.create({
          userId,

          identityStatus: "not_started",
          addressStatus: "not_started",
          overallStatus: "not_started",
        });

        kyc = createdKYC.toObject();
      } catch (createError) {
        /*
         * MongoDB duplicate key error.
         *
         * This can happen when another parallel
         * request creates the KYC document between
         * our findOne() and create().
         */
        if (
          createError &&
          typeof createError === "object" &&
          "code" in createError &&
          createError.code === 11000
        ) {
          kyc = await KYC.findOne({
            userId,
          }).lean();

          if (!kyc) {
            throw createError;
          }
        } else {
          throw createError;
        }
      }
    }

    return NextResponse.json({
      success: true,
      kyc,
    });
  } catch (error) {
    console.error(
      "GET KYC ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Unable to fetch KYC",
      },
      {
        status: 500,
      }
    );
  }
}
