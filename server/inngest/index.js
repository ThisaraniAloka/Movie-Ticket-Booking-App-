import 'dotenv/config';
import { Inngest } from "inngest";
import User from '../models/User.js';
import connectDB from '../configs/db.js';

export const inngest = new Inngest({ id: "movie-ticket-booking" });

// Inngest function to save user data to DB
const syncUserCreation = inngest.createFunction(
  { id: 'sync-user-from-clerk' },
  { event: 'clerk/user.created' },
  async ({ event }) => {
    try {
      console.log("🔔 Clerk user.created event received:", JSON.stringify(event.data, null, 2));
      
      // Connect to DB inside the function to ensure fresh connection
      await connectDB();
      
      const { id, first_name, last_name, email_addresses, image_url } = event.data;
      
      // Validate required fields
      if (!id || !email_addresses || email_addresses.length === 0) {
        throw new Error('Missing required user data');
      }

      const userdata = {
        _id: id,
        email: email_addresses[0].email_address,
        name: `${first_name || ''} ${last_name || ''}`.trim() || 'Unknown User',
        image: image_url || ''
      };

      console.log("📝 Attempting to create user:", userdata);

      // Use findOneAndUpdate with upsert to handle duplicates
      const result = await User.findOneAndUpdate(
        { _id: id },
        userdata,
        { upsert: true, new: true, runValidators: true }
      );

      console.log("✅ User successfully created/updated in MongoDB:", result);
      
      return { success: true, userId: id };
    } catch (err) {
      console.error("❌ Error inserting user in MongoDB:", err);
      console.error("Error details:", err.message);
      throw err; // Re-throw to mark function as failed in Inngest
    }
  }
);

// User deletion
const syncUserDeletion = inngest.createFunction(
  { id: 'delete-user-with-clerk' },
  { event: 'clerk/user.deleted' },
  async ({ event }) => {
    try {
      console.log("🔔 Clerk user.deleted event received:", event.data);
      await connectDB();
      
      const { id } = event.data;
      const result = await User.findByIdAndDelete(id);
      
      if (result) {
        console.log("✅ User deleted from MongoDB:", id);
      } else {
        console.log("⚠️ User not found in MongoDB for deletion:", id);
      }
      
      return { success: true, deletedId: id };
    } catch (err) {
      console.error("❌ Error deleting user from MongoDB:", err);
      throw err;
    }
  }
);

// User update
const syncUserUpdation = inngest.createFunction(
  { id: 'update-user-from-clerk' },
  { event: 'clerk/user.updated' },
  async ({ event }) => {
    try {
      console.log("🔔 Clerk user.updated event received:", JSON.stringify(event.data, null, 2));
      await connectDB();
      
      const { id, first_name, last_name, email_addresses, image_url } = event.data;
      
      const userdata = {
        email: email_addresses[0].email_address,
        name: `${first_name || ''} ${last_name || ''}`.trim() || 'Unknown User',
        image: image_url || ''
      };

      const result = await User.findByIdAndUpdate(
        id, 
        userdata, 
        { new: true, runValidators: true }
      );

      if (result) {
        console.log("✅ User updated in MongoDB:", result);
      } else {
        console.log("⚠️ User not found for update, creating new one:", id);
        // Create new user if not found
        const newUser = await User.create({
          _id: id,
          ...userdata
        });
        console.log("✅ New user created during update:", newUser);
      }
      
      return { success: true, userId: id };
    } catch (err) {
      console.error("❌ Error updating user in MongoDB:", err);
      throw err;
    }
  }
);

export const functions = [syncUserCreation, syncUserDeletion, syncUserUpdation];