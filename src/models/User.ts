import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';

interface IUser extends Document {
  name: string;
  email: string;
  password?: string;
  provider: 'local' | 'google';
  role: 'user' | 'admin';
  avatar?: string;
  phone?: string;
  addresses?: Array<{
    street?: string;
    city?: string;
    state?: string;
    pincode?: string;
    country: string;
  }>;
  wishlist?: mongoose.Types.ObjectId[];
  isVerified: boolean;
  otp?: string;
  otpExpires?: Date;
  otpAttempts?: number; // Track failed OTP attempts for brute-force protection
  otpAttemptResetTime?: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: false, select: false },
    provider: { type: String, enum: ['local', 'google'], default: 'local' },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    avatar: { type: String },
    phone: { type: String },
    addresses: [
      {
        street: String,
        city: String,
        state: String,
        pincode: String,
        country: { type: String, default: 'India' },
      },
    ],
    wishlist: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
    isVerified: { type: Boolean, default: false },
    otp: { type: String },
    otpExpires: { type: Date },
    otpAttempts: { type: Number, default: 0 },
    otpAttemptResetTime: { type: Date },
  },
  { timestamps: true }
);

// Hash password before save
UserSchema.pre('save', async function() {
  if (!this.password || !this.isModified('password')) return;
  const hash = await bcrypt.hash(this.password, 10);
  this.password = hash;
});

UserSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  if (!this.password) return false;
  return bcrypt.compare(candidatePassword, this.password);
};

// PERFORMANCE: Add indexes for common queries
UserSchema.index({ email: 1 }); // Email lookup (already unique, but explicit for clarity)
UserSchema.index({ role: 1 }); // Admin queries
UserSchema.index({ isVerified: 1 }); // Verification status filtering
UserSchema.index({ createdAt: -1 }); // Recent users

export default mongoose.model<IUser>('User', UserSchema);
