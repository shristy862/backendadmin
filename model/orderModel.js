import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    items: [
      {
        productId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Product',
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
          min: [1, 'Quantity must be at least 1'],
        },
      },
    ],
    totalPrice: {
      type: Number,
      required: true,
      min: [0, 'Total price cannot be less than 0'],
    },
    status: {
      type: String,
      enum: ['pending', 'approved','shipped', 'delivered', 'canceled'],
      default: 'pending',
    },
    orderTime: {
      type: Date,
      default: Date.now, // Automatically sets the order time
    },
  },
  { timestamps: true }
);

export default mongoose.model('Order', orderSchema);
