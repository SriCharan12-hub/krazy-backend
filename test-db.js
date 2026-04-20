const mongoose = require('mongoose');

const MONGODB_URI = 'mongodb+srv://prestige_media:media2026@cluster0.ei8x2kp.mongodb.net/?appName=Cluster0';

async function testConnection() {
  try {
    console.log('Attempting to connect to MongoDB...');
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 5000 // 5 second timeout
    });
    console.log('✅ Connection successful!');

    // List collections in the 'genzstore' database
    const genzDb = mongoose.connection.useDb('genzstore').db;
    const genzCollections = await genzDb.listCollections().toArray();
    const countArr = await Promise.all(genzCollections.map(c => genzDb.collection(c.name).countDocuments()));

    console.log(`\nCollections in 'genzstore' db:`);
    genzCollections.forEach((c, i) => {
      console.log(` - ${c.name} (${countArr[i]} documents)`);
    });

    if (genzCollections.length === 0) {
      console.log("No collections found! The DB is empty.");
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    process.exit(1);
  }
}

testConnection();


