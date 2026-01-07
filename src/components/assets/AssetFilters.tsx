import React from 'react';

interface AssetFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  selectedDepartment: string;
  onDepartmentChange: (value: string) => void;
  selectedCategory: string;
  onCategoryChange: (value: string) => void;
  selectedStatus: string;
  onStatusChange: (value: string) => void;
  departments: string[];
  categories: string[];
}

export const AssetFilters: React.FC<AssetFiltersProps> = ({
  searchTerm,
  onSearchChange,
  selectedDepartment,
  onDepartmentChange,
  selectedCategory,
  onCategoryChange,
  selectedStatus,
  onStatusChange,
  departments,
  categories
}) => {
  return (
    <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Search */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            🔍 ค้นหา
          </label>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="ค้นหารหัส, ชื่อทรัพย์สิน..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Department */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            🏢 แผนก
          </label>
          <select
            value={selectedDepartment}
            onChange={(e) => onDepartmentChange(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">ทั้งหมด</option>
            {departments.map((dept) => (
              <option key={dept} value={dept}>{dept}</option>
            ))}
          </select>
        </div>

        {/* Category */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            📂 หมวดหมู่
          </label>
          <select
            value={selectedCategory}
            onChange={(e) => onCategoryChange(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">ทั้งหมด</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        {/* Status */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            📊 สถานะ
          </label>
          <select
            value={selectedStatus}
            onChange={(e) => onStatusChange(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">ทั้งหมด</option>
            <option value="ใช้งาน">ใช้งาน</option>
            <option value="ซ่อม">ซ่อม</option>
            <option value="จำหน่าย">จำหน่าย</option>
          </select>
        </div>
      </div>
    </div>
  );
};
