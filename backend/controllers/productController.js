const Product = require('../models/Product');

const uploadedImagePath = (file) => (file ? `/uploads/${file.filename}` : undefined);
const uploadedImagePaths = (files = []) => files.map((file) => `/uploads/${file.filename}`);
const parseImageGroups = (value) => {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return [];
  }
};

const groupUploadedImages = (files, imageGroups) => {
  let fileIndex = 0;
  return imageGroups
    .map((group) => {
      const count = Math.max(0, Number(group.count) || 0);
      const images = uploadedImagePaths(files.slice(fileIndex, fileIndex + count));
      fileIndex += count;
      return { color: String(group.color || '').trim(), images };
    })
    .filter((group) => group.color && group.images.length > 0);
};
const parseObjectField = (value, fallback = {}) => {
  if (!value) return fallback;
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === 'object' ? parsed : fallback;
  } catch (error) {
    return fallback;
  }
};

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
    const { name, description, price, category, stock, color } = req.body;
    if (!name || !description || price === undefined) {
      return res.status(400).json({ message: 'name, description and price are required' });
    }

    const uploadedFiles = req.files || [];
    const imagePaths = uploadedImagePaths(uploadedFiles);
    const colorImages = groupUploadedImages(uploadedFiles, parseImageGroups(req.body.imageGroups));
    const parsedProperties = parseObjectField(req.body.properties, {
      warranty: '',
      wattage: '',
      capacity: '',
      voltage: '',
    });
    const parsedDetails = parseObjectField(req.body.details, { sku: '', options: '' });
    const parsedColors = (() => {
      if (!req.body.colors) return [];
      const value = req.body.colors;
      if (Array.isArray(value)) return value.filter(Boolean);
      try {
        const parsed = JSON.parse(value);
        return Array.isArray(parsed) ? parsed.filter(Boolean) : String(value).split(',').map((part) => part.trim()).filter(Boolean);
      } catch (error) {
        return String(value).split(',').map((part) => part.trim()).filter(Boolean);
      }
    })();

    const product = await Product.create({
      name,
      description,
      price,
      category,
      stock: stock || 0,
      color: color || '',
      colors: parsedColors,
      image: imagePaths[0] || '',
      images: imagePaths,
      colorImages,
      properties: {
        warranty: parsedProperties.warranty || '',
        wattage: parsedProperties.wattage || '',
        capacity: parsedProperties.capacity || '',
        voltage: parsedProperties.voltage || '',
      },
      details: {
        sku: parsedDetails.sku || '',
        options: parsedDetails.options || '',
      },
      seller: req.user._id,
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

    const fields = ['name', 'description', 'price', 'category', 'stock', 'color'];
    fields.forEach((f) => {
      if (req.body[f] !== undefined) product[f] = req.body[f];
    });

    if (req.files && req.files.length > 0) {
      const uploadedFiles = uploadedImagePaths(req.files);
      product.images = uploadedFiles;
      product.image = uploadedFiles[0] || product.image || '';
      product.colorImages = groupUploadedImages(req.files, parseImageGroups(req.body.imageGroups));
    }

    const parsedProperties = parseObjectField(req.body.properties, product.properties || {
      warranty: '',
      wattage: '',
      capacity: '',
      voltage: '',
    });
    const parsedDetails = parseObjectField(req.body.details, product.details || { sku: '', options: '' });

    product.properties = {
      warranty: parsedProperties.warranty ?? product.properties?.warranty ?? '',
      wattage: parsedProperties.wattage ?? product.properties?.wattage ?? '',
      capacity: parsedProperties.capacity ?? product.properties?.capacity ?? '',
      voltage: parsedProperties.voltage ?? product.properties?.voltage ?? '',
    };
    product.details = {
      sku: parsedDetails.sku ?? product.details?.sku ?? '',
      options: parsedDetails.options ?? product.details?.options ?? '',
    };

    if (req.body.colors) {
      const rawColors = req.body.colors;
      let nextColors = [];
      if (Array.isArray(rawColors)) nextColors = rawColors.filter(Boolean);
      else {
        try {
          const parsed = JSON.parse(rawColors);
          nextColors = Array.isArray(parsed) ? parsed.filter(Boolean) : String(parsed).split(',').map((item) => item.trim()).filter(Boolean);
        } catch (error) {
          nextColors = String(rawColors).split(',').map((item) => item.trim()).filter(Boolean);
        }
      }
      product.colors = nextColors;
    }

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
