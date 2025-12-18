const express = require('express');
const { prisma } = require('../config/database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// GET /api/settings - Obtener todas las configuraciones (público para algunas, requiere auth para otras)
router.get('/', async (req, res) => {
  try {
    const settings = await prisma.settings.findMany();
    
    // Convertir a objeto clave-valor
    const settingsObj = {};
    settings.forEach(setting => {
      settingsObj[setting.key] = setting.value;
    });
    
    // Valores por defecto si no existen
    const defaults = {
      shippingCost: '5000',
      freeShippingThreshold: '50000'
    };
    
    // Combinar con defaults (los valores de la BD tienen prioridad)
    const finalSettings = { ...defaults, ...settingsObj };
    
    res.json({
      success: true,
      data: finalSettings
    });
  } catch (error) {
    console.error('Error obteniendo configuraciones:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// GET /api/settings/:key - Obtener una configuración específica (público)
router.get('/:key', async (req, res) => {
  try {
    const { key } = req.params;
    
    const setting = await prisma.settings.findUnique({
      where: { key }
    });
    
    if (!setting) {
      // Retornar valores por defecto si no existe
      const defaults = {
        shippingCost: '5000',
        freeShippingThreshold: '50000'
      };
      
      return res.json({
        success: true,
        data: {
          key,
          value: defaults[key] || null
        }
      });
    }
    
    res.json({
      success: true,
      data: {
        key: setting.key,
        value: setting.value
      }
    });
  } catch (error) {
    console.error('Error obteniendo configuración:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// PUT /api/settings/:key - Actualizar una configuración (requiere admin)
router.put('/:key', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { key } = req.params;
    const { value } = req.body;
    
    if (value === undefined || value === null) {
      return res.status(400).json({
        success: false,
        message: 'El valor es requerido'
      });
    }
    
    // Validar que la clave sea válida
    const validKeys = ['shippingCost', 'freeShippingThreshold'];
    if (!validKeys.includes(key)) {
      return res.status(400).json({
        success: false,
        message: 'Clave de configuración no válida'
      });
    }
    
    // Validar que el valor sea un número para estas claves
    if (validKeys.includes(key)) {
      const numValue = parseFloat(value);
      if (isNaN(numValue) || numValue < 0) {
        return res.status(400).json({
          success: false,
          message: 'El valor debe ser un número positivo'
        });
      }
    }
    
    // Actualizar o crear la configuración
    const setting = await prisma.settings.upsert({
      where: { key },
      update: { value: String(value) },
      create: {
        key,
        value: String(value)
      }
    });
    
    res.json({
      success: true,
      message: 'Configuración actualizada exitosamente',
      data: {
        key: setting.key,
        value: setting.value
      }
    });
  } catch (error) {
    console.error('Error actualizando configuración:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

module.exports = router;

