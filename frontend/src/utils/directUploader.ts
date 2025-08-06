import axiosBackend from '@/lib/axios'; // Untuk request ke backend
import axios from 'axios'; // Untuk upload ke Cloudinary

// Interface untuk respons dari API signature kita
interface SignatureResponse {
  success: boolean;
  signature: string;
  api_key: string;
  cloud_name: string;
  params: {
    timestamp: string;
    folder: string;
  };
}

/**
 * Mengunggah file GAMBAR (bukti meter, bukti bayar, QRIS) ke Cloudinary.
 * @param file - File gambar yang akan diunggah.
 * @param folder - Nama folder tujuan di Cloudinary.
 * @returns {Promise<string>} - URL gambar yang aman dari Cloudinary.
 */
export const uploadImageToCloudinary = async (
  file: File,
  folder: 'meter_proofs' | 'payment_proofs' | 'qris_codes'
): Promise<string> => {
  try {
    // 1. Minta signature ke backend dengan menyertakan nama folder
    const { data: sigData } = await axiosBackend.post<SignatureResponse>('/petugas/uploads/signature', { folder });
    if (!sigData.success) {
      throw new Error('Gagal mendapatkan izin upload dari server.');
    }
    const { signature, api_key, cloud_name, params } = sigData;
    // 2. Siapkan FormData
    const formData = new FormData();
    formData.append('file', file);
    formData.append('api_key', api_key);
    formData.append('signature', signature);
    Object.entries(params).forEach(([key, value]) => {
      formData.append(key, value as string);
    });
    // 3. Upload ke Cloudinary
    const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${cloud_name}/image/upload`;
    const cloudinaryResponse = await axios.post(cloudinaryUrl, formData, {
      timeout: 30000,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    if (cloudinaryResponse.data.error) {
      throw new Error(cloudinaryResponse.data.error.message);
    }
    return cloudinaryResponse.data.secure_url;
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : 'Upload file gagal.');
  }
};

/**
 * Mengunggah file PDF (struk, riwayat) ke Cloudinary.
 * @param pdfBlob - Blob dari file PDF.
 * @param fileName - Nama file yang diinginkan.
 * @param folder - Nama folder tujuan di Cloudinary.
 * @returns {Promise<string>} - URL aman dari file PDF di Cloudinary.
 */
export const uploadPdfToCloudinary = async (
  pdfBlob: Blob,
  fileName: string,
  folder: 'receipts' | 'reports'
): Promise<string> => {
  try {
    // 1. Minta signature ke backend dengan menyertakan nama folder
    const { data: sigData } = await axiosBackend.post<SignatureResponse>('/petugas/uploads/signature', { folder });
    if (!sigData.success) {
      throw new Error('Gagal mendapatkan izin upload PDF dari server.');
    }
    const { signature, api_key, cloud_name, params } = sigData;
    // 2. Siapkan FormData
    const formData = new FormData();
    formData.append('file', new File([pdfBlob], fileName, { type: 'application/pdf' }));
    formData.append('api_key', api_key);
    formData.append('signature', signature);
    Object.entries(params).forEach(([key, value]) => {
      if (key !== 'resource_type') {
        formData.append(key, value as string);
      }
    });
    // 3. Kirim ke endpoint upload RAW Cloudinary
    const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${cloud_name}/raw/upload`;
    const cloudinaryResponse = await axios.post(cloudinaryUrl, formData);
    if (cloudinaryResponse.data.error) {
      throw new Error(cloudinaryResponse.data.error.message);
    }
    return cloudinaryResponse.data.secure_url;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Terjadi kesalahan tidak diketahui.';
    throw new Error(`Gagal mengunggah struk PDF: ${message}`);
  }
};