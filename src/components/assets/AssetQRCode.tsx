import React from 'react';
import QRCode from 'react-qr-code';
import type { Asset } from '../../types';

interface AssetQRCodeProps {
  asset: Asset;
}

export const AssetQRCode: React.FC<AssetQRCodeProps> = ({ asset }) => {
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
      <!DOCTYPE html>
      <html>
        <head>
          <title>Print QR Code - ${asset.tag}</title>
          <style>
            body { 
              display: flex; 
              flex-direction: column; 
              align-items: center; 
              justify-content: center; 
              min-height: 100vh; 
              margin: 0; 
              font-family: Arial, sans-serif;
            }
            .qr-container {
              text-align: center;
              padding: 20px;
            }
            .qr-code {
              margin: 20px 0;
            }
            .asset-tag {
              font-size: 24px;
              font-weight: bold;
              margin: 10px 0;
            }
            .asset-info {
              font-size: 14px;
              color: #666;
            }
            @media print {
              body { margin: 0; }
            }
          </style>
        </head>
        <body>
          <div class="qr-container">
            <div class="asset-tag">${asset.tag}</div>
            <div class="qr-code">
              <img src="${svgBase64}" width="200" height="200" />
            </div>
            <div class="asset-info">
              <p>${asset.name}</p>
              <p>สแกน QR Code เพื่อดูข้อมูลทรัพย์สิน</p>
            </div>
          </div>
        </body>
      </html>
    `);

    printWindow.document.close();
    setTimeout(() => {
      printWindow.print();
    }, 250);
  };

  return (
    <div className="text-center">
      <div id={`qr-container-${asset.id}`} className="bg-white p-4 rounded-lg inline-block">
        <QRCode value={qrValue} size={200} />
      </div>
      <div className="mt-4 space-x-2">
        <button
          onClick={downloadQR}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          📥 ดาวน์โหลด QR Code
        </button>
        <button
          onClick={printQR}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          🖨️ พิมพ์ QR Code
        </button>
      </div>
    </div>
  );
};
