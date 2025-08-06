import { useState, useEffect } from 'react';
import axios from '@/lib/axios';
import { Customer } from '@/types/customer';

export const useAllCustomersInMyArea = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    axios.get('/petugas/customers/my-area/v1')
      .then(res => {
        if (res.data.success) {
          setCustomers(res.data.data);
        } else {
          setError(res.data.message || 'Gagal memuat data pelanggan');
        }
      })
      .catch(err => {
        setError(err?.response?.data?.message || 'Gagal memuat data pelanggan');
      })
      .finally(() => setLoading(false));
  }, []);

  return { customers, loading, error };
};