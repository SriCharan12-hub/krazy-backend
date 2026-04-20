import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Product from '../models/Product';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/genzstore';

async function checkProducts() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ MongoDB Connected');
    const count = await Product.countDocuments();
    console.log(`📦 Total products in database: ${count}`);
    if (count === 0) {
      console.log('❌ No products found! Please run: npm run seed');
      process.exit(1);
    }
    const products = await Product.find().select('_id name slug category isActive').limit(5);
    console.log('\n🛍️  Sample products:');
    products.forEach(p => {
      console.log(`  - ${p.name} (slug: ${p.slug}, active: ${p.isActive})`);
    });
    const noSlug = await Product.countDocuments({ slug: { $exists: false } });
    if (noSlug > 0) {
      console.log(`\n❌ ${noSlug} products missing slug field!`);
    }
    const inactive = await Product.countDocuments({ isActive: false });
    if (inactive > 0) {
      console.log(`\n⚠️  ${inactive} products are inactive`);
    }
    console.log('\n✅ Database check complete!');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}
checkProducts();

