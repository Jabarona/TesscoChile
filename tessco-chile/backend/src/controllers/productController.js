const { prisma } = require('../config/database');

// Controlador de productos
const getProducts = async (req, res) => {
  try {
    const products = await prisma.product.findMany({
      include: {
        category: true,
        brand: true
      }
    });
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener productos', error: error.message });
  }
};

const getProductById = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await prisma.product.findUnique({
      where: { id: parseInt(id) },
      include: {
        category: true,
        brand: true
      }
    });
    
    if (!product) {
      return res.status(404).json({ message: 'Producto no encontrado' });
    }
    
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener producto', error: error.message });
  }
};

const createProduct = async (req, res) => {
  try {
    const { name, price, description, categoryId, brandId, imageUrl } = req.body;
    
    const product = await prisma.product.create({
      data: {
        name,
        price: parseFloat(price),
        description,
        categoryId: parseInt(categoryId),
        brandId: parseInt(brandId),
        imageUrl
      }
    });
    
    res.status(201).json(product);
  } catch (error) {
    res.status(500).json({ message: 'Error al crear producto', error: error.message });
  }
};

module.exports = {
  getProducts,
  getProductById,
  createProduct
};
