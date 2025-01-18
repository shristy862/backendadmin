import express from 'express';
import {
  addCategory,
  getCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
} from '../controller/categoryController.js';
import { verifyToken } from '../middleware/authToken.js';
const router = express.Router();

// Create a new category
router.post('/',verifyToken, addCategory);

// Get all categories
router.get('/', verifyToken,getCategories);

// Get category by ID
router.get('/:categoryId', verifyToken,getCategoryById);

// Update category by ID
router.put('/:categoryId', verifyToken,updateCategory);

// Delete category by ID
router.delete('/:categoryId', verifyToken,deleteCategory);

export default router;
