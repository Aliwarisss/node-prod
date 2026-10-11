import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

/* A trainee's certificate: issued once, when they've finished the program and claimed it with the name they want on it.
   The number is public — it's how anyone checks a certificate is real (/certificate/<number>). */
const certificateSchema = new Schema(
  {
    userId: { type: String, required: true, unique: true },
    number: { type: String, required: true, unique: true },
    name: { type: String, required: true, trim: true },
    program: { type: String, required: true },
    issuedAt: { type: Date, required: true },
    revokedAt: { type: Date },
  },
  { versionKey: false },
);

export type CertificateDocument = InferSchemaType<typeof certificateSchema>;
export const CertificateModel = (models.Certificate as Model<CertificateDocument> | undefined) ?? model<CertificateDocument>("Certificate", certificateSchema);
