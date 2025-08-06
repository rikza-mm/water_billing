// frontend/src/services/customerHistoryService.ts

import axios from '@/lib/axios';
import type { DetailedHistory, DebtPayment, CustomerFinancialSummary } from '@/hooks/petugas/history/useHistoryDashboard';

export interface MeterHistory {
  reading_id: number;
  reading_date: string;
  previous_reading: number;
  current_reading: number;
  water_usage: number;
  officer_name: string;
  image_url?: string;
  notes?: string;
}

export interface CombinedHistoryItem extends DetailedHistory {
  meter_reading?: {
    previous_reading: number;
    current_reading: number;
    reading_officer: string;
    reading_date: string;
  };
}

export interface CustomerHistoryData {
  detailedHistory: CombinedHistoryItem[];
  debtHistory: DebtPayment[];
  financialSummary: CustomerFinancialSummary;
}

export const getCustomerHistoryForPdf = async (customerId: string): Promise<CustomerHistoryData> => {
  const response = await axios.get(`/petugas/history/customer/${customerId}/detailed`);
  const debtResponse = await axios.get(`/petugas/history/customer/${customerId}/debt-payments`);
  
  // Ambil data meter reading untuk digabungkan
  const meterResponse = await axios.get(`/petugas/meter-readings/history/${customerId}`).catch(() => ({ data: { data: [] } }));
  const meterHistory = meterResponse.data.data || [];
  
  // Gabungkan data billing history dengan meter reading
  const combinedHistory = response.data.data.history.map((billingItem: DetailedHistory) => {
    // Cari meter reading yang sesuai dengan periode billing
    const matchingMeter = meterHistory.find((meter: MeterHistory) => {
      const billingStart = new Date(billingItem.period_start);
      const meterDate = new Date(meter.reading_date);
      // Cek apakah meter reading dalam periode yang sama (bulan yang sama)
      return billingStart.getFullYear() === meterDate.getFullYear() && 
             billingStart.getMonth() === meterDate.getMonth();
    });
    
    return {
      ...billingItem,
      meter_reading: matchingMeter ? {
        previous_reading: matchingMeter.previous_reading,
        current_reading: matchingMeter.current_reading,
        reading_officer: matchingMeter.officer_name,
        reading_date: matchingMeter.reading_date
      } : undefined
    };
  });
  
  return {
    detailedHistory: combinedHistory || [],
    debtHistory: debtResponse.data.data || [],
    financialSummary: response.data.data.summary || null
  };
};