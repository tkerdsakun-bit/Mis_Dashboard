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

  useEffect(() => {
    fetchAssetData();
  }, [assetId]);

  const fetchAssetData = async () => {
    try {
      setLoading(true);

      // Fetch asset
      const { data: assetData, error: assetError } = await supabase
        .from('assets')
        .select('*')
        .eq('id', assetId)
        .single();

      if (assetError) throw assetError;
      setAsset(assetData as Asset);

      // Fetch repair history
      const { data: repairData, error: repairError } = await supabase
        .from('repairhistory')
        .select('*')
        .eq('assetid', assetId)
        .order('createdat', { ascending: false });

      if (repairError) throw repairError;
      setRepairs(repairData as RepairHistory[]);
    } catch (error) {
      console.error('Error fetching asset:', error);
      alert('ไม่พบข้อมูลทรัพย์สิน');
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

  if (!asset) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-8xl mb-6">❌</div>
          <p className="text-2xl font-bold text-gray-700 mb-4">ไม่พบข้อมูลทรัพย์สิน</p>
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
        {asset.imageurl && (
          <img
            src={asset.imageurl}
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
            { label: '📅 วันที่ซื้อ', value: asset.purchasedate },
            { label: '🛡️ การรับประกันหมดอายุ', value: asset.warrantyexpiry, 
              color: asset.warrantydays < 30 ? 'text-red-600' : 'text-green-600' },
            { label: '💰 ราคา', value: `฿${asset.price}`, color: 'text-green-600' },
            { label: '⏰ วันรับประกันคงเหลือ', value: `${asset.warrantydays} วัน`,
              color: asset.warrantydays < 30 ? 'text-red-600' : 'text-green-600' }
          ].map((item, idx) => (
            <div key={idx} className="bg-gradient-to-br from-gray-50 to-gray-100 p-6 rounded-xl border-2 border-gray-200 hover:shadow-lg transition-all">
              <p className="text-sm text-gray-600 mb-2 font-medium">{item.label}</p>
              <p className={`font-bold text-xl ${item.color || 'text-gray-900'}`}>
                {item.value}
              </p>
            </div>
          ))}
        </div>

        {/* Repair History */}
        {repairs.length > 0 && (
          <div className="bg-gradient-to-br from-orange-50 to-red-50 p-6 rounded-2xl border-2 border-orange-200">
            <h3 className="font-bold text-2xl mb-4 flex items-center gap-2">
              🔧 ประวัติการซ่อม ({repairs.length} ครั้ง)
            </h3>
            <div className="space-y-4">
              {repairs.map(repair => (
                <div key={repair.id} className="bg-white p-5 rounded-xl border border-orange-100 hover:shadow-lg transition-all">
                  <div className="flex justify-between items-start mb-3">
                    <p className="font-semibold text-gray-900 text-lg">{repair.issuedescription}</p>
                    <span className={`px-4 py-1 rounded-full text-xs font-bold ${
                      repair.repairstatus === 'เสร็จสิ้น' ? 'bg-green-100 text-green-700' :
                      repair.repairstatus === 'กำลังซ่อม' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {repair.repairstatus}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm text-gray-600">
                    <p>💰 ค่าใช้จ่าย: <span className="font-bold text-red-600">฿{repair.repaircost.toLocaleString()}</span></p>
                    <p>👨‍🔧 ช่าง: <span className="font-semibold">{repair.technician || '-'}</span></p>
                    <p>📅 วันที่เริ่ม: {repair.startdate}</p>
                    <p>✅ วันที่เสร็จ: {repair.enddate || '-'}</p>
                  </div>
                  {repair.notes && (
                    <p className="mt-3 pt-3 border-t border-orange-200 text-sm text-gray-600">
                      📝 หมายเหตุ: {repair.notes}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AssetDetail;
