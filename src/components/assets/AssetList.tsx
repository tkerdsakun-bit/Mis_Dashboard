import React from 'react';
import { AssetCard } from './AssetCard';
import type { Asset } from '../../types';

interface AssetListProps {
  assets: Asset[];
  onAssetClick?: (asset: Asset) => void;
  loading?: boolean;
}

export const AssetList: React.FC<AssetListProps> = ({ 
  assets, 
  onAssetClick,
  loading = false 
}) => {
  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
        <p className="mt-4 text-gray-600">กำลังโหลดข้อมูล...</p>
      </div>
    );
  }

  if (assets.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 text-lg">ไม่พบทรัพย์สิน</p>
        <p className="text-gray-400 text-sm mt-2">ลองเปลี่ยนคำค้นหาหรือตัวกรอง</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {assets.map((asset) => (
        <AssetCard
          key={asset.id}
          asset={asset}
          onClick={() => onAssetClick?.(asset)}
        />
      ))}
    </div>
  );
};
