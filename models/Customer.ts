import mongoose, { Schema, model, models } from "mongoose";

export interface ICustomer {
  _id: string;
  fullName: string;
  whatsappNumber: string;
  address: string;
  pincode: string;
  voucherId: string; // e.g. "#egold-00001"
  voucherSequence: number; // e.g. 1
  deliveryStatus: "sent" | "failed" | "pending";
  deliveryError?: string;
  createdAt: Date;
  updatedAt: Date;
}

const CustomerSchema = new Schema<ICustomer>(
  {
    fullName: { type: String, required: true, trim: true },
    whatsappNumber: { type: String, required: true, trim: true, index: true },
    address: { type: String, required: true, trim: true },
    pincode: { type: String, required: true, trim: true },
    voucherId: { type: String, required: true, unique: true, index: true },
    voucherSequence: { type: Number, required: true },
    deliveryStatus: {
      type: String,
      enum: ["sent", "failed", "pending"],
      default: "pending",
    },
    deliveryError: { type: String },
  },
  { timestamps: true }
);

export const Customer =
  (models.Customer as mongoose.Model<ICustomer>) ||
  model<ICustomer>("Customer", CustomerSchema);
