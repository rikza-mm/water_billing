const pool = require("../../config/db.js");

const Transition = {};

Transition.migrateExisting = async (customerData) => {

    if (!customerData) {
        throw new Error("Data pelanggan tidak valid atau tidak lengkap.");
    }

    let connection;
    try {
        connection = await pool.getConnection();

        const {
            fullName, areaId, categoryId, phoneNumber, address,
            registrationDate, meterNumber, lastMeterReading, lastReadingDate,
            initialDebt, initialSaldo, notes, createdByUserId
        } = customerData;

        const spQuery = `CALL InitializeExistingCustomer(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, @p_result)`;

        await connection.query(
            spQuery,
            [
                fullName, areaId, categoryId, phoneNumber, address,
                registrationDate, meterNumber, lastMeterReading, lastReadingDate,
                initialDebt, initialSaldo, notes, createdByUserId
            ]
        );

        const [resSelect] = await connection.query("SELECT @p_result AS result");
        if (!resSelect[0]?.result) {
            throw new Error("Output dari Stored Procedure adalah NULL.");
        }

        const spResult = JSON.parse(resSelect[0].result);

        if (spResult.success) {
            return spResult;
        } else {
            throw new Error(spResult.message);
        }
    } catch (error) {
        throw error;
    } finally {
        if (connection) connection.release();
    }
};

module.exports = Transition;