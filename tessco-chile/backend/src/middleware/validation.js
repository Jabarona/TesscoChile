// Middleware de validación
const validateProduct = (req, res, next) => {
  const { name, price, description } = req.body;
  
  if (!name || !price || !description) {
    return res.status(400).json({ 
      message: 'Nombre, precio y descripción son requeridos' 
    });
  }
  
  next();
};

const validateUser = (req, res, next) => {
  const { email, password, name } = req.body;
  
  if (!email || !password || !name) {
    return res.status(400).json({ 
      message: 'Email, contraseña y nombre son requeridos' 
    });
  }
  
  next();
};

module.exports = {
  validateProduct,
  validateUser
};
