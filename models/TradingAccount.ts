
import mongoose, {
  Document,
  Model,
  Schema,
} from "mongoose";

export interface ITradingAccount extends Document {
  userId: mongoose.Types.ObjectId;

  provider: "alpaca";

  providerAccountId: string;

  accountType: "paper" | "live";

  status: string;

  createdAt?: Date;

  updatedAt?: Date;
}

const TradingAccountSchema = new Schema<ITradingAccount>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    provider: {
      type: String,
      enum: ["alpaca"],
      required: true,
      default: "alpaca",
    },

    providerAccountId: {
      type: String,
      required: true,
      index: true,
    },

    accountType: {
      type: String,
      enum: ["paper", "live"],
      required: true,
    },

    status: {
      type: String,
      default: "SUBMITTED",
    },
  },
  {
    timestamps: true,
  }
);

const TradingAccount: Model<ITradingAccount> =
  (mongoose.models.TradingAccount as Model<ITradingAccount>) ||
  mongoose.model<ITradingAccount>(
    "TradingAccount",
    TradingAccountSchema
  );

export default TradingAccount