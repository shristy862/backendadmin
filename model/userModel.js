import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

// Define the user schema
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  name:{type: String, requires:true, unique:true},
  phone:{type: String, requires:true, unique:true},
  password: { type: String },  // Hashed password
  rawPassword: { type: String}, // Plain text password
  role: { type: String, enum: ['admin', 'user'], required: true }, 
  status: { type: String, enum: ['active', 'inactive'], default: 'inactive' }, // User role
}, { timestamps: true });

// Hash the password before saving the user document
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  try {
    // Hash the password
    const hashedPassword = await bcrypt.hash(this.password, 10);
    this.password = hashedPassword;  // Save the hashed password
    next();
  } catch (error) {
    next(error);
  }
});

export default mongoose.model('User', userSchema);
