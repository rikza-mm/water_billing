import { NeumorphicCard } from '@/components/NeumorphicCard';
import { ActivitySummary } from '@/hooks/admin/profile/useAdminProfile';
import { Activity, Book, FileText } from 'lucide-react';

interface Props {
  summary: ActivitySummary;
}

export const ActivitySummaryCard = ({ summary }: Props) => (
  <NeumorphicCard>
    <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2"><Activity /> Ringkasan Aktivitas</h3>
    <div className="grid grid-cols-2 gap-4">
      <div className="bg-gray-50 p-4 rounded-lg text-center">
        <FileText className="mx-auto mb-2 text-blue-500" />
        <p className="text-2xl font-bold">{summary.total_financial_transactions}</p>
        <p className="text-sm text-gray-600">Transaksi Dibuat</p>
      </div>
      <div className="bg-gray-50 p-4 rounded-lg text-center">
        <Book className="mx-auto mb-2 text-green-500" />
        <p className="text-2xl font-bold">{summary.total_book_closings}</p>
        <p className="text-sm text-gray-600">Periode Ditutup</p>
      </div>
    </div>
  </NeumorphicCard>
);