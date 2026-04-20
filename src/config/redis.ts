import { createClient } from 'redis';
import dotenv from 'dotenv';
dotenv.config();

// Redis is disabled for now - can be enabled later
const REDIS_ENABLED = false;

let redisClient: any = null;
let redisConnected = false;

async function initRedis() {
  try {
    if (REDIS_ENABLED && process.env.REDIS_URL) {
      redisClient = createClient({ url: process.env.REDIS_URL });
      redisClient.on('error', (err: any) => {
        console.warn('⚠️ Redis Client Error:', err.message);
        redisConnected = false;
      });
      redisClient.on('connect', () => {
        console.log('✅ Redis connected successfully');
        redisConnected = true;
      });
      await redisClient.connect();
      redisConnected = true;
    } else {
      console.log('ℹ️  Redis disabled - using database directly');
      redisConnected = false;
    }
  } catch (error: any) {
    console.warn('⚠️ Failed to initialize Redis:', error.message);
    redisConnected = false;
    redisClient = null;
  }
}

// Initialize Redis on module load
initRedis();

// Helper function to invalidate product cache
// Currently disabled - no-op function
export const invalidateProductCache = async (): Promise<void> => {
  if (!REDIS_ENABLED) {
    console.log('ℹ️  Cache invalidation skipped (Redis disabled)');
    return;
  }
  
  if (!redisClient || !redisConnected) {
    console.log('⚠️ Redis not available - skipping cache invalidation');
    return;
  }
  
  try {
    // Clear all product-related cache keys
    const keys = await redisClient.keys('product*');
    if (keys.length > 0) {
      await redisClient.del(keys);
      console.log(`✅ Cleared ${keys.length} product cache keys`);
    }
  } catch (error: any) {
    console.warn('⚠️ Failed to invalidate product cache:', error.message);
    // Don't throw - just log warning, order creation should still succeed
  }
};

export default redisClient;
