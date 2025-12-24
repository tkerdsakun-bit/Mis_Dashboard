import React, { useState } from 'react';

// ไม่ต้อง import lucide-react, react-barcode, xlsx ก่อน
// จะใช้ emoji และ HTML แทนชั่วคราว

const App = () => {
  const [currentPage, setCurrentPage] = useState('dashboard');

  // Simple Icon Component (ใช้ emoji แทน)
  const Icon = ({ children }: { children: string }) => (
    <span className="text-xl">{children}</span>
  );

  // สถิติ
  const stats = [
    { icon: '📦', label: 'ทรัพย์สินทั้งหมด', value: '248', color: 'bg-blue-500' },
    { icon: '⚠️', label: 'การรับประกันใกล้หมด', value: '12', color: 'bg-yellow-500' },
    { icon: '🔧', label: 'อยู่ระหว่างซ่อม', value: '8', color: 'bg-red-500' },
    { icon: '💰', label: 'มูลค่ารวม', value: '฿2.4M', color: 'bg-green-500' },
    { icon: '🏢', label: 'แผนกทั้งหมด', value: '5', color: 'bg-purple-500' },
    { icon: '🗑️', label: 'ทรัพย์สินที่ตัดจำหน่าย', value: '35', color: 'bg-gray-500' }
  ];

  const categoryData = [
    { icon: '💻', name: 'คอมพิวเตอร์', count: 85, percent: 34, color: 'bg-blue-500' },
    { icon: '💼', name: 'โน้ตบุ๊ค', count: 62, percent: 25, color: 'bg-indigo-500' },
    { icon: '🖥️', name: 'จอมอนิเตอร์', count: 48, percent: 19, color: 'bg-purple-500' },
    { icon: '🖨️', name: 'เครื่องพิมพ์', count: 28, percent: 11, color: 'bg-pink-500' },
    { icon: '📡', name: 'อุปกรณ์เครือข่าย', count: 25, percent: 10, color: 'bg-green-500' }
  ];

  const assets = [
    {
      id: 1,
      icon: '💻',
      name: 'Dell Optiplex 7090',
      tag: 'IT-2023-001',
      serial: 'ABC123456789',
      category: 'คอมพิวเตอร์',
      location: 'ฝ่ายไอที',
      status: 'ใช้งาน',
      purchaseDate: '15/01/2023',
      warrantyExpiry: '15/01/2026',
      price: '35,000',
      warrantyDays: 15
    },
    {
      id: 2,
      icon: '💼',
      name: 'MacBook Pro M3',
      tag: 'IT-2024-025',
      serial: 'MBP202400125',
      category: 'โน้ตบุ๊ค',
      location: 'ฝ่ายขาย',
      status: 'ใช้งาน',
      purchaseDate: '10/03/2024',
      warrantyExpiry: '10/03/2027',
      price: '89,900',
      warrantyDays: 800
    },
    {
      id: 3,
      icon: '🖨️',
      name: 'HP LaserJet Pro MFP M428',
      tag: 'IT-2023-045',
      serial: 'HPM428-789456',
      category: 'เครื่องพิมพ์',
      location: 'ฝ่ายบัญชี',
      status: 'ซ่อม',
      purchaseDate: '20/06/2023',
      warrantyExpiry: '20/06/2026',
      price: '28,500',
      warrantyDays: 22
    }
  ];

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
                <div key={idx} className="bg-white rounded-xl p-5 border border-gray-200 hover:shadow-lg transition-shadow">
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

            {/* Category Chart */}
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                📊 ทรัพย์สินแยกตามหมวดหมู่
              </h2>
              <div className="space-y-4">
                {categoryData.map((cat, idx) => (
                  <div key={idx}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span>{cat.icon}</span>
                        <span className="text-sm font-medium">{cat.name}</span>
                      </div>
                      <span className="text-sm text-gray-600 font-semibold">
                        {cat.count} รายการ ({cat.percent}%)
                      </span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-3">
                      <div
                        className={`${cat.color} h-3 rounded-full transition-all duration-500`}
                        style={{ width: `${cat.percent}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <h1 className="text-2xl font-bold text-gray-900">ทรัพย์สินทั้งหมด</h1>
            <div className="space-y-4">
              {assets.map((asset) => (
                <div key={asset.id} className="bg-white rounded-xl p-5 border border-gray-200 hover:shadow-lg transition-shadow">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-4 rounded-xl border border-blue-100">
                      <span className="text-3xl">{asset.icon}</span>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-lg text-gray-900">{asset.name}</h3>
                      <div className="flex items-center gap-3 mt-2 flex-wrap">
                        <span className="text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
                          🏷️ {asset.tag}
                        </span>
                        <span className="text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
                          📍 {asset.location}
                        </span>
                        <span
                          className={`text-xs px-3 py-1 rounded-full font-medium ${
                            asset.status === 'ใช้งาน'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-orange-100 text-orange-700'
                          }`}
                        >
                          {asset.status}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm bg-gray-50 p-4 rounded-lg">
                    <div>
                      <div className="text-gray-500 mb-1">หมายเลขซีเรียล</div>
                      <div className="font-semibold text-gray-900">{asset.serial}</div>
                    </div>
                    <div>
                      <div className="text-gray-500 mb-1">วันที่ซื้อ</div>
                      <div className="font-semibold text-gray-900">{asset.purchaseDate}</div>
                    </div>
                    <div>
                      <div className="text-gray-500 mb-1">ราคา</div>
                      <div className="font-semibold text-gray-900">฿{asset.price}</div>
                    </div>
                    <div>
                      <div className="text-gray-500 mb-1">การรับประกัน</div>
                      <div
                        className={`font-semibold ${
                          asset.warrantyDays < 30 ? 'text-yellow-600' : 'text-green-600'
                        }`}
                      >
                        {asset.warrantyDays < 365 ? `เหลือ ${asset.warrantyDays} วัน` : 'ยังใช้ได้'}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
