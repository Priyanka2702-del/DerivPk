import mongoose, {
  Schema,
  Model,
  Types,
} from "mongoose";

export interface IDerivConnection {
  userId: Types.ObjectId;

  accessTokenEncrypted: string;

  tokenType: string;

  expiresAt: Date;

  scopes: string[];

  createdAt: Date;

  updatedAt: Date;
}

const DerivConnectionSchema =
  new Schema<IDerivConnection>(
    {
      userId: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
        unique: true,
        index: true,
      },

      accessTokenEncrypted: {
        type: String,
        required: true,
      },

      tokenType: {
        type: String,
        default: "Bearer",
      },

      expiresAt: {
        type: Date,
        required: true,
      },

      scopes: {
        type: [String],
        default: [],
      },
    },
    {
      timestamps: true,
    }
  );

const DerivConnection: Model<IDerivConnection> =
  mongoose.models.DerivConnection ||
  mongoose.model<IDerivConnection>(
    "DerivConnection",
    DerivConnectionSchema
  );

export default DerivConnection;