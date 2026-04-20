import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Order from '../models/Order';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/genzstore';

async function clearOrders() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ MongoDB Connected');

    const count = await Order.countDocuments();
    console.log(`📦 Found ${count} orders`);

    const result = await Order.deleteMany({});
    console.log(`🗑️  Deleted ${result.deletedCount} orders`);

    console.log('✅ All orders cleared!');
    process.exit(0);
  } catch (error) {
    console.error('Error clearing orders:', error);
    process.exit(1);
  }
}

clearOrders();
