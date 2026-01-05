// QRCodeComponent.tsx
// Component สำหรับสร้าง QR Code พร้อมฟังก์ชันดาวน์โหลดและพิมพ์
// ใช้กับ react-qr-code library

import QRCode from 'react-qr-code';
import type { Asset } from './supabaseClient';

interface AssetQRCodeProps {
  asset: Asset;
}

const AssetQRCode = ({ asset }: AssetQRCodeProps) => {
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
      link.download = `QR-${asset.tag}.png`;
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
      <html>
        <head>
          <title>QR Code - ${asset.tag}</title>
          <meta charset="UTF-8">
          <style>
            @media print {
              @page { 
                margin: 0;
                size: A4;
              }
              body { margin: 1.5cm; }
            }
            body { 
              display: flex; 
              flex-direction: column;
              align-items: center; 
              justify-content: center;
              min-height: 100vh;
              margin: 0;
              font-family: 'Sarabun', 'Tahoma', 'Arial', sans-serif;
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
            <div class="header">🏢 ระบบจัดการทรัพย์สิน IT</div>
            <div class="asset-name">${asset.name}</div>
            <div class="qr-container">
              <img src="${svgBase64}" width="200" height="200" alt="QR Code" />
            </div>
            <div class="info">
              <span class="info-label">🏷️ Asset Tag:</span>
              <span class="info-value">${asset.tag}</span>
            </div>
            <div class="info">
              <span class="info-label">🏢 แผนก:</span>
              <span class="info-value">${asset.location}</span>
            </div>
            <div class="info">
              <span class="info-label">📦 ประเภท:</span>
              <span class="info-value">${asset.category}</span>
            </div>
            <div class="footer">
              <div class="scan-text">📱 สแกน QR Code เพื่อดูข้อมูลทรัพย์สิน</div>
              <div style="margin-top: 10px; font-size: 12px;">พร้อมประวัติการซ่อมและข้อมูลการรับประกัน</div>
            </div>
          </div>
          <script>
            window.onload = () => {
              setTimeout(() => {
                window.print();
              }, 500);
            };
          </script>
        </body>
      </html>
    `);
  };

  return (
    <div className="flex flex-col items-center gap-4 p-6 bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl border-2 border-blue-200">
      <h4 className="font-bold text-lg text-gray-900">📱 QR Code สำหรับทรัพย์สิน</h4>
      <div id={`qr-container-${asset.id}`} className="bg-white p-4 rounded-xl shadow-lg">
        <QRCode
          value={qrValue}
          size={200}
          level="H"
          style={{ height: "auto", maxWidth: "100%", width: "100%" }}
        />
      </div>
      <p className="text-sm text-gray-600 font-semibold">{asset.tag}</p>
      <p className="text-xs text-gray-500 text-center">
        สแกน QR Code เพื่อดูข้อมูลทรัพย์สิน<br/>
        พร้อมประวัติการซ่อมและข้อมูลการรับประกัน
      </p>
      <div className="flex gap-3 w-full">
        <button
          onClick={downloadQR}
          className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl font-semibold hover:shadow-xl hover:scale-105 transition-all flex items-center justify-center gap-2"
        >
          <span className="text-xl">📥</span>
          ดาวน์โหลด
        </button>
        <button
          onClick={printQR}
          className="flex-1 px-4 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl font-semibold hover:shadow-xl hover:scale-105 transition-all flex items-center justify-center gap-2"
        >
          <span className="text-xl">🖨️</span>
          พิมพ์
        </button>
      </div>
    </div>
  );
};

export default AssetQRCode;
