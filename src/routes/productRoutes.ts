import express, { Response } from 'express';
import Product from '../models/Product';
import User from '../models/User';
import redisClient, { invalidateProductCache } from '../config/redis';
import { protect, adminOnly, AuthRequest } from '../middleware/auth';
import { searchLimiter, reviewLimiter } from '../middleware/rateLimiter';

const router = express.Router();

// GET /api/products — with Redis caching, filtering, search, pagination
router.get('/', searchLimiter, async (req: AuthRequest, res: Response) => {
  try {
    const { category, gender, minPrice, maxPrice, search, sort, page = '1', limit = '12' } = req.query as Record<string, string>;
    const cacheKey = `products:${JSON.stringify(req.query)}`;

    if (redisClient) {
      try {
        const cached = await redisClient.get(cacheKey);
        if (cached) {
          res.status(200).json({ success: true, source: 'cache', ...JSON.parse(cached) });
          return;
        }
      } catch (cacheError) {
        console.warn('Redis cache read failed:', cacheError);
        // Continue without cache if Redis fails
      }
    }

    const query: Record<string, unknown> = { isActive: true };
    if (category) {
      // Case-insensitive category search
      query.category = { $regex: category, $options: 'i' };
    }
    if (gender && gender !== 'all') {
      // men/women shows gender-specific + unisex; 'unisex' shows only unisex
      if (gender === 'men' || gender === 'women') {
        query.gender = { $in: [gender, 'unisex'] };
      } else {
        query.gender = gender;
      }
    }
    if (minPrice || maxPrice) query.price = { ...(minPrice && { $gte: Number(minPrice) }), ...(maxPrice && { $lte: Number(maxPrice) }) };
    if (search) query.$text = { $search: search };

    const sortMap: Record<string, Record<string, 1 | -1>> = {
      'price-asc': { price: 1 },
      'price-desc': { price: -1 },
      newest: { createdAt: -1 },
      rating: { ratings: -1 },
    };
    const sortOption = sortMap[sort as string] ?? { createdAt: -1 };

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(50, parseInt(limit));
    const skip = (pageNum - 1) * limitNum;

    const [products, total] = await Promise.all([
      Product.find(query).sort(sortOption).skip(skip).limit(limitNum),
      Product.countDocuments(query),
    ]);

    const payload = { data: products, total, page: pageNum, pages: Math.ceil(total / limitNum) };

    if (redisClient) {
      try {
        await redisClient.setEx(cacheKey, 600, JSON.stringify(payload));
      } catch (cacheError) {
        console.warn('Redis cache write failed:', cacheError);
        // Continue even if cache fails
      }
    }

    res.status(200).json({ success: true, source: 'db', ...payload });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Server error';
    res.status(500).json({ success: false, message });
  }
});

// GET /api/products/detail/:id — Get product by MongoDB ID
router.get('/detail/:id', async (req: AuthRequest, res: Response) => {
  try {
    let { id } = req.params;
    if (typeof id !== 'string') {
      res.status(400).json({ success: false, message: 'Invalid id parameter' });
      return;
    }
    
    const cacheKey = `product-detail:${id}`;
    
    if (redisClient) {
      try {
        const cached = await redisClient.get(cacheKey);
        if (cached) { 
          res.status(200).json({ success: true, source: 'cache', data: JSON.parse(cached) }); 
          return; 
        }
      } catch (cacheError) {
        console.warn('Cache read error:', cacheError);
      }
    }
    
    // Find product by MongoDB _id
    const product = await Product.findById(id).populate('reviews.user', 'name avatar');
    
    if (!product) { 
      res.status(404).json({ success: false, message: 'Product not found' }); 
      return; 
    }
    
    // Only show inactive products to admin users
    if (!product.isActive && req.user?.role !== 'admin') {
      res.status(404).json({ success: false, message: 'Product not found' }); 
      return;
    }
    
    if (redisClient) {
      try {
        await redisClient.setEx(cacheKey, 3600, JSON.stringify(product));
      } catch (cacheError) {
        console.warn('Cache write error:', cacheError);
      }
    }
    
    res.status(200).json({ success: true, data: product });
  } catch (error: unknown) {
    res.status(500).json({ success: false, message: error instanceof Error ? error.message : 'Server error' });
  }
});

