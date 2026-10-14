import mongoose, {
  Model,
  Schema,
  Types,
} from "mongoose";

export interface ITradingProfile {
  userId: Types.ObjectId;

  // Identity
  givenName: string;
  familyName: string;

  // Contact
  phoneNumber: string;

  // Personal information
  dateOfBirth: Date;

  // Address
  streetAddress: string[];
  city: string;
  state: string;
  postalCode: string;
  country: string;

  // Tax information
  taxId?: string;
  taxIdType?: string;
  countryOfTaxResidence?: string;

  // Employment / financial information
  employmentStatus: string;
  employerName?: string;
  occupation?: string;

  fundingSource: string[];

  riskTolerance:
    | "conservative"
    | "moderate"
    | "significant_risk";

  // Regulatory disclosures
  disclosures: {
    isControlPerson: boolean;
    isAffiliatedExchangeOrFinra: boolean;
    isPoliticallyExposed: boolean;
    immediateFamilyExposed: boolean;
  };

  agreementsAccepted: boolean;
  agreementsAcceptedAt?: Date;

  createdAt: Date;
  updatedAt: Date;
}

const TradingProfileSchema =
  new Schema<ITradingProfile>(
    {
      userId: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
        unique: true,
        index: true,
      },

      // Identity
      givenName: {
        type: String,
        required: true,
        trim: true,
        minlength: 1,
        maxlength: 100,
      },

      familyName: {
        type: String,
        required: true,
        trim: true,
        minlength: 1,
        maxlength: 100,
      },

      // Contact
      phoneNumber: {
        type: String,
        required: true,
        trim: true,
      },

      // Personal information
      dateOfBirth: {
        type: Date,
        required: true,
      },

      // Address
      streetAddress: {
        type: [String],
        required: true,
      },

      city: {
        type: String,
        required: true,
        trim: true,
      },

      state: {
        type: String,
        required: true,
        trim: true,
      },

      postalCode: {
        type: String,
        required: true,
        trim: true,
      },

      country: {
        type: String,
        required: true,
        trim: true,
      },

      // Tax information
      taxId: {
        type: String,
        required: false,
        select: false,
      },

      taxIdType: {
        type: String,
        required: false,
        trim: true,
      },

      countryOfTaxResidence: {
        type: String,
        required: false,
        trim: true,
      },

      // Employment / financial information
      employmentStatus: {
        type: String,
        required: true,
        trim: true,
      },

      employerName: {
        type: String,
        required: false,
        trim: true,
      },

      occupation: {
        type: String,
        required: false,
        trim: true,
      },

      fundingSource: {
        type: [String],
        required: true,
      },

      riskTolerance: {
        type: String,
        enum: [
          "conservative",
          "moderate",
          "significant_risk",
        ],
        required: true,
      },

      // Regulatory disclosures
      disclosures: {
        isControlPerson: {
          type: Boolean,
          required: true,
        },

        isAffiliatedExchangeOrFinra: {
          type: Boolean,
          required: true,
        },

        isPoliticallyExposed: {
          type: Boolean,
          required: true,
        },

        immediateFamilyExposed: {
          type: Boolean,
          required: true,
        },
      },

      agreementsAccepted: {
        type: Boolean,
        required: true,
        default: false,
      },

      agreementsAcceptedAt: {
        type: Date,
        required: false,
      },
    },
    {
      timestamps: true,
    }
  );

const TradingProfile: Model<ITradingProfile> =
  mongoose.models.TradingProfile ||
  mongoose.model<ITradingProfile>(
    "TradingProfile",
    TradingProfileSchema
  );

export default TradingProfile;

