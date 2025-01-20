import dotenv from 'dotenv';
import express from 'express';
import mongoose from 'mongoose';
import authRoutes from './route/authroutes.js';
import productRoutes from './route/productRoutes.js'; 
import orderRoutes from './route/orderRoutes.js';
import categoryRoutes from './route/categoryRoutes.js';

dotenv.config();
const app = express();

// Middleware
app.use(express.json());
app.get('/',(req, res)=> {
    res.send('Hello you have hitted clozet admin API');
})
// user Routes
app.use('/api/auth', authRoutes);
// product routes
app.use('/api/products', productRoutes);
// order routes
app.use('/api/orders', orderRoutes);
// category routes
app.use('/api/category', categoryRoutes);
// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI) 
  .then(() => {
    console.log('Connected to MongoDB');
    app.listen(process.env.PORT, () => {
      console.log(`Server running on http://localhost:${process.env.PORT}`);
    });
  })
  .catch((error) => console.error('MongoDB connection error:', error));