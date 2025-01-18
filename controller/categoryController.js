import Category from '../model/categoryModel.js';

import { validationResult } from 'express-validator';

// add category
export const addCategory = async (req, res) => {
  const { name, description, status } = req.body;
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
  const { id, role } = req.user; // User from JWT token

  if (role !== 'admin') {
    return res.status(403).json({
      success: false,
      statusCode: 403,
      message: 'Permission denied. Only admins can add categories.',
    });
  }

  try {
    // 3. Create the new category
    const newCategory = new Category({
      name,
      description,
      status,
      admin: id,  // Store only the admin's ID
    });

    // Save the category to the database
    await newCategory.save();

    return res.status(201).json({
      success: true,
      statusCode: 201,
      message: 'Category added successfully.',
      category: newCategory,
    });
  } catch (error) {
    console.error('Error in addCategory:', error.message);
    return res.status(500).json({
      success: false,
      statusCode: 500,
      message: `Internal server error: ${error.message}`,
    });
  }
};

export const getCategories = async (req, res) => {
    try {
      const categories = await Category.find();
      return res.status(200).json({
        success: true,
        message: 'Categories fetched successfully.',
        categories,
      });
    } catch (error) {
      console.error('Error fetching categories:', error);
      return res.status(500).json({
        success: false,
        message: `Internal server error: ${error.message}`,
      });
    }
  };

  export const getCategoryById = async (req, res) => {
    const { categoryId } = req.params;
  
    try {
      const category = await Category.findById(categoryId);
      if (!category) {
        return res.status(404).json({
          success: false,
          message: 'Category not found.',
        });
      }
  
      return res.status(200).json({
        success: true,
        message: 'Category fetched successfully.',
        category,
      });
    } catch (error) {
      console.error('Error fetching category:', error);
      return res.status(500).json({
        success: false,
        message: `Internal server error: ${error.message}`,
      });
    }
  };

  export const updateCategory = async (req, res) => {
    const { categoryId } = req.params;
    const { name, description, status } = req.body;
  
    try {
      const updatedCategory = await Category.findByIdAndUpdate(
        categoryId,
        { name, description, status },
        { new: true } // Return the updated document
      );
  
      if (!updatedCategory) {
        return res.status(404).json({
          success: false,
          message: 'Category not found.',
        });
      }
  
      return res.status(200).json({
        success: true,
        message: 'Category updated successfully.',
        category: updatedCategory,
      });
    } catch (error) {
      console.error('Error updating category:', error);
      return res.status(500).json({
        success: false,
        message: `Internal server error: ${error.message}`,
      });
    }
  };

  export const deleteCategory = async (req, res) => {
    const { categoryId } = req.params;
  
    try {
      const category = await Category.findByIdAndDelete(categoryId);
  
      if (!category) {
        return res.status(404).json({
          success: false,
          message: 'Category not found.',
        });
      }
  
      return res.status(200).json({
        success: true,
        message: 'Category deleted successfully.',
      });
    } catch (error) {
      console.error('Error deleting category:', error);
      return res.status(500).json({
        success: false,
        message: `Internal server error: ${error.message}`,
      });
    }
  };
  