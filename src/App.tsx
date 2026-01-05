import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import type { Asset, InkItem, Department, AssetCategory, InkBudgetSummary, RepairHistory, InkTransaction, BorrowRecord } from './supabaseClient';
import QRCode from 'react-qr-code';

// QR Code Component (Kept - Barcode Removed)
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
      link.download = `QR-${asset.asset_code || asset.tag}.png`;
      link.href = url;
      link.click();
    };

    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };

  const printQR = () => {
    const svg = document.querySelector(`#qr-container-${asset.id} svg`);
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const svgBase64 = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>QR Code - ${asset.asset_code || asset.tag}</title>
        <meta charset="UTF-8">
        <style>
          @media print {
            @page { margin: 0; size: A4; }
            body { margin: 1.5cm; }
          }
          body {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            margin: 0;
            font-family: 'Sarabun', Tahoma, Arial, sans-serif;
            background: white;
          }
          .container {
            text-align: center;
            padding: 20px;
            border: 3px solid #2563eb;
            border-radius: 15px;
            background: white;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            max-width: 400px;
          }
          .header {
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 15px;
            color: #1e40af;
            border-bottom: 2px solid #3b82f6;
            padding-bottom: 10px;
          }
          .asset-name {
            font-size: 28px;
            font-weight: bold;
            margin: 15px 0;
            color: #1f2937;
          }
          .qr-container {
            margin: 20px auto;
            padding: 15px;
            background: white;
            border: 2px solid #e5e7eb;
            border-radius: 10px;
            display: inline-block;
          }
          .info {
            font-size: 16px;
            margin: 8px 0;
            color: #374151;
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 8px 15px;
            background: #f3f4f6;
            border-radius: 8px;
          }
          .info-label {
            font-weight: bold;
            color: #4b5563;
          }
          .info-value {
            color: #1f2937;
          }
          .footer {
            margin-top: 20px;
            padding-top: 15px;
            border-top: 2px solid #e5e7eb;
            font-size: 14px;
            color: #6b7280;
          }
          .scan-text {
            font-size: 16px;
            color: #3b82f6;
            font-weight: 600;
            margin-top: 10px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">🏢 IT Asset Management</div>
          <div class="asset-name">${asset.name}</div>

          <div class="qr-container">
            <img src="${svgBase64}" width="200" height="200" alt="QR Code" />
          </div>

          <div class="info">
            <span class="info-label">รหัสทรัพย์สิน</span>
            <span class="info-value">${asset.asset_code || asset.tag}</span>
          </div>
          <div class="info">
            <span class="info-label">สถานที่</span>
            <span class="info-value">${asset.location}</span>
          </div>
          <div class="info">
            <span class="info-label">ประเภท</span>
            <span class="info-value">${asset.category}</span>
          </div>

          <div class="footer">
            <div class="scan-text">📱 สแกน QR Code เพื่อดูรายละเอียด</div>
            <div style="margin-top: 10px; font-size: 12px;">พิมพ์เมื่อ: ${new Date().toLocaleDateString('th-TH')}</div>
          </div>
        </div>
        <script>
          window.onload = () => {
            setTimeout(() => window.print(), 500);
          };
        </script>
      </body>
      </html>
    `);
  };

  return (
    <div className="flex flex-col items-center gap-4 p-6 bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl border-2 border-blue-200">
      <h4 className="font-bold text-lg text-gray-900">📱 QR Code</h4>

      <div id={`qr-container-${asset.id}`} className="bg-white p-4 rounded-xl shadow-lg">
        <QRCode
          value={qrValue}
          size={200}
          level="H"
          style={{ height: "auto", maxWidth: "100%", width: "100%" }}
        />
      </div>

      <p className="text-sm text-gray-600 font-semibold">{asset.asset_code || asset.tag}</p>
      <p className="text-xs text-gray-500 text-center">
        สแกน QR Code เพื่อดูข้อมูลทรัพย์สิน<br />
        พร้อมประวัติการซ่อมและข้อมูลการรับประกัน
      </p>

      <div className="flex gap-3 w-full">
        <button
          onClick={downloadQR}
          className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl font-semibold hover:shadow-xl hover:scale-105 transition-all flex items-center justify-center gap-2"
        >
          <span className="text-xl">💾</span> ดาวน์โหลด
        </button>
        <button
          onClick={printQR}
          className="flex-1 px-4 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl font-semibold hover:shadow-xl hover:scale-105 transition-all flex items-center justify-center gap-2"
        >
          <span className="text-xl">🖨️</span> พิมพ์
        </button>
      </div>
    </div>
  );
};

// Main App Component
const App = () => {
  const [currentPage, setCurrentPage] = useState<string>('dashboard');
  const [showAddAssetModal, setShowAddAssetModal] = useState<boolean>(false);
  const [showEditAssetModal, setShowEditAssetModal] = useState<boolean>(false);
  const [showDetailModal, setShowDetailModal] = useState<boolean>(false);
  const [showDepartmentModal, setShowDepartmentModal] = useState<boolean>(false);
  const [showCategoryModal, setShowCategoryModal] = useState<boolean>(false);
  const [showRepairHistoryModal, setShowRepairHistoryModal] = useState<boolean>(false);
  const [showAddRepairModal, setShowAddRepairModal] = useState<boolean>(false);
  const [showInkTransactionModal, setShowInkTransactionModal] = useState<boolean>(false);
  const [showAddTransactionModal, setShowAddTransactionModal] = useState<boolean>(false);
  const [showBorrowModal, setShowBorrowModal] = useState<boolean>(false);
  const [showReturnModal, setShowReturnModal] = useState<boolean>(false);
  const [showBorrowHistoryModal, setShowBorrowHistoryModal] = useState<boolean>(false);
  const [showUserMenu, setShowUserMenu] = useState<boolean>(false);

  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterCategory, setFilterCategory] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [uploading, setUploading] = useState<boolean>(false);

  const [assets, setAssets] = useState<Asset[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [assetCategories, setAssetCategories] = useState<AssetCategory[]>([]);
  const [repairHistory, setRepairHistory] = useState<RepairHistory[]>([]);
  const [inkTransactions, setInkTransactions] = useState<InkTransaction[]>([]);
  const [borrowRecords, setBorrowRecords] = useState<BorrowRecord[]>([]);

  // User Info (removed admin profile)
  const currentUser = {
    name: 'ผู้ใช้งาน',
    email: 'user@company.com',
    role: 'User',
    department: 'IT Department'
  };

  // Stats
  const stats = [
    {
      icon: '📦',
      label: 'ทรัพย์สินทั้งหมด',
      value: assets.length.toString(),
      color: 'from-blue-500 to-cyan-500',
      bgColor: 'bg-blue-50'
    },
    {
      icon: '🔄',
      label: 'กำลังยืม',
      value: borrowRecords.filter(b => !b.return_date).length.toString(),
      color: 'from-purple-500 to-pink-500',
      bgColor: 'bg-purple-50'
    },
    {
      icon: '⚠️',
      label: 'ใกล้หมดประกัน',
      value: assets.filter((a: Asset) => a.warranty_days <= 30).length.toString(),
      color: 'from-yellow-500 to-orange-500',
      bgColor: 'bg-yellow-50'
    },
    {
      icon: '🔧',
      label: 'กำลังซ่อม',
      value: assets.filter((a: Asset) => a.status === 'กำลังซ่อม').length.toString(),
      color: 'from-red-500 to-pink-500',
      bgColor: 'bg-red-50'
    },
    {
      icon: '🏢',
      label: 'จำนวนแผนก',
      value: departments.length.toString(),
      color: 'from-purple-500 to-violet-500',
      bgColor: 'bg-purple-50'
    },
    {
      icon: '📁',
      label: 'ประเภททรัพย์สิน',
      value: assetCategories.length.toString(),
      color: 'from-indigo-500 to-blue-500',
      bgColor: 'bg-indigo-50'
    }
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

      // Fetch Assets
      const { data: assetsData, error: assetsError } = await supabase
        .from('assets')
        .select('*')
        .order('created_at', { ascending: false });
      if (assetsError) throw assetsError;
      if (assetsData) setAssets(assetsData as Asset[]);

      // Fetch Departments
      const { data: deptsData, error: deptsError } = await supabase.from('departments').select('*');
      if (deptsError) throw deptsError;
      if (deptsData) setDepartments(deptsData as Department[]);

      // Fetch Asset Categories
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('asset_categories')
        .select('*')
        .order('name');
      if (categoriesError) throw categoriesError;
      if (categoriesData) setAssetCategories(categoriesData as AssetCategory[]);

      // Fetch Repair History
      const { data: repairData, error: repairError } = await supabase
        .from('repair_history')
        .select('*')
        .order('created_at', { ascending: false });
      if (repairError) throw repairError;
      if (repairData) setRepairHistory(repairData as RepairHistory[]);

      // Fetch Ink Transactions
      const { data: transactionsData, error: transactionsError } = await supabase
        .from('ink_transactions')
        .select('*')
        .order('transaction_date', { ascending: false });
      if (transactionsError) throw transactionsError;
      if (transactionsData) setInkTransactions(transactionsData as InkTransaction[]);

      // Fetch Borrow Records
      const { data: borrowData, error: borrowError } = await supabase
        .from('borrow_records')
        .select('*')
        .order('borrow_date', { ascending: false });
      if (borrowError) throw borrowError;
      if (borrowData) setBorrowRecords(borrowData as BorrowRecord[]);

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
      .on('postgres_changes', { event: '*', schema: 'public', table: 'assets' }, fetchAllData)
      .subscribe();

    const borrowChannel = supabase
      .channel('borrow-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'borrow_records' }, fetchAllData)
      .subscribe();

    return () => {
      supabase.removeChannel(assetsChannel);
      supabase.removeChannel(borrowChannel);
    };
  };

  const uploadImage = async (file: File): Promise<string | null> => {
    try {
      setUploading(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = fileName;

      const { error } = await supabase.storage.from('assets-images').upload(filePath, file);
      if (error) throw error;

      const { data: publicUrlData } = supabase.storage.from('assets-images').getPublicUrl(filePath);
      return publicUrlData.publicUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('เกิดข้อผิดพลาดในการอัพโหลดรูปภาพ');
      return null;
    } finally {
      setUploading(false);
    }
  };

  // Asset CRUD Operations
  const addAsset = async (assetData: Partial<Asset>): Promise<void> => {
    try {
      const { error } = await supabase.from('assets').insert(assetData);
      if (error) throw error;
      alert('เพิ่มทรัพย์สินสำเร็จ!');
      setShowAddAssetModal(false);
      fetchAllData();
    } catch (error) {
      console.error('Error adding asset:', error);
      alert('เกิดข้อผิดพลาดในการเพิ่มทรัพย์สิน');
    }
  };

  const updateAsset = async (id: number, assetData: Partial<Asset>): Promise<void> => {
    try {
      const { error } = await supabase.from('assets').update(assetData).eq('id', id);
      if (error) throw error;
      alert('อัพเดตทรัพย์สินสำเร็จ!');
      setShowEditAssetModal(false);
      setShowDetailModal(false);
      fetchAllData();
    } catch (error) {
      console.error('Error updating asset:', error);
      alert('เกิดข้อผิดพลาดในการอัพเดตทรัพย์สิน');
    }
  };

  const deleteAsset = async (id: number): Promise<void> => {
    if (!confirm('คุณแน่ใจหรือไม่ที่จะลบทรัพย์สินนี้?')) return;
    try {
      const { error } = await supabase.from('assets').delete().eq('id', id);
      if (error) throw error;
      alert('ลบทรัพย์สินสำเร็จ!');
      setShowDetailModal(false);
      fetchAllData();
    } catch (error) {
      console.error('Error deleting asset:', error);
      alert('เกิดข้อผิดพลาดในการลบทรัพย์สิน');
    }
  };

  // Borrow Operations
  const borrowAsset = async (borrowData: Partial<BorrowRecord>): Promise<void> => {
    try {
      const { error } = await supabase.from('borrow_records').insert(borrowData);
      if (error) throw error;

      // Update asset status
      await supabase.from('assets').update({ status: 'กำลังยืม' }).eq('id', borrowData.asset_id);

      alert('บันทึกการยืมสำเร็จ!');
      setShowBorrowModal(false);
      fetchAllData();
    } catch (error) {
      console.error('Error borrowing asset:', error);
      alert('เกิดข้อผิดพลาดในการยืมทรัพย์สิน');
    }
  };

  const returnAsset = async (recordId: number, assetId: number): Promise<void> => {
    try {
      const returnDate = new Date().toISOString().split('T')[0];

      const { error } = await supabase
        .from('borrow_records')
        .update({ return_date: returnDate })
        .eq('id', recordId);
      if (error) throw error;

      // Update asset status back to available
      await supabase.from('assets').update({ status: 'ใช้งานได้' }).eq('id', assetId);

      alert('คืนทรัพย์สินสำเร็จ!');
      fetchAllData();
    } catch (error) {
      console.error('Error returning asset:', error);
      alert('เกิดข้อผิดพลาดในการคืนทรัพย์สิน');
    }
  };

  // Department Operations
  const addDepartment = async (name: string): Promise<void> => {
    try {
      const { error } = await supabase.from('departments').insert({ name });
      if (error) throw error;
      alert(`เพิ่มแผนก "${name}" สำเร็จ!`);
      fetchAllData();
    } catch (error) {
      console.error('Error adding department:', error);
      alert('เกิดข้อผิดพลาดในการเพิ่มแผนก');
    }
  };

  const deleteDepartment = async (id: number, name: string): Promise<void> => {
    if (!confirm(`คุณแน่ใจหรือไม่ที่จะลบแผนก "${name}"?`)) return;
    try {
      const { error } = await supabase.from('departments').delete().eq('id', id);
      if (error) throw error;
      alert('ลบแผนกสำเร็จ!');
      fetchAllData();
    } catch (error) {
      console.error('Error deleting department:', error);
      alert('เกิดข้อผิดพลาดในการลบแผนก');
    }
  };

  // Category Operations
  const addCategory = async (name: string, icon: string): Promise<void> => {
    try {
      const { error } = await supabase.from('asset_categories').insert({ name, icon });
      if (error) throw error;
      alert(`เพิ่มประเภท "${name}" สำเร็จ!`);
      fetchAllData();
    } catch (error) {
      console.error('Error adding category:', error);
      alert('เกิดข้อผิดพลาดในการเพิ่มประเภท');
    }
  };

  const deleteCategory = async (id: number, name: string): Promise<void> => {
    if (!confirm(`คุณแน่ใจหรือไม่ที่จะลบประเภท "${name}"?`)) return;
    try {
      const { error } = await supabase.from('asset_categories').delete().eq('id', id);
      if (error) throw error;
      alert('ลบประเภทสำเร็จ!');
      fetchAllData();
    } catch (error) {
      console.error('Error deleting category:', error);
      alert('เกิดข้อผิดพลาดในการลบประเภท');
    }
  };

  // Repair Operations
  const addRepairHistory = async (repairData: Partial<RepairHistory>): Promise<void> => {
    try {
      const { error } = await supabase.from('repair_history').insert(repairData);
      if (error) throw error;
      alert('บันทึกการซ่อมสำเร็จ!');
      setShowAddRepairModal(false);
      fetchAllData();
    } catch (error) {
      console.error('Error adding repair history:', error);
      alert('เกิดข้อผิดพลาดในการบันทึกการซ่อม');
    }
  };

  // Transaction Operations
  const addTransaction = async (transactionData: Partial<InkTransaction>): Promise<void> => {
    try {
      const { error } = await supabase.from('ink_transactions').insert(transactionData);
      if (error) throw error;
      alert('บันทึกรายการสำเร็จ!');
      setShowAddTransactionModal(false);
      fetchAllData();
    } catch (error) {
      console.error('Error adding transaction:', error);
      alert('เกิดข้อผิดพลาดในการบันทึกรายการ');
    }
  };

  const filteredAssets = assets.filter((asset: Asset) => {
    const matchSearch =
      asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.tag.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (asset.asset_code && asset.asset_code.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchCategory = !filterCategory || asset.category === filterCategory;
    const matchStatus = !filterStatus || asset.status === filterStatus;
    return matchSearch && matchCategory && matchStatus;
  });

  const exportToExcel = (): void => {
    const csvContent = [
      ['รหัสทรัพย์สิน', 'Tag', 'ชื่อ', 'Serial', 'ประเภท', 'สถานที่', 'สถานะ', 'วันที่ซื้อ', 'ราคา'],
      ...assets.map((a: Asset) => [
        a.asset_code || '',
        a.tag,
        a.name,
        a.serial,
        a.category,
        a.location,
        a.status,
        a.purchase_date,
        a.price
      ])
    ]
      .map(row => row.join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `assets-export-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  // Modal Components
  const AddAssetModal = () => {
    const [formData, setFormData] = useState({
      name: '',
      tag: '',
      asset_code: '',
      serial: '',
      category: assetCategories[0]?.name || '',
      location: departments[0]?.name || '',
      price: '',
      purchase_date: '',
      warranty_expiry: '',
      icon: assetCategories[0]?.icon || '',
      status: 'ใช้งานได้',
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
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
        <div className="bg-white rounded-3xl p-8 max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl animate-slideUp">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                เพิ่มทรัพย์สินใหม่
              </h2>
              <p className="text-gray-500 text-sm mt-1">กรอกข้อมูลทรัพย์สินที่ต้องการเพิ่ม</p>
            </div>
            <button
              onClick={() => setShowAddAssetModal(false)}
              className="text-gray-400 hover:text-gray-600 text-3xl transition-colors hover:rotate-90 duration-300"
            >
              ×
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-2 gap-5">
              {/* Image Upload */}
              <div className="col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">รูปภาพทรัพย์สิน</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all hover:border-blue-300"
                />
                {imagePreview && (
                  <img src={imagePreview} alt="Preview" className="mt-3 h-40 w-full object-cover rounded-xl shadow-lg" />
                )}
                {uploading && <p className="text-blue-600 mt-2 animate-pulse">กำลังอัพโหลด...</p>}
              </div>

              {/* Asset Code - NEW FIELD */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">รหัสทรัพย์สิน</label>
                <input
                  type="text"
                  required
                  value={formData.asset_code}
                  onChange={(e) => setFormData({ ...formData, asset_code: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  placeholder="เช่น AST-001"
                />
              </div>

              {/* Asset Tag */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Tag</label>
                <input
                  type="text"
                  required
                  value={formData.tag}
                  onChange={(e) => setFormData({ ...formData, tag: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                />
              </div>

              {/* Name */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">ชื่อทรัพย์สิน</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                />
              </div>

              {/* Serial */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Serial Number</label>
                <input
                  type="text"
                  required
                  value={formData.serial}
                  onChange={(e) => setFormData({ ...formData, serial: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">ประเภท</label>
                <select
                  value={formData.category}
                  onChange={(e) => {
                    const cat = assetCategories.find(c => c.name === e.target.value);
                    setFormData({ ...formData, category: e.target.value, icon: cat?.icon || '' });
                  }}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                >
                  {assetCategories.map(cat => (
                    <option key={cat.id} value={cat.name}>
                      {cat.icon} {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Location */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">สถานที่</label>
                <select
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                >
                  {departments.map(dept => (
                    <option key={dept.id}>{dept.name}</option>
                  ))}
                </select>
              </div>

              {/* Price */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">ราคา (บาท)</label>
                <input
                  type="text"
                  required
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                />
              </div>

              {/* Purchase Date */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">วันที่ซื้อ</label>
                <input
                  type="date"
                  required
                  value={formData.purchase_date}
                  onChange={(e) => setFormData({ ...formData, purchase_date: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                />
              </div>

              {/* Warranty Expiry */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">วันหมดประกัน</label>
                <input
                  type="date"
                  required
                  value={formData.warranty_expiry}
                  onChange={(e) => setFormData({ ...formData, warranty_expiry: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                />
              </div>
            </div>

            <div className="flex gap-4 pt-6">
              <button
                type="submit"
                disabled={uploading}
                className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 rounded-xl font-semibold hover:shadow-2xl hover:scale-105 transition-all disabled:opacity-50 disabled:hover:scale-100"
              >
                {uploading ? '⏳ กำลังอัพโหลด...' : '✅ เพิ่มทรัพย์สิน'}
              </button>
              <button
                type="button"
                onClick={() => setShowAddAssetModal(false)}
                className="flex-1 bg-gray-100 text-gray-700 py-4 rounded-xl font-semibold hover:bg-gray-200 transition-all"
              >
                ❌ ยกเลิก
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  // Borrow Modal Component
  const BorrowModal = () => {
    const [formData, setFormData] = useState({
      asset_id: selectedAsset?.id || 0,
      asset_code: selectedAsset?.asset_code || '',
      asset_name: selectedAsset?.name || '',
      borrower_name: '',
      borrower_contact: '',
      purpose: '',
      borrow_date: new Date().toISOString().split('T')[0],
      expected_return_date: '',
      notes: ''
    });

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      borrowAsset(formData);
    };

    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
        <div className="bg-white rounded-3xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl animate-slideUp">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                บันทึกการยืมทรัพย์สิน
              </h2>
              <p className="text-gray-500 text-sm mt-1">กรอกข้อมูลผู้ยืมและรายละเอียด</p>
            </div>
            <button
              onClick={() => setShowBorrowModal(false)}
              className="text-gray-400 hover:text-gray-600 text-3xl transition-colors hover:rotate-90 duration-300"
            >
              ×
            </button>
          </div>

          {/* Asset Info */}
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-5 rounded-xl border border-purple-100 mb-6">
            <p className="text-sm text-gray-600 mb-1">ทรัพย์สินที่ยืม</p>
            <p className="font-bold text-xl text-gray-900">
              {selectedAsset?.name} ({selectedAsset?.asset_code})
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Borrower Name */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">ชื่อผู้ยืม *</label>
              <input
                type="text"
                required
                value={formData.borrower_name}
                onChange={(e) => setFormData({ ...formData, borrower_name: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                placeholder="เช่น นาย สมชาย ใจดี"
              />
            </div>

            {/* Contact */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">เบอร์ติดต่อ</label>
              <input
                type="text"
                value={formData.borrower_contact}
                onChange={(e) => setFormData({ ...formData, borrower_contact: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                placeholder="เช่น 081-234-5678"
              />
            </div>

            {/* Purpose */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">วัตถุประสงค์ *</label>
              <textarea
                required
                rows={3}
                value={formData.purpose}
                onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                placeholder="เช่น ใช้งานในโครงการ..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Borrow Date */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">วันที่ยืม</label>
                <input
                  type="date"
                  required
                  value={formData.borrow_date}
                  onChange={(e) => setFormData({ ...formData, borrow_date: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                />
              </div>

              {/* Expected Return Date */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">วันที่คาดว่าจะคืน</label>
                <input
                  type="date"
                  value={formData.expected_return_date}
                  onChange={(e) => setFormData({ ...formData, expected_return_date: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                />
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">หมายเหตุ</label>
              <textarea
                rows={2}
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
              />
            </div>

            <div className="flex gap-4 pt-6">
              <button
                type="submit"
                className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white py-4 rounded-xl font-semibold hover:shadow-2xl hover:scale-105 transition-all"
              >
                ✅ บันทึกการยืม
              </button>
              <button
                type="button"
                onClick={() => setShowBorrowModal(false)}
                className="flex-1 bg-gray-100 text-gray-700 py-4 rounded-xl font-semibold hover:bg-gray-200 transition-all"
              >
                ❌ ยกเลิก
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  // Borrow History Modal
  const BorrowHistoryModal = () => {
    const activeBorrows = borrowRecords.filter(b => !b.return_date);
    const returnedBorrows = borrowRecords.filter(b => b.return_date);

    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
        <div className="bg-white rounded-3xl p-8 max-w-6xl w-full max-h-[90vh] overflow-y-auto shadow-2xl animate-slideUp">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                📋 ประวัติการยืมทรัพย์สิน
              </h2>
              <p className="text-gray-500 text-sm mt-1">รวม {borrowRecords.length} รายการ</p>
            </div>
            <button
              onClick={() => setShowBorrowHistoryModal(false)}
              className="text-gray-400 hover:text-gray-600 text-3xl transition-colors hover:rotate-90 duration-300"
            >
              ×
            </button>
          </div>

          {/* Active Borrows */}
          {activeBorrows.length > 0 && (
            <div className="mb-8">
              <h3 className="text-xl font-bold text-purple-600 mb-4">🔄 กำลังยืม ({activeBorrows.length})</h3>
              <div className="space-y-4">
                {activeBorrows.map(borrow => (
                  <div key={borrow.id} className="bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-200 rounded-2xl p-6 hover:shadow-2xl transition-all">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h4 className="font-bold text-xl text-gray-900">{borrow.asset_name}</h4>
                        <p className="text-sm text-gray-600">รหัส: {borrow.asset_code}</p>
                      </div>
                      <button
                        onClick={() => returnAsset(borrow.id, borrow.asset_id)}
                        className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl font-semibold hover:shadow-xl hover:scale-105 transition-all"
                      >
                        ✅ คืนแล้ว
                      </button>
                    </div>

                    <div className="bg-white p-4 rounded-xl mb-3 border border-purple-100">
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <p className="text-gray-500">ผู้ยืม</p>
                          <p className="font-bold text-gray-900">{borrow.borrower_name}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">เบอร์ติดต่อ</p>
                          <p className="font-bold text-gray-900">{borrow.borrower_contact || '-'}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">วันที่ยืม</p>
                          <p className="font-bold text-gray-900">{borrow.borrow_date}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">กำหนดคืน</p>
                          <p className="font-bold text-gray-900">{borrow.expected_return_date || '-'}</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-yellow-50 p-3 rounded-xl border border-yellow-200">
                      <p className="text-sm text-gray-600"><strong>วัตถุประสงค์:</strong> {borrow.purpose}</p>
                      {borrow.notes && (
                        <p className="text-sm text-gray-600 mt-1"><strong>หมายเหตุ:</strong> {borrow.notes}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Returned Borrows */}
          {returnedBorrows.length > 0 && (
            <div>
              <h3 className="text-xl font-bold text-gray-600 mb-4">✅ คืนแล้ว ({returnedBorrows.length})</h3>
              <div className="space-y-4">
                {returnedBorrows.map(borrow => (
                  <div key={borrow.id} className="bg-gray-50 border border-gray-200 rounded-2xl p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h4 className="font-bold text-lg text-gray-900">{borrow.asset_name}</h4>
                        <p className="text-sm text-gray-600">รหัส: {borrow.asset_code}</p>
                      </div>
                      <span className="px-4 py-2 bg-green-100 text-green-700 rounded-full text-sm font-bold">
                        คืนแล้ว
                      </span>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                      <div>
                        <p className="text-gray-500">ผู้ยืม</p>
                        <p className="font-bold text-gray-900">{borrow.borrower_name}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">วันที่ยืม</p>
                        <p className="font-bold text-gray-900">{borrow.borrow_date}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">วันที่คืน</p>
                        <p className="font-bold text-green-600">{borrow.return_date}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">วัตถุประสงค์</p>
                        <p className="font-bold text-gray-900">{borrow.purpose}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {borrowRecords.length === 0 && (
            <div className="text-center py-20">
              <span className="text-8xl mb-6 block animate-bounce">📋</span>
              <p className="text-2xl font-bold text-gray-700 mb-2">ยังไม่มีประวัติการยืม</p>
              <p className="text-gray-500">เริ่มต้นบันทึกการยืมทรัพย์สินของคุณ</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Asset Detail Modal (WITH QR Code, NO Barcode)
  const AssetDetailModal = () => {
    const assetRepairs = repairHistory.filter(r => r.asset_id === selectedAsset?.id);
    const assetBorrows = borrowRecords.filter(b => b.asset_id === selectedAsset?.id && !b.return_date);

    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
        <div className="bg-white rounded-3xl p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl animate-slideUp">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              รายละเอียดทรัพย์สิน
            </h2>
            <button
              onClick={() => setShowDetailModal(false)}
              className="text-gray-400 hover:text-gray-600 text-3xl transition-colors hover:rotate-90 duration-300"
            >
              ×
            </button>
          </div>

          {selectedAsset && (
            <div className="space-y-6">
              {/* Image */}
              {selectedAsset.image_url && (
                <img
                  src={selectedAsset.image_url}
                  alt={selectedAsset.name}
                  className="w-full h-72 object-cover rounded-2xl shadow-xl"
                />
              )}

              {/* QR Code Component - KEPT */}
              <AssetQRCode asset={selectedAsset} />

              {/* Asset Info */}
              <div className="bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-8 rounded-2xl border-2 border-blue-100">
                <div className="flex items-center gap-5 mb-5">
                  <span className="text-6xl">{selectedAsset.icon}</span>
                  <div>
                    <h3 className="text-3xl font-bold text-gray-900">{selectedAsset.name}</h3>
                    <p className="text-gray-600 text-lg">รหัส: {selectedAsset.asset_code || selectedAsset.tag}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {[
                    { label: 'รหัสทรัพย์สิน', value: selectedAsset.asset_code },
                    { label: 'Tag', value: selectedAsset.tag },
                    { label: 'Serial Number', value: selectedAsset.serial },
                    { label: 'ประเภท', value: selectedAsset.category },
                    { label: 'สถานที่', value: selectedAsset.location },
                    { label: 'สถานะ', value: selectedAsset.status },
                    { label: 'วันที่ซื้อ', value: selectedAsset.purchase_date },
                    { label: 'วันหมดประกัน', value: selectedAsset.warranty_expiry },
                    { label: 'ราคา', value: selectedAsset.price, color: 'text-green-600' },
                    {
                      label: 'ประกันคงเหลือ',
                      value: `${selectedAsset.warranty_days} วัน`,
                      color: selectedAsset.warranty_days <= 30 ? 'text-yellow-600' : 'text-green-600'
                    }
                  ].map((item, idx) => (
                    <div
                      key={idx}
                      className="bg-gradient-to-br from-gray-50 to-gray-100 p-5 rounded-xl border border-gray-200 hover:shadow-lg transition-all"
                    >
                      <p className="text-sm text-gray-600 mb-2 font-medium">{item.label}</p>
                      <p className={`font-bold text-lg ${item.color || 'text-gray-900'}`}>{item.value}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Current Borrower */}
              {assetBorrows.length > 0 && (
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-6 rounded-2xl border border-purple-200">
                  <h4 className="font-bold text-xl mb-4 flex items-center gap-2">
                    🔄 กำลังยืม
                  </h4>
                  {assetBorrows.map(borrow => (
                    <div key={borrow.id} className="bg-white p-4 rounded-xl">
                      <p><strong>ผู้ยืม:</strong> {borrow.borrower_name}</p>
                      <p><strong>วันที่ยืม:</strong> {borrow.borrow_date}</p>
                      <p><strong>วัตถุประสงค์:</strong> {borrow.purpose}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Repair History */}
              {assetRepairs.length > 0 && (
                <div className="bg-gradient-to-br from-orange-50 to-red-50 p-6 rounded-2xl border border-orange-200">
                  <h4 className="font-bold text-xl mb-4 flex items-center gap-2">
                    🔧 ประวัติการซ่อม ({assetRepairs.length})
                  </h4>
                  <div className="space-y-3">
                    {assetRepairs.map(repair => (
                      <div
                        key={repair.id}
                        className="bg-white p-4 rounded-xl border border-orange-100 hover:shadow-lg transition-all"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <p className="font-semibold text-gray-900">{repair.issue_description}</p>
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-bold ${
                              repair.repair_status === 'เสร็จสิ้น'
                                ? 'bg-green-100 text-green-700'
                                : repair.repair_status === 'กำลังดำเนินการ'
                                ? 'bg-yellow-100 text-yellow-700'
                                : 'bg-gray-100 text-gray-700'
                            }`}
                          >
                            {repair.repair_status}
                          </span>
                        </div>
                        <div className="text-sm text-gray-600 space-y-1">
                          <p>💰 ค่าใช้จ่าย: ฿{repair.repair_cost.toLocaleString()}</p>
                          <p>👨‍🔧 ช่าง: {repair.technician || '-'}</p>
                          <p>
                            📅 วันที่: {repair.start_date} {repair.end_date ? `→ ${repair.end_date}` : ''}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="grid grid-cols-4 gap-4">
                <button
                  onClick={() => {
                    setShowDetailModal(false);
                    setShowEditAssetModal(true);
                  }}
                  className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white py-4 rounded-xl font-semibold hover:shadow-2xl hover:scale-105 transition-all flex items-center justify-center gap-2"
                >
                  ✏️ แก้ไข
                </button>
                <button
                  onClick={() => {
                    setShowDetailModal(false);
                    setShowBorrowModal(true);
                  }}
                  className="bg-gradient-to-r from-purple-500 to-pink-500 text-white py-4 rounded-xl font-semibold hover:shadow-2xl hover:scale-105 transition-all flex items-center justify-center gap-2"
                >
                  🔄 ยืม
                </button>
                <button
                  onClick={() => {
                    setShowDetailModal(false);
                    setShowAddRepairModal(true);
                  }}
                  className="bg-gradient-to-r from-orange-500 to-red-500 text-white py-4 rounded-xl font-semibold hover:shadow-2xl hover:scale-105 transition-all flex items-center justify-center gap-2"
                >
                  🔧 ซ่อม
                </button>
                <button
                  onClick={() => deleteAsset(selectedAsset.id)}
                  className="bg-gradient-to-r from-red-600 to-pink-600 text-white py-4 rounded-xl font-semibold hover:shadow-2xl hover:scale-105 transition-all flex items-center justify-center gap-2"
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

  // Loading Screen
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin text-8xl mb-6">⚙️</div>
          <p className="text-2xl font-bold text-gray-700">กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    );
  }

  // Main Render
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      {/* Header */}
      <header className="bg-white shadow-lg border-b-4 border-blue-500">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="text-5xl">🏢</span>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                IT Asset Management System 2026
              </h1>
              <p className="text-sm text-gray-500">{currentUser.name} • {currentUser.department}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-lg">👤 {currentUser.name}</span>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white shadow-md border-b-2 border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex space-x-2 overflow-x-auto py-3">
            {[
              { id: 'dashboard', icon: '📊', label: 'Dashboard' },
              { id: 'assets', icon: '📦', label: 'ทรัพย์สิน' },
              { id: 'borrow', icon: '🔄', label: 'การยืม' },
              { id: 'ink', icon: '🖨️', label: 'งบประมาณหมึก' },
              { id: 'repair', icon: '🔧', label: 'ประวัติการซ่อม' },
              { id: 'config', icon: '⚙️', label: 'ตั้งค่า' }
            ].map(nav => (
              <button
                key={nav.id}
                onClick={() => setCurrentPage(nav.id)}
                className={`px-6 py-3 rounded-xl font-semibold transition-all whitespace-nowrap ${
                  currentPage === nav.id
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-xl scale-105'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:scale-105'
                }`}
              >
                {nav.icon} {nav.label}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Dashboard Page */}
        {currentPage === 'dashboard' && (
          <div className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {stats.map((stat, idx) => (
                <div
                  key={idx}
                  className={`${stat.bgColor} p-6 rounded-2xl border-2 border-${stat.color.split('-')[1]}-200 hover:shadow-2xl transition-all hover:scale-105`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-600 font-medium mb-1">{stat.label}</p>
                      <p className={`text-4xl font-bold bg-gradient-to-r ${stat.color} bg-clip-text text-transparent`}>
                        {stat.value}
                      </p>
                    </div>
                    <span className="text-6xl">{stat.icon}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Category Distribution */}
            <div className="bg-white p-6 rounded-2xl shadow-xl border-2 border-blue-100">
              <h3 className="text-2xl font-bold mb-6 text-gray-800">📊 การกระจายทรัพย์สินตามประเภท</h3>
              <div className="space-y-4">
                {categoryData.map(cat => (
                  <div key={cat.id} className="flex items-center gap-4">
                    <span className="text-3xl">{cat.icon}</span>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold text-gray-800">{cat.name}</span>
                        <span className="text-sm font-bold text-gray-600">
                          {cat.count} ({cat.percent}%)
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div
                          className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full transition-all"
                          style={{ width: `${cat.percent}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Assets Page */}
        {currentPage === 'assets' && (
          <div className="space-y-6">
            {/* Search and Filters */}
            <div className="bg-white p-6 rounded-2xl shadow-xl border-2 border-blue-100">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <input
                  type="text"
                  placeholder="🔍 ค้นหา รหัส, ชื่อ, Tag..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                />
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                >
                  <option value="">ทุกประเภท</option>
                  {assetCategories.map(cat => (
                    <option key={cat.id} value={cat.name}>
                      {cat.icon} {cat.name}
                    </option>
                  ))}
                </select>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                >
                  <option value="">ทุกสถานะ</option>
                  <option value="ใช้งานได้">ใช้งานได้</option>
                  <option value="กำลังซ่อม">กำลังซ่อม</option>
                  <option value="กำลังยืม">กำลังยืม</option>
                  <option value="ชำรุด">ชำรุด</option>
                </select>
                <button
                  onClick={() => setShowAddAssetModal(true)}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-xl font-semibold hover:shadow-2xl hover:scale-105 transition-all"
                >
                  ➕ เพิ่มทรัพย์สิน
                </button>
              </div>
            </div>

            {/* Assets Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredAssets.map(asset => (
                <div
                  key={asset.id}
                  onClick={() => {
                    setSelectedAsset(asset);
                    setShowDetailModal(true);
                  }}
                  className="bg-white rounded-2xl shadow-lg border-2 border-gray-100 hover:shadow-2xl hover:scale-105 transition-all cursor-pointer overflow-hidden"
                >
                  {asset.image_url && (
                    <img src={asset.image_url} alt={asset.name} className="w-full h-48 object-cover" />
                  )}
                  <div className="p-6">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-4xl">{asset.icon}</span>
                      <div>
                        <h3 className="font-bold text-lg text-gray-900">{asset.name}</h3>
                        <p className="text-sm text-gray-600">{asset.asset_code || asset.tag}</p>
                      </div>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">ประเภท:</span>
                        <span className="font-semibold">{asset.category}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">สถานที่:</span>
                        <span className="font-semibold">{asset.location}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">สถานะ:</span>
                        <span
                          className={`font-semibold ${
                            asset.status === 'ใช้งานได้'
                              ? 'text-green-600'
                              : asset.status === 'กำลังซ่อม'
                              ? 'text-red-600'
                              : 'text-yellow-600'
                          }`}
                        >
                          {asset.status}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {filteredAssets.length === 0 && (
              <div className="text-center py-20 bg-white rounded-2xl">
                <span className="text-8xl mb-6 block">📦</span>
                <p className="text-2xl font-bold text-gray-700">ไม่พบทรัพย์สิน</p>
              </div>
            )}
          </div>
        )}

        {/* Borrow Page */}
        {currentPage === 'borrow' && (
          <div className="space-y-6">
            <div className="flex gap-4">
              <button
                onClick={() => setShowBorrowHistoryModal(true)}
                className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white py-4 rounded-xl font-semibold hover:shadow-2xl hover:scale-105 transition-all"
              >
                📋 ประวัติการยืม
              </button>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-xl">
              <h3 className="text-2xl font-bold mb-6">🔄 กำลังยืม ({borrowRecords.filter(b => !b.return_date).length})</h3>
              <div className="space-y-4">
                {borrowRecords
                  .filter(b => !b.return_date)
                  .map(borrow => (
                    <div
                      key={borrow.id}
                      className="bg-gradient-to-r from-purple-50 to-pink-50 p-6 rounded-xl border-2 border-purple-200"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-bold text-xl">{borrow.asset_name}</h4>
                          <p className="text-sm text-gray-600">รหัส: {borrow.asset_code}</p>
                          <p className="text-sm text-gray-600">ผู้ยืม: {borrow.borrower_name}</p>
                          <p className="text-sm text-gray-600">วันที่ยืม: {borrow.borrow_date}</p>
                        </div>
                        <button
                          onClick={() => returnAsset(borrow.id, borrow.asset_id)}
                          className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl font-semibold hover:shadow-xl hover:scale-105 transition-all"
                        >
                          ✅ คืน
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Modals */}
      {showAddAssetModal && <AddAssetModal />}
      {showDetailModal && <AssetDetailModal />}
      {showBorrowModal && <BorrowModal />}
      {showBorrowHistoryModal && <BorrowHistoryModal />}
    </div>
  );
};

export default App;
