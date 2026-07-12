import { Schema, model, models, type InferSchemaType } from 'mongoose';

const CounterSchema = new Schema(
  {
    _id: {
      type: String,
      required: true,
    },
    sequence: {
      type: Number,
      required: true,
      default: 0,
    },
  },
  {
    timestamps: true,
    collection: 'counters',
  },
);

export type CounterDocument = InferSchemaType<typeof CounterSchema> & {
  _id: string;
};

export const CounterModel = models.Counter || model('Counter', CounterSchema);
