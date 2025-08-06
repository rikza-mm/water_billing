// file: services/documentService.ts

import axios from '@/lib/axios';
import { toast } from 'react-hot-toast';

/**
 * Mengirim URL dokumen ke backend untuk disimpan di tabel payment_documents.
 * @param paymentId - ID dari pembayaran yang terkait.
 * @param documentType - Tipe dokumen ('receipt' atau 'history').
 * @param url - URL file dari Cloudinary.
 */
export async function saveDocumentUrl(paymentId: string, documentType: 'receipt' | 'history', url: string): Promise<void> {
  try {
    // Memanggil endpoint yang sudah kita buat di backend
    await axios.post(`/petugas/documents/payment/${paymentId}`, {
      document_type: documentType,
      url: url,
    });
  } catch {
    // Beri tahu pengguna via toast, tapi jangan hentikan alur utama
    toast.error(`Gagal menyimpan arsip ${documentType} secara otomatis.`);
  }
}