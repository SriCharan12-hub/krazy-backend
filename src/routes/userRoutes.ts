import express, { Response } from 'express';
import User from '../models/User';
import Product from '../models/Product';
import { protect, adminOnly, AuthRequest } from '../middleware/auth';
import { generalLimiter } from '../middleware/rateLimiter';

const router = express.Router();

// GET /api/users/profile
router.get('/profile', protect, async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findById(req.user!.id).select('-password');
    if (!user) { res.status(404).json({ success: false, message: 'User not found' }); return; }
    res.status(200).json({ success: true, data: user });
  } catch (error: unknown) {
    res.status(500).json({ success: false, message: error instanceof Error ? error.message : 'Server error' });
  }
});

// PUT /api/users/profile
router.put('/profile', protect, generalLimiter, async (req: AuthRequest, res: Response) => {
  try {
    const { name, phone, addresses } = req.body;
    
    // Input validation
    if (name && name.trim().length === 0) {
      res.status(400).json({ success: false, message: 'Name cannot be empty' });
      return;
    }
    if (phone && !/^\d{10,}$/.test(phone.replace(/[^\d]/g, ''))) {
      res.status(400).json({ success: false, message: 'Valid phone number is required' });
      return;
    }
    
    // Validate addresses if provided
    if (addresses && Array.isArray(addresses)) {
      for (const addr of addresses) {
        if (addr.street && addr.street.trim().length === 0) {
          res.status(400).json({ success: false, message: 'Address street cannot be empty' });
          return;
        }
        if (addr.city && addr.city.trim().length === 0) {
          res.status(400).json({ success: false, message: 'Address city cannot be empty' });
          return;
        }
        if (addr.pincode && !/^\d{5,}$/.test(addr.pincode)) {
          res.status(400).json({ success: false, message: 'Valid pincode is required' });
          return;
        }
      }
    }

    const user = await User.findByIdAndUpdate(req.user!.id, { name, phone, addresses }, { new: true }).select('-password');
    res.status(200).json({ success: true, data: user });
  } catch (error: unknown) {
    res.status(500).json({ success: false, message: error instanceof Error ? error.message : 'Server error' });
  }
});

// POST /api/users/wishlist/:productId — Toggle wishlist
router.post('/wishlist/:productId', protect, async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findById(req.user!.id);
    if (!user) { res.status(404).json({ success: false, message: 'User not found' }); return; }
    const productId = req.params.productId;
    
    // Initialize wishlist if undefined
    if (!user.wishlist) user.wishlist = [];
    
    const index = user.wishlist.findIndex((id) => id.toString() === productId);
    if (index > -1) {
      user.wishlist.splice(index, 1);
    } else {
      const product = await Product.findById(productId);
      if (!product) { res.status(404).json({ success: false, message: 'Product not found' }); return; }
      user.wishlist.push(product._id as import('mongoose').Types.ObjectId);
    }
    await user.save();
    res.status(200).json({ success: true, data: user.wishlist });
  } catch (error: unknown) {
    res.status(500).json({ success: false, message: error instanceof Error ? error.message : 'Server error' });
  }
});

// GET /api/users/wishlist
router.get('/wishlist', protect, async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findById(req.user!.id).populate('wishlist');
    res.status(200).json({ success: true, data: user?.wishlist ?? [] });
  } catch (error: unknown) {
    res.status(500).json({ success: false, message: error instanceof Error ? error.message : 'Server error' });
  }
});

// POST /api/users/address — Add a new address
router.post('/address', protect, async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findById(req.user!.id);
    if (!user) { res.status(404).json({ success: false, message: 'User not found' }); return; }
    
    const { street, city, state, pincode, country } = req.body;
    
    // Simple validation
    if (!street || !city || !state || !pincode) {
      res.status(400).json({ success: false, message: 'All address fields are required' });
      return;
    }

    if (!user.addresses) user.addresses = [];
    user.addresses.push({ street, city, state, pincode, country: country || 'India' });
    
    await user.save();
    res.status(201).json({ success: true, data: user.addresses });
  } catch (error: unknown) {
    res.status(500).json({ success: false, message: error instanceof Error ? error.message : 'Server error' });
  }
});

// PUT /api/users/address/:addressId — Update an address
router.put('/address/:addressId', protect, async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findById(req.user!.id);
    if (!user) { res.status(404).json({ success: false, message: 'User not found' }); return; }
    
    const addressId = req.params.addressId;
    const { street, city, state, pincode, country } = req.body;
    
    const address = (user.addresses as any[]).find(addr => addr._id.toString() === addressId);
    if (!address) {
      res.status(404).json({ success: false, message: 'Address not found' });
      return;
    }
    
    if (street) address.street = street;
    if (city) address.city = city;
    if (state) address.state = state;
    if (pincode) address.pincode = pincode;
    if (country) address.country = country;
    
    await user.save();
    res.status(200).json({ success: true, data: user.addresses });
  } catch (error: unknown) {
    res.status(500).json({ success: false, message: error instanceof Error ? error.message : 'Server error' });
  }
});

// DELETE /api/users/address/:addressId — Delete an address
router.delete('/address/:addressId', protect, async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findById(req.user!.id);
    if (!user) { res.status(404).json({ success: false, message: 'User not found' }); return; }
    
    const addressId = req.params.addressId;
    const initialLength = user.addresses?.length || 0;
    
    user.addresses = user.addresses?.filter(addr => (addr as any)._id.toString() !== addressId);
    
    if (user.addresses?.length === initialLength) {
      res.status(404).json({ success: false, message: 'Address not found' });
      return;
    }
    
    await user.save();
    res.status(200).json({ success: true, data: user.addresses });
  } catch (error: unknown) {
    res.status(500).json({ success: false, message: error instanceof Error ? error.message : 'Server error' });
  }
});

// ===== ADMIN ONLY ROUTES =====

// GET /api/users — Get all users (admin only)
router.get('/', protect, adminOnly, async (_req: AuthRequest, res: Response) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: users });
  } catch (error: unknown) {
    res.status(500).json({ success: false, message: error instanceof Error ? error.message : 'Server error' });
  }
});

// PUT /api/users/:id/role — Update user role (admin only)
router.put('/:id/role', protect, adminOnly, async (req: AuthRequest, res: Response) => {
  try {
    const { role } = req.body;
    
    if (!role || !['user', 'admin'].includes(role)) {
      res.status(400).json({ success: false, message: 'Invalid role. Must be "user" or "admin"' });
      return;
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true }
    ).select('-password');

    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    res.status(200).json({ 
      success: true, 
      message: `User "${user.name}" role updated to "${role}"`,
      data: user 
    });
  } catch (error: unknown) {
    res.status(500).json({ success: false, message: error instanceof Error ? error.message : 'Server error' });
  }
});

export default router;
