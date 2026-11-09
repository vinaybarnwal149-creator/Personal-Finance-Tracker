import mongoose from 'mongoose';
import { toDecimalAmount } from '../utils/money.js';

const transactionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['income', 'expense'],
      required: [true, 'Transaction type is required'],
    },
    amountMinor: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [1, 'Amount must be greater than zero'],
      max: [99999999999, 'Amount exceeds maximum allowed limit'],
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'Category is required'],
    },
    date: {
      type: Date,
      required: [true, 'Date is required'],
    },
    note: {
      type: String,
      maxlength: [500, 'Note cannot exceed 500 characters'],
      trim: true,
      default: '',
    },
    paymentMethod: {
      type: String,
      enum: ['cash', 'card', 'bank_transfer', 'digital_wallet', 'other'],
      default: 'card',
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (doc, ret) => {
        ret.id = ret._id.toString();
        ret.amount = toDecimalAmount(ret.amountMinor);
        delete ret._id;
        delete ret.__v;
        delete ret.amountMinor;
        return ret;
      },
    },
  }
);

transactionSchema.index({ user: 1, date: -1 });
transactionSchema.index({ user: 1, type: 1, date: -1 });
transactionSchema.index({ user: 1, category: 1, date: -1 });

export const Transaction = mongoose.model('Transaction', transactionSchema);
