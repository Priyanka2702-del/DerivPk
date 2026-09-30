import mongoose, { Schema, Model, Types } from "mongoose";

export interface ISession {
  userId: Types.ObjectId;
  tokenHash: string;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const SessionSchema = new Schema<ISession>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    tokenHash: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    expiresAt: {
      type: Date,
      required: true,
      
    },
  },
  {
    timestamps: true,
  }
);

// MongoDB automatically removes expired sessions.
SessionSchema.index(
  { expiresAt: 1 },
  { expireAfterSeconds: 0 }
);

const Session: Model<ISession> =
  mongoose.models.Session ||
  mongoose.model<ISession>("Session", SessionSchema);

export default Session;