import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import type { Asset, InkItem } from './supabaseClient';

const App = () => {
  const [currentPage, setCurrentPage] = useState<string>('dashboard');
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [showDetailModal, setShowDetailModal] = useState<boolean>(false);
  const [showDepartmentModal, setShowDepartmentModal] = useState<boolean>(false);
  const [showInkBudgetModal, setShowInkBudgetModal] = useState<boolean>(false);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterCategory, setFilterCategory] = useState<string>('ทั้งหมด');
  const [filterStatus, setFilterStatus] = useState<string>('ทั้งหมด');
  const [loading, setLoading] = useState<boolean>(true);

  // State with Supabase types
  const [assets, setAssets] = useState<Asset[]>([]);
  const [departments, setDepartments] = useState<string[]>([]);
  const [inkInventory, setInkInventory] = useState<InkItem[]>([]);

  // Stats - Fixed type inference
  const stats = [
    { icon: '📦', label: 'ทรัพย์สินทั้งหมด', value: assets.length.toString(), color: 'bg-blue-500' },
    { icon: '⚠️', label: 'การรับประกันใกล้หมด', value: assets.filter((asset: Asset) => asset.warranty_days < 30).length.toString(), color: 'bg-yellow-500' },
    { icon: '🔧', label: 'อยู่ระหว่างซ่อม', value: assets.filter((asset: Asset) => asset.status === 'ซ่อม').length.toString(), color: 'bg-red-500' },
    { icon: '💰', label: 'มูลค่ารวม', value: `฿${(assets.reduce((sum, asset: Asset) => sum + parseFloat(asset.price.replace(/,/g, '')), 0) / 1000000).toFixed(1)}M`, color: 'bg-green-500' },
    { icon: '🏢', label: 'แผนกทั้งหมด', value: departments.length.toString(), color: 'bg-purple-500' },
    { icon: '🗑️', label: 'ทรัพย์สินที่ตัดจำหน่าย', value: '0', color: 'bg-gray-500' }
  ];

  const categoryData = [
    { icon: '💻', name: 'คอมพิวเตอร์', count: assets.filter((asset: Asset) => asset.category === 'คอมพิวเตอร์').length, color: 'bg-blue-500' },
    { icon: '💼', name: 'โน้ตบุ๊ค', count: assets.filter((asset: Asset) => asset.category === 'โน้ตบุ๊ค').length, color: 'bg-indigo-500' },
    { icon: '🖥️', name: 'จอมอนิเตอร์', count: assets.filter((asset: Asset) => asset.category === 'จอมอนิเตอร์').length, color: 'bg-purple-500' },
    { icon: '🖨️', name: 'เครื่องพิมพ์', count: assets.filter((asset: Asset) => asset.category === 'เครื่องพิมพ์').length, color: 'bg-pink-500' },
    { icon: '📡', name: 'อุปกรณ์เครือข่าย', count: assets.filter((asset: Asset) => asset.category === 'อุปกรณ์เครือข่าย').length, color: 'bg-green-500' }
  ].map(cat => ({
    ...cat,
    percent: assets.length > 0 ? Math.round((cat.count / assets.length) * 100) : 0
  }));

  // Ink Budget Summary
  const inkBudgetStats = {
    totalSpentThisMonth: 8950,
    budgetLimit: 15000,
    lowStockItems: inkInventory.filter((ink: InkItem) => ink.current_level < ink.min_level && ink.status !== 'วิกฤต').length,
    criticalItems: inkInventory.filter((ink: InkItem) => ink.status === 'วิกฤต').length,
    estimatedNextMonthCost: 5600
  };

  // Fetch data from Supabase
  useEffect(() => {
    fetchAllData();
    const cleanup = setupRealtimeSubscriptions();
    return cleanup;
  }, []);

  const fetchAllData = async (): Promise<void> => {
    try {
      setLoading(true);

      // Fetch assets
      const { data: assetsData, error: assetsError } = await supabase
        .from('assets')
        .select('*')
        .order('created_at', { ascending: false });

      if (assetsError) throw assetsError;
      if (assetsData) {
        setAssets(assetsData as Asset[]);
      }

      // Fetch departments
      const { data: deptsData, error: deptsError } = await supabase
        .from('departments')
        .select('name')
        .order('name');

      if (deptsError) throw deptsError;
      if (deptsData) {
        setDepartments(deptsData.map((d: { name: string }) => d.name));
      }

      // Fetch ink inventory
      const { data: inkData, error: inkError } = await supabase
        .from('ink_inventory')
        .select('*')
        .order('created_at', { ascending: false });

      if (inkError) throw inkError;
      if (inkData) {
        setInkInventory(inkData as InkItem[]);
      }

    } catch (error) {
      console.error('Error fetching data:', error);
      alert('เกิดข้อผิดพลาดในการโหลดข้อมูล');
    } finally {
      setLoading(false);
    }
  };

  // Setup real-time subscriptions
  const setupRealtimeSubscriptions = () => {
    // Assets real-time subscription
    const assetsChannel = supabase
      .channel('assets-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'assets' },
        (payload: unknown) => {
          console.log('Assets change:', payload);
          fetchAllData();
        }
      )
      .subscribe();

    // Ink inventory real-time subscription
    const inkChannel = supabase
      .channel('ink-changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'ink_inventory' },
        (payload: unknown) => {
          console.log('Ink change:', payload);
          fetchAllData();
        }
      )
      .subscribe();

    // Cleanup subscriptions
    return () => {
      supabase.removeChannel(assetsChannel);
      supabase.removeChannel(inkChannel);
    };
  };

  // Add new asset to Supabase
  const addAsset = async (assetData: Partial<Asset>): Promise<void> => {
    try {
      const { error } = await supabase
        .from('assets')
        .insert([assetData]);

      if (error) throw error;
      
      alert('✅ เพิ่มทรัพย์สินสำเร็จ');
      setShowAddModal(false);
      fetchAllData();
    } catch (error) {
      console.error('Error adding asset:', error);
      alert('❌ เกิดข้อผิดพลาดในการเพิ่มทรัพย์สิน');
    }
  };

  // Delete asset
  const deleteAsset = async (id: number): Promise<void> => {
    if (!confirm('ต้องการลบทรัพย์สินนี้หรือไม่?')) return;

    try {
      const { error } = await supabase
        .from('assets')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      alert('✅ ลบสำเร็จ');
      setShowDetailModal(false);
      fetchAllData();
    } catch (error) {
      console.error('Error deleting asset:', error);
      alert('❌ เกิดข้อผิดพลาดในการลบ');
    }
  };

  // Add department
  const addDepartment = async (name: string): Promise<void> => {
    try {
      const { error } = await supabase
        .from('departments')
        .insert([{ name }]);

      if (error) throw error;
      
      fetchAllData();
    } catch (error) {
      console.error('Error adding department:', error);
      alert('❌ เกิดข้อผิดพลาดในการเพิ่มแผนก');
    }
  };

  // Filter assets
  const filteredAssets = assets.filter((asset: Asset) => {
    const matchSearch = asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       asset.tag.toLowerCase().includes(searchTerm.toLowerCase());
    const matchCategory = filterCategory === 'ทั้งหมด' || asset.category === filterCategory;
    const matchStatus = filterStatus === 'ทั้งหมด' || asset.status === filterStatus;
    return matchSearch && matchCategory && matchStatus;
  });

  // Generate barcode
  const generateBarcode = (code: string): string => {
    return `|||  | || ||| || |  ||| | ||  ${code}`;
  };

  // Export to CSV
  const exportToExcel = (): void => {
    const csvContent = [
      ['รหัสทรัพย์สิน', 'ชื่อ', 'ซีเรียล', 'หมวดหมู่', 'สถานที่', 'สถานะ', 'วันที่ซื้อ', 'ราคา'],
      ...assets.map((a: Asset) => [a.tag, a.name, a.serial, a.category, a.location, a.status, a.purchase_date, a.price])
    ].map(row => row.join(',')).join('\n');
    
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `assets_export_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  // Export Ink Budget Report
  const exportInkBudget = (): void => {
    const csvContent = [
      ['เครื่องพิมพ์', 'รหัส', 'ประเภทหมึก', 'ระดับปัจจุบัน%', 'ราคา/หน่วย', 'วันที่เติมล่าสุด', 'คงเหลือ(วัน)', 'สถานะ'],
      ...inkInventory.map((i: InkItem) => [i.printer_name, i.printer_tag, i.ink_type, i.current_level, i.unit_price, i.last_refill, i.estimated_days_left, i.status])
    ].map(row => row.join(',')).join('\n');
    
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `ink_budget_report_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  // Add Asset Modal Component
  const AddAssetModal = () => {
    const [formData, setFormData] = useState({
      name: '',
      tag: '',
      serial: '',
      category: 'คอมพิวเตอร์',
      location: departments[0] || '',
      price: '',
      purchase_date: '',
      warranty_expiry: '',
      icon: '💻',
      status: 'ใช้งาน',
      warranty_days: 365
    });

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      addAsset(formData);
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">เพิ่มทรัพย์สินใหม่</h2>
            <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600 text-2xl">✕</button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">ชื่อทรัพย์สิน *</label>
                <input 
                  type="text" 
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">รหัสทรัพย์สิน *</label>
                <input 
                  type="text" 
                  required
                  value={formData.tag}
                  onChange={(e) => setFormData({...formData, tag: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">หมายเลขซีเรียล *</label>
                <input 
                  type="text" 
                  required
                  value={formData.serial}
                  onChange={(e) => setFormData({...formData, serial: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">หมวดหมู่ *</label>
                <select 
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option>คอมพิวเตอร์</option>
                  <option>โน้ตบุ๊ค</option>
                  <option>จอมอนิเตอร์</option>
                  <option>เครื่องพิมพ์</option>
                  <option>อุปกรณ์เครือข่าย</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">สถานที่ *</label>
                <select 
                  value={formData.location}
                  onChange={(e) => setFormData({...formData, location: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {departments.map(dept => <option key={dept}>{dept}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">ราคา (บาท) *</label>
                <input 
                  type="text" 
                  required
                  value={formData.price}
                  onChange={(e) => setFormData({...formData, price: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">วันที่ซื้อ *</label>
                <input 
                  type="date" 
                  required
                  value={formData.purchase_date}
                  onChange={(e) => setFormData({...formData, purchase_date: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">วันหมดประกัน *</label>
                <input 
                  type="date" 
                  required
                  value={formData.warranty_expiry}
                  onChange={(e) => setFormData({...formData, warranty_expiry: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                />
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
  };

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
                <p className="font-semibold text-gray-900">{selectedAsset.purchase_date}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">หมดประกัน</p>
                <p className="font-semibold text-gray-900">{selectedAsset.warranty_expiry}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">ราคา</p>
                <p className="font-semibold text-green-600">฿{selectedAsset.price}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">การรับประกันคงเหลือ</p>
                <p className={`font-semibold ${selectedAsset.warranty_days < 30 ? 'text-yellow-600' : 'text-green-600'}`}>
                  {selectedAsset.warranty_days} วัน
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <button className="flex-1 bg-blue-500 text-white py-3 rounded-lg font-medium hover:bg-blue-600 flex items-center justify-center gap-2">
                ✏️ แก้ไข
              </button>
              <button 
                onClick={() => deleteAsset(selectedAsset.id)}
                className="flex-1 bg-red-500 text-white py-3 rounded-lg font-medium hover:bg-red-600 flex items-center justify-center gap-2"
              >
                🗑️ ลบ
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  // Department Management Modal
  const DepartmentModal = () => {
    const [newDept, setNewDept] = useState('');

    const handleAddDept = () => {
      if (newDept.trim()) {
        addDepartment(newDept);
        setNewDept('');
      }
    };

    return (
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
            <input 
              type="text" 
              placeholder="ชื่อแผนกใหม่"
              value={newDept}
              onChange={(e) => setNewDept(e.target.value)}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" 
            />
            <button 
              onClick={handleAddDept}
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2 rounded-lg font-medium hover:shadow-lg"
            >
              ➕ เพิ่ม
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Ink Budget Modal (continuing from previous - same code but properly typed)
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

        {/* Ink Inventory List */}
        <div className="space-y-3">
          {inkInventory.map((ink: InkItem) => (
            <div key={ink.id} className="bg-white border-2 border-gray-200 rounded-xl p-4 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-start gap-3">
                  <span className="text-3xl">🖨️</span>
                  <div>
                    <h3 className="font-bold text-lg text-gray-900">{ink.printer_name}</h3>
                    <p className="text-sm text-gray-600">รหัส: {ink.printer_tag}</p>
                    <p className="text-sm font-medium text-gray-700 mt-1">{ink.ink_type}</p>
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
                  <p className="font-bold text-lg text-gray-900">{ink.current_level}%</p>
                </div>
                <div>
                  <p className="text-gray-500">คงเหลือ (วัน)</p>
                  <p className={`font-bold text-lg ${ink.estimated_days_left < 10 ? 'text-red-600' : 'text-green-600'}`}>
                    {ink.estimated_days_left}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">ราคา/หน่วย</p>
                  <p className="font-bold text-lg text-gray-900">฿{ink.unit_price.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-gray-500">ใช้ต่อเดือน (%)</p>
                  <p className="font-bold text-lg text-gray-900">{ink.monthly_usage}</p>
                </div>
                <div>
                  <p className="text-gray-500">เติมล่าสุด</p>
                  <p className="font-bold text-sm text-gray-900">{ink.last_refill}</p>
                </div>
              </div>

              {/* Ink Level Progress Bar */}
              <div className="mb-3">
                <div className="w-full bg-gray-200 rounded-full h-3 relative">
                  <div 
                    className={`h-3 rounded-full transition-all duration-500 ${
                      ink.current_level < ink.min_level ? 'bg-red-500' :
                      ink.current_level < 50 ? 'bg-yellow-500' : 'bg-green-500'
                    }`}
                    style={{ width: `${ink.current_level}%` }}
                  ></div>
                  <div 
                    className="absolute top-0 bottom-0 w-0.5 bg-red-600" 
                    style={{ left: `${ink.min_level}%` }}
                    title={`ระดับขั้นต่ำ: ${ink.min_level}%`}
                  ></div>
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>0%</span>
                  <span>ขั้นต่ำ: {ink.min_level}%</span>
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">⏳</div>
          <p className="text-xl font-bold text-gray-700">กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    );
  }

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
                <p className="text-xs text-gray-500">IT Asset Management System (Supabase)</p>
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
              <h1 className="text-2xl font-bold text-gray-900">ทรัพย์สินทั้งหมด ({filteredAssets.length})</h1>
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
              {filteredAssets.map((asset: Asset) => (
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
                      <div className="font-semibold text-gray-900">{asset.purchase_date}</div>
                    </div>
                    <div>
                      <div className="text-gray-500 mb-1">ราคา</div>
                      <div className="font-semibold text-gray-900">฿{asset.price}</div>
                    </div>
                    <div>
                      <div className="text-gray-500 mb-1">การรับประกัน</div>
                      <div
                        className={`font-semibold ${
                          asset.warranty_days < 30 ? 'text-yellow-600' : 'text-green-600'
                        }`}
                      >
                        {asset.warranty_days < 365 ? `เหลือ ${asset.warranty_days} วัน` : 'ยังใช้ได้'}
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
                <p className="text-gray-500">ลองเปลี่ยนคำค้นหาหรือตัวกรอง หรือเพิ่มทรัพย์สินใหม่จาก Supabase</p>
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
