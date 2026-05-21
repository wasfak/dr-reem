import { Schema, model, models, type InferSchemaType } from "mongoose";

const NoteSchema = new Schema(
  {
    companyId: {
      type: Schema.Types.ObjectId,
      ref: "Company",
      required: true,
      index: true,
    },
    text: { type: String, required: true, trim: true },
    amount: { type: Number, default: 0, min: 0 }, // 0 = no money attached
    amountPaid: { type: Number, default: 0, min: 0 },
    status: {
      type: String,
      enum: ["unpaid", "partial", "paid"],
      default: "unpaid",
    },
    userId: { type: String, required: true },
    userName: { type: String, required: true },
  },
  { timestamps: true },
);

// Derive status from amounts before saving so it's never out of sync.
NoteSchema.pre("save", function () {
  if (this.amount <= 0) {
    this.status = "unpaid"; // no money = N/A, treat as unpaid
    return;
  }
  if (this.amountPaid <= 0) this.status = "unpaid";
  else if (this.amountPaid >= this.amount) this.status = "paid";
  else this.status = "partial";
});

NoteSchema.virtual("outstanding").get(function () {
  return Math.max((this.amount ?? 0) - (this.amountPaid ?? 0), 0);
});

NoteSchema.index({ companyId: 1, createdAt: -1 });

export type NoteDoc = InferSchemaType<typeof NoteSchema>;
export const Note = models.Note || model("Note", NoteSchema);
