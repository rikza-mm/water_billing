export interface Area {
  area_id: number;
  area_name: string;
  postal_code: string;
  total_customers: number;
  created_at?: string;
  last_updated?: string;
}

export interface AreaStatistics {
  total_areas: number;
  total_customers: number;
  active_customers: number;
  inactive_customers: number;
  suspended_customers: number;
  total_readings: number;
  total_debt: number;
}