import type { Asset, RepairHistory, InkTransaction } from '../types';

export const exportToCSV = (data: any[], filename: string): void => {
  if (data.length === 0) {
    alert('ไม่มีข้อมูลสำหรับ Export');
    return;
  }

  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map(row => 
      headers.map(header => {
        const value = row[header];
        // Escape commas and quotes
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value ?? '';
      }).join(',')
    )
  ].join('\n');

  // Add BOM for UTF-8 encoding to support Thai characters
  const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const exportAssetsToCSV = (assets: Asset[]): void => {
  const exportData = assets.map(asset => ({
    'รหัสทรัพย์สิน': asset.tag,
    'ชื่อทรัพย์สิน': asset.name,
    'หมวดหมู่': asset.category,
    'แผนก': asset.department,
    'วันที่ซื้อ': asset.purchase_date,
    'ราคาซื้อ': asset.purchase_price,
    'วันหมดประกัน': asset.warranty_end,
    'สถานะ': asset.status,
    'สถานที่': asset.location,
    'หมายเหตุ': asset.notes || ''
  }));

  exportToCSV(exportData, `assets_${new Date().toISOString().split('T')[0]}`);
};

export const exportRepairsToCSV = (repairs: RepairHistory[]): void => {
  const exportData = repairs.map(repair => ({
    'รหัสทรัพย์สิน': repair.asset_tag,
    'ชื่อทรัพย์สิน': repair.asset_name,
    'ปัญหา': repair.issue_description,
    'สถานะ': repair.repair_status,
    'ค่าใช้จ่าย': repair.repair_cost,
    'ช่างผู้รับผิดชอบ': repair.technician || '-',
    'วันที่เริ่ม': repair.start_date,
    'วันที่เสร็จ': repair.end_date || '-',
    'หมายเหตุ': repair.notes || ''
  }));

  exportToCSV(exportData, `repairs_${new Date().toISOString().split('T')[0]}`);
};

export const exportTransactionsToCSV = (transactions: InkTransaction[]): void => {
  const exportData = transactions.map(tx => ({
    'ประเภท': tx.transaction_type,
    'จำนวนเงิน': tx.amount,
    'รายละเอียด': tx.description,
    'วันที่': tx.transaction_date
  }));

  exportToCSV(exportData, `transactions_${new Date().toISOString().split('T')[0]}`);
};

export const printAssetLabel = (asset: Asset): void => {
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Print Label - ${asset.tag}</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            margin: 0;
          }
          .label {
            border: 2px solid #000;
            padding: 20px;
            width: 300px;
            text-align: center;
          }
          .tag {
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 10px;
          }
          .name {
            font-size: 18px;
            margin-bottom: 5px;
          }
          .info {
            font-size: 12px;
            color: #666;
          }
          @media print {
            body { margin: 0; }
            @page { size: auto; margin: 10mm; }
          }
        </style>
      </head>
      <body>
        <div class="label">
          <div class="tag">${asset.tag}</div>
          <div class="name">${asset.name}</div>
          <div class="info">${asset.department} - ${asset.category}</div>
        </div>
      </body>
    </html>
  `);

  printWindow.document.close();
  setTimeout(() => {
    printWindow.print();
  }, 250);
};
