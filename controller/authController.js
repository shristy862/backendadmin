import User from '../model/userModel.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken'; 
import Order from '../model/orderModel.js';
import TempUser from '../model/tempUserModal.js';
import { sendOTP, generateRandomOTP } from '../utils/otpService.js';


const ALLOWED_ROLES = ['admin', 'user'];  

// Create a temporary user and send OTP to phone
export const requestOTP = async (req, res) => {
  const { name, email, phone } = req.body;

  // 1. Validate input
  if (!name || !email || !phone) {
    return res.status(400).json({
      success: false,
      statusCode: 400,
      message: 'Name, email, and phone are required.',
    });
  }

  try {
    // 2. Check if email or phone already exists in TempUser or User collections
    const existingTempUser = await TempUser.findOne({ $or: [{ email }, { phone }] });

    if (existingTempUser) {
      return res.status(409).json({
        success: false,
        statusCode: 409,
        message: 'Email or phone already exists. Please use a different one.',
      });
    }

    // 3. Generate OTP
    const otp = generateRandomOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); 

    // 4. Save TempUser
    const tempUser = new TempUser({ name, email, phone, otp, otpExpiry });
    await tempUser.save();

    // 5. Send OTP to phone
    await sendOTP(phone, otp, 'phone');

    return res.status(201).json({
      success: true,
      statusCode: 201,
      message: 'Temporary user registered. OTP sent to phone successfully.',
    });
  } catch (error) {
    console.error('Error in registering temp user:', error.message);
    return res.status(500).json({
      success: false,
      statusCode: 500,
      message: `Internal server error: ${error.message}`,
    });
  }
};

// Verify OTP and move user to permanent User collection
export const verifyOTP = async (req, res) => {
  const { phone, otp } = req.body;

  // 1. Validate input
  if (!phone || !otp) {
    return res.status(400).json({
      success: false,
      statusCode: 400,
      message: 'Phone and OTP are required.',
    });
  }

  try {
    // 2. Find TempUser by phone
    const tempUser = await TempUser.findOne({ phone });

    if (!tempUser) {
      return res.status(404).json({
        success: false,
        statusCode: 404,
        message: 'Temporary user not found. Please register again.',
      });
    }

    // 3. Validate OTP
    if (tempUser.otp !== otp || new Date() > tempUser.otpExpiry) {
      return res.status(400).json({
        success: false,
        statusCode: 400,
        message: 'Invalid or expired OTP.',
      });
    }

    // 4. Move user to permanent User collection
    const newUser = new User({
      name: tempUser.name,
      email: tempUser.email,
      phone: tempUser.phone,
      role: 'user',  // Default role for signup
      status: 'active',  // Set status as 'active'
    });

    // 5. Save the new user
    await newUser.save();

    // 6. Delete TempUser to clean up
    await TempUser.findByIdAndDelete(tempUser._id);

    return res.status(201).json({
      success: true,
      statusCode: 201,
      message: 'User verified and registered successfully.',
    });
  } catch (error) {
    console.error('Error in verifying OTP:', error.message);
    return res.status(500).json({
      success: false,
      statusCode: 500,
      message: `Internal server error: ${error.message}`,
    });
  }
};

export const login = async (req, res) => {
    const { email, password } = req.body;
  
    // 1. Validate input fields
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        statusCode: 400,
        message: 'Email and password are required',
      });
    }
  
    try {
      // 2. Check if the user exists
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(404).json({
          success: false,
          statusCode: 404,
          message: 'User not found. Please signup first.',
        });
      }
  
      // 3. Compare the raw password with the hashed password stored in the database
      const isPasswordValid = await bcrypt.compare(password, user.password);
  
      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          statusCode: 401,
          message: 'Invalid credentials. Please try again.',
        });
      }
  
      // 4. Generate a JWT token with user info in the payload
      const token = jwt.sign(
        { id: user._id, email: user.email, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: '1h' } 
      );
  
      // 5. Send success response with the token and user info
      return res.status(200).json({
        success: true,
        statusCode: 200,
        message: 'Login successful',
        token,
        user: {
  
  
          id: user._id,
          email: user.email,
          role: user.role,
        },
      });
  
    } catch (error) {
      console.error('Error in login:', error.message);
      return res.status(500).json({
        success: false,
        statusCode: 500,
        message: `Internal server error: ${error.message}`,
      });
    }
  };

  // Dashboard route (protected)
  export const getDashboardData = async (req, res) => {
    try {
      const role = req.user.role;
  
      if (role === 'admin') {
        // Admin dashboard data
  
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
                $gte: new Date(currentDate - 24 * 60 * 60 * 1000), // Filter orders placed within the last 24 hours
              },
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
            $unwind: '$items', // Unwind the items array in each order
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
   