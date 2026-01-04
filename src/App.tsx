import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import type { Asset, InkItem, Department, AssetCategory, InkBudgetSummary, RepairHistory } from './supabaseClient';

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

  // คำนวณสถิติ
  const stats = [
    { icon: '📦', label: 'ทรัพย์สินทั้งหมด', value: assets.length.toString(), color: 'bg-blue-500' },
    { icon: '⚠️', label: 'การรับประกันใกล้หมด', value: assets.filter((a: Asset) => a.warranty_days < 30).length.toString(), color: 'bg-yellow-500' },
    { icon: '🔧', label: 'อยู่ระหว่างซ่อม', value: assets.filter((a: Asset) => a.status === 'ซ่อม').length.toString(), color: 'bg-red-500' },
    { icon: '💰', label: 'มูลค่ารวม', value: `฿${(assets.reduce((sum, a: Asset) => sum + parseFloat(a.price.replace(/,/g, '') || '0'), 0) / 1000000).toFixed(1)}M`, color: 'bg-green-500' },
    { icon: '🏢', label: 'แผนกทั้งหมด', value: departments.length.toString(), color: 'bg-purple-500' },
    { icon: '📂', label: 'ประเภททรัพย์สิน', value: assetCategories.length.toString(), color: 'bg-indigo-500' }
  ];

  const categoryData = assetCategories.map(cat => {
    const count = assets.filter((a: Asset) => a.category === cat.name).length;
    const percent = assets.length > 0 ? Math.round((count / assets.length) * 100) : 0;
    return { ...cat, count, percent };
  });

  // ดึงข้อมูลทั้งหมด
  useEffect(() => {
    fetchAllData();
    const cleanup = setupRealtimeSubscriptions();
    return cleanup;
  }, []);

  const fetchAllData = async (): Promise<void> => {
    try {
      setLoading(true);

      // ดึงทรัพย์สิน
      const { data: assetsData, error: assetsError } = await supabase
        .from('assets')
        .select('*')
        .order('created_at', { ascending: false });
      if (assetsError) throw assetsError;
      if (assetsData) setAssets(assetsData as Asset[]);

      // ดึงแผนก
      const { data: deptsData, error: deptsError } = await supabase
        .from('departments')
        .select('*');
      if (deptsError) throw deptsError;
      if (deptsData) setDepartments(deptsData as Department[]);

      // ดึงประเภททรัพย์สิน
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('asset_categories')
        .select('*')
        .order('name');
      if (categoriesError) throw categoriesError;
      if (categoriesData) setAssetCategories(categoriesData as AssetCategory[]);

      // ดึงหมึกพิมพ์
      const { data: inkData, error: inkError } = await supabase
        .from('ink_inventory')
        .select('*')
        .order('created_at', { ascending: false });
      if (inkError) throw inkError;
      if (inkData) setInkInventory(inkData as InkItem[]);

      // ดึงงบหมึกเดือนปัจจุบัน
      const currentMonth = new Date().toISOString().slice(0, 7);
      const { data: budgetData, error: budgetError } = await supabase
        .from('ink_budget_summary')
        .select('*')
        .eq('month', currentMonth)
        .single();
      if (budgetError && budgetError.code !== 'PGRST116') throw budgetError;
      if (budgetData) setInkBudget(budgetData as InkBudgetSummary);

      // ดึงประวัติการซ่อม
      const { data: repairData, error: repairError } = await supabase
        .from('repair_history')
        .select('*')
        .order('created_at', { ascending: false });
      if (repairError) throw repairError;
      if (repairData) setRepairHistory(repairData as RepairHistory[]);

    } catch (error) {
      console.error('Error fetching data:', error);
      alert('เกิดข้อผิดพลาดในการโหลดข้อมูล');
    } finally {
      setLoading(false);
    }
  };

  const setupRealtimeSubscriptions = () => {
    const assetsChannel = supabase
      .channel('assets-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'assets' }, () => fetchAllData())
      .subscribe();

    const inkChannel = supabase
      .channel('ink-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ink_inventory' }, () => fetchAllData())
      .subscribe();

    return () => {
      supabase.removeChannel(assetsChannel);
      supabase.removeChannel(inkChannel);
    };
  };

  // อัพโหลดรูปภาพไป Supabase Storage
  const uploadImage = async (file: File): Promise<string | null> => {
    try {
      setUploading(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = fileName;

      const { data, error } = await supabase.storage
        .from('assets-images')
        .upload(filePath, file);

      if (error) throw error;

      const { data: publicUrlData } = supabase.storage
        .from('assets-images')
        .getPublicUrl(filePath);

      return publicUrlData.publicUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('❌ เกิดข้อผิดพลาดในการอัพโหลดรูปภาพ');
      return null;
    } finally {
      setUploading(false);
    }
  };

  // เพิ่มทรัพย์สิน
  const addAsset = async (assetData: Partial<Asset>): Promise<void> => {
    try {
      const { error } = await supabase.from('assets').insert([assetData]);
      if (error) throw error;
      alert('✅ เพิ่มทรัพย์สินสำเร็จ');
      setShowAddAssetModal(false);
      fetchAllData();
    } catch (error) {
      console.error('Error adding asset:', error);
      alert('❌ เกิดข้อผิดพลาดในการเพิ่มทรัพย์สิน');
    }
  };

  // แก้ไขทรัพย์สิน
  const updateAsset = async (id: number, assetData: Partial<Asset>): Promise<void> => {
    try {
      const { error } = await supabase
        .from('assets')
        .update(assetData)
        .eq('id', id);
      if (error) throw error;
      alert('✅ แก้ไขทรัพย์สินสำเร็จ');
      setShowEditAssetModal(false);
      setShowDetailModal(false);
      fetchAllData();
    } catch (error) {
      console.error('Error updating asset:', error);
      alert('❌ เกิดข้อผิดพลาดในการแก้ไข');
    }
  };

  // ลบทรัพย์สิน
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
      alert('❌ เกิดข้อผิดพลาดในการลบ');
    }
  };

  // เพิ่มแผนก
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

  // ลบแผนก
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

  // เพิ่มประเภททรัพย์สิน
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

  // ลบประเภททรัพย์สิน
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

  // เพิ่มประวัติการซ่อม
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

  const filteredAssets = assets.filter((asset: Asset) => {
    const matchSearch = asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       asset.tag.toLowerCase().includes(searchTerm.toLowerCase());
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

  // Modal เพิ่มทรัพย์สิน
  const AddAssetModal = () => {
    const [formData, setFormData] = useState({
      name: '',
      tag: '',
      serial: '',
      category: assetCategories[0]?.name || '',
      location: departments[0]?.name || '',
      price: '',
      purchase_date: '',
      warranty_expiry: '',
      icon: assetCategories[0]?.icon || '📦',
      status: 'ใช้งาน',
      warranty_days: 365,
      image_url: ''
    });
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string>('');

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        setImageFile(file);
        const reader = new FileReader();
        reader.onloadend = () => {
          setImagePreview(reader.result as string);
        };
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
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">เพิ่มทรัพย์สินใหม่</h2>
            <button onClick={() => setShowAddAssetModal(false)} className="text-gray-400 hover:text-gray-600 text-2xl">✕</button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">รูปภาพ</label>
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={handleImageChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                />
                {imagePreview && (
                  <img src={imagePreview} alt="Preview" className="mt-2 h-32 object-cover rounded-lg" />
                )}
                {uploading && <p className="text-blue-600 mt-2">กำลังอัพโหลด...</p>}
              </div>
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
                  onChange={(e) => {
                    const cat = assetCategories.find(c => c.name === e.target.value);
                    setFormData({...formData, category: e.target.value, icon: cat?.icon || '📦'});
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {assetCategories.map(cat => (
                    <option key={cat.id} value={cat.name}>{cat.icon} {cat.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">สถานที่ *</label>
                <select 
                  value={formData.location}
                  onChange={(e) => setFormData({...formData, location: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {departments.map(dept => <option key={dept.id}>{dept.name}</option>)}
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
              <button type="submit" disabled={uploading} className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-lg font-medium hover:shadow-lg transition-shadow disabled:opacity-50">
                {uploading ? '⏳ กำลังอัพโหลด...' : '✅ บันทึก'}
              </button>
              <button type="button" onClick={() => setShowAddAssetModal(false)} className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-300">
                ❌ ยกเลิก
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  // Modal แก้ไขทรัพย์สิน
  const EditAssetModal = () => {
    if (!selectedAsset) return null;

    const [formData, setFormData] = useState({
      name: selectedAsset.name,
      tag: selectedAsset.tag,
      serial: selectedAsset.serial,
      category: selectedAsset.category,
      location: selectedAsset.location,
      price: selectedAsset.price,
      purchase_date: selectedAsset.purchase_date,
      warranty_expiry: selectedAsset.warranty_expiry,
      icon: selectedAsset.icon,
      status: selectedAsset.status,
      warranty_days: selectedAsset.warranty_days,
      image_url: selectedAsset.image_url || ''
    });
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string>(selectedAsset.image_url || '');

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        setImageFile(file);
        const reader = new FileReader();
        reader.onloadend = () => {
          setImagePreview(reader.result as string);
        };
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
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">แก้ไขทรัพย์สิน</h2>
            <button onClick={() => setShowEditAssetModal(false)} className="text-gray-400 hover:text-gray-600 text-2xl">✕</button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">รูปภาพ</label>
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={handleImageChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                />
                {imagePreview && (
                  <img src={imagePreview} alt="Preview" className="mt-2 h-32 object-cover rounded-lg" />
                )}
                {uploading && <p className="text-blue-600 mt-2">กำลังอัพโหลด...</p>}
              </div>
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
                  onChange={(e) => {
                    const cat = assetCategories.find(c => c.name === e.target.value);
                    setFormData({...formData, category: e.target.value, icon: cat?.icon || '📦'});
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {assetCategories.map(cat => (
                    <option key={cat.id} value={cat.name}>{cat.icon} {cat.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">สถานที่ *</label>
                <select 
                  value={formData.location}
                  onChange={(e) => setFormData({...formData, location: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {departments.map(dept => <option key={dept.id}>{dept.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">สถานะ *</label>
                <select 
                  value={formData.status}
                  onChange={(e) => setFormData({...formData, status: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option>ใช้งาน</option>
                  <option>ซ่อม</option>
                  <option>เก็บคลัง</option>
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
              <button type="submit" disabled={uploading} className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-lg font-medium hover:shadow-lg transition-shadow disabled:opacity-50">
                {uploading ? '⏳ กำลังอัพโหลด...' : '✅ บันทึก'}
              </button>
              <button type="button" onClick={() => setShowEditAssetModal(false)} className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-300">
                ❌ ยกเลิก
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  // Modal รายละเอียดทรัพย์สิน
  const AssetDetailModal = () => {
    const assetRepairs = repairHistory.filter(r => r.asset_id === selectedAsset?.id);

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">รายละเอียดทรัพย์สิน</h2>
            <button onClick={() => setShowDetailModal(false)} className="text-gray-400 hover:text-gray-600 text-2xl">✕</button>
          </div>
          {selectedAsset && (
            <div className="space-y-6">
              {selectedAsset.image_url && (
                <img src={selectedAsset.image_url} alt={selectedAsset.name} className="w-full h-64 object-cover rounded-xl" />
              )}
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

              {/* ประวัติการซ่อม */}
              {assetRepairs.length > 0 && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-bold text-lg mb-3">🔧 ประวัติการซ่อม ({assetRepairs.length} ครั้ง)</h4>
                  <div className="space-y-2">
                    {assetRepairs.map((repair) => (
                      <div key={repair.id} className="bg-white p-3 rounded-lg border">
                        <div className="flex justify-between items-start mb-2">
                          <p className="font-medium text-gray-900">{repair.issue_description}</p>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            repair.repair_status === 'เสร็จสิ้น' ? 'bg-green-100 text-green-700' :
                            repair.repair_status === 'กำลังซ่อม' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {repair.repair_status}
                          </span>
                        </div>
                        <div className="text-sm text-gray-600 space-y-1">
                          <p>ช่าง: {repair.technician || '-'}</p>
                          <p>ค่าใช้จ่าย: ฿{repair.repair_cost.toLocaleString()}</p>
                          <p>วันที่: {repair.start_date} {repair.end_date ? `- ${repair.end_date}` : ''}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <button 
                  onClick={() => { setShowDetailModal(false); setShowEditAssetModal(true); }}
                  className="flex-1 bg-blue-500 text-white py-3 rounded-lg font-medium hover:bg-blue-600 flex items-center justify-center gap-2"
                >
                  ✏️ แก้ไข
                </button>
                <button 
                  onClick={() => { setShowDetailModal(false); setShowAddRepairModal(true); }}
                  className="flex-1 bg-orange-500 text-white py-3 rounded-lg font-medium hover:bg-orange-600 flex items-center justify-center gap-2"
                >
                  🔧 เพิ่มการซ่อม
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
  };

  // Modal จัดการแผนก
  const DepartmentModal = () => {
    const [newDept, setNewDept] = useState('');
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl p-6 max-w-md w-full">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">จัดการแผนก</h2>
            <button onClick={() => setShowDepartmentModal(false)} className="text-gray-400 hover:text-gray-600 text-2xl">✕</button>
          </div>
          <div className="space-y-3 mb-4 max-h-96 overflow-y-auto">
            {departments.map((dept) => (
              <div key={dept.id} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                <span className="font-medium">{dept.name}</span>
                <button 
                  onClick={() => deleteDepartment(dept.id, dept.name)}
                  className="text-red-500 hover:text-red-700"
                >
                  🗑️
                </button>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <input 
              type="text" 
              placeholder="ชื่อแผนกใหม่"
              value={newDept}
              onChange={(e) => setNewDept(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && newDept.trim() && (addDepartment(newDept), setNewDept(''))}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" 
            />
            <button 
              onClick={() => { if (newDept.trim()) { addDepartment(newDept); setNewDept(''); } }}
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2 rounded-lg font-medium hover:shadow-lg"
            >
              ➕ เพิ่ม
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Modal จัดการประเภททรัพย์สิน
  const CategoryModal = () => {
    const [newCategory, setNewCategory] = useState({ name: '', icon: '📦' });
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl p-6 max-w-md w-full">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">จัดการประเภททรัพย์สิน</h2>
            <button onClick={() => setShowCategoryModal(false)} className="text-gray-400 hover:text-gray-600 text-2xl">✕</button>
          </div>
          <div className="space-y-3 mb-4 max-h-96 overflow-y-auto">
            {assetCategories.map((cat) => (
              <div key={cat.id} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{cat.icon}</span>
                  <span className="font-medium">{cat.name}</span>
                </div>
                <button 
                  onClick={() => deleteCategory(cat.id, cat.name)}
                  className="text-red-500 hover:text-red-700"
                >
                  🗑️
                </button>
              </div>
            ))}
          </div>
          <div className="space-y-3">
            <input 
              type="text" 
              placeholder="ไอคอน (Emoji)"
              value={newCategory.icon}
              onChange={(e) => setNewCategory({...newCategory, icon: e.target.value})}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              maxLength={2}
            />
            <div className="flex gap-2">
              <input 
                type="text" 
                placeholder="ชื่อประเภทใหม่"
                value={newCategory.name}
                onChange={(e) => setNewCategory({...newCategory, name: e.target.value})}
                onKeyPress={(e) => e.key === 'Enter' && newCategory.name.trim() && (addCategory(newCategory.name, newCategory.icon), setNewCategory({ name: '', icon: '📦' }))}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" 
              />
              <button 
                onClick={() => { 
                  if (newCategory.name.trim()) { 
                    addCategory(newCategory.name, newCategory.icon); 
                    setNewCategory({ name: '', icon: '📦' }); 
                  } 
                }}
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2 rounded-lg font-medium hover:shadow-lg"
              >
                ➕ เพิ่ม
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Modal เพิ่มการซ่อม
  const AddRepairModal = () => {
    const [formData, setFormData] = useState({
      asset_id: selectedAsset?.id || 0,
      asset_name: selectedAsset?.name || '',
      asset_tag: selectedAsset?.tag || '',
      issue_description: '',
      repair_status: 'รอดำเนินการ',
      repair_cost: 0,
      start_date: new Date().toISOString().split('T')[0],
      end_date: '',
      technician: '',
      notes: ''
    });

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      addRepairHistory(formData);
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">🔧 เพิ่มการซ่อม</h2>
            <button onClick={() => setShowAddRepairModal(false)} className="text-gray-400 hover:text-gray-600 text-2xl">✕</button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">ทรัพย์สิน</p>
              <p className="font-bold text-lg">{selectedAsset?.name} ({selectedAsset?.tag})</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">รายละเอียดปัญหา *</label>
              <textarea 
                required
                rows={3}
                value={formData.issue_description}
                onChange={(e) => setFormData({...formData, issue_description: e.target.value})}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">สถานะการซ่อม *</label>
                <select 
                  value={formData.repair_status}
                  onChange={(e) => setFormData({...formData, repair_status: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option>รอดำเนินการ</option>
                  <option>กำลังซ่อม</option>
                  <option>เสร็จสิ้น</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">ค่าใช้จ่าย (บาท)</label>
                <input 
                  type="number" 
                  step="0.01"
                  value={formData.repair_cost}
                  onChange={(e) => setFormData({...formData, repair_cost: parseFloat(e.target.value)})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">วันที่เริ่มซ่อม *</label>
                <input 
                  type="date" 
                  required
                  value={formData.start_date}
                  onChange={(e) => setFormData({...formData, start_date: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">วันที่เสร็จสิ้น</label>
                <input 
                  type="date" 
                  value={formData.end_date}
                  onChange={(e) => setFormData({...formData, end_date: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">ช่างผู้รับผิดชอบ</label>
              <input 
                type="text" 
                value={formData.technician}
                onChange={(e) => setFormData({...formData, technician: e.target.value})}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">หมายเหตุ</label>
              <textarea 
                rows={2}
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
              />
            </div>
            <div className="flex gap-3 pt-4">
              <button type="submit" className="flex-1 bg-gradient-to-r from-orange-600 to-red-600 text-white py-3 rounded-lg font-medium hover:shadow-lg transition-shadow">
                ✅ บันทึก
              </button>
              <button type="button" onClick={() => setShowAddRepairModal(false)} className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-300">
                ❌ ยกเลิก
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  // Modal ประวัติการซ่อมทั้งหมด
  const RepairHistoryModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">🔧 ประวัติการซ่อมทั้งหมด</h2>
            <p className="text-sm text-gray-500">รวม {repairHistory.length} รายการ</p>
          </div>
          <button onClick={() => setShowRepairHistoryModal(false)} className="text-gray-400 hover:text-gray-600 text-2xl">✕</button>
        </div>

        <div className="space-y-3">
          {repairHistory.map((repair) => (
            <div key={repair.id} className="bg-white border-2 border-gray-200 rounded-xl p-4 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-bold text-lg text-gray-900">{repair.asset_name}</h3>
                  <p className="text-sm text-gray-600">รหัส: {repair.asset_tag}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                  repair.repair_status === 'เสร็จสิ้น' ? 'bg-green-100 text-green-700' :
                  repair.repair_status === 'กำลังซ่อม' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-gray-100 text-gray-700'
                }`}>
                  {repair.repair_status}
                </span>
              </div>
              
              <div className="bg-gray-50 p-3 rounded-lg mb-3">
                <p className="text-sm font-medium text-gray-900">{repair.issue_description}</p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                <div>
                  <p className="text-gray-500">ค่าใช้จ่าย</p>
                  <p className="font-bold text-lg text-red-600">฿{repair.repair_cost.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-gray-500">ช่าง</p>
                  <p className="font-bold text-gray-900">{repair.technician || '-'}</p>
                </div>
                <div>
                  <p className="text-gray-500">วันที่เริ่ม</p>
                  <p className="font-bold text-gray-900">{repair.start_date}</p>
                </div>
                <div>
                  <p className="text-gray-500">วันที่เสร็จ</p>
                  <p className="font-bold text-gray-900">{repair.end_date || '-'}</p>
                </div>
              </div>

              {repair.notes && (
                <div className="mt-3 pt-3 border-t">
                  <p className="text-sm text-gray-600"><strong>หมายเหตุ:</strong> {repair.notes}</p>
                </div>
              )}
            </div>
          ))}

          {repairHistory.length === 0 && (
            <div className="text-center py-12">
              <span className="text-6xl mb-4 block">🔧</span>
              <p className="text-xl font-semibold text-gray-700">ไม่มีประวัติการซ่อม</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // Modal สรุปงบหมึก (เหมือนเดิม)
  const InkBudgetModal = () => {
    const budgetPercent = inkBudget ? (inkBudget.total_spent / inkBudget.budget_limit) * 100 : 0;
    const budgetRemaining = inkBudget ? inkBudget.budget_limit - inkBudget.total_spent : 0;
    const lowStockItems = inkInventory.filter((i: InkItem) => i.current_level < i.min_level && i.status !== 'วิกฤต').length;
    const criticalItems = inkInventory.filter((i: InkItem) => i.status === 'วิกฤต').length;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl p-6 max-w-6xl w-full max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">🖨️ สรุปงบประมาณหมึกพิมพ์</h2>
              <p className="text-sm text-gray-500">ภาพรวมการใช้งบหมึกพิมพ์ประจำเดือน</p>
            </div>
            <button onClick={() => setShowInkBudgetModal(false)} className="text-gray-400 hover:text-gray-600 text-2xl">✕</button>
          </div>

          {/* สรุปงบประมาณรวม */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl border border-blue-200">
              <p className="text-xs text-blue-600 mb-1">💰 ซื้อหมึกเดือนนี้</p>
              <p className="text-3xl font-bold text-blue-900">฿{inkBudget?.total_spent.toLocaleString() || '0'}</p>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-xl border border-green-200">
              <p className="text-xs text-green-600 mb-1">📊 งบประมาณทั้งหมด</p>
              <p className="text-3xl font-bold text-green-900">฿{inkBudget?.budget_limit.toLocaleString() || '0'}</p>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-xl border border-purple-200">
              <p className="text-xs text-purple-600 mb-1">💵 งบคงเหลือ</p>
              <p className="text-3xl font-bold text-purple-900">฿{budgetRemaining.toLocaleString()}</p>
            </div>
            <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 p-6 rounded-xl border border-yellow-200">
              <p className="text-xs text-yellow-600 mb-1">⚠️ หมึกใกล้หมด</p>
              <p className="text-3xl font-bold text-yellow-900">{lowStockItems + criticalItems} รายการ</p>
            </div>
          </div>

          {/* Progress Bar งบประมาณ */}
          <div className="bg-gray-50 p-6 rounded-xl mb-6">
            <div className="flex justify-between items-center mb-3">
              <span className="text-lg font-bold text-gray-900">การใช้งบประมาณเดือนนี้</span>
              <span className="text-2xl font-bold text-gray-900">{budgetPercent.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-6">
              <div 
                className={`h-6 rounded-full transition-all duration-500 ${budgetPercent > 80 ? 'bg-red-500' : budgetPercent > 60 ? 'bg-yellow-500' : 'bg-gradient-to-r from-blue-500 to-purple-500'}`}
                style={{ width: `${budgetPercent}%` }}
              ></div>
            </div>
            <div className="flex justify-between mt-2 text-sm">
              <span className="text-gray-600">ใช้ไป: ฿{inkBudget?.total_spent.toLocaleString()}</span>
              <span className="text-gray-600">คงเหลือ: ฿{budgetRemaining.toLocaleString()}</span>
            </div>
          </div>

          {/* รายการหมึกทั้งหมด */}
          <h3 className="text-xl font-bold mb-4">📋 รายการหมึกพิมพ์ทั้งหมด ({inkInventory.length} รายการ)</h3>
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
                    <p className="text-gray-500">ระดับหมึก</p>
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
                    <p className="text-gray-500">ใช้ต่อเดือน</p>
                    <p className="font-bold text-lg text-gray-900">{ink.monthly_usage}%</p>
                  </div>
                  <div>
                    <p className="text-gray-500">เติมล่าสุด</p>
                    <p className="font-bold text-sm text-gray-900">{ink.last_refill}</p>
                  </div>
                </div>

                {/* Progress Bar ระดับหมึก */}
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
                    ></div>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>0%</span>
                    <span>ขั้นต่ำ: {ink.min_level}%</span>
                    <span>100%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-3 mt-6 pt-6 border-t">
            <button onClick={exportInkBudget} className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 text-white py-3 rounded-lg font-medium hover:shadow-lg flex items-center justify-center gap-2">
              📥 Export รายงาน
            </button>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-pulse">⏳</div>
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
                onClick={() => setShowCategoryModal(true)}
                className="hidden md:flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-500 to-blue-500 text-white hover:shadow-lg rounded-lg text-sm font-medium transition-shadow"
              >
                📂 จัดการประเภท
              </button>
              <button 
                onClick={() => setShowInkBudgetModal(true)}
                className="hidden md:flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:shadow-lg rounded-lg text-sm font-medium transition-shadow"
              >
                🖨️ สรุปงบหมึก
              </button>
              <button 
                onClick={() => setShowRepairHistoryModal(true)}
                className="hidden md:flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-500 to-red-500 text-white hover:shadow-lg rounded-lg text-sm font-medium transition-shadow"
              >
                🔧 ประวัติการซ่อม
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
                <div key={idx} className="bg-white rounded-xl p-5 border border-gray-200 hover:shadow-lg transition-shadow cursor-pointer">
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

            {/* Ink Budget Summary Widget */}
            {inkBudget && (
              <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                  💰 สรุปงบหมึกพิมพ์เดือนนี้
                </h2>
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="text-center bg-blue-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">ใช้ไปแล้ว</p>
                    <p className="text-3xl font-bold text-blue-600">฿{inkBudget.total_spent.toLocaleString()}</p>
                  </div>
                  <div className="text-center bg-green-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">งบทั้งหมด</p>
                    <p className="text-3xl font-bold text-green-600">฿{inkBudget.budget_limit.toLocaleString()}</p>
                  </div>
                  <div className="text-center bg-purple-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">คงเหลือ</p>
                    <p className="text-3xl font-bold text-purple-600">฿{(inkBudget.budget_limit - inkBudget.total_spent).toLocaleString()}</p>
                  </div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-4">
                  <div 
                    className="bg-gradient-to-r from-blue-500 to-purple-500 h-4 rounded-full transition-all"
                    style={{ width: `${(inkBudget.total_spent / inkBudget.budget_limit) * 100}%` }}
                  ></div>
                </div>
                <p className="text-center text-sm text-gray-600 mt-2">
                  ใช้ไป {((inkBudget.total_spent / inkBudget.budget_limit) * 100).toFixed(1)}%
                </p>
                <button 
                  onClick={() => setShowInkBudgetModal(true)}
                  className="w-full mt-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-lg font-medium hover:shadow-lg transition-shadow"
                >
                  📋 ดูรายละเอียดหมึกทั้งหมด
                </button>
              </div>
            )}

            {/* Category Distribution */}
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                📊 ทรัพย์สินแยกตามประเภท
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {categoryData.map((cat) => (
                  <div key={cat.id} className="bg-gray-50 p-4 rounded-lg text-center">
                    <span className="text-4xl block mb-2">{cat.icon}</span>
                    <p className="text-sm font-medium text-gray-700 mb-1">{cat.name}</p>
                    <p className="text-2xl font-bold text-gray-900">{cat.count}</p>
                    <p className="text-xs text-gray-500">{cat.percent}% ของทั้งหมด</p>
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
                  onClick={() => setShowAddAssetModal(true)}
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
                  {assetCategories.map(cat => (
                    <option key={cat.id} value={cat.name}>{cat.icon} {cat.name}</option>
                  ))}
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

            {/* Assets Grid with Images */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredAssets.map((asset: Asset) => (
                <div key={asset.id} className="bg-white rounded-xl overflow-hidden border border-gray-200 hover:shadow-xl transition-shadow cursor-pointer"
                     onClick={() => { setSelectedAsset(asset); setShowDetailModal(true); }}>
                  {asset.image_url ? (
                    <img src={asset.image_url} alt={asset.name} className="w-full h-48 object-cover" />
                  ) : (
                    <div className="w-full h-48 bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
                      <span className="text-6xl">{asset.icon}</span>
                    </div>
                  )}
                  <div className="p-4">
                    <h3 className="font-bold text-lg text-gray-900 mb-2">{asset.name}</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">รหัส:</span>
                        <code className="bg-gray-100 px-2 py-1 rounded text-blue-600">{asset.tag}</code>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">แผนก:</span>
                        <span className="font-medium">{asset.location}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">ราคา:</span>
                        <span className="font-bold text-green-600">฿{asset.price}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">สถานะ:</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          asset.status === 'ใช้งาน' ? 'bg-green-100 text-green-700' :
                          asset.status === 'ซ่อม' ? 'bg-orange-100 text-orange-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {asset.status}
                        </span>
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
      {showAddAssetModal && <AddAssetModal />}
      {showEditAssetModal && <EditAssetModal />}
      {showDetailModal && selectedAsset && <AssetDetailModal />}
      {showDepartmentModal && <DepartmentModal />}
      {showCategoryModal && <CategoryModal />}
      {showInkBudgetModal && <InkBudgetModal />}
      {showRepairHistoryModal && <RepairHistoryModal />}
      {showAddRepairModal && <AddRepairModal />}
    </div>
  );
};

export default App;
