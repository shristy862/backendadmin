import Order from '../model/orderModel.js';
import Product from '../model/productModel.js';

export const placeOrder = async (req, res) => {
  const { items } = req.body; 
  const { id: userId } = req.user; 

  try {
    // Validate items array
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Order must contain at least one product.',
      });
    }

    // Calculate total price and validate products
    let totalPrice = 0;
    for (const item of items) {
      const product = await Product.findById(item.productId);

      if (!product) {
        return res.status(404).json({
          success: false,
          message: `Product with ID ${item.productId} not found.`,
        });
      }

      if (item.quantity > product.stock) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for product: ${product.name}.`,
        });
      }

      totalPrice += product.price * item.quantity;
    }

    // Create the order
    const newOrder = new Order({
      userId,
      items,
      totalPrice,
      status: 'pending',
      orderTime: new Date(),
    });

    // Save the order
    await newOrder.save();

    return res.status(201).json({
      success: true,
      message: 'Order placed successfully.',
      order: newOrder,
    });
  } catch (error) {
    console.error('Error placing order:', error.message);
    return res.status(500).json({
      success: false,
      message: `Internal server error: ${error.message}`,
    });
  }
};

export const updateOrderStatus = async (req, res) => {
  const { orderId, status } = req.body;

  try {
    // Check if the user is an admin
    const { role } = req.user;
    if (role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Permission denied. Only admins can update order statuses.',
      });
    }

    // Validate the status
    const validStatuses = ['pending', 'approved', 'rejected', 'shipped', 'delivered'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Valid statuses are: ${validStatuses.join(', ')}`,
      });
    }

    // Find the order by ID
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: `Order with ID '${orderId}' not found.`,
      });
    }

    // Update the order status
    order.status = status;
    await order.save();

    return res.status(200).json({
      success: true,
      message: 'Order status updated successfully.',
      order,
    });
  } catch (error) {
    console.error('Error updating order status:', error.message);
    return res.status(500).json({
      success: false,
      message: `Internal server error: ${error.message}`,
    });
  }
};
