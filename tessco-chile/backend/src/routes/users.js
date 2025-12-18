const express = require('express');
const { prisma } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

const ALLOWED_ROLES = ['admin', 'user'];
const DEFAULT_PAGE_SIZE = 12;
const MAX_PAGE_SIZE = 100;

function parseBoolean(value) {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    if (value.toLowerCase() === 'true') return true;
    if (value.toLowerCase() === 'false') return false;
  }
  return undefined;
}

function normalizePaginationParams(page = 1, limit = DEFAULT_PAGE_SIZE) {
  const pageNumber = Math.max(parseInt(page, 10) || 1, 1);
  const perPage = Math.min(Math.max(parseInt(limit, 10) || DEFAULT_PAGE_SIZE, 1), MAX_PAGE_SIZE);
  const skip = (pageNumber - 1) * perPage;

  return { page: pageNumber, limit: perPage, skip };
}

function formatUserResponse(user) {
  const { _count, orders, ...rest } = user;

  return {
    ...rest,
    ordersCount: _count?.orders || 0,
    lastOrder: orders?.[0]
      ? {
        id: orders[0].id,
        total: orders[0].total,
        createdAt: orders[0].createdAt
      }
      : null
  };
}

async function assertAdmin(req) {
  const currentUser = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: { role: true }
  });

  if (!currentUser || currentUser.role !== 'admin') {
    return false;
  }

  return true;
}

// GET /api/users/admin - Listar usuarios (solo admin)
router.get('/admin', authenticateToken, async (req, res) => {
  try {
    if (!await assertAdmin(req)) {
      return res.status(403).json({ error: 'Acceso denegado' });
    }

    const {
      page = 1,
      limit = DEFAULT_PAGE_SIZE,
      role,
      verified,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const { page: currentPage, limit: perPage, skip } = normalizePaginationParams(page, limit);

    const where = {};

    if (role && ALLOWED_ROLES.includes(role)) {
      where.role = role;
    }

    const verifiedValue = parseBoolean(verified);
    if (verifiedValue !== undefined) {
      where.isVerified = verifiedValue;
    }

    if (search && search.trim()) {
      const query = search.trim();
      where.OR = [
        { email: { contains: query, mode: 'insensitive' } },
        { firstName: { contains: query, mode: 'insensitive' } },
        { lastName: { contains: query, mode: 'insensitive' } },
        { phone: { contains: query, mode: 'insensitive' } },
        { rut: { contains: query, mode: 'insensitive' } }
      ];
    }

    const orderBy = (() => {
      const normalizedOrder = sortOrder === 'asc' ? 'asc' : 'desc';
      switch (sortBy) {
        case 'firstName':
        case 'lastName':
          return [
            { firstName: normalizedOrder },
            { lastName: normalizedOrder }
          ];
        case 'role':
          return [{ role: normalizedOrder }, { createdAt: 'desc' }];
        case 'createdAt':
        default:
          return [{ createdAt: normalizedOrder }];
      }
    })();

    const [users, total, stats] = await Promise.all([
      prisma.user.findMany({
        where,
        orderBy,
        skip,
        take: perPage,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
          rut: true,
          role: true,
          isVerified: true,
          address: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: { orders: true }
          },
          orders: {
            orderBy: { createdAt: 'desc' },
            take: 1,
            select: {
              id: true,
              total: true,
              createdAt: true
            }
          }
        }
      }),
      prisma.user.count({ where }),
      (async () => {
        const [totalUsers, adminUsers, verifiedUsers, recentUsers] = await Promise.all([
          prisma.user.count(),
          prisma.user.count({ where: { role: 'admin' } }),
          prisma.user.count({ where: { isVerified: true } }),
          prisma.user.count({
            where: {
              createdAt: {
                gte: new Date(Date.now() - (7 * 24 * 60 * 60 * 1000)) // últimos 7 días
              }
            }
          })
        ]);

        return {
          totalUsers,
          adminUsers,
          verifiedUsers,
          recentUsers
        };
      })()
    ]);

    res.json({
      users: users.map(formatUserResponse),
      pagination: {
        page: currentPage,
        limit: perPage,
        total,
        pages: Math.ceil(total / perPage)
      },
      stats
    });
  } catch (error) {
    console.error('Error obteniendo usuarios (admin):', error);
    res.status(500).json({ error: 'Error al obtener los usuarios' });
  }
});

