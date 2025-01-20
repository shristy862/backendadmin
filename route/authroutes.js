import express from 'express';
import {  signup, verifyOTP, login ,getDashboardData } from '../controller/authController.js';
import { verifyToken } from '../middleware/authToken.js';

const router = express.Router();

// Signup route
router.post('/signup',signup );

// Otp Verification Route
router.post('/verify', verifyOTP);

// Login Route
router.post('/login', login);

// Protected Dashboard Route

router.get('/dashboard', verifyToken, getDashboardData);

export default router;
