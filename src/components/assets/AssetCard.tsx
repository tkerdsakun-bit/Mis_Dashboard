import React from 'react';
import type { Asset } from '../../types';

interface AssetCardProps {
  asset: Asset;
  onClick?: () => void;
}

export const AssetCard: React.FC<AssetCardProps> = ({ asset, onClick }) => {
  const statusColors = {
    'ใช้งาน': 'bg-green-100 text-green-800',
    'ซ่อม': 'bg-yellow-100 text-yellow-800',
    'จำหน่าย': 'bg-red-100 text-red-800'
  };

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow p-4 cursor-pointer border border-gray-200"
    >
      {asset.image_url && (
        <img
          src={asset.image_url}
          alt={asset.name}
          className="w-full h-48 object-cover rounded-lg mb-3"
        />
      )}

      <div className="space-y-2">
        <div className="flex justify-between items-start">
          <h3 className="font-semibold text-lg text-gray-900">{asset.name}</h3>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[asset.status]}`}>
            {asset.status}
          </span>
        </div>

        <p className="text-sm text-gray-600">รหัส: {asset.tag}</p>
        <p className="text-sm text-gray-600">แผนก: {asset.department}</p>
        <p className="text-sm text-gray-600">หมวดหมู่: {asset.category}</p>

        <div className="pt-2 border-t">
          <p className="text-sm text-gray-500">
            ราคา: ฿{asset.purchase_price.toLocaleString()}
          </p>
        </div>
      </div>
    </div>
  );
};
