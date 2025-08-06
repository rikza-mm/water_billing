class Validator {
  static async validateRequiredFields(body, requiredFields) {
    const missingFields = [];

    requiredFields.forEach((field) => {
      if (body[field] === undefined || body[field] === null) {
        missingFields.push(field);
      }
    });

    if (missingFields.length > 0) {
      throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
    }
  }

  static async validatePhoneNumber(phone) {
    const regex = /^\+?[1-9]\d{1,14}$/; // E.164 format
    if (!regex.test(phone)) {
      throw new Error('Invalid phone number format');
    }
  }

  static async validateMeterNumber(meterNumber) {
    if (!Number.isInteger(meterNumber) || meterNumber < 0 || meterNumber > 99999) {
      throw new Error('Meter number must be a 1-5 digit number');
    }
  }

  static validatePaymentData(data) {
    // Validasi field yang required
    const requiredFields = ['customer_id', 'bill_ids', 'amount', 'method'];
    for (const field of requiredFields) {
      if (!data[field]) {
        return `${field} is required`;
      }
    }

    // Validasi tipe data
    if (!Number.isInteger(parseInt(data.customer_id, 10))) {
      return 'customer_id must be a valid number';
    }

    if (!Array.isArray(data.bill_ids) || !data.bill_ids.length) {
      return 'bill_ids must be a non-empty array';
    }

    const amount = parseFloat(data.amount);
    if (isNaN(amount) || amount <= 0) {
      return 'amount must be a positive number';
    }

    // Validasi payment method
    const validMethods = ['cash', 'transfer', 'debit'];
    if (!validMethods.includes(data.method)) {
      return 'Invalid payment method. Must be one of: ' + validMethods.join(', ');
    }

    // Validasi payment type jika ada
    if (data.payment_type && !['full', 'installment'].includes(data.payment_type)) {
      return 'Invalid payment type. Must be either full or installment';
    }

    return null; // return null jika tidak ada error
  }

  static validateFinancialData(data) {
    const { type, amount, description } = data;

    if (!type || !['income', 'expense'].includes(type)) {
      return 'Tipe transaksi tidak valid';
    }

    if (!amount || isNaN(amount) || amount <= 0) {
      return 'Jumlah transaksi tidak valid';
    }

    if (!description || description.trim().length === 0) {
      return 'Deskripsi transaksi diperlukan';
    }

    return null;
  }

}

module.exports = Validator;
