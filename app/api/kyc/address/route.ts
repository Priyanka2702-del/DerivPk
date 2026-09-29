import { NextResponse } from "next/server";
import { Types } from "mongoose";
import crypto from "crypto";

import { connectDB } from "@/lib/db";
import { requireAuth } from "@/lib/session";
import { imagekit } from "@/lib/imagekit";

import KYC from "@/models/KYC";

export const runtime = "nodejs";

const MAX_FILE_SIZE = 10 * 1024 * 1024;

const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "application/pdf",
];

export async function POST(request: Request) {
  try {
    console.log("=================================");
    console.log("KYC ADDRESS UPLOAD STARTED");
    console.log("=================================");

    // -----------------------------------------
    // 1. Database connection
    // -----------------------------------------

    await connectDB();

    console.log("MongoDB connection: OK");

    // -----------------------------------------
    // 2. Authentication
    // -----------------------------------------

    const user = await requireAuth();

    if (!user) {
      console.log("Authentication failed");

      return NextResponse.json(
        {
          success: false,
          message: "Authentication required",
        },
        { status: 401 }
      );
    }

    console.log(
      "Authenticated user:",
      user.id
    );

    // -----------------------------------------
    // 3. Validate user ID
    // -----------------------------------------

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
        { status: 401 }
      );
    }

    // -----------------------------------------
    // 4. Validate Content-Type
    // -----------------------------------------

    const contentType =
      request.headers.get("content-type");

    console.log(
      "Request Content-Type:",
      contentType
    );

    if (
      !contentType?.includes(
        "multipart/form-data"
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Request must use multipart/form-data",
        },
        { status: 400 }
      );
    }

    // -----------------------------------------
    // 5. Read FormData
    // -----------------------------------------

    const formData =
      await request.formData();

    console.log(
      "FormData received"
    );

    // -----------------------------------------
    // 6. Diagnostic logging
    // -----------------------------------------

    console.log(
      "========== ADDRESS FORM DATA =========="
    );

    for (const [key, value] of formData.entries()) {
      if (value instanceof File) {
        console.log("FIELD:", key);
        console.log(
          "FILE NAME:",
          value.name
        );
        console.log(
          "FILE TYPE:",
          value.type
        );
        console.log(
          "FILE SIZE:",
          value.size
        );
      } else {
        console.log("FIELD:", key);
        console.log(
          "VALUE:",
          value
        );
      }
    }

    console.log(
      "======================================="
    );

    // -----------------------------------------
    // 7. Get address document
    // -----------------------------------------

    const file = formData.get("address_document");
      console.log("document field:", file);
