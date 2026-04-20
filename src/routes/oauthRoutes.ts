import express, { Request, Response } from 'express';
import User from '../models/User';
import { signToken } from '../utils/token';

const router = express.Router();

const ADMIN_EMAIL = 'sricharanpalem07@gmail.com';

// POST /api/auth/google/google-sync
// Saves Google user data into MongoDB on every login
router.post('/google-sync', async (req: Request, res: Response) => {
  try {
    const { email, name, avatar } = req.body;

    if (!email) {
      res.status(400).json({ success: false, message: 'Email is required' });
      return;
    }

    const isAdmin = email.toLowerCase() === ADMIN_EMAIL;
    console.log(`Google Login: ${email} | Admin: ${isAdmin}`);

    // Build the fields to save to the database
    const updateFields: Record<string, any> = {
      name: name || 'Google User',
      provider: 'google',
      isVerified: true,
    };

    // Only save avatar if one was provided
    if (avatar) {
      updateFields.avatar = avatar;
    }

    // Always enforce admin role for the admin email; preserve existing role for others
    if (isAdmin) {
      updateFields.role = 'admin';
    }

    // findOneAndUpdate with upsert:true will:
    // - CREATE the user if they don't exist yet (new Google user saved to DB)
    // - UPDATE the user if they already exist (keeps data fresh)
    const user = await User.findOneAndUpdate(
      { email: email.toLowerCase() },
      { $set: updateFields },
      { new: true, upsert: true, runValidators: false }
    );

    if (!user) {
      throw new Error('Failed to save user to database');
    }

    const token = signToken(user._id.toString(), user.role);

    console.log(`✅ Saved to DB: ${user.email} | Role: ${user.role}`);

    res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
      },
    });
  } catch (error: any) {
    console.error('❌ Google Sync Error:', error.message);
    res.status(500).json({ success: false, message: 'Failed to save Google login data' });
  }
});

export default router;
