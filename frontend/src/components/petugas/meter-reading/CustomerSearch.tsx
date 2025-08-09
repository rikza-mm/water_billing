import { useState, useMemo } from 'react';
import { Search, AlertCircle, User, X, Tag, UserCheck, ChevronRight, History, MessageCircle } from 'lucide-react';
import type { CustomerSearchResult } from '@/hooks/petugas/meter-reading/useCustomerSearch';

interface CustomerSearchProps {
  onSearchByName: (query: string) => Promise<CustomerSearchResult[]>; 
  onSearchById: (query: string) => Promise<CustomerSearchResult | null>;
  loading: boolean;
  error: string | null;
  searchResults: CustomerSearchResult[];
  onSelectCustomer: (customer: CustomerSearchResult) => void;
}

const formatMeter = (value: number | null | undefined) => {
  if (value === null || value === undefined) return 'N/A';
  return Number.isInteger(value) ? value : parseFloat(value.toString());
};

export default function CustomerSearch({
  onSearchByName,
  onSearchById,
  loading,
  error,
  searchResults,
  onSelectCustomer,
}: CustomerSearchProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState<'id' | 'name'>('id');

  const uniqueSearchResults = useMemo(() => {
    const seen = new Set();
    return searchResults.filter(customer => {
      const isDuplicate = seen.has(customer.id);
      seen.add(customer.id);
      return !isDuplicate;
    });
  }, [searchResults]);

  const handleSearch = () => {
  if (!searchQuery.trim()) return;
  if (searchType === 'id') {
      onSearchById(searchQuery);
    } else {
      onSearchByName(searchQuery);
  }
};

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch();
  };

  const handleNotifyViaWhatsApp = (e: React.MouseEvent, customer: CustomerSearchResult) => {
    e.stopPropagation();
    if (!customer.phoneNumber) {
      alert('Nomor telepon pelanggan tidak tersedia.');
      return;
    }
    const officerName = "Tirta Muna";
    const messageLines = [
      `*PEMBERITAHUAN KUNJUNGAN*`,
      `-----------------------------------`,
      `Yth. Bpk/Ibu *${customer.name}*,`,
      `ID Pelanggan: ${customer.id}`,
      ``,
      `Kami informasikan bahwa petugas kami telah datang ke alamat Anda untuk melakukan pencatatan meter air.`,
      ``,
      `Namun, kami tidak dapat mengakses meteran karena rumah dalam keadaan kosong.`,
      ``,
      `Untuk pembuatan tagihan periode ini, mohon bantuannya untuk mengirimkan *foto angka yang tertera di meteran air* Anda ke nomor ini.`,
      ``,
      `Terima kasih atas kerja sama Anda.`,
      ``,
      `Hormat kami,`,
      `*${officerName}*`
    ];
    const message = messageLines.join('\n');
    const encodedMessage = encodeURIComponent(message);
    const formattedPhone = customer.phoneNumber.replace(/^0/, '62');
    const whatsappUrl = `https://wa.me/${formattedPhone}?text=${encodedMessage}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <div>
      {/* --- Search Input Group --- */}
      <div className="p-2 bg-[#e0e5ec] rounded-2xl shadow-neumorph-inset flex flex-col sm:flex-row gap-2">
        <div className="flex-1 flex gap-2">
          {['id', 'name'].map((type) => (
        <button
              key={type}
              onClick={() => setSearchType(type as 'id' | 'name')}
              className={`flex-1 py-2 px-3 rounded-lg text-sm font-semibold transition-all duration-300 flex items-center justify-center gap-1.5 ${
                searchType === type
                  ? 'bg-blue-600 text-white shadow-neumorph'
                  : 'bg-transparent text-gray-500 hover:bg-white/50'
              }`}
        >
              {type === 'id' ? <UserCheck size={14} /> : <User size={14} />}
              <span>{type === 'id' ? 'ID' : 'Nama'}</span>
        </button>
          ))}
      </div>
        <div className="flex-1 flex">
          <div className="relative w-full">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleKeyDown}
              placeholder={searchType === 'id' ? "Cari Nomor ID..." : "Cari Nama Pelanggan..."}
              className="w-full h-full py-2 pl-4 pr-10 rounded-lg bg-[#e0e5ec] shadow-[inset_3px_3px_6px_#bebebe,inset_-3px_-3px_6px_#ffffff] text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            />
          {searchQuery && !loading && (
              <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <X size={16} />
            </button>
          )}
        </div>
        <button
          onClick={handleSearch}
          disabled={loading || !searchQuery}
            className="px-4 py-2 rounded-lg bg-[#e0e5ec] text-blue-600 transition-all duration-300 ml-2 shadow-neumorph hover:shadow-neumorph-pressed disabled:shadow-neumorph-inset disabled:text-gray-400 disabled:cursor-not-allowed"
        >
            {loading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600" />
            ) : (
          <Search className="w-5 h-5" />
            )}
        </button>
        </div>
      </div>

      {/* --- Error Message --- */}
      {error && (
        <div className="mt-4 p-3 rounded-xl bg-red-50 shadow-neumorph text-sm">
          <div className="flex items-center gap-2 text-red-700">
            <AlertCircle size={18} />
            <p className="font-medium">{error}</p>
          </div>
        </div>
      )}

      {/* --- Search Results --- */}
      <div className="mt-6 space-y-4">
        {uniqueSearchResults.length > 0 && (
           <h3 className="text-sm font-semibold text-gray-600 px-1">
             {uniqueSearchResults.length} Pelanggan Ditemukan
           </h3>
        )}

        {uniqueSearchResults.map((customer) => (
              <div
                key={customer.id}
                onClick={() => onSelectCustomer(customer)}
                className="group p-4 sm:p-5 rounded-2xl bg-[#e0e5ec] shadow-[inset_5px_5px_10px_#bebebe,inset_-5px_-5px_10px_#ffffff] cursor-pointer hover:shadow-[inset_7px_7px_14px_#bebebe,inset_-7px_-7px_14px_#ffffff] transition-all duration-300"
              >
            <div className="flex items-start justify-between gap-4">
              {/* Customer Info */}
              <div className="flex items-center gap-4">
                <div className="bg-[#e0e5ec] p-3 rounded-full shadow-neumorph flex-shrink-0 group-hover:shadow-neumorph-pressed transition-all duration-300">
                  <User className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h4 className="font-bold text-gray-800 text-base leading-tight">{customer.name}</h4>
                  <p className="text-sm text-gray-500">ID: {customer.id}</p>
                </div>
              </div>

              {/* ✅ Tombol Aksi Kanan (WhatsApp & Panah) */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={(e) => handleNotifyViaWhatsApp(e, customer)}
                  disabled={!customer.phoneNumber}
                  className="p-3 rounded-full bg-[#e0e5ec] text-green-600 shadow-neumorph hover:shadow-neumorph-pressed disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  title="Kirim Notifikasi Kunjungan via WhatsApp"
                >
                  <MessageCircle size={20} />
                </button>
                <div className="hidden sm:block text-gray-400 group-hover:text-blue-500 group-hover:translate-x-1 transition-transform duration-300">
                  <ChevronRight size={24} />
                </div>
              </div>
            </div>

            {/* Vitals Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 pt-4 border-t border-gray-300/50">
                {/* Last Reading */}
                <div className="text-center sm:text-left">
                  <p className="text-xs text-gray-500 flex items-center justify-center sm:justify-start gap-1"><History size={12}/> Bacaan Terakhir</p>
                  <p className="text-2xl font-bold text-gray-700">
                    {formatMeter(customer.lastReading)} <span className="text-lg font-normal text-gray-600">m³</span>
                  </p>
                  </div>
                {/* Address */}
                <div className="text-center sm:text-left">
                  <p className="text-xs text-gray-500">Alamat</p>
                  <p className="font-medium text-gray-700 truncate">{customer.address}</p>
                </div>
            </div>

            {/* Category Tag */}
            {customer.category_name && (
              <div className="mt-4 pt-3 border-t border-gray-300/40">
                  <span className="text-xs px-2.5 py-1 bg-teal-100 text-teal-800 rounded-full font-semibold flex items-center gap-1.5 w-fit">
                    <Tag size={12} />
                    {customer.category_name}
                  </span>
              </div>
            )}
          </div>
        ))}
        </div>
    </div>
  );
}
