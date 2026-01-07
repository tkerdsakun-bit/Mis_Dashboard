export interface RepairHistory {
  id: string;
  asset_id: string;
  asset_tag: string;
  asset_name: string;
  issue_description: string;
  repair_status: 'รอดำเนินการ' | 'กำลังซ่อม' | 'เสร็จสิ้น';
  repair_cost: number;
  technician?: string;
  start_date: string;
  end_date?: string;
  notes?: string;
  created_at: string;
}