// GET /api/products/:slug
router.get('/:slug', async (req: AuthRequest, res: Response) => {
  try {
    let { slug } = req.params;
    if (typeof slug !== 'string') {
      res.status(400).json({ success: false, message: 'Invalid slug parameter' });
      return;
    }
    
    const normalizedSlug = slug.toLowerCase();
    const cacheKey = `product:${normalizedSlug}`;
    
    if (redisClient) {
      try {
        const cached = await redisClient.get(cacheKey);
        if (cached) { 
          res.status(200).json({ success: true, source: 'cache', data: JSON.parse(cached) }); 
          return; 
        }
      } catch (cacheError) {
        console.warn('Cache read error:', cacheError);
      }
    }
    
    // Find product by slug (case-insensitive) - show if active OR if Admin is viewing
    const product = await Product.findOne({ slug: normalizedSlug }).populate('reviews.user', 'name avatar');
    
    if (!product) { 
      res.status(404).json({ success: false, message: 'Product not found' }); 
      return; 
    }
    
    // Only show inactive products to admin users
    if (!product.isActive && req.user?.role !== 'admin') {
      res.status(404).json({ success: false, message: 'Product not found' }); 
      return;
    }
    
    if (redisClient) {
      try {
        await redisClient.setEx(cacheKey, 3600, JSON.stringify(product));
      } catch (cacheError) {
        console.warn('Cache write error:', cacheError);
      }
    }
    
    res.status(200).json({ success: true, data: product });
  } catch (error: unknown) {
    res.status(500).json({ success: false, message: error instanceof Error ? error.message : 'Server error' });
  }
});

// POST /api/products/:id/reviews — protected
router.post('/:id/reviews', protect, reviewLimiter, async (req: AuthRequest, res: Response) => {
  try {
    const { rating, comment } = req.body;
    
    // Validate rating and comment
    if (!rating || rating < 1 || rating > 5) {
      res.status(400).json({ success: false, message: 'Rating must be between 1 and 5' });
      return;
    }
    if (!comment || comment.trim().length === 0) {
      res.status(400).json({ success: false, message: 'Comment is required' });
      return;
    }

    // Fetch user to get authentic name
    const user = await User.findById(req.user!.id);
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    const product = await Product.findById(req.params.id);
    if (!product) { res.status(404).json({ success: false, message: 'Product not found' }); return; }
    
    const alreadyReviewed = product.reviews.find((r) => r.user.toString() === req.user!.id);
    if (alreadyReviewed) { res.status(400).json({ success: false, message: 'Product already reviewed' }); return; }
    
    // Use authenticated user's name, not request body
    product.reviews.push({ 
      user: req.user!.id as unknown as import('mongoose').Types.ObjectId, 
      name: user.name, 
      rating: Number(rating), 
      comment, 
      createdAt: new Date() 
    });
    product.numReviews = product.reviews.length;
    product.ratings = product.reviews.reduce((acc, r) => acc + r.rating, 0) / product.reviews.length;
    await product.save();
    res.status(201).json({ success: true, message: 'Review added' });
  } catch (error: unknown) {
    res.status(500).json({ success: false, message: error instanceof Error ? error.message : 'Server error' });
  }
});

// ADMIN: Create Product
router.post('/', protect, adminOnly, async (req: AuthRequest, res: Response) => {
  try {
    const product = await Product.create(req.body);
    await invalidateProductCache();
    res.status(201).json({ success: true, data: product });
  } catch (error: unknown) {
    res.status(500).json({ success: false, message: error instanceof Error ? error.message : 'Server error' });
  }
});

// ADMIN: Update Product
router.put('/:id', protect, adminOnly, async (req: AuthRequest, res: Response) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!product) { res.status(404).json({ success: false, message: 'Product not found' }); return; }
    await invalidateProductCache();
    res.status(200).json({ success: true, data: product });
  } catch (error: unknown) {
    res.status(500).json({ success: false, message: error instanceof Error ? error.message : 'Server error' });
  }
});

// ADMIN: Delete Product
router.delete('/:id', protect, adminOnly, async (req: AuthRequest, res: Response) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) { res.status(404).json({ success: false, message: 'Product not found' }); return; }
    await invalidateProductCache();
    res.status(200).json({ success: true, message: 'Product deleted' });
  } catch (error: unknown) {
    res.status(500).json({ success: false, message: error instanceof Error ? error.message : 'Server error' });
  }
});

export default router;
