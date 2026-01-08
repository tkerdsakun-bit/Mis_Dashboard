// InkReport12Months.tsx
import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import type { InkTransaction } from './supabaseClient';

interface MonthlyData {
  month: string;
  monthName: string;
  income: number;
  expense: number;
  net: number;
  count: number;
}

interface Props {
  onBack: () => void;
}

const InkReport12Months = ({ onBack }: Props) => {
  const [inkTransactions, setInkTransactions] = useState<InkTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'summary' | 'detailed'>('summary');

  useEffect(() => {
    fetchInkTransactions();
  }, []);

  const fetchInkTransactions = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('inktransactions')
        .select('*')
        .order('transaction_date', { ascending: false });

      if (error) throw error;
      if (data) setInkTransactions(data as InkTransaction[]);
    } catch (error) {
      console.error('Error fetching ink transactions:', error);
      alert('เกิดข้อผิดพลาดในการโหลดข้อมูล');
    } finally {
      setLoading(false);
    }
  };

  const getLast12Months = (): string[] => {
    const months: string[] = [];
    const now = new Date();
    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push(date.toISOString().slice(0, 7));
    }
    return months;
  };

  const calculateMonthlyData = (): MonthlyData[] => {
    const last12Months = getLast12Months();
    return last12Months.map(month => {
      const monthTransactions = inkTransactions.filter(t => t.month === month);
      const income = monthTransactions
        .filter(t => t.transaction_type === 'รายรับ')
        .reduce((sum, t) => sum + t.amount, 0);
      const expense = monthTransactions
        .filter(t => t.transaction_type === 'รายจ่าย')
        .reduce((sum, t) => sum + t.amount, 0);

      return {
        month,
        monthName: new Date(month + '-01').toLocaleDateString('th-TH', {
          year: 'numeric',
          month: 'long'
        }),
        income,
        expense,
        net: income - expense,
        count: monthTransactions.length
      };
    });
  };

  const exportToExcel = async () => {
    try {
      // @ts-ignore
      const XLSX = await import('https://cdn.sheetjs.com/xlsx-0.20.0/package/xlsx.mjs');
      
      const monthlyData = calculateMonthlyData();
      
      // Sheet 1: Summary
      const summaryData = [
        ['📊 รายรับ-รายจ่ายหมึก 12 เดือน'],
        [],
        ['เดือน', 'รายรับ (฿)', 'รายจ่าย (฿)', 'ยอดสุทธิ (฿)', 'จำนวนรายการ'],
        ...monthlyData.map(m => [
          m.monthName,
          m.income,
          m.expense,
          m.net,
          m.count
        ]),
        [],
        [
          'รวมทั้งปี',
          monthlyData.reduce((s, m) => s + m.income, 0),
          monthlyData.reduce((s, m) => s + m.expense, 0),
          monthlyData.reduce((s, m) => s + m.net, 0),
          monthlyData.reduce((s, m) => s + m.count, 0)
        ]
      ];

      // Sheet 2: Detailed
      const sorted = [...inkTransactions].sort((a, b) => {
        const monthCompare = b.month.localeCompare(a.month);
        if (monthCompare !== 0) return monthCompare;
        const typeOrder = { 'รายรับ': 0, 'รายจ่าย': 1 };
        return (typeOrder[a.transaction_type as keyof typeof typeOrder] || 2) - 
               (typeOrder[b.transaction_type as keyof typeof typeOrder] || 2);
      });

      const detailedData = [
        ['📝 รายละเอียดรายรับ-รายจ่ายหมึก'],
        [],
        ['วันที่', 'ประเภท', 'รายการ', 'จำนวนเงิน (฿)', 'หมวดหมู่', 'เดือน']
      ];

      sorted.forEach(t => {
        const date = new Date(t.transaction_date).toLocaleDateString('th-TH', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit'
        });
        detailedData.push([
          date,
          t.transaction_type,
          t.description,
          t.amount,
          t.category || '-',
          t.month
        ]);
      });

      // Create workbook
      const wb = XLSX.utils.book_new();
      const ws1 = XLSX.utils.aoa_to_sheet(summaryData);
      const ws2 = XLSX.utils.aoa_to_sheet(detailedData);

      // Column widths
      ws1['!cols'] = [
        { wch: 20 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 12 }
      ];
      ws2['!cols'] = [
        { wch: 12 }, { wch: 12 }, { wch: 25 }, { wch: 15 }, { wch: 15 }, { wch: 12 }
      ];

      XLSX.utils.book_append_sheet(wb, ws1, 'สรุป 12 เดือน');
      XLSX.utils.book_append_sheet(wb, ws2, 'รายละเอียด');
      XLSX.writeFile(wb, `Ink_Report_${new Date().getFullYear()}_Full_Year.xlsx`);

      alert('✅ Export สำเร็จ!');
    } catch (error) {
      console.error('Error exporting:', error);
      alert('❌ เกิดข้อผิดพลาดในการ export');
    }
  };

  const monthlyData = calculateMonthlyData();
  const totalIncome = monthlyData.reduce((s, m) => s + m.income, 0);
  const totalExpense = monthlyData.reduce((s, m) => s + m.expense, 0);
  const totalNet = totalIncome - totalExpense;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-semibold">กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header with Back Button */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl p-8 mb-8 shadow-2xl">
          <button
            onClick={onBack}
            className="mb-4 px-6 py-3 bg-white/20 hover:bg-white/30 text-white rounded-xl font-semibold transition-all flex items-center gap-2 backdrop-blur-sm"
          >
            <span className="text-xl">←</span> กลับ
          </button>
          <h1 className="text-4xl font-bold text-white mb-2">📊 รายงานรายรับ-รายจ่ายหมึก</h1>
          <p className="text-white/90">ข้อมูลย้อนหลัง 12 เดือน | Ink Income & Expense Report</p>
        </div>

        {/* Export Buttons */}
        <div className="flex gap-4 mb-6 flex-wrap">
          <button
            onClick={exportToExcel}
            className="px-6 py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-2xl font-semibold hover:shadow-2xl hover:scale-105 transition-all flex items-center gap-2"
          >
            <span className="text-xl">📥</span> Export Excel (.xlsx)
          </button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-2xl p-6 shadow-lg border-l-4 border-green-500 hover:shadow-xl transition-all">
            <p className="text-sm text-gray-500 mb-2 uppercase">รวมรายรับทั้งปี</p>
            <p className="text-3xl font-bold text-green-600 mb-1">
              ฿{totalIncome.toLocaleString()}
            </p>
            <p className="text-xs text-gray-400">ทั้ง 12 เดือน</p>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-lg border-l-4 border-red-500 hover:shadow-xl transition-all">
            <p className="text-sm text-gray-500 mb-2 uppercase">รวมรายจ่ายทั้งปี</p>
            <p className="text-3xl font-bold text-red-600 mb-1">
              ฿{totalExpense.toLocaleString()}
            </p>
            <p className="text-xs text-gray-400">ทั้ง 12 เดือน</p>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-lg border-l-4 border-blue-500 hover:shadow-xl transition-all">
            <p className="text-sm text-gray-500 mb-2 uppercase">ยอดสุทธิทั้งปี</p>
            <p className={`text-3xl font-bold mb-1 ${totalNet >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
              {totalNet >= 0 ? '+' : ''}฿{Math.abs(totalNet).toLocaleString()}
            </p>
            <p className="text-xs text-gray-400">{totalNet >= 0 ? '💰 กำไร' : '⚠️ ขาดทุน'}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-3 mb-6 border-b-2 border-white/30">
          <button
            onClick={() => setActiveTab('summary')}
            className={`px-6 py-3 rounded-t-xl font-semibold transition-all ${
              activeTab === 'summary'
                ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg'
                : 'bg-white/50 text-gray-700 hover:bg-white/70'
            }`}
          >
            📈 สรุป 12 เดือน
          </button>
          <button
            onClick={() => setActiveTab('detailed')}
            className={`px-6 py-3 rounded-t-xl font-semibold transition-all ${
              activeTab === 'detailed'
                ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg'
                : 'bg-white/50 text-gray-700 hover:bg-white/70'
            }`}
          >
            📝 รายละเอียด
          </button>
        </div>

        {/* Summary Tab */}
        {activeTab === 'summary' && (
          <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                  <tr>
                    <th className="px-6 py-4 text-left font-semibold">เดือน</th>
                    <th className="px-6 py-4 text-right font-semibold">รายรับ (฿)</th>
                    <th className="px-6 py-4 text-right font-semibold">รายจ่าย (฿)</th>
                    <th className="px-6 py-4 text-right font-semibold">ยอดสุทธิ (฿)</th>
                    <th className="px-6 py-4 text-center font-semibold">จำนวนรายการ</th>
                  </tr>
                </thead>
                <tbody>
                  {monthlyData.map((data, idx) => (
                    <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">{data.monthName}</td>
                      <td className="px-6 py-4 text-right text-green-600 font-semibold">
                        ฿{data.income.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-right text-red-600 font-semibold">
                        ฿{data.expense.toLocaleString()}
                      </td>
                      <td className={`px-6 py-4 text-right font-bold ${
                        data.net >= 0 ? 'text-blue-600' : 'text-red-600'
                      }`}>
                        {data.net >= 0 ? '+' : ''}฿{Math.abs(data.net).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-center text-gray-700">{data.count}</td>
                    </tr>
                  ))}
                  <tr className="bg-gradient-to-r from-blue-50 to-purple-50 font-bold border-t-2 border-blue-600">
                    <td className="px-6 py-5">รวมทั้งปี</td>
                    <td className="px-6 py-5 text-right text-green-700">
                      ฿{totalIncome.toLocaleString()}
                    </td>
                    <td className="px-6 py-5 text-right text-red-700">
                      ฿{totalExpense.toLocaleString()}
                    </td>
                    <td className={`px-6 py-5 text-right ${
                      totalNet >= 0 ? 'text-blue-700' : 'text-red-700'
                    }`}>
                      {totalNet >= 0 ? '+' : ''}฿{Math.abs(totalNet).toLocaleString()}
                    </td>
                    <td className="px-6 py-5 text-center">
                      {monthlyData.reduce((s, m) => s + m.count, 0)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Detailed Tab */}
        {activeTab === 'detailed' && (
          <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
            <div className="overflow-x-auto max-h-[600px]">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-green-600 to-emerald-600 text-white sticky top-0">
                  <tr>
                    <th className="px-6 py-4 text-left font-semibold">วันที่</th>
                    <th className="px-6 py-4 text-left font-semibold">ประเภท</th>
                    <th className="px-6 py-4 text-left font-semibold">รายการ</th>
                    <th className="px-6 py-4 text-right font-semibold">จำนวนเงิน (฿)</th>
                    <th className="px-6 py-4 text-left font-semibold">หมวดหมู่</th>
                  </tr>
                </thead>
                <tbody>
                  {[...inkTransactions]
                    .sort((a, b) => {
                      const monthCompare = b.month.localeCompare(a.month);
                      if (monthCompare !== 0) return monthCompare;
                      const typeOrder = { 'รายรับ': 0, 'รายจ่าย': 1 };
                      return (typeOrder[a.transaction_type as keyof typeof typeOrder] || 2) - 
                             (typeOrder[b.transaction_type as keyof typeof typeOrder] || 2);
                    })
                    .map((t, idx) => (
                      <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 text-sm">
                          {new Date(t.transaction_date).toLocaleDateString('th-TH', {
                            year: 'numeric',
                            month: '2-digit',
                            day: '2-digit'
                          })}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            t.transaction_type === 'รายรับ'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-red-100 text-red-700'
                          }`}>
                            {t.transaction_type}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm">{t.description}</td>
                        <td className={`px-6 py-4 text-right font-semibold ${
                          t.transaction_type === 'รายรับ' ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {t.transaction_type === 'รายรับ' ? '+' : '-'}฿{t.amount.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">{t.category || '-'}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default InkReport12Months;
