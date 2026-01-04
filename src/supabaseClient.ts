// Mock Supabase - Works WITHOUT creating Supabase account

export type Asset = {
  id: number;
  icon: string;
  name: string;
  tag: string;
  serial: string;
  category: string;
  location: string;
  status: string;
  purchase_date: string;
  warranty_expiry: string;
  price: string;
  warranty_days: number;
  created_at?: string;
  updated_at?: string;
};

export type InkItem = {
  id: number;
  printer_name: string;
  printer_tag: string;
  ink_type: string;
  current_level: number;
  min_level: number;
  max_level: number;
  unit_price: number;
  last_refill: string;
  estimated_days_left: number;
  monthly_usage: number;
  status: string;
  created_at?: string;
  updated_at?: string;
};

// Mock data
const mockAssets: Asset[] = [
  {
    id: 1,
    icon: '💻',
    name: 'Dell Optiplex 7090',
    tag: 'IT-2023-001',
    serial: 'ABC123456789',
    category: 'คอมพิวเตอร์',
    location: 'ฝ่ายไอที',
    status: 'ใช้งาน',
    purchase_date: '2023-01-15',
    warranty_expiry: '2026-01-15',
    price: '35,000',
    warranty_days: 15
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
    purchase_date: '2024-03-10',
    warranty_expiry: '2027-03-10',
    price: '89,900',
    warranty_days: 800
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
    purchase_date: '2023-06-20',
    warranty_expiry: '2026-06-20',
    price: '28,500',
    warranty_days: 22
  },
  {
    id: 4,
    icon: '🖥️',
    name: 'Dell UltraSharp 27"',
    tag: 'IT-2024-018',
    serial: 'DU27-445566',
    category: 'จอมอนิเตอร์',
    location: 'ฝ่ายไอที',
    status: 'ใช้งาน',
    purchase_date: '2024-02-14',
    warranty_expiry: '2027-02-14',
    price: '15,900',
    warranty_days: 760
  },
  {
    id: 5,
    icon: '📡',
    name: 'Cisco Switch 24-port',
    tag: 'IT-2023-090',
    serial: 'CS24-998877',
    category: 'อุปกรณ์เครือข่าย',
    location: 'ฝ่ายไอที',
    status: 'ใช้งาน',
    purchase_date: '2023-09-01',
    warranty_expiry: '2026-09-01',
    price: '42,000',
    warranty_days: 240
  }
];

const mockDepartments = [
  { id: 1, name: 'ฝ่ายไอที' },
  { id: 2, name: 'ฝ่ายขาย' },
  { id: 3, name: 'ฝ่ายบัญชี' },
  { id: 4, name: 'ฝ่ายการตลาด' },
  { id: 5, name: 'ฝ่ายบริหาร' }
];

const mockInkInventory: InkItem[] = [
  {
    id: 1,
    printer_name: 'HP LaserJet Pro MFP M428',
    printer_tag: 'IT-2023-045',
    ink_type: 'Toner Cartridge HP 30A (Black)',
    current_level: 35,
    min_level: 20,
    max_level: 100,
    unit_price: 1850,
    last_refill: '2025-12-15',
    estimated_days_left: 18,
    monthly_usage: 2.5,
    status: 'ต่ำ'
  },
  {
    id: 2,
    printer_name: 'Canon PIXMA G7070',
    printer_tag: 'IT-2024-089',
    ink_type: 'Ink Tank GI-790 (Cyan)',
    current_level: 78,
    min_level: 15,
    max_level: 100,
    unit_price: 350,
    last_refill: '2025-11-28',
    estimated_days_left: 45,
    monthly_usage: 1.8,
    status: 'ปกติ'
  },
  {
    id: 3,
    printer_name: 'Epson L15160',
    printer_tag: 'IT-2023-112',
    ink_type: 'Ink Bottle 774 (Black)',
    current_level: 12,
    min_level: 20,
    max_level: 100,
    unit_price: 420,
    last_refill: '2025-12-05',
    estimated_days_left: 8,
    monthly_usage: 3.2,
    status: 'วิกฤต'
  }
];

// Helper to get mock data by table name
const getMockData = (table: string) => {
  switch (table) {
    case 'assets':
      return mockAssets;
    case 'departments':
      return mockDepartments;
    case 'ink_inventory':
      return mockInkInventory;
    default:
      return [];
  }
};

// Mock Supabase client with proper TypeScript types
export const supabase = {
  from: (table: string) => {
    const queryBuilder = {
      select: (columns?: string) => {
        const data = getMockData(table);
        return {
          ...queryBuilder,
          data,
          error: null,
          order: (column: string, options?: { ascending?: boolean }) => {
            console.log(`Mock order by ${column}`, options);
            return Promise.resolve({ data, error: null });
          }
        };
      },
      insert: (newData: any) => {
        console.log('Mock insert:', newData);
        return Promise.resolve({ data: newData, error: null });
      },
      update: (updates: any) => ({
        eq: (_field: string, _value: any) => {
          console.log('Mock update:', updates);
          return Promise.resolve({ data: updates, error: null });
        }
      }),
      delete: () => ({
        eq: (_field: string, _value: any) => {
          console.log('Mock delete');
          return Promise.resolve({ data: null, error: null });
        }
      }),
      order: (column: string, options?: { ascending?: boolean }) => {
        const data = getMockData(table);
        console.log(`Mock order by ${column}`, options);
        return {
          select: (columns?: string) => {
            console.log('Mock select after order:', columns);
            return Promise.resolve({ data, error: null });
          }
        };
      }
    };
    return queryBuilder;
  },
  channel: (name: string) => ({
    on: (_event: string, _options: any, _callback: any) => ({
      subscribe: () => {
        console.log('Mock realtime subscription:', name);
        return {};
      }
    })
  }),
  removeChannel: (_channel: any) => {
    console.log('Mock remove channel');
  }
};
