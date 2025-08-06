const pool = require('../../config/db');

class DocumentModel {
  /**
   * Menyimpan URL dokumen yang terkait dengan sebuah pembayaran.
   * @param {number} paymentId - ID dari pembayaran terkait.
   * @param {'receipt' | 'history'} documentType - Tipe dokumen ('struk' atau 'riwayat').
   * @param {string} url - URL file dari Cloudinary.
   * @returns {Promise<any>} Hasil dari query insert.
   */
  static async saveDocumentUrl(paymentId, documentType, url) {
    const sql = `
      INSERT INTO payment_documents (payment_id, document_type, url)
      VALUES (?, ?, ?)
    `;
    const [result] = await pool.query(sql, [paymentId, documentType, url]);
    return result;
  }

  /**
   * Mengambil semua dokumen yang terkait dengan sebuah pembayaran.
   * @param {number} paymentId - ID dari pembayaran.
   * @returns {Promise<Array<object>>} Daftar dokumen.
   */
  static async getDocumentsByPaymentId(paymentId) {
    const sql = `
      SELECT document_id, document_type, url, created_at
      FROM payment_documents
      WHERE payment_id = ?
      ORDER BY created_at DESC
    `;
    const [rows] = await pool.query(sql, [paymentId]);
    return rows;
  }

/**
 * ✅ FUNGSI BARU: Mengambil URL dokumen berdasarkan paymentId dan tipe.
 */
static async getDocumentUrl(paymentId, documentType) {
    const sql = `
      SELECT url 
      FROM payment_documents 
      WHERE payment_id = ? AND document_type = ? 
      LIMIT 1
    `;
    const [rows] = await pool.query(sql, [paymentId, documentType]);
    // Mengembalikan objek atau null
    return rows[0] || null;
}

}

module.exports = DocumentModel;