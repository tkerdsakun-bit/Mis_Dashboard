import React from 'react';
import { StatCard } from '../common/StatCard';
import type { Asset } from '../../types';

interface AssetStatsProps {
  assets: Asset[];
}

export const AssetStats: React.FC<AssetStatsProps> = ({ assets }) => {
  const totalAssets = assets.length;
  const activeAssets = assets.filter(a => a.status === 'ใช้งาน').length;
  const repairAssets = assets.filter(a => a.status === 'ซ่อม').length;
  const disposedAssets = assets.filter(a => a.status === 'จำหน่าย').length;
  const totalValue = assets.reduce((sum, a) => sum + a.purchase_price, 0);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <StatCard
        title="ทรัพย์สินทั้งหมด"
        value={totalAssets}
        icon="📦"
        color="blue"
      />
      <StatCard
        title="ใช้งานปกติ"
        value={activeAssets}
        subtitle={`${totalAssets > 0 ? Math.round((activeAssets / totalAssets) * 100) : 0}% ของทั้งหมด`}
        icon="✅"
        color="green"
      />
      <StatCard
        title="อยู่ระหว่างซ่อม"
        value={repairAssets}
        subtitle={`${totalAssets > 0 ? Math.round((repairAssets / totalAssets) * 100) : 0}% ของทั้งหมด`}
        icon="🔧"
        color="yellow"
      />
      <StatCard
        title="มูลค่ารวม"
        value={`฿${totalValue.toLocaleString()}`}
        subtitle={`${disposedAssets} รายการถูกจำหน่าย`}
        icon="💰"
        color="purple"
      />
    </div>
  );
};
