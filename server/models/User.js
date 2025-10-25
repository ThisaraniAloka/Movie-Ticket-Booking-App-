// In models/User.js
import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  _id: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: false, // ✅ Change to false to allow null
    default: null
  },
  name: {
    type: String,
    required: true
  },
  image: {
    type: String,
    default: ""
  }
}, {
  timestamps: true
});

export default mongoose.model("User", userSchema);