const Cart = require('../models/Cart');
const Product = require('../models/Product');

const populatedCart = (cart) => cart.populate({
  path: 'items.product',
  populate: { path: 'seller', select: 'name email' },
});

const getOrCreateCart = async (userId) => {
  let cart = await Cart.findOne({ user: userId });
  if (!cart) cart = await Cart.create({ user: userId, items: [] });
  return cart;
};

// @route GET /api/cart (buyer only)
const getCart = async (req, res) => {
  try {
    if (req.user.role !== 'user') {
      const carts = await Cart.find()
        .populate('user', 'name email role')
        .populate({
          path: 'items.product',
          populate: { path: 'seller', select: 'name email' },
        });
      return res.json({ carts });
    }

    const cart = await getOrCreateCart(req.user._id);
    res.json(await populatedCart(cart));
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch cart', error: err.message });
  }
};

// @route POST /api/cart (buyer only)
const addToCart = async (req, res) => {
  try {
    if (req.user.role !== 'user') {
      return res.status(403).json({ message: 'Only buyers can add items to a cart' });
    }

    const { productId, quantity = 1 } = req.body;
    const requestedQuantity = Number(quantity);
    if (!productId || !Number.isInteger(requestedQuantity) || requestedQuantity < 1) {
      return res.status(400).json({ message: 'productId and a positive integer quantity are required' });
    }

    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    const cart = await getOrCreateCart(req.user._id);
    const item = cart.items.find((cartItem) => cartItem.product.toString() === productId);
    const nextQuantity = (item?.quantity || 0) + requestedQuantity;
    if (nextQuantity > product.stock) {
      return res.status(400).json({ message: `Only ${product.stock} available in stock` });
    }

    if (item) item.quantity = nextQuantity;
    else cart.items.push({ product: product._id, quantity: requestedQuantity });
    await cart.save();
    res.status(201).json(await populatedCart(cart));
  } catch (err) {
    res.status(500).json({ message: 'Failed to add item to cart', error: err.message });
  }
};

// @route PUT /api/cart/:productId (buyer only)
const updateCartItem = async (req, res) => {
  try {
    if (!['user', 'admin'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Sellers cannot update cart items' });
    }

    const requestedQuantity = Number(req.body.quantity);
    if (!Number.isInteger(requestedQuantity) || requestedQuantity < 1) {
      return res.status(400).json({ message: 'Quantity must be a positive integer' });
    }

    const product = await Product.findById(req.params.productId);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    if (requestedQuantity > product.stock) {
      return res.status(400).json({ message: `Only ${product.stock} available in stock` });
    }

    const cartUserId = req.user.role === 'admin' ? req.query.userId : req.user._id;
    if (!cartUserId) return res.status(400).json({ message: 'userId is required for admin cart changes' });
    const cart = await Cart.findOne({ user: cartUserId });
    const item = cart?.items.find((cartItem) => cartItem.product.toString() === req.params.productId);
    if (!item) return res.status(404).json({ message: 'Product is not in your cart' });

    item.quantity = requestedQuantity;
    await cart.save();
    res.json(await populatedCart(cart));
  } catch (err) {
    res.status(500).json({ message: 'Failed to update cart item', error: err.message });
  }
};

// @route DELETE /api/cart/:productId (buyer only)
const removeCartItem = async (req, res) => {
  try {
    if (req.user.role === 'seller') {
      return res.status(403).json({ message: 'Sellers cannot remove cart items' });
    }

    const cartUserId = req.user.role === 'admin' ? req.query.userId : req.user._id;
    if (!cartUserId) return res.status(400).json({ message: 'userId is required for admin cart changes' });
    const cart = await Cart.findOne({ user: cartUserId });
    if (!cart) return res.json({ user: cartUserId, items: [] });

    cart.items = cart.items.filter((item) => item.product.toString() !== req.params.productId);
    await cart.save();
    res.json(await populatedCart(cart));
  } catch (err) {
    res.status(500).json({ message: 'Failed to remove cart item', error: err.message });
  }
};

module.exports = { getCart, addToCart, updateCartItem, removeCartItem };