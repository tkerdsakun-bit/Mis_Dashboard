export interface Asset {
  id: string;
  tag: string;
  name: string;
  category: string;
  department: string;
  purchase_date: string;
  purchase_price: number;
  warranty_end: string;
  status: 'ใช้งาน' | 'ซ่อม' | 'จำหน่าย';
  location: string;
  image_url?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Department {
  id: string;
  name: string;
  created_at: string;
}

export interface AssetCategory {
  id: string;
  name: string;
  created_at: string;
}
