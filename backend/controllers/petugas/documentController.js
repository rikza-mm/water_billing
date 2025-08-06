const DocumentModel = require('../../models/petugas/documentModel');

const documentController = {
  /**
   * Handler untuk menyimpan URL dokumen baru.
   * Menerima paymentId dari parameter URL, serta document_type dan url dari body.
   */
  async saveDocument(req, res) {
    try {
      const { paymentId } = req.params;
      const { document_type, url } = req.body;

      // Validasi input
      if (!document_type || !url || !['receipt', 'history'].includes(document_type)) {
        return res.status(400).json({ 
          success: false, 
          message: 'Data tidak lengkap atau tipe dokumen tidak valid.' 
        });
      }

      await DocumentModel.saveDocumentUrl(paymentId, document_type, url);

      res.status(201).json({ 
        success: true, 
        message: `Dokumen '${document_type}' berhasil ditautkan ke pembayaran #${paymentId}.` 
      });

    } catch (error) {
      res.status(500).json({ 
        success: false, 
        message: 'Gagal menyimpan URL dokumen.',
        error: error.message 
      });
    }
  },

  /**
   * Handler untuk mendapatkan semua dokumen terkait satu pembayaran.
   */
  async getDocuments(req, res) {
    try {
      const { paymentId } = req.params;
      const documents = await DocumentModel.getDocumentsByPaymentId(paymentId);
      
      res.status(200).json({
        success: true,
        data: documents
      });

    } catch (error) {
      res.status(500).json({ 
        success: false, 
        message: 'Gagal mengambil data dokumen.' 
      });
    }
  },

  /**
 * ✅ FUNGSI BARU: Handler untuk mengambil URL dokumen.
 */
async getDocument(req, res) {
    try {
        const { paymentId, docType } = req.params;
        
        if (!docType || !['receipt', 'history'].includes(docType)) {
            return res.status(400).json({ success: false, message: 'Tipe dokumen tidak valid.' });
        }

        const document = await DocumentModel.getDocumentUrl(paymentId, docType);

        if (!document) {
            return res.status(404).json({ success: false, message: `Dokumen '${docType}' tidak ditemukan untuk pembayaran ini.` });
        }

        res.status(200).json({ success: true, data: document });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Gagal mengambil URL dokumen.' });
    }
}

};

module.exports = documentController;