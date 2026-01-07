import { useState } from 'react';
import { supabase } from './lib/supabase';
import type { Asset, Department, AssetCategory, RepairHistory, InkTransaction, InkBudgetSummary } from './types';
import QRCode from 'react-qr-code';

type TabType = 'dashboard' | 'assets' | 'repairs' | 'ink';

// QR Code Component
const AssetQRCode = ({ asset }: { asset: Asset }) => {
  const qrValue = `${window.location.origin}/asset/${asset.id}`;

  const downloadQR = () => {
    const svg = document.querySelector(`#qr-container-${asset.id} svg`);
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    canvas.width = 240;
    canvas.height = 240;

    img.onload = () => {
      if (ctx) {
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, 240, 240);
        ctx.drawImage(img, 20, 20, 200, 200);
      }

      const url = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `QR-${asset.tag}.png`;
      link.href = url;
      link.click();
    };

    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };

  return (
    <div className="flex flex-col items-center gap-4 p-6 bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl border-2 border-blue-200">
      <h4 className="font-bold text-lg text-gray-900">📱 QR Code</h4>
      <div id={`qr-container-${asset.id}`} className="bg-white p-4 rounded-xl shadow-lg">
        <QRCode value={qrValue} size={200} level="H" style={{ height: "auto", maxWidth: "100%", width: "100%" }} />
      </div>
      <p className="text-sm text-gray-600 font-semibold">{asset.tag}</p>
      <div className="flex gap-3 w-full">
        <button
          onClick={downloadQR}
          className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl font-semibold hover:shadow-xl hover:scale-105 transition-all"
        >
          ⬇️ ดาวน์โหลด
        </button>
      </div>
    </div>
  );
};

