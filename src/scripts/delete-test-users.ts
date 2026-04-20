import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import User from '../models/User';

dotenv.config({ path: path.join(__dirname, '../.env') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/genzstore';

const testEmails = [
  'test_address@example.com',
  'test@example.com',
  'testuser@example.com',
];

async function deleteTestUsers() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Delete test users
    const result = await User.deleteMany({ email: { $in: testEmails } });
    
    console.log(`\n🗑️  Deleted ${result.deletedCount} test user(s):`);
    testEmails.forEach((email) => {
      console.log(`   - ${email}`);
    });

    if (result.deletedCount === 0) {
      console.log('\n⚠️  No test users found to delete.');
    } else {
      console.log('\n✅ Test users removed successfully!');
    }

    process.exit(0);
  } catch (error: any) {
    console.error('❌ Error deleting test users:', error.message);
    process.exit(1);
  }
}

deleteTestUsers();
