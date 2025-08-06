export interface Customer {
  id: number;
  name: string;
  address: string;
  area: string;
  phoneNumber: string;
  status: string;
  saldo: string;
  hutang: string;
  meterNumber: number;
  category_name: string | null;
  lastReadingDate: string | null;
  lastPaymentDate: string | null;
  unpaidBills: number;
}
