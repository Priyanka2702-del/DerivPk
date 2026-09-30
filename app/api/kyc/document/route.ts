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
    console.log("KYC DOCUMENT UPLOAD STARTED");
    console.log("=================================");

    // --------------------------------------------------
    // 1. Database connection
    // --------------------------------------------------

    await connectDB();

    console.log("MongoDB connection: OK");

    // --------------------------------------------------
    // 2. Authentication
    // --------------------------------------------------

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

    console.log("Authenticated user:", user.id);

    // --------------------------------------------------
    // 3. Validate User ID
    // --------------------------------------------------

    if (!user.id || !Types.ObjectId.isValid(user.id)) {
      console.error("Invalid user ID:", user.id);

      return NextResponse.json(
        {
          success: false,
          message: "Invalid user ID",
        },
        { status: 401 }
      );
    }

    // --------------------------------------------------
    // 4. Validate Content-Type
    // --------------------------------------------------

    const contentType =
      request.headers.get("content-type");

    console.log("Request Content-Type:", contentType);

    if (
      !contentType?.includes("multipart/form-data")
    ) {
      console.log(
        "Invalid Content-Type. Expected multipart/form-data"
      );

      return NextResponse.json(
        {
          success: false,
          message:
            "Request must use multipart/form-data",
        },
        { status: 400 }
      );
    }

    // --------------------------------------------------
    // 5. Read FormData
    // --------------------------------------------------

    const formData = await request.formData();

    console.log("FormData received");

    // --------------------------------------------------
    // 6. Diagnostic logging
    // --------------------------------------------------

    console.log("========== FORM DATA ==========");

    for (const [key, value] of formData.entries()) {
      if (value instanceof File) {
        console.log("FIELD:", key);
        console.log("FILE NAME:", value.name);
        console.log("FILE TYPE:", value.type);
        console.log("FILE SIZE:", value.size);
      } else {
        console.log("FIELD:", key);
        console.log("VALUE:", value);
      }
    }

    console.log("===============================");

    // --------------------------------------------------
    // 7. Get document file
    // --------------------------------------------------

    const file = formData.get("document");

    console.log("DOCUMENT FIELD:", file);

    if (!(file instanceof File)) {
      console.log(
        "ERROR: document field is missing or is not a File"
      );

      return NextResponse.json(
        {
          success: false,
          message: "Identity document is required",
        },
        { status: 400 }
      );
    }

    // --------------------------------------------------
    // 8. Validate empty file
    // --------------------------------------------------

    if (file.size === 0) {
      console.log("ERROR: Uploaded file is empty");

      return NextResponse.json(
        {
          success: false,
          message: "Uploaded file is empty",
        },
        { status: 400 }
      );
    }

    // --------------------------------------------------
    // 9. Validate file size
    // --------------------------------------------------

    if (file.size > MAX_FILE_SIZE) {
      console.log(
        "ERROR: File exceeds 10MB:",
        file.size
      );

      return NextResponse.json(
        {
          success: false,
          message:
            "File size must not exceed 10MB",
        },
        { status: 400 }
      );
    }

    // --------------------------------------------------
    // 10. Validate file type
    // --------------------------------------------------

    console.log("Uploaded file type:", file.type);

    if (!ALLOWED_TYPES.includes(file.type)) {
      console.log(
        "ERROR: Invalid file type:",
        file.type
      );

      return NextResponse.json(
        {
          success: false,
          message:
            "Invalid file type. Only JPG, PNG and PDF files are allowed",
        },
        { status: 400 }
      );
    }

    // --------------------------------------------------
    // 11. Find/Create KYC record
    // --------------------------------------------------

    const userObjectId =
      new Types.ObjectId(user.id);

    let kyc = await KYC.findOne({
      userId: userObjectId,
    });

    if (!kyc) {
      console.log(
        "No KYC record found. Creating new record."
      );

      kyc = await KYC.create({
        userId: userObjectId,

        identityStatus: "not_started",

        addressStatus: "not_started",

        overallStatus: "not_started",
      });
    }

    console.log(
      "Current KYC identity status:",
      kyc.identityStatus
    );

    // --------------------------------------------------
    // 12. Prevent duplicate pending submission
    // --------------------------------------------------

    if (kyc.identityStatus === "pending") {
      return NextResponse.json(
        {
          success: false,
          message:
            "Your identity document is already under review",
        },
        { status: 409 }
      );
    }

    // --------------------------------------------------
    // 13. Prevent upload after approval
    // --------------------------------------------------

    if (kyc.identityStatus === "approved") {
      return NextResponse.json(
        {
          success: false,
          message:
            "Your identity verification is already approved",
        },
        { status: 409 }
      );
    }

    // --------------------------------------------------
    // 14. Convert File to Buffer
    // --------------------------------------------------

    console.log("Converting file to buffer...");

    const arrayBuffer =
      await file.arrayBuffer();

    const buffer =
      Buffer.from(arrayBuffer);

    console.log(
      "Buffer created successfully:",
      buffer.length
    );

    // --------------------------------------------------
    // 15. Generate unique filename
    // --------------------------------------------------

    const extension =
      getFileExtension(
        file.name,
        file.type
      );

    const uniqueFileName =
      `identity-${crypto.randomUUID()}${extension}`;

    console.log(
      "ImageKit filename:",
      uniqueFileName
    );

    // --------------------------------------------------
    // 16. Upload to ImageKit
    // --------------------------------------------------

    console.log(
      "Uploading document to ImageKit..."
    );

    const uploadResponse =
      await imagekit.files.upload({
        file: buffer.toString("base64"),

        fileName: uniqueFileName,

        folder: "/kyc/identity",

        useUniqueFileName: false,

        isPrivateFile: true,
      });

    console.log(
      "ImageKit upload response:",
      uploadResponse
    );

    // --------------------------------------------------
    // 17. Validate ImageKit response
    // --------------------------------------------------

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

    // --------------------------------------------------
    // 18. Update KYC document information
    // --------------------------------------------------

    kyc.identityDocument = {
      fileName: file.name,

      fileType: file.type,

      fileSize: file.size,

      imageKitFileId:
        uploadResponse.fileId,

      imageKitFilePath:
        uploadResponse.filePath,
    };

    // --------------------------------------------------
    // 19. Update verification status
    // --------------------------------------------------

    kyc.identityStatus =
      "pending";

    kyc.overallStatus =
      "pending";

    kyc.submittedAt =
      new Date();

    kyc.rejectionReason =
      undefined;

    kyc.reviewedAt =
      undefined;

    // --------------------------------------------------
    // 20. Save KYC record
    // --------------------------------------------------

    console.log(
      "Saving KYC record to MongoDB..."
    );

    await kyc.save();

    console.log(
      "KYC record saved successfully"
    );

    // --------------------------------------------------
    // 21. Success response
    // --------------------------------------------------

    return NextResponse.json(
      {
        success: true,

        message:
          "Identity document submitted successfully",

        kyc: {
          id: kyc._id,

          identityStatus:
            kyc.identityStatus,

          addressStatus:
            kyc.addressStatus,

          overallStatus:
            kyc.overallStatus,

          identityDocument: {
            fileName:
              kyc.identityDocument
                ?.fileName,

            fileType:
              kyc.identityDocument
                ?.fileType,

            fileSize:
              kyc.identityDocument
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
      "POST KYC DOCUMENT ERROR:"
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
            : "Unable to upload identity document",
      },
      {
        status: 500,
      }
    );
  }
}

// --------------------------------------------------
// Helper: Get File Extension
// --------------------------------------------------

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