function App() {
  const [currentPage, setCurrentPage] = useState<TabType>('dashboard');

  // Modal states
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);

  // Search and filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  // Data states
  const [loading, setLoading] = useState(true);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [assetCategories, setAssetCategories] = useState<AssetCategory[]>([]);
  const [repairHistory, setRepairHistory] = useState<RepairHistory[]>([]);
  const [inkTransactions, setInkTransactions] = useState<InkTransaction[]>([]);

  // Filtered assets
  const filteredAssets = assets.filter((asset: Asset) => {
    const matchSearch = asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        asset.tag.toLowerCase().includes(searchTerm.toLowerCase());
    const matchCategory = !filterCategory || asset.category === filterCategory;
    const matchStatus = !filterStatus || asset.status === filterStatus;
    return matchSearch && matchCategory && matchStatus;
  });

  // Stats
  const stats = [
    { icon: '📦', label: 'ทรัพย์สินทั้งหมด', value: assets.length.toString(), color: 'from-blue-500 to-cyan-500', bgColor: 'bg-blue-50' },
    { icon: '⚠️', label: 'ใกล้หมดประกัน', value: assets.filter((a: Asset) => a.warranty_days <= 30).length.toString(), color: 'from-yellow-500 to-orange-500', bgColor: 'bg-yellow-50' },
    { icon: '🔧', label: 'อยู่ระหว่างซ่อม', value: repairHistory.filter((r: RepairHistory) => r.repair_status === 'กำลังซ่อม').length.toString(), color: 'from-red-500 to-pink-500', bgColor: 'bg-red-50' },
    { icon: '💰', label: 'มูลค่ารวม', value: (assets.reduce((sum, a: Asset) => sum + parseFloat(a.purchase_price.replace(/,/g, '') || '0'), 0) / 1000000).toFixed(1) + 'M', color: 'from-green-500 to-emerald-500', bgColor: 'bg-green-50' },
  ];

  // Category data
  const categoryData = assetCategories.map(cat => {
    const count = assets.filter((a: Asset) => a.category === cat.name).length;
    const percent = assets.length > 0 ? Math.round((count / assets.length) * 100) : 0;
    return { ...cat, count, percent };
  });

  // Ink budget
  const currentMonth = new Date().toISOString().slice(0, 7);
  const monthlyTransactions = inkTransactions.filter(t => t.month === currentMonth);
  const totalExpense = monthlyTransactions.filter(t => t.transaction_type === 'รายจ่าย').reduce((sum, t) => sum + t.amount, 0);
  const totalIncome = monthlyTransactions.filter(t => t.transaction_type === 'รายรับ').reduce((sum, t) => sum + t.amount, 0);
  const netAmount = totalIncome - totalExpense;

  // Asset Detail Modal
  const AssetDetailModal = () => {
    const assetRepairs = repairHistory.filter(r => r.asset_id === selectedAsset?.id);

    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
        <div className="bg-white rounded-3xl p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl animate-slideUp">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">รายละเอียดทรัพย์สิน</h2>
            <button onClick={() => setShowDetailModal(false)} className="text-gray-400 hover:text-gray-600 text-3xl transition-colors">×</button>
          </div>

          {selectedAsset && (
            <div className="space-y-6">
              {selectedAsset.image_url && (
                <img src={selectedAsset.image_url} alt={selectedAsset.name} className="w-full h-72 object-cover rounded-2xl shadow-xl" />
              )}

              <AssetQRCode asset={selectedAsset} />

              <div className="bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-8 rounded-2xl border-2 border-blue-100">
                <div className="flex items-center gap-5 mb-5">
                  <span className="text-6xl">{selectedAsset.icon || '📦'}</span>
                  <div>
                    <h3 className="text-3xl font-bold text-gray-900">{selectedAsset.name}</h3>
                    <p className="text-gray-600 text-lg">รหัส: {selectedAsset.tag}</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: 'รหัสทรัพย์สิน', value: selectedAsset.tag },
                  { label: 'หมวดหมู่', value: selectedAsset.category },
                  { label: 'แผนก', value: selectedAsset.department },
                  { label: 'สถานะ', value: selectedAsset.status },
                  { label: 'วันที่ซื้อ', value: selectedAsset.purchase_date },
                  { label: 'หมดประกัน', value: selectedAsset.warranty_end || '-' },
                  { label: 'ราคา', value: `฿${selectedAsset.purchase_price}`, color: 'text-green-600' },
                  { label: 'สถานที่', value: selectedAsset.location || '-' }
                ].map((item, idx) => (
                  <div key={idx} className="bg-gradient-to-br from-gray-50 to-gray-100 p-5 rounded-xl border border-gray-200 hover:shadow-lg transition-all">
                    <p className="text-sm text-gray-600 mb-2 font-medium">{item.label}</p>
                    <p className={`font-bold text-lg ${item.color || 'text-gray-900'}`}>{item.value}</p>
                  </div>
                ))}
              </div>

              {assetRepairs.length > 0 && (
                <div className="bg-gradient-to-br from-orange-50 to-red-50 p-6 rounded-2xl border border-orange-200">
                  <h4 className="font-bold text-xl mb-4">🔧 ประวัติการซ่อม ({assetRepairs.length} ครั้ง)</h4>
                  <div className="space-y-3">
                    {assetRepairs.map((repair) => (
                      <div key={repair.id} className="bg-white p-4 rounded-xl border border-orange-100">
                        <div className="flex justify-between items-start mb-2">
                          <p className="font-semibold text-gray-900">{repair.issue_description}</p>
                          <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                            repair.repair_status === 'เสร็จสิ้น' ? 'bg-green-100 text-green-700' :
                            repair.repair_status === 'กำลังซ่อม' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>{repair.repair_status}</span>
                        </div>
                        <div className="text-sm text-gray-600 space-y-1">
                          <p>💰 ค่าใช้จ่าย: ฿{repair.repair_cost.toLocaleString()}</p>
                          <p>👨‍🔧 ช่าง: {repair.technician || '-'}</p>
                          <p>📅 วันที่: {repair.start_date} {repair.end_date ? `→ ${repair.end_date}` : ''}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <button className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white py-4 rounded-xl font-semibold hover:shadow-2xl hover:scale-105 transition-all">
                  ✏️ แก้ไข
                </button>
                <button className="bg-gradient-to-r from-orange-500 to-red-500 text-white py-4 rounded-xl font-semibold hover:shadow-2xl hover:scale-105 transition-all">
                  🔧 เพิ่มการซ่อม
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-bounce">📊</div>
          <p className="text-xl font-semibold text-gray-700">กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-xl border-b border-gray-200 shadow-lg sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center gap-4">
              <div className="bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 p-3 rounded-2xl shadow-xl">
                <span className="text-3xl">📊</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">ระบบจัดการทรัพย์สิน</h1>
                <p className="text-xs text-gray-500 font-medium">IT Asset Management System 2026</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="bg-white/60 backdrop-blur-xl border-b border-gray-200 shadow-md sticky top-20 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex gap-2">
            {[
              { page: 'dashboard', icon: '📈', label: 'Dashboard' },
              { page: 'assets', icon: '📦', label: 'ทรัพย์สิน' },
              { page: 'repairs', icon: '🔧', label: 'การซ่อม' },
              { page: 'ink', icon: '💰', label: 'งบหมึก' }
            ].map(nav => (
              <button
                key={nav.page}
                onClick={() => setCurrentPage(nav.page as TabType)}
                className={`px-6 py-4 font-semibold flex items-center gap-2 border-b-4 transition-all ${
                  currentPage === nav.page
                    ? 'border-blue-600 text-blue-600 bg-blue-50/50'
                    : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50/50'
                }`}
              >
                <span className="text-lg">{nav.icon}</span>
                {nav.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">

        {/* Dashboard */}
        {currentPage === 'dashboard' && (
          <div className="space-y-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {stats.map((stat, idx) => (
                <div key={idx} className={`${stat.bgColor} rounded-2xl p-7 border-2 border-gray-200 hover:shadow-2xl hover:scale-105 transition-all cursor-pointer backdrop-blur-sm`}>
                  <div className="flex items-center gap-4 mb-3">
                    <div className={`bg-gradient-to-br ${stat.color} p-4 rounded-xl shadow-xl`}>
                      <span className="text-white text-2xl">{stat.icon}</span>
                    </div>
                    <span className="text-sm text-gray-700 font-semibold">{stat.label}</span>
                  </div>
                  <div className="text-4xl font-bold text-gray-900">{stat.value}</div>
                </div>
              ))}
            </div>

            {/* Category Distribution */}
            <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-8 border-2 border-gray-200 shadow-2xl">
              <h2 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent mb-6">📊 การกระจายตามหมวดหมู่</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                {categoryData.map(cat => (
                  <div key={cat.id} className="bg-gradient-to-br from-gray-50 to-white p-6 rounded-2xl text-center border-2 border-gray-200 hover:shadow-2xl hover:scale-105 transition-all cursor-pointer">
                    <span className="text-6xl block mb-3">{cat.icon}</span>
                    <p className="text-sm font-semibold text-gray-700 mb-2">{cat.name}</p>
                    <p className="text-4xl font-bold text-gray-900 mb-1">{cat.count}</p>
                    <p className="text-xs text-gray-500 font-medium">{cat.percent}%</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Ink Budget Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-2xl p-8 border-2 border-red-100 shadow-xl">
                <div className="flex items-center gap-4 mb-3">
                  <div className="bg-gradient-to-br from-red-500 to-pink-500 p-4 rounded-xl shadow-lg">
                    <span className="text-4xl">💸</span>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 font-medium">รายจ่ายทั้งหมด</p>
                    <p className="text-3xl font-bold text-red-600">฿{totalExpense.toLocaleString()}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-8 border-2 border-green-100 shadow-xl">
                <div className="flex items-center gap-4 mb-3">
                  <div className="bg-gradient-to-br from-green-500 to-emerald-500 p-4 rounded-xl shadow-lg">
                    <span className="text-4xl">💵</span>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 font-medium">รายรับทั้งหมด</p>
                    <p className="text-3xl font-bold text-green-600">฿{totalIncome.toLocaleString()}</p>
                  </div>
                </div>
              </div>

              <div className={`bg-white rounded-2xl p-8 border-2 ${netAmount >= 0 ? 'border-blue-100' : 'border-orange-100'} shadow-xl`}>
                <div className="flex items-center gap-4 mb-3">
                  <div className={`bg-gradient-to-br ${netAmount >= 0 ? 'from-blue-500 to-cyan-500' : 'from-orange-500 to-red-500'} p-4 rounded-xl shadow-lg`}>
                    <span className="text-4xl">{netAmount >= 0 ? '📈' : '📉'}</span>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 font-medium">ยอดสุทธิ</p>
                    <p className={`text-3xl font-bold ${netAmount >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
                      {netAmount >= 0 ? '+' : ''}฿{Math.abs(netAmount).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Assets Page - App-16.tsx Style */}
        {currentPage === 'assets' && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                📦 ทรัพย์สิน ({filteredAssets.length})
              </h1>
              <div className="flex gap-3">
                <button className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-2xl font-semibold hover:shadow-2xl hover:scale-105 transition-all">
                  ➕ เพิ่มทรัพย์สิน
                </button>
                <button className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-8 py-4 rounded-2xl font-semibold hover:shadow-2xl hover:scale-105 transition-all">
                  📥 Export
                </button>
              </div>
            </div>

            {/* Filters */}
            <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 border-2 border-gray-200 shadow-lg">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <input
                  type="text"
                  placeholder="🔍 ค้นหา..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="px-5 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                />
                <select
                  value={filterCategory}
                  onChange={e => setFilterCategory(e.target.value)}
                  className="px-5 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                >
                  <option value="">🏷️ หมวดหมู่ทั้งหมด</option>
                  {assetCategories.map(cat => (
                    <option key={cat.id} value={cat.name}>{cat.icon} {cat.name}</option>
                  ))}
                </select>
                <select
                  value={filterStatus}
                  onChange={e => setFilterStatus(e.target.value)}
                  className="px-5 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                >
                  <option value="">📊 สถานะทั้งหมด</option>
                  <option value="ใช้งาน">✅ ใช้งาน</option>
                  <option value="ซ่อม">🔧 ซ่อม</option>
                  <option value="จำหน่าย">❌ จำหน่าย</option>
                </select>
              </div>
            </div>

            {/* Asset Grid - App-16 Style */}
            {filteredAssets.length === 0 ? (
              <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-20 text-center border-2 border-gray-200 shadow-2xl">
                <span className="text-9xl mb-6 block animate-bounce">📦</span>
                <p className="text-3xl font-bold text-gray-700 mb-3">ไม่พบทรัพย์สิน</p>
                <p className="text-gray-500 text-lg">ลองค้นหาด้วยคำอื่นหรือเพิ่มทรัพย์สินใหม่</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredAssets.map((asset: Asset) => (
                  <div
                    key={asset.id}
                    className="bg-white/80 backdrop-blur-xl rounded-2xl overflow-hidden border-2 border-gray-200 hover:shadow-2xl hover:scale-105 transition-all cursor-pointer group"
                    onClick={() => {
                      setSelectedAsset(asset);
                      setShowDetailModal(true);
                    }}
                  >
                    {asset.image_url ? (
                      <img src={asset.image_url} alt={asset.name} className="w-full h-56 object-cover group-hover:scale-110 transition-transform duration-500" />
                    ) : (
                      <div className="w-full h-56 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center">
                        <span className="text-8xl group-hover:scale-110 transition-transform duration-500">{asset.icon || '📦'}</span>
                      </div>
                    )}

                    <div className="p-6">
                      <h3 className="font-bold text-xl text-gray-900 mb-4 group-hover:text-blue-600 transition-colors">{asset.name}</h3>

                      <div className="space-y-3 text-sm">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600 font-medium">🏷️ รหัส</span>
                          <code className="bg-blue-50 px-3 py-1 rounded-lg text-blue-600 font-semibold">{asset.tag}</code>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-gray-600 font-medium">📍 สถานที่</span>
                          <span className="font-semibold text-gray-900">{asset.location}</span>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-gray-600 font-medium">💰 ราคา</span>
                          <span className="font-bold text-green-600 text-lg">฿{asset.purchase_price}</span>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-gray-600 font-medium">📊 สถานะ</span>
                          <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                            asset.status === 'ใช้งาน' ? 'bg-green-100 text-green-700' :
                            asset.status === 'ซ่อม' ? 'bg-orange-100 text-orange-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>{asset.status}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Other tabs placeholder */}
        {currentPage === 'repairs' && (
          <div className="text-center py-20">
            <span className="text-8xl block mb-4">🔧</span>
            <h2 className="text-3xl font-bold text-gray-700">การซ่อมบำรุง</h2>
            <p className="text-gray-500 mt-2">กำลังพัฒนา...</p>
          </div>
        )}

        {currentPage === 'ink' && (
          <div className="text-center py-20">
            <span className="text-8xl block mb-4">💰</span>
            <h2 className="text-3xl font-bold text-gray-700">งบประมาณหมึก</h2>
            <p className="text-gray-500 mt-2">กำลังพัฒนา...</p>
          </div>
        )}
      </div>

      {/* Modals */}
      {showDetailModal && selectedAsset && <AssetDetailModal />}
    </div>
  );
}

export default App;
