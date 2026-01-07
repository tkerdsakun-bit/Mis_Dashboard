export const validateRequired = (value: string): boolean => {
  return value.trim().length > 0;
};

export const validateNumber = (value: string): boolean => {
  return !isNaN(Number(value)) && Number(value) >= 0;
};

export const validateDate = (dateString: string): boolean => {
  const date = new Date(dateString);
  return !isNaN(date.getTime());
};

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validateAssetTag = (tag: string): boolean => {
  // Check that asset tag is not empty and has max 50 characters
  return tag.trim().length > 0 && tag.trim().length <= 50;
};

export const validatePrice = (price: number): boolean => {
  return price > 0 && !isNaN(price);
};

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export const validateAssetForm = (data: {
  tag: string;
  name: string;
  category: string;
  department: string;
  purchase_date: string;
  purchase_price: number;
  status: string;
}): ValidationResult => {
  const errors: string[] = [];

  if (!validateRequired(data.tag)) {
    errors.push('กรุณากรอกรหัสทรัพย์สิน');
  } else if (!validateAssetTag(data.tag)) {
    errors.push('รหัสทรัพย์สินต้องมีความยาวไม่เกิน 50 ตัวอักษร');
  }

  if (!validateRequired(data.name)) {
    errors.push('กรุณากรอกชื่อทรัพย์สิน');
  }

  if (!validateRequired(data.category)) {
    errors.push('กรุณาเลือกหมวดหมู่');
  }

  if (!validateRequired(data.department)) {
    errors.push('กรุณาเลือกแผนก');
  }

  if (!validateDate(data.purchase_date)) {
    errors.push('กรุณาระบุวันที่ซื้อที่ถูกต้อง');
  }

  if (!validatePrice(data.purchase_price)) {
    errors.push('กรุณาระบุราคาซื้อที่ถูกต้อง');
  }

  if (!['ใช้งาน', 'ซ่อม', 'จำหน่าย'].includes(data.status)) {
    errors.push('สถานะไม่ถูกต้อง');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

export const validateRepairForm = (data: {
  issue_description: string;
  repair_status: string;
  repair_cost: number;
  start_date: string;
}): ValidationResult => {
  const errors: string[] = [];

  if (!validateRequired(data.issue_description)) {
    errors.push('กรุณากรอกรายละเอียดปัญหา');
  }

  if (!['รอดำเนินการ', 'กำลังซ่อม', 'เสร็จสิ้น'].includes(data.repair_status)) {
    errors.push('สถานะการซ่อมไม่ถูกต้อง');
  }

  if (data.repair_cost < 0) {
    errors.push('ค่าใช้จ่ายต้องไม่ติดลบ');
  }

  if (!validateDate(data.start_date)) {
    errors.push('กรุณาระบุวันที่เริ่มซ่อมที่ถูกต้อง');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};
