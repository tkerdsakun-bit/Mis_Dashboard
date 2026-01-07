export const ASSET_STATUS = {
  ACTIVE: 'ใช้งาน',
  REPAIR: 'ซ่อม',
  DISPOSED: 'จำหน่าย'
} as const;

export const REPAIR_STATUS = {
  PENDING: 'รอดำเนินการ',
  IN_PROGRESS: 'กำลังซ่อม',
  COMPLETED: 'เสร็จสิ้น'
} as const;

export const TRANSACTION_TYPE = {
  INCOME: 'รายรับ',
  EXPENSE: 'รายจ่าย'
} as const;

export const DATE_FORMAT = {
  FULL: 'th-TH',
  SHORT: 'th-TH'
} as const;

export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
  PAGE_SIZE_OPTIONS: [10, 20, 50, 100]
} as const;

export const USER_ROLES = {
  ADMIN: 'admin',
  USER: 'user',
  VIEWER: 'viewer'
} as const;

export const COLORS = {
  PRIMARY: 'blue',
  SUCCESS: 'green',
  WARNING: 'yellow',
  DANGER: 'red',
  INFO: 'purple'
} as const;

export const STATUS_COLORS = {
  [ASSET_STATUS.ACTIVE]: 'bg-green-100 text-green-800',
  [ASSET_STATUS.REPAIR]: 'bg-yellow-100 text-yellow-800',
  [ASSET_STATUS.DISPOSED]: 'bg-red-100 text-red-800'
} as const;

export const REPAIR_STATUS_COLORS = {
  [REPAIR_STATUS.PENDING]: 'bg-gray-100 text-gray-800',
  [REPAIR_STATUS.IN_PROGRESS]: 'bg-yellow-100 text-yellow-800',
  [REPAIR_STATUS.COMPLETED]: 'bg-green-100 text-green-800'
} as const;

export const FILE_SIZE_LIMIT = 5 * 1024 * 1024; // 5MB
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

export const MESSAGES = {
  SUCCESS: {
    ASSET_ADDED: 'เพิ่มทรัพย์สินสำเร็จ',
    ASSET_UPDATED: 'อัพเดตทรัพย์สินสำเร็จ',
    ASSET_DELETED: 'ลบทรัพย์สินสำเร็จ',
    REPAIR_ADDED: 'บันทึกการซ่อมสำเร็จ',
    TRANSACTION_ADDED: 'บันทึกรายการสำเร็จ'
  },
  ERROR: {
    FETCH_FAILED: 'ไม่สามารถโหลดข้อมูลได้',
    SAVE_FAILED: 'ไม่สามารถบันทึกข้อมูลได้',
    DELETE_FAILED: 'ไม่สามารถลบข้อมูลได้',
    IMAGE_UPLOAD_FAILED: 'ไม่สามารถอัพโหลดรูปภาพได้'
  }
} as const;
