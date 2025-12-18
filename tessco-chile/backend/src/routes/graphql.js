const express = require('express');
const config = require('../config/app');
const router = express.Router();

// Ruta de GraphQL
router.get('/', (req, res) => {
  res.json({ 
    message: 'GraphQL endpoint - En desarrollo',
    playground: `${config.apiBaseUrl}/graphql`
  });
});

module.exports = router;
