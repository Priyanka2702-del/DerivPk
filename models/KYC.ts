import mongoose, {
  Schema,
  Model,
  Types,
} from "mongoose";

export type KYCStatus =
  | "not_started"
  | "pending"
  | "approved"
  | "rejected";

export interface IKYC {
  userId: Types.ObjectId;

  identityStatus: KYCStatus;
  addressStatus: KYCStatus;
  overallStatus: KYCStatus;

  identityDocument?: {
    fileName?: string;
    fileType?: string;
    fileSize?: number;
    imageKitFileId?: string;
    imageKitFilePath?: string;
  };

  addressDocument?: {
    fileName?: string;
    fileType?: string;
    fileSize?: number;
    imageKitFileId?: string;
    imageKitFilePath?: string;
  };

  rejectionReason?: string;

  submittedAt?: Date;
  reviewedAt?: Date;

  createdAt: Date;
  updatedAt: Date;
}

const DocumentSchema = new Schema(
  {
    fileName: {
      type: String,
      required: false,
    },

    fileType: {
      type: String,
      required: false,
    },

    fileSize: {
      type: Number,
      required: false,
    },

    imageKitFileId: {
      type: String,
      required: false,
    },

    imageKitFilePath: {
      type: String,
      required: false,
    },
  },
  {
    _id: false,
  }
);

const KYCSchema = new Schema<IKYC>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },

    identityStatus: {
      type: String,
      enum: [
        "not_started",
        "pending",
        "approved",
        "rejected",
      ],
      default: "not_started",
    },

    addressStatus: {
      type: String,
      enum: [
        "not_started",
        "pending",
        "approved",
        "rejected",
      ],
      default: "not_started",
    },

    overallStatus: {
      type: String,
      enum: [
        "not_started",
        "pending",
        "approved",
        "rejected",
      ],
      default: "not_started",
    },

    identityDocument: {
      type: DocumentSchema,
      required: false,
    },

    addressDocument: {
      type: DocumentSchema,
      required: false,
    },

    rejectionReason: {
      type: String,
      required: false,
      maxlength: 1000,
    },

    submittedAt: {
      type: Date,
      required: false,
    },

    reviewedAt: {
      type: Date,
      required: false,
    },
  },

  {
    timestamps: true,
  }
);

const KYC: Model<IKYC> =
  mongoose.models.KYC ||
  mongoose.model<IKYC>("KYC", KYCSchema);

export default KYC;