/**
 * Format angka menjadi format mata uang Rupiah
 * @param amount - Jumlah yang akan diformat
 * @returns String dalam format Rupiah (contoh: Rp 1.000.000)
 */
export function formatRupiah(amount: number | string): string {
  // Konversi ke number jika input adalah string
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  // Jika bukan angka yang valid, kembalikan string kosong
  if (isNaN(numAmount)) {
    return 'Rp 0';
  }
  
  // Format angka dengan pemisah ribuan
  const formattedAmount = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(numAmount);
  
  // Hapus simbol non-breaking space yang mungkin ditambahkan oleh Intl.NumberFormat
  return formattedAmount.replace(/\s/g, ' ');
}

/**
 * Format tanggal ke format Indonesia (DD/MM/YYYY)
 * @param date - Tanggal yang akan diformat (string atau Date object)
 * @returns String dalam format DD/MM/YYYY
 */
export function formatDate(date: string | Date): string {
  if (!date) return '-';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  // Jika tanggal tidak valid, kembalikan string kosong
  if (isNaN(dateObj.getTime())) {
    return '-';
  }
  
  // Format tanggal ke DD/MM/YYYY
  const day = String(dateObj.getDate()).padStart(2, '0');
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const year = dateObj.getFullYear();
  
  return `${day}/${month}/${year}`;
}

/**
 * Format tanggal ke format Indonesia lengkap (DD Bulan YYYY)
 * @param date - Tanggal yang akan diformat (string atau Date object)
 * @returns String dalam format DD Bulan YYYY (contoh: 01 Januari 2023)
 */
export function formatDateLong(date: string | Date): string {
  if (!date) return '-';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  // Jika tanggal tidak valid, kembalikan string kosong
  if (isNaN(dateObj.getTime())) {
    return '-';
  }
  
  // Daftar nama bulan dalam bahasa Indonesia
  const months = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];
  
  // Format tanggal ke DD Bulan YYYY
  const day = String(dateObj.getDate()).padStart(2, '0');
  const month = months[dateObj.getMonth()];
  const year = dateObj.getFullYear();
  
  return `${day} ${month} ${year}`;
}

/**
 * Format angka dengan pemisah ribuan
 * @param num - Angka yang akan diformat
 * @returns String dengan pemisah ribuan (contoh: 1.000.000)
 */
export function formatNumber(num: number | string): string {
  // Konversi ke number jika input adalah string
  const numValue = typeof num === 'string' ? parseFloat(num) : num;
  
  // Jika bukan angka yang valid, kembalikan string kosong
  if (isNaN(numValue)) {
    return '0';
  }
  
  // Format angka dengan pemisah ribuan
  return new Intl.NumberFormat('id-ID').format(numValue);
}

/**
 * Format persentase
 * @param value - Nilai yang akan diformat (0-1 atau 0-100)
 * @param decimals - Jumlah angka di belakang koma
 * @returns String dalam format persentase (contoh: 75%)
 */
export function formatPercent(value: number | string, decimals: number = 0): string {
  // Konversi ke number jika input adalah string
  let numValue = typeof value === 'string' ? parseFloat(value) : value;
  
  // Jika bukan angka yang valid, kembalikan string kosong
  if (isNaN(numValue)) {
    return '0%';
  }
  
  // Jika nilai antara 0-1, kalikan dengan 100
  if (numValue > 0 && numValue < 1) {
    numValue = numValue * 100;
  }
  
  // Format angka dengan jumlah desimal yang ditentukan
  return `${numValue.toFixed(decimals)}%`;
}

/**
 * Format nomor meter tanpa trailing zeros
 * @param meterNumber - Nomor meter (string atau number)
 * @returns String nomor meter yang bersih
 */
export function formatMeterNumber(meterNumber: string | number): string {
  if (!meterNumber) return '-';
  
  // Konversi ke string jika number
  const meterStr = String(meterNumber);
  
  // Hapus trailing zeros dan titik desimal jika tidak ada angka setelahnya
  const cleanNumber = meterStr.replace(/\.?0+$/, '');
  
  // Jika hasilnya kosong atau hanya titik, kembalikan '0'
  if (!cleanNumber || cleanNumber === '.') {
    return '0';
  }
  
  return cleanNumber;
}

/**
 * Format nomor meter dengan pemisah ribuan (opsional)
 * @param meterNumber - Nomor meter (string atau number)
 * @param withSeparator - Apakah menggunakan pemisah ribuan
 * @returns String nomor meter yang diformat
 */
export function formatMeterNumberWithSeparator(meterNumber: string | number, withSeparator: boolean = false): string {
  const cleanNumber = formatMeterNumber(meterNumber);
  
  if (!withSeparator) {
    return cleanNumber;
  }
  
  // Tambahkan pemisah ribuan
  return new Intl.NumberFormat('id-ID').format(Number(cleanNumber));
}

/**
 * Format pemakaian air tanpa desimal yang tidak perlu
 * @param waterUsage - Pemakaian air (string atau number)
 * @returns String pemakaian air yang bersih
 */
export function formatWaterUsage(waterUsage: string | number): string {
  if (!waterUsage) return '0 m³';
  
  const usage = Number(waterUsage);
  
  if (isNaN(usage)) {
    return '0 m³';
  }
  
  // Jika angka bulat, tampilkan tanpa desimal
  if (Number.isInteger(usage)) {
    return `${usage} m³`;
  }
  
  // Jika ada desimal, tampilkan dengan 1 angka di belakang koma
  return `${usage.toFixed(1)} m³`;
}
