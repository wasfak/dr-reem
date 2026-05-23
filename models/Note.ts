import {
  Schema,
  model,
  models,
  type InferSchemaType,
  type Model,
} from "mongoose";

const AmountChangeSchema = new Schema(
  {
    previousAmount: { type: Number, required: true },
    newAmount: { type: Number, required: true },
    previousPaid: { type: Number, required: true },
    newPaid: { type: Number, required: true },
    userId: { type: String, required: true },
    userName: { type: String, required: true },
    changedAt: { type: Date, default: Date.now },
  },
  { _id: true },
);

const NoteSchema = new Schema(
  {
    companyId: {
      type: Schema.Types.ObjectId,
      ref: "Company",
      required: true,
      index: true,
    },
    text: { type: String, required: true, trim: true },
    amount: { type: Number, default: 0, min: 0 },
    amountPaid: { type: Number, default: 0, min: 0 },
    status: {
      type: String,
      enum: ["unpaid", "partial", "paid"],
      default: "unpaid",
    },
    amountHistory: { type: [AmountChangeSchema], default: [] },
    userId: { type: String, required: true },
    userName: { type: String, required: true },
  },
  { timestamps: true },
);

NoteSchema.pre("save", function () {
  if (this.amount <= 0) {
    this.status = "unpaid";
    return;
  }
  if (this.amountPaid <= 0) this.status = "unpaid";
  else if (this.amountPaid >= this.amount) this.status = "paid";
  else this.status = "partial";
});

NoteSchema.index({ companyId: 1, createdAt: -1 });

export type NoteDoc = InferSchemaType<typeof NoteSchema>;
export const Note: Model<NoteDoc> =
  (models.Note as Model<NoteDoc>) || model<NoteDoc>("Note", NoteSchema);
