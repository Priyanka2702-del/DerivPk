
import mongoose, { Schema, Model } from "mongoose";

export type PaymentPurpose = "DEPOSIT" | "REAL_TRADE";

export type PaymentStatus =
  | "PENDING"
  | "COMPLETED"
  | "FAILED"
  | "EXPIRED"
  | "CANCELLED"
  | "AMOUNT_MISMATCH";

export type CryptoCurrency = "USDT" | "BTC" | "ETH";

export interface IPayment {
  userId: mongoose.Types.ObjectId;
  purpose: PaymentPurpose;
  amountCents: number;
  currency: "USD";
  status: PaymentStatus;
  provider: string;
  providerPaymentId?: string;
  providerOrderId?: string;
  checkoutUrl?: string;
  depositAddress?: string;
  cryptoCurrency?: CryptoCurrency;
  cryptoAmount?: string;
  txHash?: string;
  expiresAt?: Date;
  tradeRequestId?: mongoose.Types.ObjectId;
  creditedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

const PaymentSchema = new Schema<IPayment>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    purpose: {
      type: String,
      enum: ["DEPOSIT", "REAL_TRADE"],
      required: true,
    },
    amountCents: {
      type: Number,
      required: true,
      min: 1,
      max: 100000000000,
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
    status: {
      type: String,
      enum: [
        "PENDING",
        "COMPLETED",
        "FAILED",
        "EXPIRED",
        "CANCELLED",
        "AMOUNT_MISMATCH",
      ],
      default: "PENDING",
      required: true,
      index: true,
    },
    provider: {
      type: String,
      required: true,
      default: "UNCONFIGURED",
      maxlength: 50,
    },
    providerPaymentId: {
      type: String,
      trim: true,
      maxlength: 200,
    },
    providerOrderId: {
      type: String,
      trim: true,
      maxlength: 200,
    },
    checkoutUrl: {
      type: String,
      trim: true,
      maxlength: 2000,
    },
    depositAddress: {
      type: String,
      trim: true,
      maxlength: 300,
    },
    cryptoCurrency: {
      type: String,
      enum: ["USDT", "BTC", "ETH"],
    },
    cryptoAmount: {
      type: String,
      trim: true,
      maxlength: 100,
    },
    txHash: {
      type: String,
      trim: true,
      maxlength: 200,
    },
    expiresAt: Date,
    tradeRequestId: {
      type: Schema.Types.ObjectId,
      ref: "RealTradeRequest",
    },
    creditedAt: Date,
  },
  { timestamps: true }
);

PaymentSchema.index({ userId: 1, createdAt: -1 });

PaymentSchema.index(
  { provider: 1, providerPaymentId: 1 },
  {
    unique: true,
    partialFilterExpression: {
      providerPaymentId: { $type: "string" },
    },
  }
);

const Payment: Model<IPayment> =
  mongoose.models.Payment ||
  mongoose.model<IPayment>("Payment", PaymentSchema);

export default Payment;
