import api from '@/lib/axios';

export interface TransitionCustomerPayload {
  full_name: string;
  area_id: string;
  category_id: string;
  phone_number: string;
  address: string;
  meter_number: string;
  registration_date: string;
  last_meter_reading: string;
  last_reading_date: string;
  initial_debt: string;
  initial_saldo: string;
  notes?: string;
}

export function useTransitionCustomer() {
  // Fungsi migrasi pelanggan lama
  const migrateCustomer = async (data: TransitionCustomerPayload) => {
    // Map data frontend ke payload backend
    const payload = {
      fullName: data.full_name,
      areaId: Number(data.area_id),
      categoryId: Number(data.category_id),
      phoneNumber: data.phone_number?.trim() || null,
      address: data.address,
      registrationDate: data.registration_date,
      meterNumber: data.meter_number,
      lastMeterReading: Number(data.last_meter_reading),
      lastReadingDate: data.last_reading_date,
      initialDebt: Number(data.initial_debt),
      initialSaldo: Number(data.initial_saldo),
      notes: data.notes,
    };

    const res = await api.post('/admin/transition-customers/migrate', payload);
    return res.data;
  };

  return { migrateCustomer };
}