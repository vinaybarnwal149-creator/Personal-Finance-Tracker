import mongoose from 'mongoose';
import { toDecimalAmount } from '../utils/money.js';

const budgetSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      default: null,
    },
    month: {
      type: String,
      required: [true, 'Month is required (YYYY-MM)'],
      match: [/^\d{4}-(0[1-9]|1[0-2])$/, 'Month must be in YYYY-MM format'],
    },
    limitMinor: {
      type: Number,
      required: [true, 'Budget limit is required'],
      min: [1, 'Limit must be greater than zero'],
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (doc, ret) => {
        ret.id = ret._id.toString();
        ret.limit = toDecimalAmount(ret.limitMinor);
        delete ret._id;
        delete ret.__v;
        delete ret.limitMinor;
        return ret;
      },
    },
  }
);

budgetSchema.index({ user: 1, month: 1, category: 1 }, { unique: true });

export const Budget = mongoose.model('Budget', budgetSchema);
