const pool = require('../config/db');
const NodeCache = require('node-cache');

// ✅ TAMBAHKAN: Definisi CACHE_TTL
const CACHE_TTL = 5 * 60 * 1000; // 5 menit dalam milliseconds

// Cache untuk area restriction (TTL 5 menit)
const areaCache = new NodeCache({ stdTTL: 300 });

/**
 * Middleware untuk membatasi akses petugas hanya ke wilayah yang ditugaskan
 * Petugas hanya bisa mengakses data pelanggan di wilayahnya
 */
const areaRestrictionMiddleware = () => {
  return async (req, res, next) => {
    try {
      // Skip jika bukan petugas
      if (!req.user || req.user.role !== 'petugas') {
        return next();
      }

      const userId = req.user.id;
      
      // ✅ Cek cache terlebih dahulu
      const cacheKey = `area_restriction_${userId}`;
      const cachedData = areaCache.get(cacheKey);
      
      if (cachedData && (Date.now() - cachedData.timestamp) < CACHE_TTL) {
        // ✅ Gunakan data dari cache
        req.user.assignedAreas = cachedData.assignedAreas;
        req.user.assignedAreaIds = cachedData.assignedAreaIds;
        
        // ✅ Hanya log di development
        if (process.env.NODE_ENV === 'development') {
        }
        
        return next();
      }

      // ✅ Query database hanya jika tidak ada di cache atau expired

      const [officerAreas] = await pool.execute(`
        SELECT DISTINCT oa.area_id, a.area_name
        FROM officer_areas oa
        JOIN areas a ON oa.area_id = a.area_id
        WHERE oa.user_id = ?
      `, [userId]);

      const assignedAreas = officerAreas.map(row => ({
        area_id: row.area_id,
        area_name: row.area_name
      }));

      if (assignedAreas.length === 0) {
        return res.status(403).json({
          success: false,
          message: 'Petugas belum ditugaskan ke wilayah manapun. Hubungi admin untuk penugasan wilayah.',
          code: 'NO_AREA_ASSIGNED'
        });
      }

      // ✅ Simpan ke cache
      areaCache.set(cacheKey, {
        assignedAreas,
        assignedAreaIds: assignedAreas.map(row => row.area_id),
        timestamp: Date.now()
      });

      // Simpan area yang diizinkan ke req.user
      req.user.assignedAreas = assignedAreas;
      req.user.assignedAreaIds = assignedAreas.map(row => row.area_id);

      next();
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Gagal memverifikasi akses wilayah',
        error: error.message
      });
    }
  };
};

/**
 * Middleware untuk memvalidasi akses ke customer tertentu
 * Memastikan customer berada di wilayah yang ditugaskan ke petugas
 */
const validateCustomerAccess = () => {
  return async (req, res, next) => {
    try {
      // Skip jika bukan petugas
      if (!req.user || req.user.role !== 'petugas') {
        return next();
      }

      // Ambil customer ID dari parameter atau body
      const customerId = req.params.customerId || req.params.customer_id || req.body.customer_id;

      if (!customerId) {
        return next(); // Lanjut jika tidak ada customer ID spesifik
      }

      // Cek apakah customer berada di wilayah yang ditugaskan
      const [customerRows] = await pool.execute(`
        SELECT c.customer_id, c.full_name, c.area_id, a.area_name
        FROM customers c
        JOIN areas a ON c.area_id = a.area_id
        WHERE c.customer_id = ?
      `, [customerId]);

      if (customerRows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Pelanggan tidak ditemukan',
          code: 'CUSTOMER_NOT_FOUND'
        });
      }

      const customer = customerRows[0];

      // Periksa apakah customer berada di wilayah yang ditugaskan
      if (!req.user.assignedAreaIds.includes(customer.area_id)) {
        return res.status(403).json({
          success: false,
          message: `Akses ditolak. Pelanggan ${customer.full_name} berada di wilayah ${customer.area_name} yang tidak ditugaskan kepada Anda.`,
          code: 'CUSTOMER_AREA_RESTRICTED',
          data: {
            customer_area: customer.area_name,
            assigned_areas: req.user.assignedAreas.map(area => area.area_name)
          }
        });
      }

      // Simpan info customer ke request untuk digunakan di controller
      req.customer = customer;

      next();
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Gagal memvalidasi akses pelanggan',
        error: error.message
      });
    }
  };
};

/**
 * Helper function untuk menambahkan filter area ke query
 * Digunakan di model untuk membatasi data berdasarkan area
 */
const addAreaFilter = (baseQuery, whereConditions, queryParams, userAreaIds) => {
  if (userAreaIds && userAreaIds.length > 0) {
    const placeholders = userAreaIds.map(() => '?').join(',');
    whereConditions.push(`c.area_id IN (${placeholders})`);
    queryParams.push(...userAreaIds);
  }
  return { baseQuery, whereConditions, queryParams };
};

/**
 * Helper function untuk memvalidasi area access dalam transaksi
 */
const validateAreaAccessInTransaction = async (connection, userId, areaId) => {
  const [rows] = await connection.execute(`
    SELECT 1 FROM officer_areas
    WHERE user_id = ? AND area_id = ?
  `, [userId, areaId]);

  return rows.length > 0;
};

// ✅ Tambahkan method untuk invalidate cache
const invalidateAreaCache = (userId) => {
  const cacheKey = `area_restriction_${userId}`;
  areaCache.del(cacheKey);
};

// ✅ TAMBAHKAN: Method untuk clear semua cache
const clearAreaCache = () => {
  areaCache.clear();
};

module.exports = {
  areaRestrictionMiddleware,
  validateCustomerAccess,
  addAreaFilter,
  validateAreaAccessInTransaction,
  invalidateAreaCache,
  clearAreaCache
};