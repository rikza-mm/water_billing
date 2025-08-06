const pool = require('../../config/db');

class PaymentModel {
    static async create(paymentData, connection) {
        const db = connection || pool;
        // Hapus properti yang tidak ada di tabel `payments`
        const { customer_id, ...dataToInsert } = paymentData;
        const sql = `INSERT INTO payments SET ?`;
        const [result] = await db.query(sql, [dataToInsert]);
        return result;
    }

    static async getSimulationFromDB(params) {
        const { p_customer_id, p_bill_id, p_amount, p_use_balance, p_priority } = params;
        const sql = `SELECT SimulatePaymentScenario(?, ?, ?, ?, ?) AS simulation`;
        const [rows] = await pool.query(sql, [p_customer_id, p_bill_id, p_amount, p_use_balance, p_priority]);
        if (rows.length > 0 && rows[0].simulation) {
            return JSON.parse(rows[0].simulation);
        }
        return null;
    }

    static async getHistoryByCustomer(customerId) {
        const sql = `SELECT * FROM payment_analysis WHERE customer_id = ? ORDER BY payment_date DESC`;
        const [rows] = await pool.query(sql, [customerId]);
        return rows;
    }

    // ✅ METODE BARU: processSinglePayment dengan parameter lengkap
    static async processSinglePayment(paymentData) {
        const { p_bill_id, p_user_id, p_amount_paid, p_method, p_use_balance, p_proof_url } = paymentData;
        
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            // ✅ Panggil stored procedure dengan 6 parameter input
            await connection.query(
                'CALL ProcessSinglePayment_v2(?, ?, ?, ?, ?, ?, @p_result);', 
                [p_bill_id, p_user_id, p_amount_paid, p_method, p_use_balance, p_proof_url || null]
            );

            // Ambil hasil dari output parameter
            const [outResult] = await connection.query('SELECT @p_result AS result;');
            await connection.commit();
            return JSON.parse(outResult[0].result);

        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            if (connection) connection.release();
        }
    }

    // ✅ UPDATE: processTransaction untuk menggunakan parameter yang benar
    static async processTransaction(paymentData) {
        const { bill_id, user_id, amount, method, use_balance, proof_url } = paymentData;
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            // ✅ Panggil stored procedure dengan 6 parameter (termasuk proof_url)
            await connection.query(
                'CALL ProcessSinglePayment_v2(?, ?, ?, ?, ?, ?, @result);',
                [bill_id, user_id, amount, method, use_balance, proof_url || null]
            );
            
            const [resultRows] = await connection.query('SELECT @result AS result;');
            await connection.commit();
            return JSON.parse(resultRows[0].result);
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            if (connection) connection.release();
        }
    }

    /**
     * ✅ METODE BARU: Memanggil Stored Procedure PayCustomerDebt
     * @param {object} debtPaymentData - Data pembayaran hutang dari controller
     * @returns {Promise<object>} - Hasil dari stored procedure
     */
    static async processDebtPayment(debtPaymentData) {
        const { p_customer_id, p_amount, p_method, p_user_id, p_proof_url } = debtPaymentData;
        const connection = await pool.getConnection();

        try {
            await connection.beginTransaction();

            // Panggil stored procedure dengan 5 parameter input
            await connection.query(
                'CALL PayCustomerDebt(?, ?, ?, ?, ?, @p_result);',
                [p_customer_id, p_amount, p_method, p_user_id, p_proof_url || null]
            );

            const [outResult] = await connection.query('SELECT @p_result AS result;');
            await connection.commit();
            
            if (!outResult[0] || !outResult[0].result) {
                throw new Error('Prosedur PayCustomerDebt tidak mengembalikan hasil.');
            }
            return JSON.parse(outResult[0].result);

        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            if (connection) connection.release();
        }
    }

    static async useBalanceTransaction(balanceData) {
        const { customer_id, user_id } = balanceData;
        const connection = await pool.getConnection();
        try {
            // Panggil stored procedure UseBalanceToPayBills
            await connection.query(
                'CALL UseBalanceToPayBills(?, ?, @result);',
                [customer_id, user_id]
            );
            const [resultRows] = await connection.query('SELECT @result AS result;');
            return JSON.parse(resultRows[0].result);
        } catch (error) {
            throw error;
        } finally {
            connection.release();
        }
    }

    static async getDebtPaymentHistory(customerId) {
        // ✅ PERBAIKAN: Query diubah untuk kompatibilitas dengan MariaDB 10.4
        const sql = `
          SELECT
            p.payment_id,
            p.transaction_date,
            p.amount AS total_payment_amount,
            p.method,
            -- Meniru JSON_ARRAYAGG dengan GROUP_CONCAT dan JSON_OBJECT
            CONCAT('[',
              GROUP_CONCAT(
                JSON_OBJECT(
                  'allocation_id', pa.allocation_id,
                  'bill_id', pa.bill_id,
                  'allocated_amount', pa.amount,
                  'bill_period_start', b.period_start,
                  'bill_period_end', b.period_end,
                  'bill_total_amount', b.amount,      
                  'final_bill_status', b.status        
                )
              ),
            ']') AS allocations
          FROM payments p
          JOIN payment_allocations pa ON p.payment_id = pa.payment_id
          JOIN bills b ON pa.bill_id = b.bill_id
          WHERE p.customer_id = ? AND p.payment_type = 'debt'
          GROUP BY p.payment_id, p.transaction_date, p.amount, p.method
          ORDER BY p.transaction_date DESC;
        `;
        const [rows] = await pool.query(sql, [customerId]);
        
        // Hasil 'allocations' akan menjadi string JSON, perlu di-parse di backend
        // atau biarkan frontend yang melakukan parsing. Untuk konsistensi, kita bisa parse di sini.
        return rows.map(row => ({
          ...row,
          allocations: row.allocations ? JSON.parse(row.allocations) : []
        }));
    }
}

module.exports = PaymentModel;