const CustomerPageModel = require('../../models/petugas/customerPageModel');

const getMyAreaCustomers = async (req, res) => {
  try {
    // Data 'assignedAreaIds' ini datang dari areaRestrictionMiddleware
    const assignedAreaIds = req.user.assignedAreaIds;

    // Validasi bahwa middleware telah memberikan ID area
    if (!assignedAreaIds || assignedAreaIds.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'Akses ditolak. Petugas tidak memiliki penugasan wilayah.',
        code: 'NO_AREA_ASSIGNED'
      });
    }

    // Memanggil fungsi dari customerPageModel yang menggunakan VIEW
    const customers = await CustomerPageModel.findCustomersByAreaIds(assignedAreaIds);

    // Mengirim respons sukses dengan data yang didapat dari model
    res.status(200).json({
      success: true,
      message: `[VIEW] Berhasil mengambil ${customers.length} pelanggan.`,
      source: 'v_customer_history_summary',
      data: customers,
    });

  } catch (error) {
    // Menangkap error jika terjadi di level model atau controller
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server.',
      error: error.message,
    });
  }
};

module.exports = {
  getMyAreaCustomers,
};