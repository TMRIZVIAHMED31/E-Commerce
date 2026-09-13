const Product = require('../models/Product');

const uploadedImagePath = (file) => (file ? `/uploads/${file.filename}` : undefined);

// @route GET /api/products
// Public. Supports ?search=&category=&page=&limit=
const getProducts = async (req, res) => {
  try {
    const { search, category, page = 1, limit = 12 } = req.query;
    const filter = {};
    if (category) filter.category = category;
    if (search) filter.$text = { $search: search };

    const skip = (Number(page) - 1) * Number(limit);
    const [products, total] = await Promise.all([
      Product.find(filter).populate('seller', 'name email').skip(skip).limit(Number(limit)).sort({ createdAt: -1 }),
      Product.countDocuments(filter),
    ]);

    res.json({ products, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch products', error: err.message });
  }
};

// @route GET /api/products/:id
const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate('seller', 'name email');
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json(product);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch product', error: err.message });
  }
};

// @route POST /api/products  (seller, admin)
const createProduct = async (req, res) => {
  try {
    const { name, description, price, category, stock } = req.body;
    if (!name || !description || price === undefined) {
      return res.status(400).json({ message: 'name, description and price are required' });
    }

    const product = await Product.create({
      name,
      description,
      price,
      category,
      stock: stock || 0,
      image: uploadedImagePath(req.file) || '',
      seller: req.user._id, // ownership always tied to the creator
    });

    res.status(201).json(product);
  } catch (err) {
    res.status(500).json({ message: 'Failed to create product', error: err.message });
  }
};

// helper: can this req.user modify this product?
const canModify = (user, product) =>
  user.role === 'admin' || (user.role === 'seller' && product.seller.toString() === user._id.toString());

// @route PUT /api/products/:id  (owning seller or admin)
const updateProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    if (!canModify(req.user, product)) {
      return res.status(403).json({ message: 'Forbidden: you can only edit your own products' });
    }

    const fields = ['name', 'description', 'price', 'category', 'stock'];
    fields.forEach((f) => {
      if (req.body[f] !== undefined) product[f] = req.body[f];
    });
    if (req.file) product.image = uploadedImagePath(req.file);

    // Admins are also allowed to reassign a product to a different seller
    if (req.user.role === 'admin' && req.body.seller) {
      product.seller = req.body.seller;
    }

    await product.save();
    res.json(product);
  } catch (err) {
    res.status(500).json({ message: 'Failed to update product', error: err.message });
  }
};

// @route DELETE /api/products/:id  (owning seller or admin)
const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    if (!canModify(req.user, product)) {
      return res.status(403).json({ message: 'Forbidden: you can only delete your own products' });
    }

    await product.deleteOne();
    res.json({ message: 'Product deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete product', error: err.message });
  }
};

// @route GET /api/products/mine/list  (seller's own products, or all for admin)
const getMyProducts = async (req, res) => {
  try {
    const filter = req.user.role === 'admin' ? {} : { seller: req.user._id };
    const products = await Product.find(filter).populate('seller', 'name email').sort({ createdAt: -1 });
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch your products', error: err.message });
  }
};

module.exports = { getProducts, getProductById, createProduct, updateProduct, deleteProduct, getMyProducts };
