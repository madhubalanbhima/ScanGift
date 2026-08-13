import mongoose, { Schema, model, models } from "mongoose";

export interface ICounter {
  _id: string;
  seq: number;
}

const CounterSchema = new Schema<ICounter>({
  _id: { type: String, required: true },
  seq: { type: Number, default: 996 },
});

export const Counter =
  (models.Counter as mongoose.Model<ICounter>) ||
  model<ICounter>("Counter", CounterSchema);

/**
 * Atomically increments the named counter and returns the new value.
 * Safe under concurrent requests because findOneAndUpdate + $inc is atomic in MongoDB.
 */
export async function getNextSequence(name: string): Promise<number> {
  const result = await Counter.findOneAndUpdate(
    { _id: name },
    { $setOnInsert: { seq: 996 }, $inc: { seq: 5 } },
    { new: true, upsert: true }
  );
  return result.seq;
}
