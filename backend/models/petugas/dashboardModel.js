const pool = require('../../config/db');

class PetugasDashboardModel {
    /**
     * ✅ [DIPERBAIKI] Mengambil semua data metrik untuk dasbor petugas
     * dengan cara yang benar untuk memanggil Stored Procedure dengan OUT parameter.
     */
    static async getDashboardData(officerId) {
        let connection; // Deklarasikan koneksi di luar blok try
        try {
            // LANGKAH 1: Dapatkan satu koneksi dari pool
            connection = await pool.getConnection();

            // LANGKAH 2: Panggil prosedur dan ambil hasilnya dalam satu koneksi yang sama
            const [results] = await connection.query('CALL GetPetugasDashboardStats(?, @dashboardResult); SELECT @dashboardResult AS result;', [officerId]);
            
            // Hasil dari SELECT @dashboardResult akan ada di indeks kedua dari array 'results'
            const dashboardResult = results[1][0].result;
            
            // Jika prosedur tidak mengembalikan apa-apa, lemparkan error
            if (!dashboardResult) {
                throw new Error('Stored procedure tidak mengembalikan hasil.');
            }

            // Hasilnya adalah string JSON, jadi kita perlu mem-parse-nya
            const parsedResult = JSON.parse(dashboardResult);

            if (!parsedResult.success) {
                // Jika prosedur itu sendiri mengembalikan error, lemparkan pesannya
                throw new Error(parsedResult.message);
            }

            // Kembalikan hanya bagian 'data' dari objek JSON
            return parsedResult.data;

        } catch (error) {
            throw error; // Lemparkan error agar bisa ditangkap oleh controller
        } finally {
            // LANGKAH 3: Selalu lepaskan koneksi setelah selesai
            if (connection) connection.release();
        }
    }
}

module.exports = PetugasDashboardModel;