export const Role = {
  ADMINISTRATOR: 'ADMINISTRATOR',
  MANAGER: 'MANAGER',
  CURATOR: 'CURATOR',
  NONE: 'NONE',
} as const;

export type Role = (typeof Role)[keyof typeof Role];

export interface Department {
  id: number;
  title: string;
}

export interface Position {
  id: number;
  title: string;
  department_id: number;
  department: Department;
}

export interface User {
  id: number;
  name: string;
  surname: string;
  lastname: string | null;
  position_id: number | null;
  role: Role;
  email: string;
  phone: string | null;
  is_active: boolean;
  registration_date: string;
  last_login?: string | null;
  position: Position;
}

export interface Shift_type {
  id: number;
  title: string;
  rate: number;
  quantity_for_increased_payment: number;
  increased_payment: number;
}

export interface ShiftUserBrief {
  id: number;
  name: string;
  surname: string;
}

export interface Shift_user {
  id: number;
  shift_id: number;
  user_id: number;
  user?: User | ShiftUserBrief | null;
}

export interface Shift {
  id: number;
  type_id: number;
  start_time: string;
  end_time: string;
  is_free: boolean;
  max_user: number;
  shift_type?: Shift_type;
  shift_user?: Shift_user[] | null;
}

export interface ShiftSchedule {
  id: number;
  schedule_id: number;
  shift_id: number;
  shift: Shift | null;
}

export interface Schedule {
  id: number;
  creator_id: number;
  start_date: string;
  end_date: string;
  opening_date: string;
  ending_date: string;
  create_date: string;
  user?: User;
  shift_schedule: ShiftSchedule[];
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
}
