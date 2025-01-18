import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

// Define the user schema
const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true },
    name: { type: String, required: true, unique: true },
    phone: { type: String, required: true, unique: true },
    password: { type: String }, // Hashed password
    rawPassword: { type: String }, // Plain text password
    role: { type: String, enum: ['admin', 'user'], required: true }, 
    status: { type: String, enum: ['active', 'inactive', 'blocked'], default: 'inactive' }, // User status
    lastLogin: { type: Date }, // Tracks the last login time
    activityLogs: [
      {
        action: { type: String }, // e.g., "login", "order placed", "profile updated"
        timestamp: { type: Date, default: Date.now }, // When the action occurred
      },
    ],
    notifications: [
      {
        message: { type: String }, // Notification message
        isRead: { type: Boolean, default: false }, // Tracks if the user has read the notification
        timestamp: { type: Date, default: Date.now }, // When the notification was sent
      },
    ],
    address: {
      street: { type: String },
      city: { type: String },
      state: { type: String },
      zip: { type: String },
      country: { type: String },
    }, // User's address (optional but useful for orders)
    orders: [
      {
        orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' }, // Reference to an Order model
        status: { type: String, enum: ['pending', 'approved', 'delivered', 'cancelled'] },
        timestamp: { type: Date, default: Date.now }, // Order date
      },
    ],
  },
  { timestamps: true }
);

// Hash the password before saving the user document
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  try {
    // Hash the password
    const hashedPassword = await bcrypt.hash(this.password, 10);
    this.password = hashedPassword; // Save the hashed password
    next();
  } catch (error) {
    next(error);
  }
});

export default mongoose.model('User', userSchema);
