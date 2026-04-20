import mongoose, { Schema, Document } from 'mongoose';

export interface IOrderItem {
  product: mongoose.Types.ObjectId;
  name: string;
  image: string;
  price: number;
  quantity: number;
  size?: string;
  color?: string;
}

export interface IOrder extends Document {
  user: mongoose.Types.ObjectId;
  transactionId?: string; // SECURITY: Unique transaction ID instead of sequential _id
  items: IOrderItem[];
  shippingAddress: {
    street: string;
    city: string;
    state: string;
    pincode: string;
    country: string;
  };
  paymentMethod: 'razorpay' | 'cod';
  paymentResult?: {
    id: string;
    status: string;
    paymentId?: string;
    orderId?: string;
  };
  subtotal: number;
  shippingPrice: number;
  taxPrice: number;
  totalPrice: number;
  isPaid: boolean;
  paidAt?: Date;
  isDelivered: boolean;
  deliveredAt?: Date;
  isCancelled?: boolean;
  cancelledAt?: Date;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  createdAt: Date;
}

const OrderSchema = new Schema<IOrder>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    transactionId: { 
      type: String, 
      unique: true, 
      sparse: true,
      default: () => require('crypto').randomUUID(),
    },
    items: [
      {
        product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
        name: String,
        image: String,
        price: Number,
        quantity: Number,
        size: String,
        color: String,
      },
    ],
    shippingAddress: {
      street: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, required: true },
      pincode: { type: String, required: true },
      country: { type: String, required: true, default: 'India' },
    },
    paymentMethod: { type: String, enum: ['razorpay', 'cod'], required: true },
    paymentResult: {
      id: String,
      status: String,
      paymentId: String,
      orderId: String,
    },
    subtotal: { type: Number, required: true },
    shippingPrice: { type: Number, required: true, default: 0 },
    taxPrice: { type: Number, required: true, default: 0 },
    totalPrice: { type: Number, required: true },
    isPaid: { type: Boolean, default: false },
    paidAt: { type: Date },
    isDelivered: { type: Boolean, default: false },
    deliveredAt: { type: Date },
    isCancelled: { type: Boolean, default: false },
    cancelledAt: { type: Date },
    status: {
      type: String,
      enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
      default: 'pending',
    },
  },
  { timestamps: true }
);

// PERFORMANCE: Add indexes for common queries
OrderSchema.index({ user: 1, createdAt: -1 }); // User's order history
OrderSchema.index({ status: 1, createdAt: -1 }); // Filter by status
OrderSchema.index({ transactionId: 1 }); // Lookup orders by transaction ID
OrderSchema.index({ paymentMethod: 1 }); // Analytics
OrderSchema.index({ createdAt: -1 }); // Recent orders

export default mongoose.model<IOrder>('Order', OrderSchema);
