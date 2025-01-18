import mongoose from 'mongoose';

// Define the category schema
const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true, // Ensure category names are unique
    },
    description: {
      type: String,
      required: true,
    },
    admin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User', // Reference to the User model (admin)
      required: true, // Ensure that an admin id is stored
    },
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active', // Categories are active by default
    },
  },
  { timestamps: true } // This will add createdAt and updatedAt fields automatically
);

// Create the Category model
export default mongoose.model('Category', categorySchema);
