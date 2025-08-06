export interface User {
  id: number;
  full_name: string;
  email: string;
  role: string;
  phone?: string;
  address?: string;
  created_at?: string;
  updated_at?: string;
}