import mongoose, { Schema, model, models } from "mongoose";

export interface ICounter {
  _id: string;
  seq: number;
}

const STARTING_SEQUENCE = 1000;

const CounterSchema = new Schema<ICounter>({
  _id: { type: String, required: true },
  seq: { type: Number, default: STARTING_SEQUENCE },
});

export const Counter =
  (models.Counter as mongoose.Model<ICounter>) ||
  model<ICounter>("Counter", CounterSchema);

/**
 * Starts voucher numbers at 1001 and moves upward by 1 each time.
 * If an old counter document exists, reset it once so the numbering is clean.
 */
export async function getNextSequence(name: string): Promise<number> {
  const current = await Counter.findOne({ _id: name }).lean();
  const nextSequence = current ? current.seq + 5 : STARTING_SEQUENCE + 5;

  await Counter.findOneAndUpdate(
    { _id: name },
    { $set: { seq: nextSequence } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  return nextSequence;
}

export async function resetCounter(name: string, startAt = STARTING_SEQUENCE): Promise<number> {
  await Counter.deleteMany({ _id: name });
  const created = await Counter.create({ _id: name, seq: startAt });
  return created.seq;
}
