import mongoose from "mongoose";

const connectDB = async () => {
  try {
    // Remove the connection closing - it causes issues
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI, {
        bufferCommands: false,
        maxPoolSize: 10,
      }); 
      console.log('✅ Database Connected successfully');
    } else {
      console.log('✅ Using existing database connection');
    }
  } catch (error) {
    console.log('❌ Error connecting to MongoDB:', error);
    process.exit(1);
  }
};

export default connectDB;