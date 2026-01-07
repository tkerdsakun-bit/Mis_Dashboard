@ -1,142 +1,142 @@
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from './supabaseClient';
import type { Asset, RepairHistory } from './supabaseClient';

const AssetDetail = () => {
  const { assetId } = useParams<{ assetId: string }>();
  const navigate = useNavigate();
  const [asset, setAsset] = useState<Asset | null>(null);
  const [repairs, setRepairs] = useState<RepairHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetchAssetData();
  }, [assetId]);

  const fetchAssetData = async () => {
    try {
      setLoading(true);
      setError(false);

      // Fetch asset
      const { data: assetData, error: assetError } = await supabase
        .from('assets')
        .select('*')
        .eq('id', assetId)
        .single();

      if (assetError) {
        console.error('Asset fetch error:', assetError);
        setError(true);
        setLoading(false);
        return;
      }

      setAsset(assetData as Asset);

      // Fetch repair history
      // Fetch repair history - ✅ แก้ชื่อ table ให้ถูกต้อง
      const { data: repairData, error: repairError } = await supabase
        .from('repairhistory')
        .from('repair_history')  // ✅ เปลี่ยนจาก 'repairhistory'
        .select('*')
        .eq('assetid', assetId)
        .order('createdat', { ascending: false });
        .eq('asset_id', assetId)  // ✅ เปลี่ยนจาก 'assetid'
        .order('created_at', { ascending: false });  // ✅ เปลี่ยนจาก 'createdat'

      if (repairError) {
        console.error('Repair history fetch error:', repairError);
        // ไม่ต้อง return เพราะ asset data ได้แล้ว
      } else {
        setRepairs(repairData as RepairHistory[]);
      }
    } catch (error) {
      console.error('Error fetching asset:', error);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-8xl mb-6 animate-bounce">📦</div>
          <p className="text-2xl font-bold text-gray-700">กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    );
  }

  if (error || !asset) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-8xl mb-6">❌</div>
          <p className="text-2xl font-bold text-gray-700 mb-4">ไม่พบข้อมูลทรัพย์สิน</p>
          <p className="text-gray-500 mb-6">รหัสทรัพย์สินไม่ถูกต้องหรือถูกลบไปแล้ว</p>
          <button
            onClick={() => navigate('/')}
            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-3 rounded-xl font-semibold hover:shadow-2xl hover:scale-105 transition-all"
          >
            กลับหน้าหลัก
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-6">
      {/* Header */}
      <div className="max-w-5xl mx-auto mb-6">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold mb-4 text-lg"
        >
          <span className="text-2xl">←</span>
          กลับหน้าหลัก
        </button>
      </div>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto bg-white rounded-3xl shadow-2xl p-8">
        <div className="flex items-center gap-4 mb-8">
          <div className="bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 p-4 rounded-2xl shadow-xl">
            <span className="text-5xl">{asset.icon}</span>
          </div>
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              {asset.name}
            </h1>
            <p className="text-gray-600 text-lg mt-1">Asset Tag: {asset.tag}</p>
          </div>
        </div>

        {/* Asset Image */}
        {asset.image_url && (
          <img
            src={asset.image_url}
            alt={asset.name}
            className="w-full h-80 object-cover rounded-2xl shadow-xl mb-8"
          />
        )}

        {/* Asset Information Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {[
            { label: '🔖 Serial Number', value: asset.serial },
            { label: '📦 ประเภท', value: asset.category },
            { label: '🏢 แผนก', value: asset.location },
            { label: '📊 สถานะ', value: asset.status, 
              color: asset.status === 'ปกติ' ? 'text-green-600' : 
                     asset.status === 'ซ่อม' ? 'text-orange-600' : 'text-red-600' },
              color: asset.status === 'ใช้งาน' ? 'text-green-600' : 
                     asset.status === 'ซ่อม' ? 'text-orange-600' : 'text-gray-600' },
            { label: '📅 วันที่ซื้อ', value: asset.purchase_date },
            { label: '🛡️ การรับประกันหมดอายุ', value: asset.warranty_expiry, 
              color: asset.warranty_days < 30 ? 'text-red-600' : 'text-green-600' },
            { label: '💰 ราคา', value: `฿${asset.price}`, color: 'text-green-600' },
            { label: '⏰ วันรับประกันคงเหลือ', value: `${asset.warranty_days} วัน`,
              color: asset.warranty_days < 30 ? 'text-red-600' : 'text-green-600' }
              color: asset.warranty_days < 30 ? 'text-red-600' : 'text-green-600' },
            { label: '👤 ผู้ใช้งาน', value: asset.assigned_user || '-' }
          ].map((item, idx) => (
            <div key={idx} className="bg-gradient-to-br from-gray-50 to-gray-100 p-6 rounded-xl border-2 border-gray-200 hover:shadow-lg transition-all">
              <p className="text-sm text-gray-600 mb-2 font-medium">{item.label}</p>
