import React, { useState } from 'react';

// ไม่ต้อง import lucide-react, react-barcode, xlsx ก่อน
// จะใช้ emoji และ HTML แทนชั่วคราว

const App = () => {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showDepartmentModal, setShowDepartmentModal] = useState(false);
  const [showInkBudgetModal, setShowInkBudgetModal] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('ทั้งหมด');
  const [filterStatus, setFilterStatus] = useState('ทั้งหมด');

  // Stats
  const stats = [
    { icon: '📦', label: 'ทรัพย์สินทั้งหมด', value: '248', color: 'bg-blue-500' },
    { icon: '⚠️', label: 'การรับประกันใกล้หมด', value: '12', color: 'bg-yellow-500' },
    { icon: '🔧', label: 'อยู่ระหว่างซ่อม', value: '8', color: 'bg-red-500' },
    { icon: '💰', label: 'มูลค่ารวม', value: '฿2.4M', color: 'bg-green-500' },
    { icon: '🏢', label: 'แผนกทั้งหมด', value: '5', color: 'bg-purple-500' },
    { icon: '🗑️', label: 'ทรัพย์สินที่ตัดจำหน่าย', value: '35', color: 'bg-gray-500' }
  ];

  const categoryData = [
    { icon: '💻', name: 'คอมพิวเตอร์', count: 85, percent: 34, color: 'bg-blue-500' },
    { icon: '💼', name: 'โน้ตบุ๊ค', count: 62, percent: 25, color: 'bg-indigo-500' },
    { icon: '🖥️', name: 'จอมอนิเตอร์', count: 48, percent: 19, color: 'bg-purple-500' },
    { icon: '🖨️', name: 'เครื่องพิมพ์', count: 28, percent: 11, color: 'bg-pink-500' },
    { icon: '📡', name: 'อุปกรณ์เครือข่าย', count: 25, percent: 10, color: 'bg-green-500' }
  ];

  const [assets, setAssets] = useState([
    {
      id: 1,
      icon: '💻',
      name: 'Dell Optiplex 7090',
      tag: 'IT-2023-001',
      serial: 'ABC123456789',
      category: 'คอมพิวเตอร์',
      location: 'ฝ่ายไอที',
      status: 'ใช้งาน',
      purchaseDate: '15/01/2023',
      warrantyExpiry: '15/01/2026',
      price: '35,000',
      warrantyDays: 15
    },
    {
      id: 2,
      icon: '💼',
      name: 'MacBook Pro M3',
      tag: 'IT-2024-025',
      serial: 'MBP202400125',
      category: 'โน้ตบุ๊ค',
      location: 'ฝ่ายขาย',
      status: 'ใช้งาน',
      purchaseDate: '10/03/2024',
      warrantyExpiry: '10/03/2027',
      price: '89,900',
      warrantyDays: 800
    },
    {
      id: 3,
      icon: '🖨️',
      name: 'HP LaserJet Pro MFP M428',
      tag: 'IT-2023-045',
      serial: 'HPM428-789456',
      category: 'เครื่องพิมพ์',
      location: 'ฝ่ายบัญชี',
      status: 'ซ่อม',
      purchaseDate: '20/06/2023',
      warrantyExpiry: '20/06/2026',
      price: '28,500',
      warrantyDays: 22
    }
  ]);

  const [departments, setDepartments] = useState([
    'ฝ่ายไอที', 'ฝ่ายขาย', 'ฝ่ายบัญชี', 'ฝ่ายการตลาด', 'ฝ่ายบริหาร'
  ]);

  // Ink & Toner Budget Tracking
  const [inkInventory, setInkInventory] = useState([
    {
      id: 1,
      printerName: 'HP LaserJet Pro MFP M428',
      printerTag: 'IT-2023-045',
      inkType: 'Toner Cartridge HP 30A (Black)',
      currentLevel: 35,
      minLevel: 20,
      maxLevel: 100,
      unitPrice: 1850,
      lastRefill: '15/12/2025',
      estimatedDaysLeft: 18,
      monthlyUsage: 2.5,
      status: 'ต่ำ'
    },
    {
      id: 2,
      printerName: 'Canon PIXMA G7070',
      printerTag: 'IT-2024-089',
      inkType: 'Ink Tank GI-790 (Cyan)',
      currentLevel: 78,
      minLevel: 15,
      maxLevel: 100,
      unitPrice: 350,
      lastRefill: '28/11/2025',
      estimatedDaysLeft: 45,
      monthlyUsage: 1.8,
      status: 'ปกติ'
    },
    {
      id: 3,
      printerName: 'Epson L15160',
      printerTag: 'IT-2023-112',
      inkType: 'Ink Bottle 774 (Black)',
      currentLevel: 12,
      minLevel: 20,
      maxLevel: 100,
      unitPrice: 420,
      lastRefill: '05/12/2025',
      estimatedDaysLeft: 8,
      monthlyUsage: 3.2,
      status: 'วิกฤต'
    }
  ]);

  // Ink Budget Summary
  const inkBudgetStats = {
    totalSpentThisMonth: 8950,
    budgetLimit: 15000,
    lowStockItems: 2,
    criticalItems: 1,
    estimatedNextMonthCost: 5600
  };

  // Filter assets
  const filteredAssets = assets.filter(asset => {
    const matchSearch = asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       asset.tag.toLowerCase().includes(searchTerm.toLowerCase());
    const matchCategory = filterCategory === 'ทั้งหมด' || asset.category === filterCategory;
    const matchStatus = filterStatus === 'ทั้งหมด' || asset.status === filterStatus;
    return matchSearch && matchCategory && matchStatus;
  });

  // Generate simple barcode (text representation)
  const generateBarcode = (code) => {
    return `|||  | || ||| || |  ||| | ||  ${code}`;
  };

  // Export to "Excel" (CSV format)
  const exportToExcel = () => {
    const csvContent = [
      ['รหัสทรัพย์สิน', 'ชื่อ', 'ซีเรียล', 'หมวดหมู่', 'สถานที่', 'สถานะ', 'วันที่ซื้อ', 'ราคา'],
      ...assets.map(a => [a.tag, a.name, a.serial, a.category, a.location, a.status, a.purchaseDate, a.price])
    ].map(row => row.join(',')).join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'assets_export.csv';
    link.click();
  };

  // Export Ink Budget Report
  const exportInkBudget = () => {
    const csvContent = [
      ['เครื่องพิมพ์', 'รหัส', 'ประเภทหมึก', 'ระดับปัจจุบัน%', 'ราคา/หน่วย', 'วันที่เติมล่าสุด', 'คงเหลือ(วัน)', 'สถานะ'],
      ...inkInventory.map(i => [i.printerName, i.printerTag, i.inkType, i.currentLevel, i.unitPrice, i.lastRefill, i.estimatedDaysLeft, i.status])
    ].map(row => row.join(',')).join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'ink_budget_report.csv';
    link.click();
  };

  // Add Asset Modal Component
  const AddAssetModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">เพิ่มทรัพย์สินใหม่</h2>
          <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600 text-2xl">✕</button>
        </div>
        <form className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">ชื่อทรัพย์สิน</label>
              <input type="text" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">รหัสทรัพย์สิน</label>
              <input type="text" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">หมายเลขซีเรียล</label>
              <input type="text" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">หมวดหมู่</label>
              <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                <option>คอมพิวเตอร์</option>
                <option>โน้ตบุ๊ค</option>
                <option>จอมอนิเตอร์</option>
                <option>เครื่องพิมพ์</option>
                <option>อุปกรณ์เครือข่าย</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">สถานที่</label>
              <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                {departments.map(dept => <option key={dept}>{dept}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">ราคา (บาท)</label>
              <input type="number" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">วันที่ซื้อ</label>
              <input type="date" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">วันหมดประกัน</label>
              <input type="date" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
            </div>
          </div>
          <div className="flex gap-3 pt-4">
            <button type="submit" className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-lg font-medium hover:shadow-lg transition-shadow">
              ✅ บันทึก
            </button>
            <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-300">
              ❌ ยกเลิก
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  // Asset Detail Modal
  const AssetDetailModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">รายละเอียดทรัพย์สิน</h2>
          <button onClick={() => setShowDetailModal(false)} className="text-gray-400 hover:text-gray-600 text-2xl">✕</button>
        </div>
        {selectedAsset && (
          <div className="space-y-6">
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-100">
              <div className="flex items-center gap-4 mb-4">
                <span className="text-5xl">{selectedAsset.icon}</span>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">{selectedAsset.name}</h3>
                  <p className="text-gray-600">รหัส: {selectedAsset.tag}</p>
                </div>
              </div>
              <div className="bg-white p-4 rounded-lg font-mono text-center text-sm mb-2">
                {generateBarcode(selectedAsset.tag)}
              </div>
              <p className="text-center text-xs text-gray-600">{selectedAsset.tag}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">หมายเลขซีเรียล</p>
                <p className="font-semibold text-gray-900">{selectedAsset.serial}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">หมวดหมู่</p>
                <p className="font-semibold text-gray-900">{selectedAsset.category}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">สถานที่</p>
                <p className="font-semibold text-gray-900">{selectedAsset.location}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">สถานะ</p>
                <p className="font-semibold text-gray-900">{selectedAsset.status}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">วันที่ซื้อ</p>
                <p className="font-semibold text-gray-900">{selectedAsset.purchaseDate}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">หมดประกัน</p>
                <p className="font-semibold text-gray-900">{selectedAsset.warrantyExpiry}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">ราคา</p>
                <p className="font-semibold text-green-600">฿{selectedAsset.price}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">การรับประกันคงเหลือ</p>
                <p className={`font-semibold ${selectedAsset.warrantyDays < 30 ? 'text-yellow-600' : 'text-green-600'}`}>
                  {selectedAsset.warrantyDays} วัน
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <button className="flex-1 bg-blue-500 text-white py-3 rounded-lg font-medium hover:bg-blue-600 flex items-center justify-center gap-2">
                ✏️ แก้ไข
              </button>
              <button className="flex-1 bg-red-500 text-white py-3 rounded-lg font-medium hover:bg-red-600 flex items-center justify-center gap-2">
                🗑️ ลบ
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  // Department Management Modal
  const DepartmentModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 max-w-md w-full">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">จัดการแผนก</h2>
          <button onClick={() => setShowDepartmentModal(false)} className="text-gray-400 hover:text-gray-600 text-2xl">✕</button>
        </div>
        <div className="space-y-3 mb-4">
          {departments.map((dept, idx) => (
            <div key={idx} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
              <span className="font-medium">{dept}</span>
              <button className="text-red-500 hover:text-red-700">🗑️</button>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <input type="text" placeholder="ชื่อแผนกใหม่" className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
          <button className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2 rounded-lg font-medium hover:shadow-lg">
            ➕ เพิ่ม
          </button>
        </div>
      </div>
    </div>
  );

  // Ink Budget Modal
  const InkBudgetModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">🖨️ ระบบติดตามงบประมาณหมึกพิมพ์</h2>
            <p className="text-sm text-gray-500">Ink & Toner Budget Control System</p>
          </div>
          <button onClick={() => setShowInkBudgetModal(false)} className="text-gray-400 hover:text-gray-600 text-2xl">✕</button>
        </div>

        {/* Ink Budget Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl border border-blue-200">
            <p className="text-xs text-blue-600 mb-1">💰 ค่าใช้จ่ายเดือนนี้</p>
            <p className="text-2xl font-bold text-blue-900">฿{inkBudgetStats.totalSpentThisMonth.toLocaleString()}</p>
          </div>
          <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-xl border border-green-200">
            <p className="text-xs text-green-600 mb-1">📊 งบประมาณทั้งหมด</p>
            <p className="text-2xl font-bold text-green-900">฿{inkBudgetStats.budgetLimit.toLocaleString()}</p>
          </div>
          <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 p-4 rounded-xl border border-yellow-200">
            <p className="text-xs text-yellow-600 mb-1">⚠️ สต็อกต่ำ</p>
            <p className="text-2xl font-bold text-yellow-900">{inkBudgetStats.lowStockItems} รายการ</p>
          </div>
          <div className="bg-gradient-to-br from-red-50 to-red-100 p-4 rounded-xl border border-red-200">
            <p className="text-xs text-red-600 mb-1">🚨 วิกฤต</p>
            <p className="text-2xl font-bold text-red-900">{inkBudgetStats.criticalItems} รายการ</p>
          </div>
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-xl border border-purple-200">
            <p className="text-xs text-purple-600 mb-1">📈 คาดการณ์เดือนหน้า</p>
            <p className="text-2xl font-bold text-purple-900">฿{inkBudgetStats.estimatedNextMonthCost.toLocaleString()}</p>
          </div>
        </div>

        {/* Budget Progress Bar */}
        <div className="bg-gray-50 p-4 rounded-xl mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">การใช้งบประมาณ</span>
            <span className="text-sm font-bold text-gray-900">
              {((inkBudgetStats.totalSpentThisMonth / inkBudgetStats.budgetLimit) * 100).toFixed(1)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-4">
            <div 
              className="bg-gradient-to-r from-blue-500 to-purple-500 h-4 rounded-full transition-all duration-500"
              style={{ width: `${(inkBudgetStats.totalSpentThisMonth / inkBudgetStats.budgetLimit) * 100}%` }}
            ></div>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            คงเหลือ ฿{(inkBudgetStats.budgetLimit - inkBudgetStats.totalSpentThisMonth).toLocaleString()} จากงบประมาณทั้งหมด
          </p>
        </div>

        {/* Ink Inventory Table */}
        <div className="space-y-3">
          {inkInventory.map((ink) => (
            <div key={ink.id} className="bg-white border-2 border-gray-200 rounded-xl p-4 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-start gap-3">
                  <span className="text-3xl">🖨️</span>
                  <div>
                    <h3 className="font-bold text-lg text-gray-900">{ink.printerName}</h3>
                    <p className="text-sm text-gray-600">รหัส: {ink.printerTag}</p>
                    <p className="text-sm font-medium text-gray-700 mt-1">{ink.inkType}</p>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                  ink.status === 'วิกฤต' ? 'bg-red-100 text-red-700' :
                  ink.status === 'ต่ำ' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-green-100 text-green-700'
                }`}>
                  {ink.status}
                </span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-sm mb-3">
                <div>
                  <p className="text-gray-500">ระดับหมึกปัจจุบัน</p>
                  <p className="font-bold text-lg text-gray-900">{ink.currentLevel}%</p>
                </div>
                <div>
                  <p className="text-gray-500">คงเหลือ (วัน)</p>
                  <p className={`font-bold text-lg ${ink.estimatedDaysLeft < 10 ? 'text-red-600' : 'text-green-600'}`}>
                    {ink.estimatedDaysLeft}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">ราคา/หน่วย</p>
                  <p className="font-bold text-lg text-gray-900">฿{ink.unitPrice.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-gray-500">ใช้ต่อเดือน (%)</p>
                  <p className="font-bold text-lg text-gray-900">{ink.monthlyUsage}</p>
                </div>
                <div>
                  <p className="text-gray-500">เติมล่าสุด</p>
                  <p className="font-bold text-sm text-gray-900">{ink.lastRefill}</p>
                </div>
              </div>

              {/* Ink Level Progress Bar */}
              <div className="mb-3">
                <div className="w-full bg-gray-200 rounded-full h-3 relative">
                  <div 
                    className={`h-3 rounded-full transition-all duration-500 ${
                      ink.currentLevel < ink.minLevel ? 'bg-red-500' :
                      ink.currentLevel < 50 ? 'bg-yellow-500' : 'bg-green-500'
                    }`}
                    style={{ width: `${ink.currentLevel}%` }}
                  ></div>
                  <div 
                    className="absolute top-0 bottom-0 w-0.5 bg-red-600" 
                    style={{ left: `${ink.minLevel}%` }}
                    title={`ระดับขั้นต่ำ: ${ink.minLevel}%`}
                  ></div>
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>0%</span>
                  <span>ขั้นต่ำ: {ink.minLevel}%</span>
                  <span>100%</span>
                </div>
              </div>

              <div className="flex gap-2">
                <button className="flex-1 bg-blue-500 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-600">
                  🛒 สั่งซื้อหมึก
                </button>
                <button className="flex-1 bg-green-500 text-white py-2 rounded-lg text-sm font-medium hover:bg-green-600">
                  ✏️ บันทึกการเติม
                </button>
                <button className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-300">
                  📊 ประวัติ
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-3 mt-6 pt-6 border-t">
          <button onClick={exportInkBudget} className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 text-white py-3 rounded-lg font-medium hover:shadow-lg flex items-center justify-center gap-2">
            📥 Export รายงานหมึกพิมพ์
          </button>
          <button className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-lg font-medium hover:shadow-lg flex items-center justify-center gap-2">
            ➕ เพิ่มรายการหมึกใหม่
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-blue-600 to-purple-600 p-2 rounded-xl">
                <span className="text-2xl">📦</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">ระบบจัดการทรัพย์สิน</h1>
                <p className="text-xs text-gray-500">IT Asset Management System</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setShowDepartmentModal(true)}
                className="hidden md:flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium transition-colors"
              >
                🏢 จัดการแผนก
              </button>
              <button 
                onClick={() => setShowInkBudgetModal(true)}
                className="hidden md:flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:shadow-lg rounded-lg text-sm font-medium transition-shadow"
              >
                🖨️ งบหมึกพิมพ์
              </button>
              <button className="p-2 hover:bg-gray-100 rounded-lg">⚙️</button>
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                AD
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex gap-1">
            <button
              onClick={() => setCurrentPage('dashboard')}
              className={`px-5 py-3 font-medium flex items-center gap-2 border-b-2 ${
                currentPage === 'dashboard'
                  ? 'border-blue-600 text-blue-600 bg-blue-50'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              🏠 แดชบอร์ด
            </button>
            <button
              onClick={() => setCurrentPage('assets')}
              className={`px-5 py-3 font-medium flex items-center gap-2 border-b-2 ${
                currentPage === 'assets'
                  ? 'border-blue-600 text-blue-600 bg-blue-50'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              📦 ทรัพย์สิน
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {currentPage === 'dashboard' ? (
          <div className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {stats.map((stat, idx) => (
                <div key={idx} className="bg-white rounded-xl p-5 border border-gray-200 hover:shadow-lg transition-shadow">
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`${stat.color} p-2 rounded-lg`}>
                      <span className="text-white text-xl">{stat.icon}</span>
                    </div>
                    <span className="text-sm text-gray-600 font-medium">{stat.label}</span>
                  </div>
                  <div className="text-3xl font-bold text-gray-900">{stat.value}</div>
                </div>
              ))}
            </div>

            {/* Category Chart */}
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                📊 ทรัพย์สินแยกตามหมวดหมู่
              </h2>
              <div className="space-y-4">
                {categoryData.map((cat, idx) => (
                  <div key={idx}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span>{cat.icon}</span>
                        <span className="text-sm font-medium">{cat.name}</span>
                      </div>
                      <span className="text-sm text-gray-600 font-semibold">
                        {cat.count} รายการ ({cat.percent}%)
                      </span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-3">
                      <div
                        className={`${cat.color} h-3 rounded-full transition-all duration-500`}
                        style={{ width: `${cat.percent}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Toolbar */}
            <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
              <h1 className="text-2xl font-bold text-gray-900">ทรัพย์สินทั้งหมด</h1>
              <div className="flex gap-2 w-full md:w-auto">
                <button 
                  onClick={() => setShowAddModal(true)}
                  className="flex-1 md:flex-none bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2.5 rounded-lg font-medium hover:shadow-lg transition-shadow flex items-center justify-center gap-2"
                >
                  ➕ เพิ่มทรัพย์สิน
                </button>
                <button 
                  onClick={exportToExcel}
                  className="flex-1 md:flex-none bg-green-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                >
                  📥 Export
                </button>
              </div>
            </div>

            {/* Search and Filters */}
            <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2">🔍</span>
                  <input
                    type="text"
                    placeholder="ค้นหาทรัพย์สิน..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option>ทั้งหมด</option>
                  <option>คอมพิวเตอร์</option>
                  <option>โน้ตบุ๊ค</option>
                  <option>จอมอนิเตอร์</option>
                  <option>เครื่องพิมพ์</option>
                  <option>อุปกรณ์เครือข่าย</option>
                </select>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option>ทั้งหมด</option>
                  <option>ใช้งาน</option>
                  <option>ซ่อม</option>
                  <option>เก็บคลัง</option>
                </select>
              </div>
            </div>

            {/* Assets List */}
            <div className="space-y-4">
              {filteredAssets.map((asset) => (
                <div key={asset.id} className="bg-white rounded-xl p-5 border border-gray-200 hover:shadow-lg transition-shadow">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-4 rounded-xl border border-blue-100">
                      <span className="text-3xl">{asset.icon}</span>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-lg text-gray-900">{asset.name}</h3>
                      <div className="flex items-center gap-3 mt-2 flex-wrap">
                        <span className="text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
                          🏷️ {asset.tag}
                        </span>
                        <span className="text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
                          📍 {asset.location}
                        </span>
                        <span
                          className={`text-xs px-3 py-1 rounded-full font-medium ${
                            asset.status === 'ใช้งาน'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-orange-100 text-orange-700'
                          }`}
                        >
                          {asset.status}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => {
                          setSelectedAsset(asset);
                          setShowDetailModal(true);
                        }}
                        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium"
                      >
                        👁️ ดูรายละเอียด
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm bg-gray-50 p-4 rounded-lg">
                    <div>
                      <div className="text-gray-500 mb-1">หมายเลขซีเรียล</div>
                      <div className="font-semibold text-gray-900">{asset.serial}</div>
                    </div>
                    <div>
                      <div className="text-gray-500 mb-1">วันที่ซื้อ</div>
                      <div className="font-semibold text-gray-900">{asset.purchaseDate}</div>
                    </div>
                    <div>
                      <div className="text-gray-500 mb-1">ราคา</div>
                      <div className="font-semibold text-gray-900">฿{asset.price}</div>
                    </div>
                    <div>
                      <div className="text-gray-500 mb-1">การรับประกัน</div>
                      <div
                        className={`font-semibold ${
                          asset.warrantyDays < 30 ? 'text-yellow-600' : 'text-green-600'
                        }`}
                      >
                        {asset.warrantyDays < 365 ? `เหลือ ${asset.warrantyDays} วัน` : 'ยังใช้ได้'}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {filteredAssets.length === 0 && (
              <div className="bg-white rounded-xl p-12 text-center border border-gray-200">
                <span className="text-6xl mb-4 block">🔍</span>
                <p className="text-xl font-semibold text-gray-700 mb-2">ไม่พบทรัพย์สิน</p>
                <p className="text-gray-500">ลองเปลี่ยนคำค้นหาหรือตัวกรอง</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modals */}
      {showAddModal && <AddAssetModal />}
      {showDetailModal && selectedAsset && <AssetDetailModal />}
      {showDepartmentModal && <DepartmentModal />}
      {showInkBudgetModal && <InkBudgetModal />}
    </div>
  );
};

export default App;
