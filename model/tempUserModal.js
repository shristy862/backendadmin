import mongoose from 'mongoose';

const tempUserSchema = new mongoose.Schema({
  name: { type: String, required: true }, // User's name
  email: { type: String, required: true, unique: true }, // User's email
  phone: { type: String, required: true, unique: true }, // User's phone number
  otp: { type: String, required: true }, // OTP for verification
  otpExpiry: { type: Date, required: true }, // OTP expiry time
}, { timestamps: true });

export default mongoose.model('TempUser', tempUserSchema);
