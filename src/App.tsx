import { useState } from 'react';
import { LoadingSpinner } from './components/common/LoadingSpinner';
import { StatCard } from './components/common/StatCard';
import { AssetList } from './components/assets/AssetList';
import { AssetFilters } from './components/assets/AssetFilters';
import { AssetStats } from './components/assets/AssetStats';
import { AssetQRCode } from './components/assets/AssetQRCode';
import { useAssets } from './hooks/useAssets';
import { useDepartments } from './hooks/useDepartments';
import { useCategories } from './hooks/useCategories';
import { useRepairHistory } from './hooks/useRepairHistory';
import { useInkTransactions } from './hooks/useInkTransactions';
import { exportAssetsToCSV, exportRepairsToCSV, exportTransactionsToCSV } from './utils/exportUtils';
import { formatCurrency, formatDate } from './utils/formatters';
import type { Asset } from './types';

type TabType = 'dashboard' | 'assets' | 'repairs' | 'ink';

function App() {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');

  // Search and filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  // Modal states
  const [showAddAsset, setShowAddAsset] = useState(false);
  const [showAddRepair, setShowAddRepair] = useState(false);
  const [showAddTransaction, setShowAddTransaction] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [showAssetDetail, setShowAssetDetail] = useState(false);

  // Data hooks
  const { assets, loading: assetsLoading } = useAssets();
  const { departments } = useDepartments();
  const { categories } = useCategories();
  const { repairs, loading: repairsLoading } = useRepairHistory();
  const { transactions, summary, loading: transactionsLoading } = useInkTransactions();

  // Filter assets
  const filteredAssets = assets.filter(asset => {
    const matchesSearch = asset.tag.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          asset.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDepartment = !selectedDepartment || asset.department === selectedDepartment;
    const matchesCategory = !selectedCategory || asset.category === selectedCategory;
    const matchesStatus = !selectedStatus || asset.status === selectedStatus;

    return matchesSearch && matchesDepartment && matchesCategory && matchesStatus;
  });

  // Get unique department and category names
  const departmentNames = departments.map(d => d.name);
  const categoryNames = categories.map(c => c.name);

  // Calculate stats for dashboard
  const stats = {
    totalAssets: assets.length,
    activeAssets: assets.filter(a => a.status === 'ใช้งาน').length,
    repairAssets: assets.filter(a => a.status === 'ซ่อม').length,
    totalValue: assets.reduce((sum, a) => sum + a.purchase_price, 0),
    totalRepairs: repairs.length,
    pendingRepairs: repairs.filter(r => r.repair_status === 'รอดำเนินการ').length,
    inProgressRepairs: repairs.filter(r => r.repair_status === 'กำลังซ่อม').length,
    completedRepairs: repairs.filter(r => r.repair_status === 'เสร็จสิ้น').length,
    totalRepairCost: repairs.reduce((sum, r) => sum + r.repair_cost, 0)
  };

  // Category distribution for dashboard
  const categoryDistribution = categoryNames.map(catName => {
    const count = assets.filter(a => a.category === catName).length;
    return {
      name: catName,
      count,
      percent: assets.length > 0 ? Math.round((count / assets.length) * 100) : 0
    };
  }).filter(cat => cat.count > 0);

  // Ink budget calculations
  const currentMonth = new Date().toISOString().slice(0, 7);
  const monthlyTransactions = transactions.filter(t => t.transaction_date.startsWith(currentMonth));
  const totalExpense = monthlyTransactions.filter(t => t.transaction_type === 'รายจ่าย').reduce((sum, t) => sum + t.amount, 0);
  const totalIncome = monthlyTransactions.filter(t => t.transaction_type === 'รายรับ').reduce((sum, t) => sum + t.amount, 0);
  const netAmount = totalIncome - totalExpense;

  // Asset Detail Modal
  const AssetDetailModal = () => {
    if (!selectedAsset) return null;

    const assetRepairs = repairs.filter(r => r.asset_id === selectedAsset.id);

    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-3xl p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              รายละเอียดทรัพย์สิน
            </h2>
            <button 
              onClick={() => setShowAssetDetail(false)} 
              className="text-gray-400 hover:text-gray-600 text-3xl"
            >
              ×
            </button>
          </div>

          <div className="space-y-6">
            {selectedAsset.image_url && (
              <img 
                src={selectedAsset.image_url} 
                alt={selectedAsset.name} 
                className="w-full h-72 object-cover rounded-2xl shadow-xl" 
              />
            )}

            {/* QR Code Component */}
            <AssetQRCode asset={selectedAsset} />

            <div className="bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-8 rounded-2xl border-2 border-blue-100">
              <div className="flex items-center gap-5 mb-5">
                <span className="text-6xl">📦</span>
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
                { label: 'วันที่ซื้อ', value: formatDate(selectedAsset.purchase_date) },
                { label: 'หมดประกัน', value: formatDate(selectedAsset.warranty_end) },
                { label: 'ราคา', value: formatCurrency(selectedAsset.purchase_price), color: 'text-green-600' },
                { label: 'สถานที่', value: selectedAsset.location }
              ].map((item, idx) => (
                <div key={idx} className="bg-gradient-to-br from-gray-50 to-gray-100 p-5 rounded-xl border border-gray-200 hover:shadow-lg transition-all">
                  <p className="text-sm text-gray-600 mb-2 font-medium">{item.label}</p>
                  <p className={`font-bold text-lg ${item.color || 'text-gray-900'}`}>{item.value}</p>
                </div>
              ))}
            </div>

            {/* Repair History */}
            {assetRepairs.length > 0 && (
              <div className="bg-gradient-to-br from-orange-50 to-red-50 p-6 rounded-2xl border border-orange-200">
                <h4 className="font-bold text-xl mb-4 flex items-center gap-2">
                  🔧 ประวัติการซ่อม ({assetRepairs.length} ครั้ง)
                </h4>
                <div className="space-y-3">
                  {assetRepairs.map((repair) => (
                    <div key={repair.id} className="bg-white p-4 rounded-xl border border-orange-100">
                      <div className="flex justify-between items-start mb-2">
                        <p className="font-semibold text-gray-900">{repair.issue_description}</p>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                          repair.repair_status === 'เสร็จสิ้น' ? 'bg-green-100 text-green-700' :
                          repair.repair_status === 'กำลังซ่อม' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {repair.repair_status}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600 space-y-1">
                        <p>💰 ค่าใช้จ่าย: {formatCurrency(repair.repair_cost)}</p>
                        <p>👨‍🔧 ช่าง: {repair.technician || '-'}</p>
                        <p>📅 วันที่: {formatDate(repair.start_date)} {repair.end_date ? `→ ${formatDate(repair.end_date)}` : ''}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => {
                  setShowAssetDetail(false);
                  // TODO: Open edit modal
                }}
                className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white py-4 rounded-xl font-semibold hover:shadow-2xl hover:scale-105 transition-all"
              >
                ✏️ แก้ไข
              </button>
              <button
                onClick={() => {
                  setShowAssetDetail(false);
                  setShowAddRepair(true);
                }}
                className="bg-gradient-to-r from-orange-500 to-red-500 text-white py-4 rounded-xl font-semibold hover:shadow-2xl hover:scale-105 transition-all"
              >
                🔧 เพิ่มการซ่อม
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (assetsLoading && assets.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner text="กำลังโหลดระบบ..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-600 to-blue-800 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                📊 IT Asset Management System
              </h1>
              <p className="text-blue-100 mt-1">ระบบจัดการทรัพย์สิน IT และงบประมาณ</p>
            </div>
            <div className="text-right text-white">
              <p className="text-sm opacity-90">วันที่</p>
              <p className="font-semibold">{formatDate(new Date().toISOString())}</p>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="bg-white border-b shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex space-x-8">
            {[
              { id: 'dashboard', label: '📈 Dashboard', value: 'dashboard' },
              { id: 'assets', label: '📦 ทรัพย์สิน', value: 'assets', badge: filteredAssets.length },
              { id: 'repairs', label: '🔧 การซ่อม', value: 'repairs', badge: repairs.length },
              { id: 'ink', label: '💰 งบหมึก', value: 'ink', badge: transactions.length }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.value as TabType)}
                className={`py-4 px-2 border-b-2 font-medium text-sm transition-all relative ${
                  activeTab === tab.value
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
                {tab.badge !== undefined && (
                  <span className={`ml-2 px-2 py-0.5 text-xs rounded-full ${
                    activeTab === tab.value 
                      ? 'bg-blue-100 text-blue-600' 
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {tab.badge}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">

        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">ภาพรวมระบบ</h2>
              <button
                onClick={() => {
                  exportAssetsToCSV(assets);
                  exportRepairsToCSV(repairs);
                }}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                📥 Export ข้อมูลทั้งหมด
              </button>
            </div>

            {/* Asset Stats */}
            <div>
              <h3 className="text-lg font-semibold mb-3 text-gray-700">ทรัพย์สิน</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                  title="ทรัพย์สินทั้งหมด"
                  value={stats.totalAssets}
                  icon="📦"
                  color="blue"
                  onClick={() => setActiveTab('assets')}
                />
                <StatCard
                  title="ใช้งานปกติ"
                  value={stats.activeAssets}
                  subtitle={`${stats.totalAssets > 0 ? Math.round((stats.activeAssets / stats.totalAssets) * 100) : 0}% ของทั้งหมด`}
                  icon="✅"
                  color="green"
                />
                <StatCard
                  title="อยู่ระหว่างซ่อม"
                  value={stats.repairAssets}
                  subtitle={`${stats.totalAssets > 0 ? Math.round((stats.repairAssets / stats.totalAssets) * 100) : 0}% ของทั้งหมด`}
                  icon="🔧"
                  color="yellow"
                  onClick={() => setActiveTab('repairs')}
                />
                <StatCard
                  title="มูลค่ารวม"
                  value={formatCurrency(stats.totalValue)}
                  icon="💰"
                  color="purple"
                />
              </div>
            </div>

            {/* Repair Stats */}
            <div>
              <h3 className="text-lg font-semibold mb-3 text-gray-700">การซ่อมบำรุง</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                  title="การซ่อมทั้งหมด"
                  value={stats.totalRepairs}
                  icon="🔨"
                  color="blue"
                />
                <StatCard
                  title="รอดำเนินการ"
                  value={stats.pendingRepairs}
                  icon="⏳"
                  color="gray"
                />
                <StatCard
                  title="กำลังซ่อม"
                  value={stats.inProgressRepairs}
                  icon="⚙️"
                  color="yellow"
                />
                <StatCard
                  title="ค่าใช้จ่ายรวม"
                  value={formatCurrency(stats.totalRepairCost)}
                  icon="💸"
                  color="red"
                />
              </div>
            </div>

            {/* Ink Budget Summary */}
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 border-2 border-green-200">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold text-green-700">💰 งบประมาณหมึกเดือนนี้</h3>
                <button
                  onClick={() => setActiveTab('ink')}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  ดูทั้งหมด →
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-6 rounded-xl shadow-md">
                  <p className="text-sm text-gray-600 mb-2">รายรับทั้งหมด</p>
                  <p className="text-3xl font-bold text-green-600">{formatCurrency(totalIncome)}</p>
                  <p className="text-xs text-gray-500 mt-1">{monthlyTransactions.filter(t => t.transaction_type === 'รายรับ').length} รายการ</p>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-md">
                  <p className="text-sm text-gray-600 mb-2">รายจ่ายทั้งหมด</p>
                  <p className="text-3xl font-bold text-red-600">{formatCurrency(totalExpense)}</p>
                  <p className="text-xs text-gray-500 mt-1">{monthlyTransactions.filter(t => t.transaction_type === 'รายจ่าย').length} รายการ</p>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-md">
                  <p className="text-sm text-gray-600 mb-2">ยอดสุทธิ</p>
                  <p className={`text-3xl font-bold ${netAmount >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
                    {netAmount >= 0 ? '+' : ''}{formatCurrency(netAmount)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">{netAmount >= 0 ? 'กำไร' : 'ขาดทุน'}</p>
                </div>
              </div>
            </div>

            {/* Category Distribution */}
            {categoryDistribution.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold mb-4 text-gray-700">การกระจายตามหมวดหมู่</h3>
                <div className="space-y-3">
                  {categoryDistribution.map((cat, idx) => (
                    <div key={idx} className="flex items-center gap-3">
                      <div className="w-32 text-sm font-medium text-gray-700">{cat.name}</div>
                      <div className="flex-1">
                        <div className="bg-gray-200 rounded-full h-6 relative overflow-hidden">
                          <div
                            className="bg-blue-500 h-full rounded-full transition-all duration-500 flex items-center justify-end px-2"
                            style={{ width: `${cat.percent}%` }}
                          >
                            <span className="text-xs text-white font-medium">{cat.percent}%</span>
                          </div>
                        </div>
                      </div>
                      <div className="w-16 text-right text-sm text-gray-600">{cat.count} รายการ</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Assets Tab */}
        {activeTab === 'assets' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">
                จัดการทรัพย์สิน ({filteredAssets.length})
              </h2>
              <div className="flex gap-2">
                <button
                  onClick={() => exportAssetsToCSV(assets)}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  📥 Export CSV
                </button>
                <button
                  onClick={() => setShowAddAsset(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  ➕ เพิ่มทรัพย์สิน
                </button>
              </div>
            </div>

            <AssetStats assets={filteredAssets} />

            <AssetFilters
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              selectedDepartment={selectedDepartment}
              onDepartmentChange={setSelectedDepartment}
              selectedCategory={selectedCategory}
              onCategoryChange={setSelectedCategory}
              selectedStatus={selectedStatus}
              onStatusChange={setSelectedStatus}
              departments={departmentNames}
              categories={categoryNames}
            />

            <AssetList
              assets={filteredAssets}
              onAssetClick={(asset) => {
                setSelectedAsset(asset);
                setShowAssetDetail(true);
              }}
              loading={assetsLoading}
            />
          </div>
        )}

        {/* Repairs Tab */}
        {activeTab === 'repairs' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">
                ประวัติการซ่อม ({repairs.length})
              </h2>
              <div className="flex gap-2">
                <button
                  onClick={() => exportRepairsToCSV(repairs)}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  📥 Export CSV
                </button>
                <button
                  onClick={() => setShowAddRepair(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  ➕ เพิ่มการซ่อม
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <StatCard
                title="การซ่อมทั้งหมด"
                value={stats.totalRepairs}
                icon="🔨"
                color="blue"
              />
              <StatCard
                title="รอดำเนินการ"
                value={stats.pendingRepairs}
                icon="⏳"
                color="gray"
              />
              <StatCard
                title="กำลังซ่อม"
                value={stats.inProgressRepairs}
                icon="⚙️"
                color="yellow"
              />
              <StatCard
                title="เสร็จสิ้น"
                value={stats.completedRepairs}
                icon="✅"
                color="green"
              />
            </div>

            {repairsLoading ? (
              <LoadingSpinner />
            ) : repairs.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                <p className="text-gray-500 text-lg">ไม่มีประวัติการซ่อม</p>
                <p className="text-gray-400 text-sm mt-2">ระบบยังไม่มีการบันทึกการซ่อมทรัพย์สิน</p>
              </div>
            ) : (
              <div className="space-y-4">
                {repairs.map((repair) => (
                  <div key={repair.id} className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-bold text-lg">{repair.asset_name}</h3>
                          <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-600">
                            {repair.asset_tag}
                          </span>
                        </div>
                        <p className="text-gray-700 mb-3">{repair.issue_description}</p>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <p className="text-gray-500">ค่าใช้จ่าย</p>
                            <p className="font-semibold">{formatCurrency(repair.repair_cost)}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">ช่าง</p>
                            <p className="font-semibold">{repair.technician || '-'}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">วันที่เริ่ม</p>
                            <p className="font-semibold">{formatDate(repair.start_date)}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">วันที่เสร็จ</p>
                            <p className="font-semibold">{repair.end_date ? formatDate(repair.end_date) : '-'}</p>
                          </div>
                        </div>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium whitespace-nowrap ${
                        repair.repair_status === 'เสร็จสิ้น' ? 'bg-green-100 text-green-800' :
                        repair.repair_status === 'กำลังซ่อม' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {repair.repair_status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Ink Budget Tab */}
        {activeTab === 'ink' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">งบประมาณหมึก</h2>
              <div className="flex gap-2">
                <button
                  onClick={() => exportTransactionsToCSV(transactions)}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  📥 Export CSV
                </button>
                <button
                  onClick={() => setShowAddTransaction(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  ➕ เพิ่มรายการ
                </button>
              </div>
            </div>

            {summary && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <StatCard
                  title="รายรับทั้งหมด"
                  value={formatCurrency(summary.total_income)}
                  subtitle={`${transactions.filter(t => t.transaction_type === 'รายรับ').length} รายการ`}
                  icon="💵"
                  color="green"
                />
                <StatCard
                  title="รายจ่ายทั้งหมด"
                  value={formatCurrency(summary.total_expense)}
                  subtitle={`${transactions.filter(t => t.transaction_type === 'รายจ่าย').length} รายการ`}
                  icon="💳"
                  color="red"
                />
                <StatCard
                  title="ยอดสุทธิ"
                  value={formatCurrency(summary.net_amount)}
                  subtitle={summary.net_amount >= 0 ? 'กำไร' : 'ขาดทุน'}
                  icon={summary.net_amount >= 0 ? '📈' : '📉'}
                  color={summary.net_amount >= 0 ? 'blue' : 'orange'}
                />
              </div>
            )}

            <div className="bg-white rounded-lg shadow-sm">
              <div className="p-6 border-b">
                <h3 className="font-bold text-lg">รายการล่าสุด</h3>
              </div>
              <div className="p-6">
                {transactionsLoading ? (
                  <LoadingSpinner />
                ) : transactions.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500">ยังไม่มีรายการ</p>
                    <p className="text-gray-400 text-sm mt-2">คลิกปุ่มด้านบนเพื่อเพิ่มรายการใหม่</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {transactions.slice(0, 20).map(tx => (
                      <div key={tx.id} className="flex justify-between items-center border-b pb-3 last:border-b-0">
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{tx.description}</p>
                          <p className="text-sm text-gray-500">
                            {formatDate(tx.transaction_date)}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className={`font-bold text-lg ${
                            tx.transaction_type === 'รายรับ' ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {tx.transaction_type === 'รายรับ' ? '+' : '-'}{formatCurrency(tx.amount)}
                          </span>
                          <p className="text-xs text-gray-500">{tx.transaction_type}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-12">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <p className="text-gray-600">
              <span className="font-semibold">IT Asset Management System</span> © 2026
            </p>
            <div className="text-sm text-gray-500">
              <p>จำนวนข้อมูล: {assets.length} ทรัพย์สิน • {repairs.length} การซ่อม • {transactions.length} รายการ</p>
            </div>
          </div>
        </div>
      </footer>

      {/* Modals - TODO: Implement modal components */}
      {showAssetDetail && <AssetDetailModal />}
      
      {/* TODO: Add other modals:
      {showAddAsset && <AddAssetModal />}
      {showAddRepair && <AddRepairModal />}
      {showAddTransaction && <AddTransactionModal />}
      */}
    </div>
  );
}

export default App;
