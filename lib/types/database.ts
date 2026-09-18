// ============================================================
// Sierra Electric Technologies HRM — Database Types
// (ported + adapted from the DLCF Choir Platform reference)
// ============================================================

export interface Profile {
  id: string
  display_name: string
  email: string | null
  phone: string | null
  position: string | null
  department: string | null
  employee_id: string | null
  photo_url: string | null
  address: string | null
  emergency_contact: string | null
  date_of_birth: string | null
  gender: string | null
  must_change_password: boolean
  updated_at: string
  created_at: string
}

export interface Role {
  id: string
  name: string
  slug: string
  description: string | null
  hierarchy_level: number
  is_administrative: boolean
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface RolePermission {
  id: string
  role_id: string
  permission: string
  created_at: string
}

export interface UserRole {
  id: string
  user_id: string
  role_id: string
  granted_by: string | null
  granted_at: string
  expires_at: string | null
  is_active: boolean
  notes: string | null
  created_at: string
  updated_at: string
  role?: Role
}

export interface Notification {
  id: string
  user_id: string
  title: string
  message: string | null
  type: string
  link: string | null
  is_read: boolean
  created_at: string
}

export interface AuditLog {
  id: string
  actor_id: string | null
  action: string
  target_type: string
  target_id: string | null
  previous_value: Record<string, unknown> | null
  new_value: Record<string, unknown> | null
  created_at: string
}

export interface LeaveType {
  id: string
  name: string
  slug: string
  default_days: number
  is_active: boolean
  created_at: string
}

export interface LeaveRequest {
  id: string
  user_id: string
  leave_type_id: string
  start_date: string
  end_date: string
  reason: string | null
  status: 'pending' | 'approved' | 'rejected' | 'cancelled'
  reviewed_by: string | null
  reviewed_at: string | null
  review_note: string | null
  created_at: string
  updated_at: string
}

// --- Composite types (for joined queries) ---
export interface UserProfile extends Profile {
  user_roles?: UserRole[]
}

export interface UserWithRoles {
  user_id: string
  profile: Profile | null
  roles: UserRole[]
  permissions: string[]
}