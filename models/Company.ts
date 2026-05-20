import mongoose, { Schema, model, models, type InferSchemaType } from "mongoose";

const DebtSchema = new Schema(
  {
    description: { type: String, trim: true },
    amount: { type: Number, required: true, min: 0 },
    amountPaid: { type: Number, default: 0, min: 0 },
    dueDate: { type: Date },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

DebtSchema.virtual("outstanding").get(function () {
  return Math.max(this.amount - this.amountPaid, 0);
});

DebtSchema.virtual("status").get(function () {
  if (this.amountPaid <= 0) return "unpaid";
  if (this.amountPaid >= this.amount) return "paid";
  return "partial";
});

const CompanySchema = new Schema(
  {
    name: { type: String, required: true, trim: true, unique: true },
    notes: { type: String, trim: true, default: "" },
    debts: { type: [DebtSchema], default: [] },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

CompanySchema.virtual("totalOutstanding").get(function () {
  return (this.debts ?? []).reduce(
    (sum, d) => sum + Math.max(d.amount - d.amountPaid, 0),
    0
  );
});

CompanySchema.index(
  { name: 1 },
  { unique: true, collation: { locale: "en", strength: 2 } }
);

export type CompanyDoc = InferSchemaType<typeof CompanySchema>;

export const Company = models.Company || model("Company", CompanySchema);