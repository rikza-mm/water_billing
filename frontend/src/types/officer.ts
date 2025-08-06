export interface Area {
  area_id: number;
  name: string;
}

export interface Officer {
    officer_id: number;
    full_name: string;
    username: string;
    phone_number: string;
    areas: { name: string }[];
    total_customers: number;
    salary?: number;
    status: 'active' | 'inactive';
    join_date: string; // Added join_date property
  }

export interface OfficerCreateInput {
  username: string;
  full_name: string;
  password: string;
  phone_number: string;
  salary: number;
  join_date: string;
}

export interface OfficerUpdateInput {
  full_name?: string;
  phone_number?: string;
  salary?: number;
}

export interface OfficerAreaAssignment {
  officer_id: number;
  area_id: number;
}

export interface OfficerStatistics {
  total_officers: number;
  active_officers: number;
  inactive_officers: number;
  total_areas_covered: number;
  total_customers_served: number;
  total_salary: number;
  average_salary: number;
}

export interface OfficerPlacementHistory {
  placement_id: number;
  officer_id: number;
  officer_name: string;
  area_id: number;
  area_name: string;
  start_date: string;
  end_date: string | null;
  status: 'active' | 'completed' | 'transferred';
}

export interface OfficerResponse {
  success: boolean;
  data: Officer[];
  metadata: {
    total_officers: number;
    active_officers: number;
    total_areas_covered: number;
    total_customers_served: number;
  };
}
