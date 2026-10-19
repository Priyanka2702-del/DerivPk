import mongoose, { Schema, Model } from "mongoose";

export interface IWalletLedger {
  userId: mongoose.Types.ObjectId;
  paymentId: mongoose.Types.ObjectId;
  type: "CREDIT";
  amountCents: number;
  currency: "USD";
  description: string;
  createdAt?: Date;
}

const WalletLedgerSchema = new Schema<IWalletLedger>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    paymentId: {
      type: Schema.Types.ObjectId,
      ref: "Payment",
      required: true,
      unique: true,
    },
    type: {
      type: String,
      enum: ["CREDIT"],
      default: "CREDIT",
      required: true,
    },
    amountCents: {
      type: Number,
      required: true,
      min: 1,
      validate: {
        validator: Number.isSafeInteger,
        message: "Amount must be an integer number of cents.",
      },
    },
    currency: {
      type: String,
      enum: ["USD"],
      default: "USD",
      required: true,
    },
    description: {
      type: String,
      required: true,
      maxlength: 200,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

WalletLedgerSchema.index({ userId: 1, createdAt: -1 });

const WalletLedger: Model<IWalletLedger> =
  mongoose.models.WalletLedger ||
  mongoose.model<IWalletLedger>(
    "WalletLedger",
    WalletLedgerSchema
  );

export default WalletLedger;
