import mongoose, { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

/* One sign-in, or a refused attempt: where from (browser, system, IP, the browser's device id), when — and how it
   ended: signed out, replaced (this browser signing in again, or succeeding an expired session), refused because the
   account was in use on another device or browser, or signed out everywhere by an admin */
const loginEventSchema = new Schema(
  {
    userId: { type: String, required: true, index: true },
    sid: { type: String, required: true, unique: true },
    at: { type: Date, required: true },
    ip: { type: String, default: "" },
    ua: { type: String, default: "" },
    browser: { type: String, default: "" },
    os: { type: String, default: "" },
    device: { type: String, default: "" }, // desktop · mobile · tablet
    did: { type: String, default: "" },
    endedAt: { type: Date },
    endedReason: { type: String, enum: ["signout", "replaced", "blocked", "revoked"] },
  },
  { versionKey: false },
);
/* in dev the model survives hot reloads with its old schema — rebuild it when the schema has changed */
if (models.LoginEvent && !models.LoginEvent.schema.path("did")) mongoose.deleteModel("LoginEvent");

export type LoginEventDocument = InferSchemaType<typeof loginEventSchema>;
export const LoginEventModel = (models.LoginEvent as Model<LoginEventDocument> | undefined) ?? model<LoginEventDocument>("LoginEvent", loginEventSchema);
