import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import connectDB from './configs/db.js';
import { clerkMiddleware } from '@clerk/express';
import webhookRoutes from './routes/webhooks.js';

const app = express();
const port = 3000;

await connectDB();

// Middleware - IMPORTANT: Webhook must be before express.json()
app.use('/api/webhooks', webhookRoutes);

// Other middleware
app.use(express.json());
app.use(cors());
app.use(clerkMiddleware());

// Routes
app.get('/', (req, res) => res.send("Server is Live with Official Clerk Webhooks!"));
app.get('/api/users', async (req, res) => {
  try {
    const User = (await import('./models/User.js')).default;
    const users = await User.find({});
    res.json({ 
      totalUsers: users.length,
      users: users.map(u => ({ 
        id: u._id, 
        name: u.name, 
        email: u.email 
      }))
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(port, () => {
  console.log(`🚀 Server running on http://localhost:${port}`);
});