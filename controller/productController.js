import Product from '../model/productModel.js';
import { validationResult } from 'express-validator';
import Category from '../model/categoryModel.js';

export const addProduct = async (req, res) => {
  const { name, description, price, category, stock, images } = req.body;

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      statusCode: 400,
      message: 'Validation error',
      errors: errors.array(),
    });
  }

  // 2. Ensure the user is an admin
  const { role, id } = req.user;

  if (role !== 'admin') {
    return res.status(403).json({
      success: false,
      statusCode: 403,
      message: 'Permission denied. Only admins can add products.',
    });
  }

  try {
    // 3. Check if the category exists
    const existingCategory = await Category.findOne({ name: category });

    if (!existingCategory) {
      return res.status(404).json({
        success: false,
        statusCode: 404,
        message: `Category '${category}' does not exist. Please create the category first.`,
      });
    }

    // 4. Create the new product
    const newProduct = new Product({
      name,
      description,
      price,
      category: existingCategory._id, // Store the category's ID
      stock,
      images,
      adminId: id, // Reference to the admin who added the product
    });

    // Save the product to the database
    await newProduct.save();

    return res.status(201).json({
      success: true,
      statusCode: 201,
      message: 'Product added successfully.',
      product: newProduct,
    });
  } catch (error) {
    console.error('Error in addProduct:', error.message);
    return res.status(500).json({
      success: false,
      statusCode: 500,
      message: `Internal server error: ${error.message}`,
    });
  }
};

// Get all products
export const getAllProducts = async (req, res) => {
  try {
    const products = await Product.find().populate('category', 'name');
    return res.status(200).json({ success: true, products });
  } catch (error) {
    console.error('Error fetching products:', error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Get a product by ID
export const getProductById = async (req, res) => {
  const { id } = req.params;

  try {
    const product = await Product.findById(id).populate('category', 'name');
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    return res.status(200).json({ success: true, product });
  } catch (error) {
    console.error('Error fetching product:', error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Update a product
export const updateProduct = async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  try {
    const product = await Product.findByIdAndUpdate(id, updates, { new: true }).populate('category', 'name');
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    return res.status(200).json({ success: true, message: 'Product updated successfully.', product });
  } catch (error) {
    console.error('Error updating product:', error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Delete a product
export const deleteProduct = async (req, res) => {
  const { id } = req.params;

  try {
    const product = await Product.findByIdAndDelete(id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    return res.status(200).json({ success: true, message: 'Product deleted successfully.' });
  } catch (error) {
    console.error('Error deleting product:', error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
};
