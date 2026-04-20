import mongoose, { Schema, Document } from 'mongoose';

export interface IReview {
  user: mongoose.Types.ObjectId;
  name: string;
  rating: number;
  comment: string;
  createdAt: Date;
}

export interface ISizePricing {
  size: string;
  price: number;
  comparePrice?: number;
}

export interface ISizeStock {
  size: string;
  quantity: number;
}

export interface IProduct extends Document {
  name: string;
  slug: string;
  description: string;
  price: number;
  comparePrice?: number;
  category: string;
  subcategory?: string;
  gender: 'men' | 'women' | 'unisex';
  brand: string;
  thumbnail: string;
  images: string[];
  stock: number;
  sizes: string[];
  sizePricing?: ISizePricing[];
  sizeStock?: ISizeStock[];
  colors: { name: string; hex: string }[];
  tags: string[];
  isFeatured: boolean;
  isActive: boolean;
  reviews: IReview[];
  ratings: number;
  numReviews: number;
  createdAt: Date;
}

const ReviewSchema = new Schema<IReview>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, required: true },
  },
  { timestamps: true }
);

const ProductSchema = new Schema<IProduct>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    description: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    comparePrice: { type: Number },
    category: { type: String, required: true },
    subcategory: { type: String },
    gender: { type: String, enum: ['men', 'women', 'unisex'], default: 'unisex' },
    brand: { type: String, required: true },
    thumbnail: { type: String, default: '' },
    images: [{ type: String }],
    stock: { type: Number, required: true, default: 0 },
    sizes: [{ type: String }],
    sizePricing: [{ 
      size: { type: String, required: true },
      price: { type: Number, required: true, min: 0 },
      comparePrice: { type: Number }
    }],
    sizeStock: [{
      size: { type: String, required: true },
      quantity: { type: Number, required: true, default: 0 }
    }],
    colors: [{ name: String, hex: String }],
    tags: [{ type: String }],
    isFeatured: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    reviews: [ReviewSchema],
    ratings: { type: Number, default: 0 },
    numReviews: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Index for search performance
ProductSchema.index({ name: 'text', description: 'text', brand: 'text', tags: 'text' });

// Indexes for filtering and sorting performance
ProductSchema.index({ category: 1, price: 1 });
ProductSchema.index({ category: 1, isActive: 1 });
ProductSchema.index({ gender: 1, isActive: 1 });
ProductSchema.index({ isFeatured: 1, isActive: 1 });
ProductSchema.index({ createdAt: -1 });
ProductSchema.index({ ratings: -1 });
// Note: slug already has an index created by unique: true constraint

export default mongoose.model<IProduct>('Product', ProductSchema);
