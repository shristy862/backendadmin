import express from 'express';
import { verifyToken } from '../middleware/authToken.js';  
import { addProduct , getAllProducts , getProductById , updateProduct, deleteProduct} from '../controller/productController.js'; 
import { body } from 'express-validator'; 

const router = express.Router();

// Product validation middleware
const validateProduct = [
  body('name').isString().withMessage('Name must be a string').notEmpty().withMessage('Name is required'),
  body('description').isString().withMessage('Description must be a string').notEmpty().withMessage('Description is required'),
  body('price').isNumeric().withMessage('Price must be a number').isFloat({ min: 0 }).withMessage('Price must be greater than or equal to 0'),
  body('category').isString().withMessage('Category must be a string').notEmpty().withMessage('Category is required'),
];

// Add product route (only accessible by admins)
router.post('/', verifyToken, validateProduct, addProduct);

// Get all products
router.get('/',verifyToken ,getAllProducts);

// Get a product by ID
router.get('/:id',verifyToken, getProductById);

// Update a product
router.put('/:id', verifyToken , updateProduct);

// Delete a product
router.delete('/:id', verifyToken , deleteProduct);

export default router;
