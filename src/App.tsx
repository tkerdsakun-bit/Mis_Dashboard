import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import type { Asset, InkItem, Department, AssetCategory, InkBudgetSummary, RepairHistory, InkTransaction } from './supabaseClient';

const App = () => {
  const [currentPage, setCurrentPage] = useState<string>('dashboard');
  const [showAddAssetModal, setShowAddAssetModal] = useState<boolean>(false);
  const [showEditAssetModal, setShowEditAssetModal] = useState<boolean>(false);
  const [showDetailModal, setShowDetailModal] = useState<boolean>(false);
  const [showDepartmentModal, setShowDepartmentModal] = useState<boolean>(false);
  const [showCategoryModal, setShowCategoryModal] = useState<boolean>(false);
  const [showInkBudgetModal, setShowInkBudgetModal] = useState<boolean>(false);
  const [showRepairHistoryModal, setShowRepairHistoryModal] = useState<boolean>(false);
  const [showAddRepairModal, setShowAddRepairModal] = useState<boolean>(false);
  const [showInkTransactionModal, setShowInkTransactionModal] = useState<boolean>(false);
  const [showAddTransactionModal, setShowAddTransactionModal] = useState<boolean>(false);
  const [showUserMenu, setShowUserMenu] = useState<boolean>(false);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterCategory, setFilterCategory] = useState<string>('ทั้งหมด');
  const [filterStatus, setFilterStatus] = useState<string>('ทั้งหมด');
  const [loading, setLoading] = useState<boolean>(true);
  const [uploading, setUploading] = useState<boolean>(false);

  const [assets, setAssets] = useState<Asset[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [assetCategories, setAssetCategories] = useState<AssetCategory[]>([]);
  const [inkInventory, setInkInventory] = useState<InkItem[]>([]);
  const [inkBudget, setInkBudget] = useState<InkBudgetSummary | null>(null);
  const [repairHistory, setRepairHistory] = useState<RepairHistory[]>([]);
  const [inkTransactions, setInkTransactions] = useState<InkTransaction[]>([]);

  // User Info
  const currentUser = {
    name: 'Admin',
    email: 'admin@company.com',
    role: 'ผู้ดูแลระบบ',
    avatar: '👤',
    department: 'IT Department'
  };

  const stats = [
    { icon: '📦', label: 'ทรัพย์สินทั้งหมด', value: assets.length.toString(), color: 'from-blue-500 to-cyan-500', bgColor: 'bg-blue-50' },
    { icon: '⚠️', label: 'การรับประกันใกล้หมด', value: assets.filter((a: Asset) => a.warranty_days < 30).length.toString(), color: 'from-yellow-500 to-orange-500', bgColor: 'bg-yellow-50' },
    { icon: '🔧', label: 'อยู่ระหว่างซ่อม', value: assets.filter((a: Asset) => a.status === 'ซ่อม').length.toString(), color: 'from-red-500 to-pink-500', bgColor: 'bg-red-50' },
    { icon: '💰', label: 'มูลค่ารวม', value: `฿${(assets.reduce((sum, a: Asset) => sum + parseFloat(a.price.replace(/,/g, '') || '0'), 0) / 1000000).toFixed(1)}M`, color: 'from-green-500 to-emerald-500', bgColor: 'bg-green-50' },
    { icon: '🏢', label: 'แผนกทั้งหมด', value: departments.length.toString(), color: 'from-purple-500 to-violet-500', bgColor: 'bg-purple-50' },
    { icon: '📂', label: 'ประเภททรัพย์สิน', value: assetCategories.length.toString(), color: 'from-indigo-500 to-blue-500', bgColor: 'bg-indigo-50' }
  ];

  const categoryData = assetCategories.map(cat => {
    const count = assets.filter((a: Asset) => a.category === cat.name).length;
    const percent = assets.length > 0 ? Math.round((count / assets.length) * 100) : 0;
    return { ...cat, count, percent };
  });

  const currentMonth = new Date().toISOString().slice(0, 7);
  const monthlyTransactions = inkTransactions.filter(t => t.month === currentMonth);
  const totalExpense = monthlyTransactions.filter(t => t.transaction_type === 'รายจ่าย').reduce((sum, t) => sum + t.amount, 0);
  const totalIncome = monthlyTransactions.filter(t => t.transaction_type === 'รายรับ').reduce((sum, t) => sum + t.amount, 0);
  const netAmount = totalIncome - totalExpense;

  useEffect(() => {
    fetchAllData();
    const cleanup = setupRealtimeSubscriptions();
    return cleanup;
  }, []);

  const fetchAllData = async (): Promise<void> => {
    try {
      setLoading(true);

      const { data: assetsData, error: assetsError } = await supabase.from('assets').select('*').order('created_at', { ascending: false });
      if (assetsError) throw assetsError;
      if (assetsData) setAssets(assetsData as Asset[]);

      const { data: deptsData, error: deptsError } = await supabase.from('departments').select('*');
      if (deptsError) throw deptsError;
      if (deptsData) setDepartments(deptsData as Department[]);

      const { data: categoriesData, error: categoriesError } = await supabase.from('asset_categories').select('*').order('name');
      if (categoriesError) throw categoriesError;
      if (categoriesData) setAssetCategories(categoriesData as AssetCategory[]);

      const { data: inkData, error: inkError } = await supabase.from('ink_inventory').select('*').order('created_at', { ascending: false });
      if (inkError) throw inkError;
      if (inkData) setInkInventory(inkData as InkItem[]);

      const currentMonth = new Date().toISOString().slice(0, 7);
      const { data: budgetData, error: budgetError } = await supabase.from('ink_budget_summary').select('*').eq('month', currentMonth).single();
      if (budgetError && budgetError.code !== 'PGRST116') throw budgetError;
      if (budgetData) setInkBudget(budgetData as InkBudgetSummary);

      const { data: repairData, error: repairError } = await supabase.from('repair_history').select('*').order('created_at', { ascending: false });
      if (repairError) throw repairError;
      if (repairData) setRepairHistory(repairData as RepairHistory[]);

      const { data: transactionsData, error: transactionsError } = await supabase.from('ink_transactions').select('*').order('transaction_date', { ascending: false });
      if (transactionsError) throw transactionsError;
      if (transactionsData) setInkTransactions(transactionsData as InkTransaction[]);

    } catch (error) {
      console.error('Error fetching data:', error);
      alert('เกิดข้อผิดพลาดในการโหลดข้อมูล');
    } finally {
      setLoading(false);
    }
  };

  const setupRealtimeSubscriptions = () => {
    const assetsChannel = supabase.channel('assets-changes').on('postgres_changes', { event: '*', schema: 'public', table: 'assets' }, () => fetchAllData()).subscribe();
    const inkChannel = supabase.channel('ink-changes').on('postgres_changes', { event: '*', schema: 'public', table: 'ink_inventory' }, () => fetchAllData()).subscribe();
    return () => {
      supabase.removeChannel(assetsChannel);
      supabase.removeChannel(inkChannel);
    };
  };

  const uploadImage = async (file: File): Promise<string | null> => {
    try {
      setUploading(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = fileName;

      const { error } = await supabase.storage.from('assets-images').upload(filePath, file);
      if (error) throw error;

      const { data: publicUrlData } = supabase.storage.from('assets-images').getPublicUrl(filePath);
      return publicUrlData.publicUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('❌ เกิดข้อผิดพลาดในการอัพโหลดรูปภาพ');
      return null;
    } finally {
      setUploading(false);
    }
  };

  const addAsset = async (assetData: Partial<Asset>): Promise<void> => {
    try {
      const { error } = await supabase.from('assets').insert([assetData]);
      if (error) throw error;
      alert('✅ เพิ่มทรัพย์สินสำเร็จ');
      setShowAddAssetModal(false);
      fetchAllData();
    } catch (error) {
      console.error('Error adding asset:', error);
      alert('❌ เกิดข้อผิดพลาด');
    }
  };

  const updateAsset = async (id: number, assetData: Partial<Asset>): Promise<void> => {
    try {
      const { error } = await supabase.from('assets').update(assetData).eq('id', id);
      if (error) throw error;
      alert('✅ แก้ไขสำเร็จ');
      setShowEditAssetModal(false);
      setShowDetailModal(false);
      fetchAllData();
    } catch (error) {
      console.error('Error updating asset:', error);
      alert('❌ เกิดข้อผิดพลาด');
    }
  };

  const deleteAsset = async (id: number): Promise<void> => {
    if (!confirm('ต้องการลบทรัพย์สินนี้หรือไม่?')) return;
    try {
      const { error } = await supabase.from('assets').delete().eq('id', id);
      if (error) throw error;
      alert('✅ ลบสำเร็จ');
      setShowDetailModal(false);
      fetchAllData();
    } catch (error) {
      console.error('Error deleting asset:', error);
      alert('❌ เกิดข้อผิดพลาด');
    }
  };

  const addDepartment = async (name: string): Promise<void> => {
    try {
      const { error } = await supabase.from('departments').insert([{ name }]);
      if (error) throw error;
      alert('✅ เพิ่มแผนก ' + name + ' สำเร็จ');
      fetchAllData();
    } catch (error) {
      console.error('Error adding department:', error);
      alert('❌ เกิดข้อผิดพลาด');
    }
  };

  const deleteDepartment = async (id: number, name: string): Promise<void> => {
    if (!confirm(`ต้องการลบแผนก "${name}" หรือไม่?`)) return;
    try {
      const { error } = await supabase.from('departments').delete().eq('id', id);
      if (error) throw error;
      alert('✅ ลบแผนกสำเร็จ');
      fetchAllData();
    } catch (error) {
      console.error('Error deleting department:', error);
      alert('❌ เกิดข้อผิดพลาด');
    }
  };

  const addCategory = async (name: string, icon: string): Promise<void> => {
    try {
      const { error } = await supabase.from('asset_categories').insert([{ name, icon }]);
      if (error) throw error;
      alert('✅ เพิ่มประเภท ' + name + ' สำเร็จ');
      fetchAllData();
    } catch (error) {
      console.error('Error adding category:', error);
      alert('❌ เกิดข้อผิดพลาด');
    }
  };

  const deleteCategory = async (id: number, name: string): Promise<void> => {
    if (!confirm(`ต้องการลบประเภท "${name}" หรือไม่?`)) return;
    try {
      const { error } = await supabase.from('asset_categories').delete().eq('id', id);
      if (error) throw error;
      alert('✅ ลบประเภทสำเร็จ');
      fetchAllData();
    } catch (error) {
      console.error('Error deleting category:', error);
      alert('❌ เกิดข้อผิดพลาด');
    }
  };

  const addRepairHistory = async (repairData: Partial<RepairHistory>): Promise<void> => {
    try {
      const { error } = await supabase.from('repair_history').insert([repairData]);
      if (error) throw error;
      alert('✅ เพิ่มประวัติการซ่อมสำเร็จ');
      setShowAddRepairModal(false);
      fetchAllData();
    } catch (error) {
      console.error('Error adding repair history:', error);
      alert('❌ เกิดข้อผิดพลาด');
    }
  };

  const addTransaction = async (transactionData: Partial<InkTransaction>): Promise<void> => {
    try {
      const { error } = await supabase.from('ink_transactions').insert([transactionData]);
      if (error) throw error;
      alert('✅ เพิ่มรายการสำเร็จ');
      setShowAddTransactionModal(false);
      fetchAllData();
    } catch (error) {
      console.error('Error adding transaction:', error);
      alert('❌ เกิดข้อผิดพลาด');
    }
  };

  const filteredAssets = assets.filter((asset: Asset) => {
    const matchSearch = asset.name.toLowerCase().includes(searchTerm.toLowerCase()) || asset.tag.toLowerCase().includes(searchTerm.toLowerCase());
    const matchCategory = filterCategory === 'ทั้งหมด' || asset.category === filterCategory;
    const matchStatus = filterStatus === 'ทั้งหมด' || asset.status === filterStatus;
    return matchSearch && matchCategory && matchStatus;
  });

  const generateBarcode = (code: string): string => {
    return `|||  | || ||| || |  ||| | ||  ${code}`;
  };

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

  const exportInkTransactions = (): void => {
    const csvContent = [
      ['วันที่', 'ประเภท', 'รายละเอียด', 'หมวดหมู่', 'จำนวนเงิน (บาท)', 'เดือน'],
      ...inkTransactions.map((t: InkTransaction) => [
        t.transaction_date,
        t.transaction_type,
        t.description,
        t.category || '-',
        t.transaction_type === 'รายจ่าย' ? `-${t.amount}` : t.amount,
        t.month
      ]),
      [],
      ['สรุปรายรับ-รายจ่ายเดือน ' + currentMonth],
      ['รายรับทั้งหมด', totalIncome],
      ['รายจ่ายทั้งหมด', totalExpense],
      ['สุทธิ', netAmount >= 0 ? `+${netAmount}` : netAmount]
    ].map(row => row.join(',')).join('\n');
    
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `ink_transactions_${currentMonth}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  // Modal Components
  const AddAssetModal = () => {
    const [formData, setFormData] = useState({
      name: '', tag: '', serial: '', category: assetCategories[0]?.name || '', location: departments[0]?.name || '',
      price: '', purchase_date: '', warranty_expiry: '', icon: assetCategories[0]?.icon || '📦', status: 'ใช้งาน', warranty_days: 365, image_url: ''
    });
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string>('');

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        setImageFile(file);
        const reader = new FileReader();
        reader.onloadend = () => setImagePreview(reader.result as string);
        reader.readAsDataURL(file);
      }
    };

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      let imageUrl = formData.image_url;
      if (imageFile) {
        const uploadedUrl = await uploadImage(imageFile);
        if (uploadedUrl) imageUrl = uploadedUrl;
      }
      addAsset({ ...formData, image_url: imageUrl });
    };

    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
        <div className="bg-white rounded-3xl p-8 max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl animate-slideUp">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">เพิ่มทรัพย์สินใหม่</h2>
              <p className="text-gray-500 text-sm mt-1">กรอกข้อมูลทรัพย์สินที่ต้องการเพิ่ม</p>
            </div>
            <button onClick={() => setShowAddAssetModal(false)} className="text-gray-400 hover:text-gray-600 text-3xl transition-colors hover:rotate-90 duration-300">✕</button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-2 gap-5">
              <div className="col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">📷 รูปภาพ</label>
                <input type="file" accept="image/*" onChange={handleImageChange} className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all hover:border-blue-300" />
                {imagePreview && <img src={imagePreview} alt="Preview" className="mt-3 h-40 w-full object-cover rounded-xl shadow-lg" />}
                {uploading && <p className="text-blue-600 mt-2 animate-pulse">⏳ กำลังอัพโหลด...</p>}
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">ชื่อทรัพย์สิน *</label>
                <input type="text" required value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">รหัสทรัพย์สิน *</label>
                <input type="text" required value={formData.tag} onChange={(e) => setFormData({...formData, tag: e.target.value})} className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">หมายเลขซีเรียล *</label>
                <input type="text" required value={formData.serial} onChange={(e) => setFormData({...formData, serial: e.target.value})} className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">หมวดหมู่ *</label>
                <select value={formData.category} onChange={(e) => { const cat = assetCategories.find(c => c.name === e.target.value); setFormData({...formData, category: e.target.value, icon: cat?.icon || '📦'}); }} className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all">
                  {assetCategories.map(cat => <option key={cat.id} value={cat.name}>{cat.icon} {cat.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">สถานที่ *</label>
                <select value={formData.location} onChange={(e) => setFormData({...formData, location: e.target.value})} className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all">
                  {departments.map(dept => <option key={dept.id}>{dept.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">ราคา (บาท) *</label>
                <input type="text" required value={formData.price} onChange={(e) => setFormData({...formData, price: e.target.value})} className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">วันที่ซื้อ *</label>
                <input type="date" required value={formData.purchase_date} onChange={(e) => setFormData({...formData, purchase_date: e.target.value})} className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">วันหมดประกัน *</label>
                <input type="date" required value={formData.warranty_expiry} onChange={(e) => setFormData({...formData, warranty_expiry: e.target.value})} className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all" />
              </div>
            </div>
            <div className="flex gap-4 pt-6">
              <button type="submit" disabled={uploading} className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 rounded-xl font-semibold hover:shadow-2xl hover:scale-105 transition-all disabled:opacity-50 disabled:hover:scale-100">
                {uploading ? '⏳ กำลังอัพโหลด...' : '✅ บันทึก'}
              </button>
              <button type="button" onClick={() => setShowAddAssetModal(false)} className="flex-1 bg-gray-100 text-gray-700 py-4 rounded-xl font-semibold hover:bg-gray-200 transition-all">❌ ยกเลิก</button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  const EditAssetModal = () => {
    if (!selectedAsset) return null;
    const [formData, setFormData] = useState({ name: selectedAsset.name, tag: selectedAsset.tag, serial: selectedAsset.serial, category: selectedAsset.category, location: selectedAsset.location, price: selectedAsset.price, purchase_date: selectedAsset.purchase_date, warranty_expiry: selectedAsset.warranty_expiry, icon: selectedAsset.icon, status: selectedAsset.status, warranty_days: selectedAsset.warranty_days, image_url: selectedAsset.image_url || '' });
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string>(selectedAsset.image_url || '');

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        setImageFile(file);
        const reader = new FileReader();
        reader.onloadend = () => setImagePreview(reader.result as string);
        reader.readAsDataURL(file);
      }
    };

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      let imageUrl = formData.image_url;
      if (imageFile) {
        const uploadedUrl = await uploadImage(imageFile);
        if (uploadedUrl) imageUrl = uploadedUrl;
      }
      updateAsset(selectedAsset.id, { ...formData, image_url: imageUrl });
    };

    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
        <div className="bg-white rounded-3xl p-8 max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl animate-slideUp">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">แก้ไขทรัพย์สิน</h2>
              <p className="text-gray-500 text-sm mt-1">อัพเดตข้อมูลทรัพย์สิน</p>
            </div>
            <button onClick={() => setShowEditAssetModal(false)} className="text-gray-400 hover:text-gray-600 text-3xl transition-colors hover:rotate-90 duration-300">✕</button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-2 gap-5">
              <div className="col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">📷 รูปภาพ</label>
                <input type="file" accept="image/*" onChange={handleImageChange} className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all" />
                {imagePreview && <img src={imagePreview} alt="Preview" className="mt-3 h-40 w-full object-cover rounded-xl shadow-lg" />}
                {uploading && <p className="text-blue-600 mt-2 animate-pulse">⏳ กำลังอัพโหลด...</p>}
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">ชื่อทรัพย์สิน *</label>
                <input type="text" required value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">รหัสทรัพย์สิน *</label>
                <input type="text" required value={formData.tag} onChange={(e) => setFormData({...formData, tag: e.target.value})} className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">หมายเลขซีเรียล *</label>
                <input type="text" required value={formData.serial} onChange={(e) => setFormData({...formData, serial: e.target.value})} className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">สถานะ *</label>
                <select value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value})} className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all">
                  <option>ใช้งาน</option>
                  <option>ซ่อม</option>
                  <option>เก็บคลัง</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">ราคา *</label>
                <input type="text" required value={formData.price} onChange={(e) => setFormData({...formData, price: e.target.value})} className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all" />
              </div>
            </div>
            <div className="flex gap-4 pt-6">
              <button type="submit" disabled={uploading} className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 rounded-xl font-semibold hover:shadow-2xl hover:scale-105 transition-all">
                {uploading ? '⏳ กำลังอัพโหลด...' : '✅ บันทึก'}
              </button>
              <button type="button" onClick={() => setShowEditAssetModal(false)} className="flex-1 bg-gray-100 text-gray-700 py-4 rounded-xl font-semibold hover:bg-gray-200 transition-all">❌ ยกเลิก</button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  const AssetDetailModal = () => {
    const assetRepairs = repairHistory.filter(r => r.asset_id === selectedAsset?.id);
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
        <div className="bg-white rounded-3xl p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl animate-slideUp">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">รายละเอียดทรัพย์สิน</h2>
            <button onClick={() => setShowDetailModal(false)} className="text-gray-400 hover:text-gray-600 text-3xl transition-colors hover:rotate-90 duration-300">✕</button>
          </div>
          {selectedAsset && (
            <div className="space-y-6">
              {selectedAsset.image_url && <img src={selectedAsset.image_url} alt={selectedAsset.name} className="w-full h-72 object-cover rounded-2xl shadow-xl" />}
              <div className="bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-8 rounded-2xl border-2 border-blue-100">
                <div className="flex items-center gap-5 mb-5">
                  <span className="text-6xl">{selectedAsset.icon}</span>
                  <div>
                    <h3 className="text-3xl font-bold text-gray-900">{selectedAsset.name}</h3>
                    <p className="text-gray-600 text-lg">รหัส: {selectedAsset.tag}</p>
                  </div>
                </div>
                <div className="bg-white p-5 rounded-xl font-mono text-center text-base mb-3 shadow-inner">{generateBarcode(selectedAsset.tag)}</div>
                <p className="text-center text-sm text-gray-600 font-semibold">{selectedAsset.tag}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: 'หมายเลขซีเรียล', value: selectedAsset.serial },
                  { label: 'หมวดหมู่', value: selectedAsset.category },
                  { label: 'สถานที่', value: selectedAsset.location },
                  { label: 'สถานะ', value: selectedAsset.status },
                  { label: 'วันที่ซื้อ', value: selectedAsset.purchase_date },
                  { label: 'หมดประกัน', value: selectedAsset.warranty_expiry },
                  { label: 'ราคา', value: `฿${selectedAsset.price}`, color: 'text-green-600' },
                  { label: 'การรับประกันคงเหลือ', value: `${selectedAsset.warranty_days} วัน`, color: selectedAsset.warranty_days < 30 ? 'text-yellow-600' : 'text-green-600' }
                ].map((item, idx) => (
                  <div key={idx} className="bg-gradient-to-br from-gray-50 to-gray-100 p-5 rounded-xl border border-gray-200 hover:shadow-lg transition-all">
                    <p className="text-sm text-gray-600 mb-2 font-medium">{item.label}</p>
                    <p className={`font-bold text-lg ${item.color || 'text-gray-900'}`}>{item.value}</p>
                  </div>
                ))}
              </div>
              {assetRepairs.length > 0 && (
                <div className="bg-gradient-to-br from-orange-50 to-red-50 p-6 rounded-2xl border border-orange-200">
                  <h4 className="font-bold text-xl mb-4 flex items-center gap-2">🔧 ประวัติการซ่อม ({assetRepairs.length} ครั้ง)</h4>
                  <div className="space-y-3">
                    {assetRepairs.map((repair) => (
                      <div key={repair.id} className="bg-white p-4 rounded-xl border border-orange-100 hover:shadow-lg transition-all">
                        <div className="flex justify-between items-start mb-2">
                          <p className="font-semibold text-gray-900">{repair.issue_description}</p>
                          <span className={`px-3 py-1 rounded-full text-xs font-bold ${repair.repair_status === 'เสร็จสิ้น' ? 'bg-green-100 text-green-700' : repair.repair_status === 'กำลังซ่อม' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-700'}`}>{repair.repair_status}</span>
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
              <div className="grid grid-cols-3 gap-4">
                <button onClick={() => { setShowDetailModal(false); setShowEditAssetModal(true); }} className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white py-4 rounded-xl font-semibold hover:shadow-2xl hover:scale-105 transition-all flex items-center justify-center gap-2">✏️ แก้ไข</button>
                <button onClick={() => { setShowDetailModal(false); setShowAddRepairModal(true); }} className="bg-gradient-to-r from-orange-500 to-red-500 text-white py-4 rounded-xl font-semibold hover:shadow-2xl hover:scale-105 transition-all flex items-center justify-center gap-2">🔧 เพิ่มการซ่อม</button>
                <button onClick={() => deleteAsset(selectedAsset.id)} className="bg-gradient-to-r from-red-600 to-pink-600 text-white py-4 rounded-xl font-semibold hover:shadow-2xl hover:scale-105 transition-all flex items-center justify-center gap-2">🗑️ ลบ</button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const DepartmentModal = () => {
    const [newDept, setNewDept] = useState('');
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
        <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl animate-slideUp">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">จัดการแผนก</h2>
              <p className="text-gray-500 text-sm mt-1">เพิ่มหรือลบแผนก</p>
            </div>
            <button onClick={() => setShowDepartmentModal(false)} className="text-gray-400 hover:text-gray-600 text-3xl transition-colors hover:rotate-90 duration-300">✕</button>
          </div>
          <div className="space-y-3 mb-6 max-h-96 overflow-y-auto">
            {departments.map((dept) => (
              <div key={dept.id} className="flex items-center justify-between bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-xl border border-purple-100 hover:shadow-lg transition-all">
                <span className="font-semibold text-gray-900">🏢 {dept.name}</span>
                <button onClick={() => deleteDepartment(dept.id, dept.name)} className="text-red-500 hover:text-red-700 hover:scale-125 transition-all">🗑️</button>
              </div>
            ))}
          </div>
          <div className="flex gap-3">
            <input type="text" placeholder="ชื่อแผนกใหม่" value={newDept} onChange={(e) => setNewDept(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && newDept.trim() && (addDepartment(newDept), setNewDept(''))} className="flex-1 px-5 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all" />
            <button onClick={() => { if (newDept.trim()) { addDepartment(newDept); setNewDept(''); } }} className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-3 rounded-xl font-semibold hover:shadow-2xl hover:scale-105 transition-all">➕</button>
          </div>
        </div>
      </div>
    );
  };

  const CategoryModal = () => {
    const [newCategory, setNewCategory] = useState({ name: '', icon: '📦' });
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
        <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl animate-slideUp">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent">จัดการประเภท</h2>
              <p className="text-gray-500 text-sm mt-1">เพิ่มหรือลบประเภททรัพย์สิน</p>
            </div>
            <button onClick={() => setShowCategoryModal(false)} className="text-gray-400 hover:text-gray-600 text-3xl transition-colors hover:rotate-90 duration-300">✕</button>
          </div>
          <div className="space-y-3 mb-6 max-h-96 overflow-y-auto">
            {assetCategories.map((cat) => (
              <div key={cat.id} className="flex items-center justify-between bg-gradient-to-r from-indigo-50 to-blue-50 p-4 rounded-xl border border-indigo-100 hover:shadow-lg transition-all">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{cat.icon}</span>
                  <span className="font-semibold text-gray-900">{cat.name}</span>
                </div>
                <button onClick={() => deleteCategory(cat.id, cat.name)} className="text-red-500 hover:text-red-700 hover:scale-125 transition-all">🗑️</button>
              </div>
            ))}
          </div>
          <div className="space-y-3">
            <input type="text" placeholder="ไอคอน (Emoji)" value={newCategory.icon} onChange={(e) => setNewCategory({...newCategory, icon: e.target.value})} className="w-full px-5 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-center text-2xl" maxLength={2} />
            <div className="flex gap-3">
              <input type="text" placeholder="ชื่อประเภทใหม่" value={newCategory.name} onChange={(e) => setNewCategory({...newCategory, name: e.target.value})} onKeyPress={(e) => e.key === 'Enter' && newCategory.name.trim() && (addCategory(newCategory.name, newCategory.icon), setNewCategory({ name: '', icon: '📦' }))} className="flex-1 px-5 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all" />
              <button onClick={() => { if (newCategory.name.trim()) { addCategory(newCategory.name, newCategory.icon); setNewCategory({ name: '', icon: '📦' }); } }} className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white px-8 py-3 rounded-xl font-semibold hover:shadow-2xl hover:scale-105 transition-all">➕</button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const AddRepairModal = () => {
    const [formData, setFormData] = useState({ asset_id: selectedAsset?.id || 0, asset_name: selectedAsset?.name || '', asset_tag: selectedAsset?.tag || '', issue_description: '', repair_status: 'รอดำเนินการ', repair_cost: 0, start_date: new Date().toISOString().split('T')[0], end_date: '', technician: '', notes: '' });

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      addRepairHistory(formData);
    };

    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
        <div className="bg-white rounded-3xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl animate-slideUp">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">🔧 เพิ่มการซ่อม</h2>
              <p className="text-gray-500 text-sm mt-1">บันทึกประวัติการซ่อมทรัพย์สิน</p>
            </div>
            <button onClick={() => setShowAddRepairModal(false)} className="text-gray-400 hover:text-gray-600 text-3xl transition-colors hover:rotate-90 duration-300">✕</button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="bg-gradient-to-r from-blue-50 to-cyan-50 p-5 rounded-xl border border-blue-100">
              <p className="text-sm text-gray-600 mb-1">ทรัพย์สิน</p>
              <p className="font-bold text-xl text-gray-900">{selectedAsset?.name} ({selectedAsset?.tag})</p>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">รายละเอียดปัญหา *</label>
              <textarea required rows={3} value={formData.issue_description} onChange={(e) => setFormData({...formData, issue_description: e.target.value})} className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">สถานะการซ่อม *</label>
                <select value={formData.repair_status} onChange={(e) => setFormData({...formData, repair_status: e.target.value})} className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all">
                  <option>รอดำเนินการ</option>
                  <option>กำลังซ่อม</option>
                  <option>เสร็จสิ้น</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">ค่าใช้จ่าย (บาท)</label>
                <input type="number" step="0.01" value={formData.repair_cost} onChange={(e) => setFormData({...formData, repair_cost: parseFloat(e.target.value)})} className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">วันที่เริ่มซ่อม *</label>
                <input type="date" required value={formData.start_date} onChange={(e) => setFormData({...formData, start_date: e.target.value})} className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">วันที่เสร็จสิ้น</label>
                <input type="date" value={formData.end_date} onChange={(e) => setFormData({...formData, end_date: e.target.value})} className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">ช่างผู้รับผิดชอบ</label>
              <input type="text" value={formData.technician} onChange={(e) => setFormData({...formData, technician: e.target.value})} className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">หมายเหตุ</label>
              <textarea rows={2} value={formData.notes} onChange={(e) => setFormData({...formData, notes: e.target.value})} className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all" />
            </div>
            <div className="flex gap-4 pt-6">
              <button type="submit" className="flex-1 bg-gradient-to-r from-orange-600 to-red-600 text-white py-4 rounded-xl font-semibold hover:shadow-2xl hover:scale-105 transition-all">✅ บันทึก</button>
              <button type="button" onClick={() => setShowAddRepairModal(false)} className="flex-1 bg-gray-100 text-gray-700 py-4 rounded-xl font-semibold hover:bg-gray-200 transition-all">❌ ยกเลิก</button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  const RepairHistoryModal = () => (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
      <div className="bg-white rounded-3xl p-8 max-w-6xl w-full max-h-[90vh] overflow-y-auto shadow-2xl animate-slideUp">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">🔧 ประวัติการซ่อมทั้งหมด</h2>
            <p className="text-gray-500 text-sm mt-1">รวม {repairHistory.length} รายการ</p>
          </div>
          <button onClick={() => setShowRepairHistoryModal(false)} className="text-gray-400 hover:text-gray-600 text-3xl transition-colors hover:rotate-90 duration-300">✕</button>
        </div>
        <div className="space-y-4">
          {repairHistory.map((repair) => (
            <div key={repair.id} className="bg-gradient-to-r from-orange-50 to-red-50 border-2 border-orange-100 rounded-2xl p-6 hover:shadow-2xl transition-all">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-bold text-xl text-gray-900">{repair.asset_name}</h3>
                  <p className="text-sm text-gray-600">รหัส: {repair.asset_tag}</p>
                </div>
                <span className={`px-4 py-2 rounded-full text-sm font-bold ${repair.repair_status === 'เสร็จสิ้น' ? 'bg-green-100 text-green-700' : repair.repair_status === 'กำลังซ่อม' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-700'}`}>{repair.repair_status}</span>
              </div>
              <div className="bg-white p-4 rounded-xl mb-4 border border-orange-100">
                <p className="text-sm font-semibold text-gray-900">{repair.issue_description}</p>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div className="bg-white p-3 rounded-lg border border-orange-100">
                  <p className="text-gray-500 mb-1">ค่าใช้จ่าย</p>
                  <p className="font-bold text-lg text-red-600">฿{repair.repair_cost.toLocaleString()}</p>
                </div>
                <div className="bg-white p-3 rounded-lg border border-orange-100">
                  <p className="text-gray-500 mb-1">ช่าง</p>
                  <p className="font-bold text-gray-900">{repair.technician || '-'}</p>
                </div>
                <div className="bg-white p-3 rounded-lg border border-orange-100">
                  <p className="text-gray-500 mb-1">วันที่เริ่ม</p>
                  <p className="font-bold text-gray-900">{repair.start_date}</p>
                </div>
                <div className="bg-white p-3 rounded-lg border border-orange-100">
                  <p className="text-gray-500 mb-1">วันที่เสร็จ</p>
                  <p className="font-bold text-gray-900">{repair.end_date || '-'}</p>
                </div>
              </div>
              {repair.notes && (
                <div className="mt-4 pt-4 border-t border-orange-200">
                  <p className="text-sm text-gray-600"><strong>หมายเหตุ:</strong> {repair.notes}</p>
                </div>
              )}
            </div>
          ))}
          {repairHistory.length === 0 && (
            <div className="text-center py-20">
              <span className="text-8xl mb-6 block animate-bounce">🔧</span>
              <p className="text-2xl font-bold text-gray-700 mb-2">ไม่มีประวัติการซ่อม</p>
              <p className="text-gray-500">ระบบยังไม่มีการบันทึกการซ่อมทรัพย์สิน</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const AddTransactionModal = () => {
    const [formData, setFormData] = useState({ transaction_type: 'รายจ่าย' as 'รายจ่าย' | 'รายรับ', description: '', amount: 0, transaction_date: new Date().toISOString().split('T')[0], month: currentMonth, category: '' });

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      addTransaction(formData);
    };

    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
        <div className="bg-white rounded-3xl p-8 max-w-xl w-full shadow-2xl animate-slideUp">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">💰 เพิ่มรายการ</h2>
              <p className="text-gray-500 text-sm mt-1">บันทึกรายรับหรือรายจ่ายหมึก</p>
            </div>
            <button onClick={() => setShowAddTransactionModal(false)} className="text-gray-400 hover:text-gray-600 text-3xl transition-colors hover:rotate-90 duration-300">✕</button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">ประเภท *</label>
              <div className="grid grid-cols-2 gap-3">
                <button type="button" onClick={() => setFormData({...formData, transaction_type: 'รายจ่าย'})} className={`py-4 rounded-xl font-semibold transition-all ${formData.transaction_type === 'รายจ่าย' ? 'bg-gradient-to-r from-red-600 to-pink-600 text-white shadow-xl scale-105' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>💸 รายจ่าย</button>
                <button type="button" onClick={() => setFormData({...formData, transaction_type: 'รายรับ'})} className={`py-4 rounded-xl font-semibold transition-all ${formData.transaction_type === 'รายรับ' ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-xl scale-105' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>💵 รายรับ</button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">รายละเอียด *</label>
              <input type="text" required value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all" placeholder="เช่น ซื้อหมึก HP 30A" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">จำนวนเงิน (บาท) *</label>
                <input type="number" required step="0.01" value={formData.amount} onChange={(e) => setFormData({...formData, amount: parseFloat(e.target.value)})} className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">วันที่ *</label>
                <input type="date" required value={formData.transaction_date} onChange={(e) => setFormData({...formData, transaction_date: e.target.value, month: e.target.value.slice(0, 7)})} className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">หมวดหมู่</label>
              <input type="text" value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})} className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all" placeholder="เช่น ซื้อหมึก, บริการ, คืนเงิน" />
            </div>
            <div className="flex gap-4 pt-6">
              <button type="submit" className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 text-white py-4 rounded-xl font-semibold hover:shadow-2xl hover:scale-105 transition-all">✅ บันทึก</button>
              <button type="button" onClick={() => setShowAddTransactionModal(false)} className="flex-1 bg-gray-100 text-gray-700 py-4 rounded-xl font-semibold hover:bg-gray-200 transition-all">❌ ยกเลิก</button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  const InkTransactionModal = () => (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
      <div className="bg-white rounded-3xl p-8 max-w-6xl w-full max-h-[90vh] overflow-y-auto shadow-2xl animate-slideUp">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">💰 รายรับ-รายจ่ายหมึกเดือนนี้</h2>
            <p className="text-gray-500 text-sm mt-1">ประจำเดือน {new Date().toLocaleDateString('th-TH', { year: 'numeric', month: 'long' })}</p>
          </div>
          <button onClick={() => setShowInkTransactionModal(false)} className="text-gray-400 hover:text-gray-600 text-3xl transition-colors hover:rotate-90 duration-300">✕</button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gradient-to-br from-red-50 to-pink-50 p-8 rounded-2xl border-2 border-red-100 shadow-lg hover:shadow-2xl transition-all">
            <div className="flex items-center gap-4 mb-3">
              <div className="bg-gradient-to-br from-red-500 to-pink-500 p-4 rounded-xl shadow-lg">
                <span className="text-4xl">💸</span>
              </div>
              <div>
                <p className="text-sm text-gray-600 font-medium">รายจ่ายทั้งหมด</p>
                <p className="text-4xl font-bold text-red-600">฿{totalExpense.toLocaleString()}</p>
              </div>
            </div>
            <p className="text-sm text-gray-500">{monthlyTransactions.filter(t => t.transaction_type === 'รายจ่าย').length} รายการ</p>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-8 rounded-2xl border-2 border-green-100 shadow-lg hover:shadow-2xl transition-all">
            <div className="flex items-center gap-4 mb-3">
              <div className="bg-gradient-to-br from-green-500 to-emerald-500 p-4 rounded-xl shadow-lg">
                <span className="text-4xl">💵</span>
              </div>
              <div>
                <p className="text-sm text-gray-600 font-medium">รายรับทั้งหมด</p>
                <p className="text-4xl font-bold text-green-600">฿{totalIncome.toLocaleString()}</p>
              </div>
            </div>
            <p className="text-sm text-gray-500">{monthlyTransactions.filter(t => t.transaction_type === 'รายรับ').length} รายการ</p>
          </div>

          <div className={`bg-gradient-to-br ${netAmount >= 0 ? 'from-blue-50 to-cyan-50 border-blue-100' : 'from-orange-50 to-red-50 border-orange-100'} p-8 rounded-2xl border-2 shadow-lg hover:shadow-2xl transition-all`}>
            <div className="flex items-center gap-4 mb-3">
              <div className={`bg-gradient-to-br ${netAmount >= 0 ? 'from-blue-500 to-cyan-500' : 'from-orange-500 to-red-500'} p-4 rounded-xl shadow-lg`}>
                <span className="text-4xl">{netAmount >= 0 ? '📈' : '📉'}</span>
              </div>
              <div>
                <p className="text-sm text-gray-600 font-medium">ยอดสุทธิ</p>
                <p className={`text-4xl font-bold ${netAmount >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>{netAmount >= 0 ? '+' : ''}฿{Math.abs(netAmount).toLocaleString()}</p>
              </div>
            </div>
            <p className="text-sm text-gray-500">{netAmount >= 0 ? 'กำไร' : 'ขาดทุน'}</p>
          </div>
        </div>

        <button onClick={() => setShowAddTransactionModal(true)} className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-4 rounded-2xl font-semibold hover:shadow-2xl hover:scale-105 transition-all mb-6 flex items-center justify-center gap-3 text-lg">
          ➕ เพิ่มรายการใหม่
        </button>

        <div className="space-y-3">
          {monthlyTransactions.map((transaction) => (
            <div key={transaction.id} className={`bg-gradient-to-r ${transaction.transaction_type === 'รายจ่าย' ? 'from-red-50 to-pink-50 border-red-100' : 'from-green-50 to-emerald-50 border-green-100'} border-2 rounded-2xl p-6 hover:shadow-xl transition-all`}>
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4 flex-1">
                  <div className={`bg-gradient-to-br ${transaction.transaction_type === 'รายจ่าย' ? 'from-red-500 to-pink-500' : 'from-green-500 to-emerald-500'} p-4 rounded-xl shadow-lg`}>
                    <span className="text-3xl">{transaction.transaction_type === 'รายจ่าย' ? '💸' : '💵'}</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${transaction.transaction_type === 'รายจ่าย' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>{transaction.transaction_type}</span>
                      {transaction.category && <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">{transaction.category}</span>}
                    </div>
                    <h3 className="font-bold text-lg text-gray-900 mb-1">{transaction.description}</h3>
                    <p className="text-sm text-gray-600">📅 {new Date(transaction.transaction_date).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-3xl font-bold ${transaction.transaction_type === 'รายจ่าย' ? 'text-red-600' : 'text-green-600'}`}>
                    {transaction.transaction_type === 'รายจ่าย' ? '-' : '+'}฿{transaction.amount.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          ))}

          {monthlyTransactions.length === 0 && (
            <div className="text-center py-20">
              <span className="text-8xl mb-6 block animate-bounce">💰</span>
              <p className="text-2xl font-bold text-gray-700 mb-2">ยังไม่มีรายการในเดือนนี้</p>
              <p className="text-gray-500">คลิกปุ่มด้านบนเพื่อเพิ่มรายการใหม่</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const InkBudgetModal = () => {
    const budgetPercent = inkBudget ? (inkBudget.total_spent / inkBudget.budget_limit) * 100 : 0;
    const budgetRemaining = inkBudget ? inkBudget.budget_limit - inkBudget.total_spent : 0;
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
        <div className="bg-white rounded-3xl p-8 max-w-6xl w-full max-h-[90vh] overflow-y-auto shadow-2xl animate-slideUp">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">🖨️ สรุปงบประมาณหมึกพิมพ์</h2>
              <p className="text-gray-500 text-sm mt-1">ภาพรวมการใช้งบหมึกพิมพ์ประจำเดือน</p>
            </div>
            <button onClick={() => setShowInkBudgetModal(false)} className="text-gray-400 hover:text-gray-600 text-3xl transition-colors hover:rotate-90 duration-300">✕</button>
          </div>

          {inkBudget && (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
                <div className="bg-gradient-to-br from-blue-50 to-cyan-50 p-6 rounded-2xl border-2 border-blue-100 shadow-lg">
                  <p className="text-xs text-blue-600 mb-2 font-semibold">💰 ซื้อหมึกเดือนนี้</p>
                  <p className="text-4xl font-bold text-blue-900">฿{inkBudget.total_spent.toLocaleString()}</p>
                </div>
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-6 rounded-2xl border-2 border-green-100 shadow-lg">
                  <p className="text-xs text-green-600 mb-2 font-semibold">📊 งบประมาณทั้งหมด</p>
                  <p className="text-4xl font-bold text-green-900">฿{inkBudget.budget_limit.toLocaleString()}</p>
                </div>
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-6 rounded-2xl border-2 border-purple-100 shadow-lg">
                  <p className="text-xs text-purple-600 mb-2 font-semibold">💵 งบคงเหลือ</p>
                  <p className="text-4xl font-bold text-purple-900">฿{budgetRemaining.toLocaleString()}</p>
                </div>
                <div className="bg-gradient-to-br from-yellow-50 to-orange-50 p-6 rounded-2xl border-2 border-yellow-100 shadow-lg">
                  <p className="text-xs text-yellow-600 mb-2 font-semibold">⚠️ หมึกใกล้หมด</p>
                  <p className="text-4xl font-bold text-yellow-900">{inkInventory.filter(i => i.current_level < i.min_level).length} รายการ</p>
                </div>
              </div>

              <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-8 rounded-2xl mb-8 border-2 border-gray-200">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-xl font-bold text-gray-900">การใช้งบประมาณเดือนนี้</span>
                  <span className="text-3xl font-bold text-gray-900">{budgetPercent.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-8 shadow-inner">
                  <div className={`h-8 rounded-full transition-all duration-500 shadow-lg ${budgetPercent > 80 ? 'bg-gradient-to-r from-red-500 to-pink-500' : budgetPercent > 60 ? 'bg-gradient-to-r from-yellow-500 to-orange-500' : 'bg-gradient-to-r from-blue-500 to-purple-500'}`} style={{ width: `${budgetPercent}%` }}></div>
                </div>
                <div className="flex justify-between mt-3 text-sm font-medium">
                  <span className="text-gray-600">ใช้ไป: ฿{inkBudget.total_spent.toLocaleString()}</span>
                  <span className="text-gray-600">คงเหลือ: ฿{budgetRemaining.toLocaleString()}</span>
                </div>
              </div>
            </>
          )}

          <h3 className="text-2xl font-bold mb-6 flex items-center gap-2">
            📋 รายการหมึกพิมพ์ทั้งหมด ({inkInventory.length} รายการ)
          </h3>
          <div className="space-y-4">
            {inkInventory.map((ink: InkItem) => (
              <div key={ink.id} className="bg-gradient-to-r from-white to-gray-50 border-2 border-gray-200 rounded-2xl p-6 hover:shadow-2xl hover:scale-[1.02] transition-all">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-4">
                    <div className="bg-gradient-to-br from-purple-500 to-pink-500 p-4 rounded-xl shadow-lg">
                      <span className="text-4xl">🖨️</span>
                    </div>
                    <div>
                      <h3 className="font-bold text-xl text-gray-900">{ink.printer_name}</h3>
                      <p className="text-sm text-gray-600">รหัส: {ink.printer_tag}</p>
                      <p className="text-sm font-semibold text-gray-700 mt-2">{ink.ink_type}</p>
                    </div>
                  </div>
                  <span className={`px-4 py-2 rounded-full text-sm font-bold shadow-lg ${ink.status === 'วิกฤต' ? 'bg-gradient-to-r from-red-500 to-pink-500 text-white' : ink.status === 'ต่ำ' ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white' : 'bg-gradient-to-r from-green-500 to-emerald-500 text-white'}`}>
                    {ink.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm mb-4">
                  {[
                    { label: 'ระดับหมึก', value: `${ink.current_level}%`, color: 'text-gray-900' },
                    { label: 'คงเหลือ (วัน)', value: ink.estimated_days_left, color: ink.estimated_days_left < 10 ? 'text-red-600' : 'text-green-600' },
                    { label: 'ราคา/หน่วย', value: `฿${ink.unit_price.toLocaleString()}`, color: 'text-gray-900' },
                    { label: 'ใช้ต่อเดือน', value: `${ink.monthly_usage}%`, color: 'text-gray-900' },
                    { label: 'เติมล่าสุด', value: ink.last_refill, color: 'text-gray-900' }
                  ].map((item, idx) => (
                    <div key={idx} className="bg-white p-3 rounded-xl border border-gray-200">
                      <p className="text-gray-500 mb-1 text-xs">{item.label}</p>
                      <p className={`font-bold text-lg ${item.color}`}>{item.value}</p>
                    </div>
                  ))}
                </div>

                <div className="mb-2">
                  <div className="w-full bg-gray-200 rounded-full h-4 relative shadow-inner">
                    <div className={`h-4 rounded-full transition-all duration-500 shadow-lg ${ink.current_level < ink.min_level ? 'bg-gradient-to-r from-red-500 to-pink-500' : ink.current_level < 50 ? 'bg-gradient-to-r from-yellow-500 to-orange-500' : 'bg-gradient-to-r from-green-500 to-emerald-500'}`} style={{ width: `${ink.current_level}%` }}></div>
                    <div className="absolute top-0 bottom-0 w-1 bg-red-700 shadow-lg" style={{ left: `${ink.min_level}%` }}></div>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500 mt-2 font-medium">
                    <span>0%</span>
                    <span>ขั้นต่ำ: {ink.min_level}%</span>
                    <span>100%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-8xl mb-6 animate-bounce">⏳</div>
          <p className="text-2xl font-bold text-gray-700 mb-2">กำลังโหลดข้อมูล...</p>
          <div className="flex gap-2 justify-center mt-4">
            <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
            <div className="w-3 h-3 bg-purple-500 rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></div>
            <div className="w-3 h-3 bg-pink-500 rounded-full animate-pulse" style={{animationDelay: '0.4s'}}></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: .5; } }
        .animate-fadeIn { animation: fadeIn 0.3s ease-out; }
        .animate-slideUp { animation: slideUp 0.4s ease-out; }
        .animate-pulse { animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
      `}</style>

      {/* Header */}
      <div className="bg-white/80 backdrop-blur-xl border-b border-gray-200 shadow-lg sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center gap-4">
              <div className="bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 p-3 rounded-2xl shadow-xl">
                <span className="text-3xl">📦</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">ระบบจัดการทรัพย์สิน</h1>
                <p className="text-xs text-gray-500 font-medium">IT Asset Management System 2026</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {[
                { onClick: () => setShowDepartmentModal(true), color: 'from-gray-500 to-gray-600', label: '🏢' },
                { onClick: () => setShowCategoryModal(true), color: 'from-indigo-500 to-blue-500', label: '📂' },
                { onClick: () => setShowInkBudgetModal(true), color: 'from-purple-500 to-pink-500', label: '🖨️' },
                { onClick: () => setShowRepairHistoryModal(true), color: 'from-orange-500 to-red-500', label: '🔧' },
                { onClick: () => setShowInkTransactionModal(true), color: 'from-green-500 to-emerald-500', label: '💰' }
              ].map((btn, idx) => (
                <button key={idx} onClick={btn.onClick} className={`hidden md:flex items-center justify-center w-12 h-12 bg-gradient-to-r ${btn.color} text-white hover:shadow-2xl rounded-xl text-xl font-semibold transition-all hover:scale-110`}>
                  {btn.label}
                </button>
              ))}
              <button className="p-3 hover:bg-gray-100 rounded-xl transition-all hover:scale-110">⚙️</button>
              
              {/* User Menu */}
              <div className="relative">
                <button onClick={() => setShowUserMenu(!showUserMenu)} className="flex items-center gap-3 px-4 py-2 hover:bg-gray-100 rounded-xl transition-all">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 text-white rounded-xl flex items-center justify-center text-lg font-bold shadow-lg">
                    {currentUser.avatar}
                  </div>
                  <div className="text-left hidden lg:block">
                    <p className="text-sm font-bold text-gray-900">{currentUser.name}</p>
                    <p className="text-xs text-gray-500">{currentUser.role}</p>
                  </div>
                </button>
                
                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-2xl border-2 border-gray-200 p-4 z-50 animate-slideUp">
                    <div className="flex items-center gap-4 mb-4 pb-4 border-b border-gray-200">
                      <div className="w-16 h-16 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 text-white rounded-2xl flex items-center justify-center text-3xl font-bold shadow-lg">
                        {currentUser.avatar}
                      </div>
                      <div>
                        <p className="font-bold text-lg text-gray-900">{currentUser.name}</p>
                        <p className="text-sm text-gray-600">{currentUser.email}</p>
                        <span className="inline-block mt-1 px-3 py-1 bg-gradient-to-r from-blue-500 to-purple-500 text-white text-xs font-bold rounded-full">
                          {currentUser.role}
                        </span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl">
                        <span className="text-2xl">🏢</span>
                        <div>
                          <p className="text-xs text-gray-600">แผนก</p>
                          <p className="font-semibold text-gray-900">{currentUser.department}</p>
                        </div>
                      </div>
                      <button className="w-full px-4 py-3 text-left hover:bg-gray-50 rounded-xl transition-all flex items-center gap-3">
                        <span className="text-xl">👤</span>
                        <span className="font-medium text-gray-700">โปรไฟล์</span>
                      </button>
                      <button className="w-full px-4 py-3 text-left hover:bg-gray-50 rounded-xl transition-all flex items-center gap-3">
                        <span className="text-xl">⚙️</span>
                        <span className="font-medium text-gray-700">ตั้งค่า</span>
                      </button>
                      <button className="w-full px-4 py-3 text-left hover:bg-red-50 rounded-xl transition-all flex items-center gap-3 text-red-600">
                        <span className="text-xl">🚪</span>
                        <span className="font-medium">ออกจากระบบ</span>
                      </button>
                    </div>
                  </div>
                )}
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
              { page: 'dashboard', icon: '🏠', label: 'แดชบอร์ด' },
              { page: 'assets', icon: '📦', label: 'ทรัพย์สิน' }
            ].map((nav) => (
              <button key={nav.page} onClick={() => setCurrentPage(nav.page)} className={`px-6 py-4 font-semibold flex items-center gap-2 border-b-4 transition-all ${currentPage === nav.page ? 'border-blue-600 text-blue-600 bg-blue-50/50' : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50/50'}`}>
                <span className="text-lg">{nav.icon}</span>
                {nav.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        {currentPage === 'dashboard' ? (
          <div className="space-y-8">
            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
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

            {/* รายรับ-รายจ่ายหมึก Widget */}
            <div className="bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 rounded-3xl p-8 border-2 border-green-200 shadow-2xl">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent flex items-center gap-3">
                    💰 รายรับ-รายจ่ายหมึกเดือนนี้
                  </h2>
                  <p className="text-gray-600 text-base mt-2 font-medium">
                    📅 {new Date().toLocaleDateString('th-TH', { year: 'numeric', month: 'long' })} 
                    <span className="ml-3 text-sm">({monthlyTransactions.length} รายการ)</span>
                  </p>
                </div>
                <div className="flex gap-3">
                  <button onClick={exportInkTransactions} className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-2xl hover:scale-105 transition-all flex items-center gap-2">
                    📥 Export
                  </button>
                  <button onClick={() => setShowInkTransactionModal(true)} className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-2xl hover:scale-105 transition-all flex items-center gap-2">
                    📋 ดูทั้งหมด →
                  </button>
                </div>
              </div>

              {/* สรุปยอด 3 การ์ด */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white rounded-2xl p-8 border-2 border-red-100 shadow-xl hover:shadow-2xl hover:scale-105 transition-all">
                  <div className="flex items-start justify-between mb-4">
                    <div className="bg-gradient-to-br from-red-500 to-pink-500 p-4 rounded-2xl shadow-lg">
                      <span className="text-5xl">💸</span>
                    </div>
                    <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-bold">
                      {monthlyTransactions.filter(t => t.transaction_type === 'รายจ่าย').length} รายการ
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 font-medium mb-2">รายจ่ายทั้งหมด</p>
                  <p className="text-5xl font-bold text-red-600 mb-3">฿{totalExpense.toLocaleString()}</p>
                  <div className="w-full bg-red-100 rounded-full h-2">
                    <div className="bg-gradient-to-r from-red-500 to-pink-500 h-2 rounded-full shadow-lg transition-all duration-1000" style={{ width: totalExpense > 0 ? '100%' : '0%' }}></div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-8 border-2 border-green-100 shadow-xl hover:shadow-2xl hover:scale-105 transition-all">
                  <div className="flex items-start justify-between mb-4">
                    <div className="bg-gradient-to-br from-green-500 to-emerald-500 p-4 rounded-2xl shadow-lg">
                      <span className="text-5xl">💵</span>
                    </div>
                    <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold">
                      {monthlyTransactions.filter(t => t.transaction_type === 'รายรับ').length} รายการ
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 font-medium mb-2">รายรับทั้งหมด</p>
                  <p className="text-5xl font-bold text-green-600 mb-3">฿{totalIncome.toLocaleString()}</p>
                  <div className="w-full bg-green-100 rounded-full h-2">
                    <div className="bg-gradient-to-r from-green-500 to-emerald-500 h-2 rounded-full shadow-lg transition-all duration-1000" style={{ width: totalIncome > 0 ? '100%' : '0%' }}></div>
                  </div>
                </div>

                <div className={`bg-white rounded-2xl p-8 border-2 ${netAmount >= 0 ? 'border-blue-100' : 'border-orange-100'} shadow-xl hover:shadow-2xl hover:scale-105 transition-all`}>
                  <div className="flex items-start justify-between mb-4">
                    <div className={`bg-gradient-to-br ${netAmount >= 0 ? 'from-blue-500 to-cyan-500' : 'from-orange-500 to-red-500'} p-4 rounded-2xl shadow-lg`}>
                      <span className="text-5xl">{netAmount >= 0 ? '📈' : '📉'}</span>
                    </div>
                    <span className={`${netAmount >= 0 ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'} px-3 py-1 rounded-full text-xs font-bold`}>
                      {netAmount >= 0 ? 'กำไร' : 'ขาดทุน'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 font-medium mb-2">ยอดสุทธิ</p>
                  <p className={`text-5xl font-bold ${netAmount >= 0 ? 'text-blue-600' : 'text-orange-600'} mb-3`}>
                    {netAmount >= 0 ? '+' : ''}฿{Math.abs(netAmount).toLocaleString()}
                  </p>
                  <div className={`w-full ${netAmount >= 0 ? 'bg-blue-100' : 'bg-orange-100'} rounded-full h-2`}>
                    <div className={`bg-gradient-to-r ${netAmount >= 0 ? 'from-blue-500 to-cyan-500' : 'from-orange-500 to-red-500'} h-2 rounded-full shadow-lg transition-all duration-1000`} style={{ width: '100%' }}></div>
                  </div>
                </div>
              </div>

              {/* กราฟเปรียบเทียบ */}
              <div className="bg-white rounded-2xl p-8 border-2 border-gray-200 shadow-xl">
                <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                  📊 เปรียบเทียบรายรับ-รายจ่าย
                </h3>
                <div className="space-y-6">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">💸</span>
                        <span className="font-semibold text-gray-700">รายจ่าย</span>
                      </div>
                      <span className="text-2xl font-bold text-red-600">฿{totalExpense.toLocaleString()}</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-8 shadow-inner">
                      <div 
                        className="bg-gradient-to-r from-red-500 to-pink-500 h-8 rounded-full shadow-lg flex items-center justify-end pr-4 text-white text-sm font-bold transition-all duration-1000" 
                        style={{ width: `${totalExpense > 0 && (totalExpense + totalIncome) > 0 ? (totalExpense / (totalExpense + totalIncome)) * 100 : 0}%`, minWidth: totalExpense > 0 ? '80px' : '0' }}
                      >
                        {totalExpense > 0 ? `${((totalExpense / (totalExpense + totalIncome)) * 100).toFixed(1)}%` : ''}
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">💵</span>
                        <span className="font-semibold text-gray-700">รายรับ</span>
                      </div>
                      <span className="text-2xl font-bold text-green-600">฿{totalIncome.toLocaleString()}</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-8 shadow-inner">
                      <div 
                        className="bg-gradient-to-r from-green-500 to-emerald-500 h-8 rounded-full shadow-lg flex items-center justify-end pr-4 text-white text-sm font-bold transition-all duration-1000" 
                        style={{ width: `${totalIncome > 0 && (totalExpense + totalIncome) > 0 ? (totalIncome / (totalExpense + totalIncome)) * 100 : 0}%`, minWidth: totalIncome > 0 ? '80px' : '0' }}
                      >
                        {totalIncome > 0 ? `${((totalIncome / (totalExpense + totalIncome)) * 100).toFixed(1)}%` : ''}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Category Distribution */}
            <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-8 border-2 border-gray-200 shadow-2xl">
              <h2 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent mb-6 flex items-center gap-3">
                📊 ทรัพย์สินแยกตามประเภท
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                {categoryData.map((cat) => (
                  <div key={cat.id} className="bg-gradient-to-br from-gray-50 to-white p-6 rounded-2xl text-center border-2 border-gray-200 hover:shadow-2xl hover:scale-105 transition-all cursor-pointer">
                    <span className="text-6xl block mb-3">{cat.icon}</span>
                    <p className="text-sm font-semibold text-gray-700 mb-2">{cat.name}</p>
                    <p className="text-4xl font-bold text-gray-900 mb-1">{cat.count}</p>
                    <p className="text-xs text-gray-500 font-medium">{cat.percent}% ของทั้งหมด</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">ทรัพย์สิน ({filteredAssets.length})</h1>
              <div className="flex gap-3">
                <button onClick={() => setShowAddAssetModal(true)} className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-2xl font-semibold hover:shadow-2xl hover:scale-105 transition-all">➕ เพิ่ม</button>
                <button onClick={exportToExcel} className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-8 py-4 rounded-2xl font-semibold hover:shadow-2xl hover:scale-105 transition-all">📥 Export</button>
              </div>
            </div>

            <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 border-2 border-gray-200 shadow-xl">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="relative">
                  <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-2xl">🔍</span>
                  <input type="text" placeholder="ค้นหา..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-14 pr-5 py-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all" />
                </div>
                <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)} className="px-5 py-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all">
                  <option>ทั้งหมด</option>
                  {assetCategories.map(c => <option key={c.id} value={c.name}>{c.icon} {c.name}</option>)}
                </select>
                <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="px-5 py-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all">
                  <option>ทั้งหมด</option>
                  <option>ใช้งาน</option>
                  <option>ซ่อม</option>
                  <option>เก็บคลัง</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredAssets.map(asset => (
                <div key={asset.id} className="bg-white/80 backdrop-blur-xl rounded-2xl overflow-hidden border-2 border-gray-200 hover:shadow-2xl hover:scale-105 transition-all cursor-pointer group" onClick={() => { setSelectedAsset(asset); setShowDetailModal(true); }}>
                  {asset.image_url ? (
                    <img src={asset.image_url} alt={asset.name} className="w-full h-56 object-cover group-hover:scale-110 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-56 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center">
                      <span className="text-8xl group-hover:scale-110 transition-transform duration-500">{asset.icon}</span>
                    </div>
                  )}
                  <div className="p-6">
                    <h3 className="font-bold text-xl text-gray-900 mb-4 group-hover:text-blue-600 transition-colors">{asset.name}</h3>
                    <div className="space-y-3 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600 font-medium">รหัส:</span>
                        <code className="bg-blue-50 px-3 py-1 rounded-lg text-blue-600 font-semibold">{asset.tag}</code>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600 font-medium">แผนก:</span>
                        <span className="font-semibold text-gray-900">{asset.location}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600 font-medium">ราคา:</span>
                        <span className="font-bold text-green-600 text-lg">฿{asset.price}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600 font-medium">สถานะ:</span>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${asset.status === 'ใช้งาน' ? 'bg-green-100 text-green-700' : asset.status === 'ซ่อม' ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-700'}`}>{asset.status}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {filteredAssets.length === 0 && (
              <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-20 text-center border-2 border-gray-200 shadow-2xl">
                <span className="text-9xl mb-6 block animate-bounce">🔍</span>
                <p className="text-3xl font-bold text-gray-700 mb-3">ไม่พบทรัพย์สิน</p>
                <p className="text-gray-500 text-lg">ลองเปลี่ยนคำค้นหาหรือตัวกรอง</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* All Modals */}
      {showAddAssetModal && <AddAssetModal />}
      {showEditAssetModal && <EditAssetModal />}
      {showDetailModal && <AssetDetailModal />}
      {showDepartmentModal && <DepartmentModal />}
      {showCategoryModal && <CategoryModal />}
      {showAddRepairModal && <AddRepairModal />}
      {showRepairHistoryModal && <RepairHistoryModal />}
      {showInkTransactionModal && <InkTransactionModal />}
      {showAddTransactionModal && <AddTransactionModal />}
      {showInkBudgetModal && <InkBudgetModal />}
    </div>
  );
};
export default App;
