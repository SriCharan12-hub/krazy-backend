import express, { Request, Response } from 'express';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import dotenv from 'dotenv';
import { paymentLimiter } from '../middleware/rateLimiter';
import { validatePaymentAmount, sanitizeOrderData } from '../utils/security';

dotenv.config();

// Validate Razorpay credentials
if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
  console.warn('⚠️ Warning: Razorpay credentials not set. Razorpay payments will not work.');
}

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_placeholder',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'rzp_secret_placeholder',
});

const router = express.Router();

/**
 * Create Razorpay Order
 * POST /api/payments/razorpay/create-order
 * Body: { amount: number (in rupees), currency: string }
 * Response: { success: boolean, order: object }
 */
router.post('/razorpay/create-order', paymentLimiter, async (req: Request, res: Response) => {
  try {
    const { amount, currency = 'INR', orderId } = req.body;
    
    // Validate amount
    if (!amount || amount <= 0 || isNaN(amount)) {
      res.status(400).json({ 
        success: false, 
        message: 'Invalid amount. Amount must be a positive number.' 
      });
      return;
    }

    // CRITICAL: Amount tampering prevention
    // Cap maximum order amount to prevent injection attacks
    const MAX_ORDER_AMOUNT = 1000000; // 10 lakh rupees
    if (amount > MAX_ORDER_AMOUNT) {
      console.warn(`🚨 FRAUD ALERT: Suspiciously high order amount: ${amount}`);
      res.status(400).json({ 
        success: false, 
        message: 'Order amount exceeds maximum limit' 
      });
      return;
    }

    // Create Razorpay order
    const options = {
      amount: Math.round(amount * 100), // Convert to paise (smallest unit)
      currency,
      receipt: `receipt_${Date.now()}`,
      payment_capture: 1, // Auto-capture payment
    };

    const order = await razorpay.orders.create(options as any);
    
    res.status(200).json({ 
      success: true, 
      order,
      keyId: process.env.RAZORPAY_KEY_ID, // Send key to frontend for Razorpay modal
    });
  } catch (error: any) {
    console.error('Razorpay order creation error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Failed to create Razorpay order' 
    });
  }
});

/**
 * Verify Razorpay Payment Signature
 * POST /api/payments/razorpay/verify
 * Body: { razorpay_order_id, razorpay_payment_id, razorpay_signature }
 * Response: { success: boolean, verified: boolean }
 * 
 * This endpoint verifies the HMAC SHA256 signature to ensure payment genuineness
 */
router.post('/razorpay/verify', paymentLimiter, (req: Request, res: Response) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    // Validate required fields
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      res.status(400).json({ 
        success: false,
        verified: false,
        message: 'Missing payment parameters (order_id, payment_id, or signature)' 
      });
      return;
    }

    // Create signature string: order_id|payment_id
    const body = `${razorpay_order_id}|${razorpay_payment_id}`;

    // Generate expected signature using HMAC SHA256
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || '')
      .update(body)
      .digest('hex');

    // Compare signatures
    const isSignatureValid = expectedSignature === razorpay_signature;

    if (isSignatureValid) {
      res.status(200).json({ 
        success: true,
        verified: true,
        message: 'Payment signature verified successfully',
        orderId: razorpay_order_id,
        paymentId: razorpay_payment_id,
      });
    } else {
      console.warn('Signature verification failed:', {
        expected: expectedSignature,
        received: razorpay_signature,
      });
      res.status(400).json({ 
        success: false,
        verified: false,
        message: 'Payment signature verification failed. Possible tampering detected.' 
      });
    }
  } catch (error: any) {
    console.error('Payment verification error:', error);
    res.status(500).json({ 
      success: false,
      verified: false,
      message: error.message || 'Payment verification failed' 
    });
  }
});

/**
 * Healthcheck endpoint for payment service
 */
router.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ 
    success: true,
    message: 'Payment service is operational',
    gateway: 'razorpay',
    timestamp: new Date().toISOString(),
  });
});

export default router;