// GET /api/users/admin/:id - Obtener detalle de usuario (solo admin)
router.get('/admin/:id', authenticateToken, async (req, res) => {
  try {
    if (!await assertAdmin(req)) {
      return res.status(403).json({ error: 'Acceso denegado' });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        rut: true,
        role: true,
        isVerified: true,
        address: true,
        createdAt: true,
        updatedAt: true,
        orders: {
          orderBy: { createdAt: 'desc' },
          take: 5,
          select: {
            id: true,
            total: true,
            status: true,
            createdAt: true
          }
        },
        _count: {
          select: { orders: true }
        }
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    res.json(formatUserResponse(user));
  } catch (error) {
    console.error('Error obteniendo usuario (admin):', error);
    res.status(500).json({ error: 'Error al obtener la información del usuario' });
  }
});

// PUT /api/users/admin/:id - Actualizar usuario (solo admin)
router.put('/admin/:id', authenticateToken, async (req, res) => {
  try {
    if (!await assertAdmin(req)) {
      return res.status(403).json({ error: 'Acceso denegado' });
    }

    const { role, isVerified, firstName, lastName, phone, rut, address } = req.body;

    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      select: { id: true, role: true }
    });

    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const updateData = {};

    if (role) {
      if (!ALLOWED_ROLES.includes(role)) {
        return res.status(400).json({ error: 'Rol inválido' });
      }

      if (req.params.id === req.user.id && role !== 'admin') {
        return res.status(400).json({ error: 'No puedes cambiar tu propio rol a uno distinto de admin' });
      }

      updateData.role = role;
    }

    if (isVerified !== undefined) {
      updateData.isVerified = !!isVerified;
    }

    if (firstName !== undefined) {
      updateData.firstName = firstName || null;
    }

    if (lastName !== undefined) {
      updateData.lastName = lastName || null;
    }

    if (phone !== undefined) {
      updateData.phone = phone || null;
    }

    if (rut !== undefined) {
      updateData.rut = rut || null;
    }

    if (address !== undefined) {
      if (address && typeof address === 'object') {
        updateData.address = address;
      } else if (!address) {
        updateData.address = null;
      } else {
        return res.status(400).json({ error: 'Formato de dirección inválido' });
      }
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ error: 'No se proporcionaron datos para actualizar' });
    }

    const updatedUser = await prisma.user.update({
      where: { id: req.params.id },
      data: updateData,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        rut: true,
        role: true,
        isVerified: true,
        address: true,
        createdAt: true,
        updatedAt: true,
        _count: { select: { orders: true } },
        orders: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: {
            id: true,
            total: true,
            createdAt: true
          }
        }
      }
    });

    res.json(formatUserResponse(updatedUser));
  } catch (error) {
    console.error('Error actualizando usuario (admin):', error);
    res.status(500).json({ error: 'Error al actualizar el usuario' });
  }
});

// DELETE /api/users/admin/:id - Eliminar usuario (solo admin)
router.delete('/admin/:id', authenticateToken, async (req, res) => {
  try {
    if (!await assertAdmin(req)) {
      return res.status(403).json({ error: 'Acceso denegado' });
    }

    if (req.params.id === req.user.id) {
      return res.status(400).json({ error: 'No puedes eliminar tu propio usuario' });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      select: { id: true, role: true }
    });

    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    if (user.role === 'admin') {
      const otherAdmins = await prisma.user.count({
        where: {
          role: 'admin',
          id: { not: req.params.id }
        }
      });

      if (otherAdmins === 0) {
        return res.status(400).json({ error: 'No se puede eliminar al único administrador' });
      }
    }

    await prisma.user.delete({
      where: { id: req.params.id }
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Error eliminando usuario (admin):', error);
    res.status(500).json({ error: 'Error al eliminar el usuario' });
  }
});

module.exports = router;
