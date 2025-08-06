'use client';

interface Customer {
  name: string;
  amount: number;
  phone_number: string;
}

interface OverdueCustomersProps {
  customers: Customer[];
}

export function OverdueCustomers({ customers }: OverdueCustomersProps) {
  return (
    <div className="bg-[#e0e5ec] p-6 rounded-2xl shadow-[8px_8px_16px_#bebebe,-8px_-8px_16px_#ffffff]">
      <h2 className="text-lg font-semibold mb-6 text-gray-800">Pelanggan Menunggak &gt; 3 Bulan</h2>
      
      <div className="bg-[#e0e5ec] rounded-xl shadow-[inset_4px_4px_8px_#bebebe,inset_-4px_-4px_8px_#ffffff] p-4">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-gray-700">
              <th className="text-left py-3 px-4 font-semibold">Nama</th>
              <th className="text-left py-3 px-4 font-semibold">Telepon</th>
              <th className="text-left py-3 px-4 font-semibold">Tunggakan</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {customers.map((cust, i) => (
              <tr 
                key={i} 
                className="hover:bg-[#d1d5dc] transition-colors duration-200"
              >
                <td className="py-3 px-4">{cust.name}</td>
                <td className="py-3 px-4">{cust.phone_number}</td>
                <td className="py-3 px-4">
                  <span className="bg-[#e0e5ec] px-3 py-1 rounded-lg text-red-600 font-medium
                    shadow-[2px_2px_4px_#bebebe,-2px_-2px_4px_#ffffff]">
                    Rp {cust.amount.toLocaleString()}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {customers.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-600">Tidak ada pelanggan yang menunggak</p>
          </div>
        )}
      </div>

      <div className="mt-4 flex justify-end">
        <button 
          className="text-sm text-gray-600 px-4 py-2 rounded-xl
            bg-[#e0e5ec]
            shadow-[4px_4px_8px_#bebebe,-4px_-4px_8px_#ffffff]
            hover:shadow-[inset_4px_4px_8px_#bebebe,inset_-4px_-4px_8px_#ffffff]
            transition-all duration-300"
        >
          Lihat Semua
        </button>
      </div>
    </div>
  );
}
