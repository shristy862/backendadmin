import User from '../model/userModel.js';
import TemporaryUser from '../model/tempUserModal.js';
import { generateRandomOTP, sendOTP } from '../utils/otpService.js';
import Order from '../model/orderModel.js'
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// Signup route
export const signup = async (req, res) => {
  const { name, role, phone, email } = req.body;


  // Validate that the phone number is not empty or null
  if (!phone || !phone.trim()) {
    return res.status(400).json({ message: 'Phone number is required' });
  }

  try {
    const existingUser = await TemporaryUser.findOne({ phone });
    if (existingUser) {
      return res.status(400).json({ message: 'Phone number already exists' });
    }

    //Generate OTP
    const otp = generateRandomOTP();
    const otpExpiry = Date.now() + 5 * 60 * 1000;

    //Send OTP via SMS (using AWS SNS or other service)
    const otpSent = await sendOTP(phone, otp);
    if (!otpSent.success) {
      return res.status(500).json({ message: 'Failed to send OTP' });
    }

    //Save the user data in the TemporaryUser collection
    const newUser = new TemporaryUser({
      name,
      role,
      phone,
      email,
      otp,
      otpExpiry,
    });

    await newUser.save();

    // Step 7: Respond with success message
    return res.status(200).json({ message: 'OTP sent successfully!' });
  } catch (error) {
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// Verify OTP and create user
export const verifyOTP = async (req, res) => {
  const { otp, password, phone } = req.body;

  if (!phone || !otp || !password) {
    return res.status(400).json({ message: 'Phone, OTP, and password are required' });
  }

  try {
    const tempUser = await TemporaryUser.findOne({ phone });

    if (!tempUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (Date.now() > tempUser.otpExpiry) {
      return res.status(400).json({ message: 'OTP expired' });
    }

    if (tempUser.otp !== otp) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    // Hash the password before saving it
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create a new user with the hashed password
    const newUser = new User({
      role: tempUser.role,
      name: tempUser.name,
      phone: tempUser.phone,
      email: tempUser.email,
      password: hashedPassword,
      rawPassword: password, // Store the hashed password
      status: 'active',
    });

    await newUser.save();

    // Delete the temporary user
    await TemporaryUser.deleteOne({ phone });

    return res.status(200).json({ message: 'User verified and created successfully!' });
  } catch (error) {
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// login 
export const login = async (req, res) => {
  const { phone, password } = req.body;

  if (!phone || !password) {
    return res.status(400).json({ message: 'Phone and password are required' });
  }

  try {
    // Find the user by phone
    const user = await User.findOne({ phone });

    if (!user) {
      console.log(`User not found with phone: ${phone}`);
      return res.status(404).json({ message: 'User not found' });
    }
    // Verify the password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(400).json({
        success: false,
        statusCode: 400,
        message: 'Invalid credentials. Please try again.',
      });
    }
    // Generate a JWT token
    const token = jwt.sign(
      {
        id: user._id,
        phone: user.phone,
        role: user.role,
      },
      process.env.JWT_SECRET, // Replace with your secret key
      { expiresIn: '1h' } 
    );

    // Respond with the token and user data
    res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        role: user.role,
        phone: user.phone,
        email: user.email,
      },
    });
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Dashboard route (protected)
export const getDashboardData = async (req, res) => {
  try {
    const role = req.user.role;

    if (role === 'admin') {

      // Get the current date and time
      const currentDate = new Date();

      // Get the total number of orders till date
      const totalOrders = await Order.countDocuments();

      // Get the total number of pending orders
      const pendingOrders = await Order.countDocuments({ status: 'pending' });

      // Get active users who have placed orders within the last 24 hours
      const activeUsers = await User.aggregate([
        {
          $lookup: {
            from: 'orders', // Reference to the orders collection
            localField: '_id', // Join on the user ID field
            foreignField: 'userId', // Match the `userId` in the orders collection
            as: 'orders', // Create a new field 'orders' that will store the matched orders
          },
        },
        {
          $unwind: {
            path: '$orders', // Unwind the orders array so that each user order can be processed
            preserveNullAndEmptyArrays: true, // Ensure users with no orders are also included (optional)
          },
        },
        {
          $match: {
            'orders.createdAt': {
              $gte: new Date(currentDate - 24 * 60 * 60 * 1000),},
          },
        },
        {
          $group: {
            _id: '$_id', // Group by the user ID (each user will appear only once)
          },
        },
        {
          $project: {
            _id: 0,
            userId: '$_id',
          },
        },
      ]);

      // Extract the user IDs of active users from the aggregation result
      const activeUserIds = activeUsers.map((user) => user.userId);

      // Fetch the actual user data for the active users
      const activeUserData = await User.find({
        _id: { $in: activeUserIds },
      }).select('email');

      // Fetch products along with their order IDs and statuses
      const productStatuses = await Order.aggregate([
        {
          $unwind: '$items', 
        },
        {
          $lookup: {
            from: 'products', // Reference to the products collection
            localField: 'items.productId', // Join on the product ID in the items
            foreignField: '_id', // Match the `_id` in the products collection
            as: 'productDetails', // Create a new field 'productDetails'
          },
        },
        {
          $unwind: '$productDetails', // Unwind the productDetails array
        },
        {
          $project: {
            _id: 0,
            orderId: '$_id', // Add the order ID
            productId: '$productDetails._id', // Include product ID
            productName: '$productDetails.name', // Include product name
            status: '$status', // Include order status
          },
        },
      ]);

      // Return the response with the dashboard data
      return res.status(200).json({
        success: true,
        data: {
          role: 'admin',
          totalOrders,
          pendingOrders,
          activeUsers: activeUserData,
          productStatuses, // Include product IDs, order IDs, and statuses
        },
      });
    } else if (role === 'user') {
      // User dashboard data

      // Fetch user's orders
      const userOrders = await Order.find({ userId: req.user.id });

      // Fetch user profile
      const userProfile = await User.findById(req.user.id);

      return res.status(200).json({
        success: true,
        data: {
          role: 'user',
          userProfile,
          userOrders,
        },
      });
    } else {
      return res.status(403).json({
        success: false,
        message: 'Invalid role',
      });
    }
  } catch (error) {
    console.error('Error fetching dashboard data:', error);

    if (error.name === 'ValidationError') {
      // Validation errors
      return res.status(400).json({
        success: false,
        message: 'Validation error: ' + error.message,
      });
    } else if (error.name === 'CastError') {
      // Invalid data format error (e.g., invalid ObjectId)
      return res.status(400).json({
        success: false,
        message: 'Invalid data format: ' + error.message,
      });
    } else if (error.message.includes('permission')) {
      // Specific error for permission-related issues
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You do not have the necessary permissions.',
      });
    } else {
      // Generic server error
      return res.status(500).json({
        success: false,
        message: `Internal server error: ${error.message}`,
      });
    }
  }
};
