import express from 'express';
import { verifyOTP, login ,getDashboardData ,requestOTP} from '../controller/authController.js';
import { verifyToken } from '../middleware/authToken.js';

const router = express.Router();

// Signup route
router.post('/signup',requestOTP );

// Otp Verification Route
router.post('/verify-otp', verifyOTP);

// router.post('/signup', signup);
// Login Route
router.post('/login', login);
// Protected Dashboard Route
router.get('/dashboard', verifyToken, getDashboardData);

export default router;
