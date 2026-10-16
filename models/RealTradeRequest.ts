import mongoose, { Schema, Model } from "mongoose";

export type RealTradeSide = "BUY" | "SELL";
export type RealTradeOrderType = "MARKET" | "LIMIT";
export type RealTradeStatus =
  | "PENDING_REVIEW"
  | "APPROVED"
  | "REJECTED";
export type RealTradePaymentStatus = "NOT_INTEGRATED";

export interface IRealTradeRequest {
  userId: mongoose.Types.ObjectId;
  accountId: mongoose.Types.ObjectId;
  symbol: string;
  side: RealTradeSide;
  orderType: RealTradeOrderType;
  quantity: number;
  amount: number;
  limitPrice?: number;
  notes?: string;
  status: RealTradeStatus;
  paymentStatus: RealTradePaymentStatus;
  adminDecisionBy?: mongoose.Types.ObjectId;
  adminDecisionAt?: Date;
  adminNote?: string;
  rejectionReason?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const RealTradeRequestSchema =
  new Schema<IRealTradeRequest>(
    {
      userId: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true,
      },
      accountId: {
        type: Schema.Types.ObjectId,
        ref: "RealTradingAccount",
        required: true,
        index: true,
      },
      symbol: {
        type: String,
        required: true,
        trim: true,
        uppercase: true,
        minlength: 1,
        maxlength: 20,
      },
      side: {
        type: String,
        enum: ["BUY", "SELL"],
        required: true,
      },
      orderType: {
        type: String,
        enum: ["MARKET", "LIMIT"],
        required: true,
      },
      quantity: {
        type: Number,
        required: true,
        min: 0.000001,
        validate: {
          validator: (value: number) =>
            Number.isFinite(value),
          message: "Quantity must be a finite number.",
        },
      },
      amount: {
        type: Number,
        required: true,
        min: 0.01,
        max: 1000000000,
        validate: {
          validator: (value: number) =>
            Number.isFinite(value),
          message: "Amount must be a finite number.",
        },
      },
      limitPrice: {
        type: Number,
        min: 0.000001,
        validate: {
          validator: (value: number | undefined) =>
            value === undefined ||
            Number.isFinite(value),
          message: "Limit price must be a finite number.",
        },
      },
      notes: {
        type: String,
        trim: true,
        maxlength: 500,
      },
      status: {
        type: String,
        enum: [
          "PENDING_REVIEW",
          "APPROVED",
          "REJECTED",
        ],
        default: "PENDING_REVIEW",
        required: true,
        index: true,
      },
      paymentStatus: {
        type: String,
        enum: ["NOT_INTEGRATED"],
        default: "NOT_INTEGRATED",
        required: true,
      },
      adminDecisionBy: {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
      adminDecisionAt: Date,
      adminNote: {
        type: String,
        trim: true,
        maxlength: 1000,
      },
      rejectionReason: {
        type: String,
        trim: true,
        maxlength: 1000,
      },
    },
    { timestamps: true }
  );

RealTradeRequestSchema.index({
  userId: 1,
  createdAt: -1,
});

RealTradeRequestSchema.index({
  status: 1,
  createdAt: -1,
});

const RealTradeRequest: Model<IRealTradeRequest> =
  (mongoose.models.RealTradeRequest as
    Model<IRealTradeRequest>) ||
  mongoose.model<IRealTradeRequest>(
    "RealTradeRequest",
    RealTradeRequestSchema
  );

export default RealTradeRequest;
