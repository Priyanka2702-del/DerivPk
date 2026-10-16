import mongoose, { Schema, Model } from "mongoose";

export type InternalAccountStatus = "ACTIVE" | "SUSPENDED";

export interface IRealTradingAccount {
  userId: mongoose.Types.ObjectId;
  accountLabel: string;
  status: InternalAccountStatus;
  createdAt?: Date;
  updatedAt?: Date;
}

const RealTradingAccountSchema =
  new Schema<IRealTradingAccount>(
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
    },
    { timestamps: true }
  );

const RealTradingAccount: Model<IRealTradingAccount> =
  (mongoose.models.RealTradingAccount as
    Model<IRealTradingAccount>) ||
  mongoose.model<IRealTradingAccount>(
    "RealTradingAccount",
    RealTradingAccountSchema
  );

export default RealTradingAccount;
