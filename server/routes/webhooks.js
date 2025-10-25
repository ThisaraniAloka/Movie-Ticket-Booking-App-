import express from 'express';
import { Webhook } from 'svix';
import User from '../models/User.js';
import connectDB from '../configs/db.js';

const router = express.Router();

// Clerk webhook handler
router.post('/clerk', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    console.log('📨 Clerk webhook received at:', new Date().toISOString());

    // Get headers and body
    const svix_id = req.headers['svix-id'];
    const svix_timestamp = req.headers['svix-timestamp'];
    const svix_signature = req.headers['svix-signature'];
    const payload = req.body.toString();
    
    // Verify webhook
    if (!svix_id || !svix_timestamp || !svix_signature) {
      console.log('❌ Missing Svix headers');
      return res.status(400).json({ error: 'Missing Svix headers' });
    }

    const wh = new Webhook(process.env.CLERK_WEBHOOK_SECRET);
    let evt;
    
    try {
      evt = wh.verify(payload, {
        'svix-id': svix_id,
        'svix-timestamp': svix_timestamp,
        'svix-signature': svix_signature,
      });
      console.log('✅ Webhook verified:', evt.type);
    } catch (err) {
      console.log('❌ Webhook verification failed:', err.message);
      return res.status(400).json({ error: 'Invalid webhook signature' });
    }

    // ✅ RESPOND IMMEDIATELY
    res.status(200).json({ success: true, message: 'Webhook received' });
    
    // ✅ PROCESS IN BACKGROUND
    processWebhookInBackground(evt);
    
  } catch (error) {
    console.error('❌ Webhook processing error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Background processing
async function processWebhookInBackground(evt) {
  try {
    console.log('🔄 Starting background processing for:', evt.type);
    await connectDB();
    
    const { type, data } = evt;

    switch (type) {
      case 'user.created':
        await handleUserCreated(data);
        break;
      case 'user.updated':
        await handleUserUpdated(data);
        break;
      case 'user.deleted':
        await handleUserDeleted(data);
        break;
      default:
        console.log(`🤔 Unhandled event: ${type}`);
    }
    
    console.log('✅ Background processing completed');
  } catch (error) {
    console.error('❌ Background processing failed:', error);
  }
}

// FIXED: Better email handling
async function handleUserCreated(userData) {
  try {
    const { id, first_name, last_name, email_addresses, image_url, primary_email_address_id } = userData;
    
    // ✅ IMPROVED EMAIL LOGIC
    let email = null;
    
    if (email_addresses && email_addresses.length > 0 && email_addresses[0].email_address) {
      email = email_addresses[0].email_address;
    } else if (primary_email_address_id) {
      // Real users might have email populated in user.updated webhook later
      email = `user_${id}@placeholder.com`;
      console.log('ℹ️ Using placeholder email, will update later');
    } else {
      email = null; // Allow null in database
    }

    const user = {
      _id: id,
      email: email,
      name: `${first_name || ''} ${last_name || ''}`.trim() || 'Unknown User',
      image: image_url || ''
    };

    console.log('📝 Creating user:', user);

    const result = await User.findOneAndUpdate(
      { _id: id },
      user,
      { upsert: true, new: true, runValidators: false } // ✅ Turn off validators temporarily
    );

    console.log('✅ User created in MongoDB:', result._id);
    return result;
  } catch (error) {
    console.error('❌ Error creating user:', error);
    throw error;
  }
}

// Keep your existing handleUserUpdated and handleUserDeleted functions
async function handleUserUpdated(userData) {
  try {
    const { id, first_name, last_name, email_addresses, image_url } = userData;
    
    const user = {
      email: email_addresses[0]?.email_address,
      name: `${first_name || ''} ${last_name || ''}`.trim() || 'Unknown User',
      image: image_url || ''
    };

    console.log('📝 Updating user:', id);

    const result = await User.findByIdAndUpdate(
      id,
      user,
      { new: true, runValidators: false }
    );

    if (result) {
      console.log('✅ User updated:', result._id);
    } else {
      console.log('⚠️ User not found, creating:', id);
      await handleUserCreated(userData);
    }

    return result;
  } catch (error) {
    console.error('❌ Error updating user:', error);
    throw error;
  }
}

async function handleUserDeleted(userData) {
  try {
    const { id } = userData;
    
    console.log('🗑️ Deleting user:', id);

    const result = await User.findByIdAndDelete(id);

    if (result) {
      console.log('✅ User deleted:', id);
    } else {
      console.log('⚠️ User not found for deletion:', id);
    }

    return result;
  } catch (error) {
    console.error('❌ Error deleting user:', error);
    throw error;
  }
}

export default router;