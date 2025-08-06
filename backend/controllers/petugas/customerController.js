const customerModel = require('../../models/petugas/customerModel');
const { logger } = require('../../utils/logger');

const getCustomers = async (req, res) => {
  // ✅ TAMBAHKAN: Definisi startTime di awal fungsi
  const startTime = Date.now();
  
  try {
    // Ambil parameter query dengan nilai default
    const {
      search = '',
      status = 'all',
      usage = 'all',
      page = 1,
      perPage = 10
    } = req.query;

    const currentPage = parseInt(page);
    const per_Page = parseInt(perPage);
    const offset = (currentPage - 1) * per_Page;

    // ✅ HAPUS: Debug log yang berlebihan
    // ('🔍 Customer Search Request:', { ... });
    // ('👤 User Info:', { ... });

    // ✅ TAMBAHKAN: Log hanya di development
    if (process.env.NODE_ENV === 'development') {
      logger.debug('Customer search request', {
        search,
        status,
        usage,
        currentPage,
        per_Page,
        userId: req.user?.id
      });
    }

    // ✅ AREA RESTRICTION: Panggil model dengan filter area untuk petugas
    const { customers, total } = await customerModel.getCustomers(
      search,
      status,
      usage,
      offset,
      per_Page,
      req.user?.assignedAreaIds // Pass area restriction
    );

    // ✅ HAPUS: Debug log yang berlebihan
    // ('📊 Customer Search Results:', { ... });

    // ✅ TAMBAHKAN: Log performance warning jika terlalu lambat
    const duration = Date.now() - startTime;
    if (duration > 1000) {
      logger.warn('Slow customer search', {
        duration,
        userId: req.user?.id,
        searchTerm: search,
        resultCount: customers.length
      });
    }

    // ✅ TAMBAHKAN: Log hanya di development
    if (process.env.NODE_ENV === 'development') {
      logger.debug('Customer search completed', {
        totalFound: total,
        customersReturned: customers.length,
        searchTerm: search,
        duration
      });
    }

    // ✅ AREA RESTRICTION: Kirim info area di response header
    if (req.user?.assignedAreas) {
      res.setHeader('X-Assigned-Areas', JSON.stringify(req.user.assignedAreas));
    }

    // Kirim response
    return res.status(200).json({
      success: true,
      data: {
        customers,
        pagination: {
          total,
          currentPage,
          totalPages: Math.ceil(total / per_Page),
          perPage: per_Page,
        },
      },
    });
  } catch (error) {
    // ✅ PERTAHANKAN: Error logging dengan detail
    logger.error('Customer search failed', {
      userId: req.user?.id,
      search: req.query.search,
      error: error.message,
      stack: error.stack
    });
    
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

/**
 * ✅ FUNGSI BARU: Mengambil detail satu pelanggan berdasarkan ID.
 */
const getCustomerDetails = async (req, res) => {
  try {
    const { customerId } = req.params;
    
    // Panggil metode model findById dengan menyertakan filter area dari middleware
    const customer = await customerModel.findById(customerId, req.user?.assignedAreaIds);

    if (customer) {
      res.status(200).json({ success: true, data: customer });
    } else {
      // ✅ PERTAHANKAN: Security log
      logger.warn('Customer access denied', {
        userId: req.user?.id,
        customerId,
        assignedAreas: req.user?.assignedAreaIds
      });
      
      res.status(404).json({ success: false, message: 'Pelanggan tidak ditemukan atau Anda tidak memiliki akses ke area ini.' });
    }
  } catch (error) {
    // ✅ PERTAHANKAN: Error logging dengan detail
    logger.error('Customer details fetch failed', {
      userId: req.user?.id,
      customerId: req.params.customerId,
      error: error.message,
      stack: error.stack
    });
    
    res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server.' });
  }
};

// ✅ UPDATE/ IMPUT NOMOR WA PELANGGAN UNTUK KIRIM STRUK
const updatePhoneNumber = async (req, res) => {
  try {
    const { customerId } = req.params;
    const { phone_number } = req.body; // Sesuaikan dengan nama kolom

    if (!phone_number) {
      return res.status(400).json({ success: false, message: 'Nomor telepon wajib diisi.' });
    }

    const result = await customerModel.updatePhoneNumber(customerId, phone_number);
    res.status(200).json(result);

  } catch (error) {
    logger.error('Failed to update phone number', {
      userId: req.user?.id,
      customerId: req.params.customerId,
      error: error.message
    });
    res.status(500).json({ success: false, message: error.message || 'Terjadi kesalahan pada server.' });
  }
};

module.exports = {
  getCustomers,
  getCustomerDetails,
  updatePhoneNumber,
};