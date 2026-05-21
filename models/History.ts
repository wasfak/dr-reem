import {
  Schema,
  model,
  models,
  type InferSchemaType,
  type Model,
} from "mongoose";

const HistorySchema = new Schema(
  {
    action: {
      type: String,
      required: true,
      enum: [
        "company_added",
        "company_deleted",
        "debt_added",
        "payment_recorded",
        "status_changed",
      ],
    },
    message: { type: String, required: true },
    companyId: { type: Schema.Types.ObjectId, ref: "Company" },
    companyName: { type: String, trim: true },
    amount: { type: Number },
    userId: { type: String, required: true },
    userName: { type: String, required: true },
  },
  { timestamps: true },
);

HistorySchema.index({ createdAt: -1 });
HistorySchema.index({ companyId: 1, createdAt: -1 });

export type HistoryDoc = InferSchemaType<typeof HistorySchema>;

export const History: Model<HistoryDoc> =
  (models.History as Model<HistoryDoc>) ||
  model<HistoryDoc>("History", HistorySchema);
