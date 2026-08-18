import mongoose, { Schema, model, models } from "mongoose";

export interface IVoucherScan {
  _id: string;
  voucherId: string;
  customerId: string;
  scannedAt: Date;
  userAgent?: string;
}

const VoucherScanSchema = new Schema<IVoucherScan>({
  voucherId: { type: String, required: true, index: true },
  customerId: { type: String, required: true, index: true },
  scannedAt: { type: Date, default: Date.now },
  userAgent: { type: String },
});

export const VoucherScan =
  (models.VoucherScan as mongoose.Model<IVoucherScan>) ||
  model<IVoucherScan>("VoucherScan", VoucherScanSchema);