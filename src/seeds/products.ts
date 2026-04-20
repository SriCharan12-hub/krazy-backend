import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Product from '../models/Product';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/genzstore';

const sampleProducts = [
  {
    name: 'Classic Black Hoodie',
    slug: 'classic-black-hoodie',
    description: 'Premium black hoodie made from 100% organic cotton. Perfect for casual wear and streetwear styling.',
    price: 59.99,
    comparePrice: 79.99,
    category: 'Hoodies',
    brand: 'GenZ Basics',
    thumbnail: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?q=80&w=500',
    images: [
      'https://images.unsplash.com/photo-1556821840-3a63f95609a7?q=80&w=500',
      'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=500',
    ],
    stock: 50,
    sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
    sizePricing: [
      { size: 'XS', price: 49.99, comparePrice: 69.99 },
      { size: 'S', price: 54.99, comparePrice: 74.99 },
      { size: 'M', price: 59.99, comparePrice: 79.99 },
      { size: 'L', price: 64.99, comparePrice: 84.99 },
      { size: 'XL', price: 69.99, comparePrice: 89.99 },
      { size: 'XXL', price: 74.99, comparePrice: 94.99 },
    ],
    colors: [
      { name: 'Black', hex: '#000000' },
      { name: 'Gray', hex: '#808080' },
      { name: 'White', hex: '#FFFFFF' },
    ],
    tags: ['hoodie', 'casual', 'winter'],
    isFeatured: true,
    isActive: true,
    ratings: 4.5,
    numReviews: 24,
  },
  {
    name: 'Oversized White Tee',
    slug: 'oversized-white-tee',
    description: 'Oversized white t-shirt with minimalist design. Comfortable cotton blend fabric.',
    price: 29.99,
    comparePrice: 39.99,
    category: 'Tees',
    brand: 'Urban Wear',
    thumbnail: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=500',
    images: [
      'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=500',
      'https://images.unsplash.com/photo-1503342452862-b37b694470b0?q=80&w=500',
    ],
    stock: 100,
    sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
    sizePricing: [
      { size: 'XS', price: 24.99, comparePrice: 34.99 },
      { size: 'S', price: 26.99, comparePrice: 36.99 },
      { size: 'M', price: 29.99, comparePrice: 39.99 },
      { size: 'L', price: 32.99, comparePrice: 42.99 },
      { size: 'XL', price: 34.99, comparePrice: 44.99 },
      { size: 'XXL', price: 37.99, comparePrice: 47.99 },
    ],
    colors: [
      { name: 'White', hex: '#FFFFFF' },
      { name: 'Black', hex: '#000000' },
      { name: 'Navy', hex: '#000080' },
    ],
    tags: ['tee', 'casual', 'summer'],
    isFeatured: true,
    isActive: true,
    ratings: 4.8,
    numReviews: 42,
  },
  {
    name: 'Bomber Jacket',
    slug: 'bomber-jacket',
    description: 'Classic bomber jacket with premium nylon exterior and soft lining. Perfect for layering.',
    price: 89.99,
    comparePrice: 119.99,
    category: 'Outerwear',
    brand: 'Street Elite',
    thumbnail: 'https://images.unsplash.com/photo-1551028719-00167b16ebc5?q=80&w=500',
    images: [
      'https://images.unsplash.com/photo-1551028719-00167b16ebc5?q=80&w=500',
      'https://images.unsplash.com/photo-1542272604-787c62d465d1?q=80&w=500',
    ],
    stock: 35,
    sizes: ['S', 'M', 'L', 'XL'],
    sizePricing: [
      { size: 'S', price: 79.99, comparePrice: 109.99 },
      { size: 'M', price: 89.99, comparePrice: 119.99 },
      { size: 'L', price: 99.99, comparePrice: 129.99 },
      { size: 'XL', price: 109.99, comparePrice: 139.99 },
    ],
    colors: [
      { name: 'Black', hex: '#000000' },
      { name: 'Olive', hex: '#808000' },
      { name: 'Navy', hex: '#000080' },
    ],
    tags: ['jacket', 'outerwear', 'winter'],
    isFeatured: true,
    isActive: true,
    ratings: 4.6,
    numReviews: 18,
  },
  {
    name: 'Slim Fit Joggers',
    slug: 'slim-fit-joggers',
    description: 'Comfortable slim fit joggers with tapered ankles. Perfect for casual streetwear look.',
    price: 49.99,
    comparePrice: 69.99,
    category: 'Bottoms',
    brand: 'Urban Fit',
    thumbnail: 'https://images.unsplash.com/photo-1526883888805-1ca80ddb0b7b?q=80&w=500',
    images: [
      'https://images.unsplash.com/photo-1526883888805-1ca80ddb0b7b?q=80&w=500',
      'https://images.unsplash.com/photo-1542319825-5a97b4ee5a71?q=80&w=500',
    ],
    stock: 60,
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    sizePricing: [
      { size: 'XS', price: 39.99, comparePrice: 59.99 },
      { size: 'S', price: 44.99, comparePrice: 64.99 },
      { size: 'M', price: 49.99, comparePrice: 69.99 },
      { size: 'L', price: 54.99, comparePrice: 74.99 },
      { size: 'XL', price: 59.99, comparePrice: 79.99 },
    ],
    colors: [
      { name: 'Black', hex: '#000000' },
      { name: 'Gray', hex: '#808080' },
      { name: 'Charcoal', hex: '#36454F' },
    ],
    tags: ['joggers', 'bottoms', 'casual'],
    isFeatured: false,
    isActive: true,
    ratings: 4.4,
    numReviews: 15,
  },
  {
    name: 'Premium Beanie',
    slug: 'premium-beanie',
    description: 'Cozy wool beanie perfect for cold weather. Available in multiple colors.',
    price: 19.99,
    comparePrice: 29.99,
    category: 'Accessories',
    brand: 'Cozy Brand',
    thumbnail: 'https://images.unsplash.com/photo-1529011236777-d9e1e0e9e58f?q=80&w=500',
    images: [
      'https://images.unsplash.com/photo-1529011236777-d9e1e0e9e58f?q=80&w=500',
      'https://images.unsplash.com/photo-1511010501228-430e5d2f11ef?q=80&w=500',
    ],
    stock: 150,
    sizes: ['One Size'],
    sizePricing: [
      { size: 'One Size', price: 19.99, comparePrice: 29.99 },
    ],
    colors: [
      { name: 'Black', hex: '#000000' },
      { name: 'White', hex: '#FFFFFF' },
      { name: 'Burgundy', hex: '#800020' },
    ],
    tags: ['beanie', 'accessories', 'winter'],
    isFeatured: false,
    isActive: true,
    ratings: 4.7,
    numReviews: 32,
  },
  {
    name: 'Canvas Sneakers',
    slug: 'canvas-sneakers',
    description: 'Classic canvas sneakers with comfortable sole. Great for everyday wear.',
    price: 69.99,
    comparePrice: 89.99,
    category: 'Footwear',
    brand: 'Step Co',
    thumbnail: 'https://images.unsplash.com/photo-1525966222134-fcebfc17c645?q=80&w=500',
    images: [
      'https://images.unsplash.com/photo-1525966222134-fcebfc17c645?q=80&w=500',
      'https://images.unsplash.com/photo-1541291026-7aedcf74fab7?q=80&w=500',
    ],
    stock: 80,
    sizes: ['6', '7', '8', '9', '10', '11', '12', '13'],
    sizePricing: [
      { size: '6', price: 59.99, comparePrice: 79.99 },
      { size: '7', price: 64.99, comparePrice: 84.99 },
      { size: '8', price: 69.99, comparePrice: 89.99 },
      { size: '9', price: 69.99, comparePrice: 89.99 },
      { size: '10', price: 69.99, comparePrice: 89.99 },
      { size: '11', price: 74.99, comparePrice: 94.99 },
      { size: '12', price: 79.99, comparePrice: 99.99 },
      { size: '13', price: 84.99, comparePrice: 104.99 },
    ],
    colors: [
      { name: 'White', hex: '#FFFFFF' },
      { name: 'Black', hex: '#000000' },
      { name: 'Blue', hex: '#0000FF' },
    ],
    tags: ['sneakers', 'footwear', 'casual'],
    isFeatured: true,
    isActive: true,
    ratings: 4.5,
    numReviews: 28,
  },
  {
    name: 'Sweat T-Shirt',
    slug: 'sweat-t-shirt',
    description: 'Comfortable sweatshirt t-shirt perfect for workouts and casual wear. Premium breathable fabric.',
    price: 39.99,
    comparePrice: 59.99,
    category: 'Tees',
    brand: 'Athletic Edge',
    thumbnail: 'https://images.unsplash.com/photo-1503342452862-b37b694470b0?q=80&w=500',
    images: [
      'https://images.unsplash.com/photo-1503342452862-b37b694470b0?q=80&w=500',
      'https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=500',
    ],
    stock: 90,
    sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
    sizePricing: [
      { size: 'XS', price: 34.99, comparePrice: 54.99 },
      { size: 'S', price: 36.99, comparePrice: 56.99 },
      { size: 'M', price: 39.99, comparePrice: 59.99 },
      { size: 'L', price: 42.99, comparePrice: 62.99 },
      { size: 'XL', price: 44.99, comparePrice: 64.99 },
      { size: 'XXL', price: 47.99, comparePrice: 67.99 },
    ],
    colors: [
      { name: 'Black', hex: '#000000' },
      { name: 'Gray', hex: '#808080' },
      { name: 'Navy', hex: '#000080' },
    ],
    tags: ['tee', 'athletic', 'summer'],
    isFeatured: true,
    isActive: true,
    ratings: 4.6,
    numReviews: 35,
  },
  {
    name: 'Cargo Shorts',
    slug: 'cargo-shorts',
    description: 'Trendy cargo shorts with multiple pockets. Perfect for summer adventures and casual wear.',
    price: 44.99,
    comparePrice: 64.99,
    category: 'Bottoms',
    brand: 'Urban Fit',
    thumbnail: 'https://images.unsplash.com/photo-1545873438-fc3ee04dbcf0?q=80&w=500',
    images: [
      'https://images.unsplash.com/photo-1545873438-fc3ee04dbcf0?q=80&w=500',
      'https://images.unsplash.com/photo-1552058871-cb72b27e84bf?q=80&w=500',
    ],
    stock: 55,
    sizes: ['28', '30', '32', '34', '36', '38', '40'],
    sizePricing: [
      { size: '28', price: 39.99, comparePrice: 59.99 },
      { size: '30', price: 42.99, comparePrice: 62.99 },
      { size: '32', price: 44.99, comparePrice: 64.99 },
      { size: '34', price: 44.99, comparePrice: 64.99 },
      { size: '36', price: 44.99, comparePrice: 64.99 },
      { size: '38', price: 47.99, comparePrice: 67.99 },
      { size: '40', price: 49.99, comparePrice: 69.99 },
    ],
    colors: [
      { name: 'Khaki', hex: '#C3B091' },
      { name: 'Black', hex: '#000000' },
      { name: 'Olive', hex: '#808000' },
    ],
    tags: ['shorts', 'bottoms', 'summer'],
    isFeatured: false,
    isActive: true,
    ratings: 4.3,
    numReviews: 12,
  },
  {
    name: 'Leather Belt',
    slug: 'leather-belt',
    description: 'Classic leather belt with premium buckle. Versatile accessory for any outfit.',
    price: 34.99,
    comparePrice: 54.99,
    category: 'Accessories',
    brand: 'Classic Gear',
    thumbnail: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?q=80&w=500',
    images: [
      'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?q=80&w=500',
    ],
    stock: 120,
    sizes: ['30', '32', '34', '36', '38', '40'],
    sizePricing: [
      { size: '30', price: 29.99, comparePrice: 49.99 },
      { size: '32', price: 32.99, comparePrice: 52.99 },
      { size: '34', price: 34.99, comparePrice: 54.99 },
      { size: '36', price: 34.99, comparePrice: 54.99 },
      { size: '38', price: 37.99, comparePrice: 57.99 },
      { size: '40', price: 39.99, comparePrice: 59.99 },
    ],
    colors: [
      { name: 'Black', hex: '#000000' },
      { name: 'Brown', hex: '#A52A2A' },
      { name: 'Tan', hex: '#D2B48C' },
    ],
    tags: ['belt', 'accessories', 'casual'],
    isFeatured: false,
    isActive: true,
    ratings: 4.8,
    numReviews: 45,
  },
];

async function seedDatabase() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ MongoDB Connected');

    // Clear existing products
    await Product.deleteMany({});
    console.log('🗑️  Cleared existing products');

    // Insert sample products
    const inserted = await Product.insertMany(sampleProducts);
    console.log(`✅ Inserted ${inserted.length} sample products`);

    console.log('🎉 Database seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

seedDatabase();
