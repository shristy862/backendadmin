import mongoose from 'mongoose';

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Product description is required'],
    },
    price: {
      type: Number,
      required: [true, 'Product price is required'],
      min: [0, 'Price cannot be less than 0'],
    },
    category: {
      type: mongoose.Schema.Types.ObjectId, // Reference to Category collection
      ref: 'Category',
      required: [true, 'Product category is required'],
    },
    adminId: {
      type: mongoose.Schema.Types.ObjectId, // Reference to Admin who created the product
      ref: 'User',
      required: true,
    },
    stock: {
      type: Number,
      required: [true, 'Product stock is required'],
      min: [0, 'Stock cannot be less than 0'],
    },
    images: [
      {
        type: String, // Array of image URLs
      },
    ],
  },
  { timestamps: true }
);

const Product = mongoose.model('Product', productSchema);

export default Product;
