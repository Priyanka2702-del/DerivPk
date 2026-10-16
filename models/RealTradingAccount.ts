import mongoose, { Schema, Model } from "mongoose";

export type InternalAccountStatus = "ACTIVE" | "SUSPENDED";

export interface IRealTradingAccount {
  userId: mongoose.Types.ObjectId;
  accountLabel: string;
  status: InternalAccountStatus;
  fullName?: string;
  email?: string;
  phone?: string;
  country?: string;
  consentAccepted?: boolean;
  consentAcceptedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

const RealTradingAccountSchema = new Schema<IRealTradingAccount>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },
    accountLabel: {
      type: String,
      required: true,
      default: "Internal Trade Request Account",
    },
    status: {
      type: String,
      enum: ["ACTIVE", "SUSPENDED"],
      default: "ACTIVE",
      required: true,
    },
    fullName: { type: String, trim: true },
    email: { type: String, trim: true, lowercase: true },
    phone: { type: String, trim: true },
    country: { type: String, trim: true },
    consentAccepted: { type: Boolean, default: false },
    consentAcceptedAt: { type: Date },
  },
  { timestamps: true }
);

const RealTradingAccount: Model<IRealTradingAccount> =
  (mongoose.models.RealTradingAccount as Model<IRealTradingAccount>) ||
  mongoose.model<IRealTradingAccount>(
    "RealTradingAccount",
    RealTradingAccountSchema
  );

export default RealTradingAccount;
