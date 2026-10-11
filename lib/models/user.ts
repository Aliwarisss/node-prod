import mongoose, { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

export const PAYMENT_STATUSES = ["unpaid", "paid"] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

const userSchema = new Schema(
  {
    name: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    /* empty until the person sets a password (accounts an admin adds start without one) */
    passwordHash: {
      type: String,
      default: "",
    },
    /* true for accounts an admin added: the person creates their password at first sign-in */
    passwordSetupRequired: {
      type: Boolean,
      default: false,
    },
    role: {
      type: String,
      default: "student",
      trim: true,
    },
    /* fees are cash on delivery: an admin marks the account paid once the fee is received */
    paymentStatus: {
      type: String,
      enum: PAYMENT_STATUSES,
      default: "unpaid",
    },
    paidAt: {
      type: Date,
    },
    paymentMarkedBy: {
      type: String,
      trim: true,
    },
    invitedBy: {
      type: String,
      trim: true,
    },
    /* referrals: their own code to share, and who referred them (a user id) */
    referralCode: {
      type: String,
      trim: true,
      uppercase: true,
      unique: true,
      sparse: true,
    },
    referredBy: {
      type: String,
      trim: true,
      index: true,
    },
    /* friends who had joined when they paid (those came off the fee) — friends after that earn cash back */
    paidJoined: {
      type: Number,
      default: 0,
    },
    cashbackPaid: {
      type: Number,
      default: 0,
    },
    /* the fee, paid in parts: every payment an admin records (the balance is the fee less these) */
    payments: {
      type: [{ amount: Number, at: Date, method: String, note: String, by: String }],
      default: [],
    },
    /* each cash back hand-over, for the admin's referral history */
    cashbackLog: {
      type: [{ amount: Number, at: Date, by: String, _id: false }],
      default: [],
    },
    primaryTrack: {
      type: String,
      trim: true,
    },
    bio: {
      type: String,
      trim: true,
      default: "",
    },
    experienceLevel: {
      type: String,
      trim: true,
      default: "",
    },
    weeklyHours: {
      type: String,
      trim: true,
      default: "",
    },
    timezone: {
      type: String,
      trim: true,
      default: "",
    },
    learningGoal: {
      type: String,
      trim: true,
      default: "",
    },
    /* contact, set in the onboarding or the profile */
    phone: { type: String, trim: true, default: "" },
    linkedin: { type: String, trim: true, default: "" },
    /* for the program: their AI tools, the computer they'll build on, when live sessions suit them */
    aiTools: { type: [String], default: [] },
    device: { type: String, trim: true, default: "" },
    sessionTimes: { type: [String], default: [] },
    /* for Explore: the role they're aiming for (a role id) and the fields that interest them (domain ids) */
    targetRole: { type: String, trim: true, default: "" },
    interests: { type: [String], default: [] },
    /* the one signed-in session (one device and browser at a time): its id, the browser's device id, when it was last
       used (it holds the account until it's idle), and where it is — for the message a refused sign-in shows */
    activeSid: { type: String },
    activeDid: { type: String },
    activeSeenAt: { type: Date },
    activeAgent: { type: String },
    lastLoginAt: { type: Date },
    /* set when an admin signs the account out everywhere — older tokens without a session id stop working too */
    sessionsRevokedAt: { type: Date },
    onboardingCompleted: {
      type: Boolean,
      default: false,
    },
    onboardingSkipped: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

export type UserDocument = InferSchemaType<typeof userSchema> & {
  _id: Schema.Types.ObjectId;
};

/* in dev the model survives hot reloads with its old schema — rebuild it when the schema has changed */
if (models.User && !models.User.schema.path("activeSeenAt")) {
  mongoose.deleteModel("User");
}

export const UserModel =
  (models.User as Model<UserDocument> | undefined) ??
  model<UserDocument>("User", userSchema);

/* admins never pay; everyone else needs an admin to mark their fee as received */
export const hasAccess = (u: { role?: string | null; paymentStatus?: string | null }) =>
  u.role === "admin" || u.paymentStatus === "paid";
