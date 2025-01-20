import mongoose from 'mongoose';
import argon2 from 'argon2';

const userSchema = new mongoose.Schema({
  role: { type: String, required: true },
  name: { type: String, required: true },
  phone: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  otp: { type: String },
  password: { type: String, required: true },
  rawPassword: { type: String, required: true }, 
  status: { type: String, default: 'inactive' },
}, { timestamps: true });

const User = mongoose.model('User', userSchema);

export default User;
