import mongoose, { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

/* A file a trainee attaches to a document (a deck, a PDF, a Word file) — small, stored with the record */
export const MAX_UPLOAD = 5 * 1024 * 1024;
const uploadSchema = new Schema(
  {
    userId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    type: { type: String, default: "application/octet-stream" },
    size: { type: Number, required: true },
    data: { type: Buffer, required: true },
    public: { type: Boolean, default: false }, // shared on the feed: any signed-in member of the program can see it
  },
  { timestamps: true },
);

export type UploadDocument = InferSchemaType<typeof uploadSchema>;
if (models.Upload && !models.Upload.schema.path("public")) mongoose.deleteModel("Upload");
export const UploadModel = (models.Upload as Model<UploadDocument> | undefined) ?? model<UploadDocument>("Upload", uploadSchema);
