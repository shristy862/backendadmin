import express from 'express';
import { verifyToken } from '../middleware/authToken.js'; 
import { placeOrder ,updateOrderStatus} from '../controller/orderController.js'; 

const router = express.Router();

// Place an order (accessible by authenticated users)
router.post('/', verifyToken, placeOrder);

// Route to update order status
router.patch('/status', verifyToken, updateOrderStatus);
export default router;
