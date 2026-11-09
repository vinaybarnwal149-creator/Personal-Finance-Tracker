import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Category name is required'],
      trim: true,
      minlength: [1, 'Name must be at least 1 character'],
      maxlength: [40, 'Name cannot exceed 40 characters'],
    },
    nameLower: {
      type: String,
      lowercase: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ['income', 'expense'],
      required: [true, 'Category type is required'],
    },
    color: {
      type: String,
      default: '#6366F1',
      match: [/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Invalid hex color code'],
    },
    icon: {
      type: String,
      default: 'tag',
      trim: true,
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (doc, ret) => {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        delete ret.nameLower;
        return ret;
      },
    },
  }
);

categorySchema.pre('validate', function (next) {
  if (this.name) {
    this.nameLower = this.name.toLowerCase();
  }
  next();
});

categorySchema.index({ user: 1, type: 1, nameLower: 1 }, { unique: true });

export const Category = mongoose.model('Category', categorySchema);