console.log("document instanceof File:", file instanceof File);
console.log("document type:", typeof file);

    if (!(file instanceof File)) {
      console.log(
        "Address document is missing"
      );

      return NextResponse.json(
        {
          success: false,
          message:
            "Address document is required",
        },
        { status: 400 }
      );
    }

    // -----------------------------------------
    // 8. Validate empty file
    // -----------------------------------------

    if (file.size === 0) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Uploaded file is empty",
        },
        { status: 400 }
      );
    }

    // -----------------------------------------
    // 9. Validate file size
    // -----------------------------------------

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          success: false,
          message:
            "File size must not exceed 10MB",
        },
        { status: 400 }
      );
    }

    // -----------------------------------------
    // 10. Validate file type
    // -----------------------------------------

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Invalid file type. Only JPG, PNG and PDF files are allowed",
        },
        { status: 400 }
      );
    }

    console.log(
      "Address document validation: OK"
    );

    // -----------------------------------------
    // 11. Find KYC record
    // -----------------------------------------

    const userObjectId =
      new Types.ObjectId(user.id);

    let kyc = await KYC.findOne({
      userId: userObjectId,
    });

    // -----------------------------------------
    // 12. Create KYC if not exists
    // -----------------------------------------

    if (!kyc) {
      console.log(
        "KYC record not found. Creating..."
      );

      kyc = await KYC.create({
        userId: userObjectId,

        identityStatus: "not_started",

        addressStatus: "not_started",

        overallStatus: "not_started",
      });
    }

    console.log(
      "Current address status:",
      kyc.addressStatus
    );

    // -----------------------------------------
    // 13. Prevent duplicate pending upload
    // -----------------------------------------

    if (
      kyc.addressStatus === "pending"
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Your address document is already under review",
        },
        { status: 409 }
      );
    }

    // -----------------------------------------
    // 14. Prevent upload after approval
    // -----------------------------------------

    if (
      kyc.addressStatus === "approved"
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Your address verification is already approved",
        },
        { status: 409 }
      );
    }

    // -----------------------------------------
    // 15. Convert File to Buffer
    // -----------------------------------------

    console.log(
      "Converting address document..."
    );

    const arrayBuffer =
      await file.arrayBuffer();

    const buffer =
      Buffer.from(arrayBuffer);

    // -----------------------------------------
    // 16. Generate unique filename
    // -----------------------------------------

    const extension =
      getFileExtension(
        file.name,
        file.type
      );

    const uniqueFileName =
      `address-${crypto.randomUUID()}${extension}`;

    console.log(
      "ImageKit filename:",
      uniqueFileName
    );

    // -----------------------------------------
    // 17. Upload to ImageKit
    // -----------------------------------------

    console.log(
      "Uploading address document to ImageKit..."
    );

    const uploadResponse =
      await imagekit.files.upload({
        file: buffer.toString("base64"),

        fileName: uniqueFileName,

        folder: "/kyc/address",

        useUniqueFileName: false,

        isPrivateFile: true,
      });

    console.log(
      "ImageKit upload successful"
    );

    // -----------------------------------------
    // 18. Validate ImageKit response
    // -----------------------------------------

    if (
      !uploadResponse.fileId ||
      !uploadResponse.filePath
    ) {
      console.error(
        "Invalid ImageKit response:",
        uploadResponse
      );

      return NextResponse.json(
        {
          success: false,
          message:
            "Document storage failed",
        },
        { status: 500 }
      );
    }

    // -----------------------------------------
    // 19. Save address document
    // -----------------------------------------

    kyc.addressDocument = {
      fileName: file.name,

      fileType: file.type,

      fileSize: file.size,

      imageKitFileId:
        uploadResponse.fileId,

      imageKitFilePath:
        uploadResponse.filePath,
    };

    // -----------------------------------------
    // 20. Update address status
    // -----------------------------------------

    kyc.addressStatus =
      "pending";

    // -----------------------------------------
    // 21. Update overall status
    // -----------------------------------------

    /*
      If either identity or address
      is pending, overall KYC remains pending.
    */

    if (
      kyc.identityStatus === "pending" ||
      kyc.addressStatus === "pending"
    ) {
      kyc.overallStatus =
        "pending";
    }

    // -----------------------------------------
    // 22. Submission date
    // -----------------------------------------

    kyc.submittedAt =
      new Date();

    // -----------------------------------------
    // 23. Clear previous rejection
    // -----------------------------------------

    kyc.rejectionReason =
      undefined;

    kyc.reviewedAt =
      undefined;

    // -----------------------------------------
    // 24. Save MongoDB
    // -----------------------------------------

    console.log(
      "Saving address KYC data..."
    );

    await kyc.save();

    console.log(
      "Address KYC data saved successfully"
    );

    // -----------------------------------------
    // 25. Success response
    // -----------------------------------------

    return NextResponse.json(
      {
        success: true,

        message:
          "Address document submitted successfully",

        kyc: {
          id: kyc._id,

          identityStatus:
            kyc.identityStatus,

          addressStatus:
            kyc.addressStatus,

          overallStatus:
            kyc.overallStatus,

          addressDocument: {
            fileName:
              kyc.addressDocument
                ?.fileName,

            fileType:
              kyc.addressDocument
                ?.fileType,

            fileSize:
              kyc.addressDocument
                ?.fileSize,
          },

          submittedAt:
            kyc.submittedAt,
        },
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error(
      "================================="
    );

    console.error(
      "POST KYC ADDRESS DOCUMENT ERROR:"
    );

    console.error(error);

    console.error(
      "================================="
    );

    return NextResponse.json(
      {
        success: false,

        message:
          error instanceof Error
            ? error.message
            : "Unable to upload address document",
      },
      {
        status: 500,
      }
    );
  }
}

// -----------------------------------------
// Helper: Get File Extension
// -----------------------------------------

function getFileExtension(
  fileName: string,
  mimeType: string
): string {
  const extension =
    fileName
      .split(".")
      .pop()
      ?.toLowerCase();

  if (
    extension === "jpg" ||
    extension === "jpeg" ||
    extension === "png" ||
    extension === "pdf"
  ) {
    return `.${extension}`;
  }

  switch (mimeType) {
    case "image/jpeg":
      return ".jpg";

    case "image/png":
      return ".png";

    case "application/pdf":
      return ".pdf";

    default:
      return "";
  }
}