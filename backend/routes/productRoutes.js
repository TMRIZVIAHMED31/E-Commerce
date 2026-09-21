const express = require('express');
const multer = require('multer');
const {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getMyProducts,
} = require('../controllers/productController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, callback) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) return callback(null, true);
    callback(new Error('Only JPG, PNG, and WEBP images are allowed'));
  },
});

router.get('/', getProducts);
router.get('/mine/list', protect, authorize('seller', 'admin'), getMyProducts);
router.get('/:id', getProductById);

router.post('/', protect, authorize('seller', 'admin'), upload.array('images', 30), createProduct);
router.put('/:id', protect, authorize('seller', 'admin'), upload.array('images', 30), updateProduct);
router.delete('/:id', protect, authorize('seller', 'admin'), deleteProduct);

module.exports = router;
