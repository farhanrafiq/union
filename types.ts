export enum UserRole {
  ADMIN = 'admin',
  DEALER = 'dealer',
}

export enum AuditActionType {
    LOGIN = 'login',
    RESET_PASSWORD = 'reset_password',
    CHANGE_PASSWORD = 'change_password',
    CREATE_DEALER = 'create_dealer',
    UPDATE_DEALER = 'update_dealer',
    SEARCH = 'search',
    CREATE_EMPLOYEE = 'create_employee',
    UPDATE_EMPLOYEE = 'update_employee',
    TERMINATE_EMPLOYEE = 'terminate_employee',
    CREATE_CUSTOMER = 'create_customer',
    UPDATE_CUSTOMER = 'update_customer',
}

export interface User {
  id: string;
  email: string;
  username: string;
  role: UserRole;
  name: string;
  dealerId?: string;
  tempPassword?: string | null;
  tempPasswordExpiry?: string | null;
}

export interface Dealer {
  id: string;
  companyName: string;
  primaryContactName: string;
  primaryContactPhone: string;
  primaryContactEmail: string;
  address: string;
  status: 'active' | 'suspended';
  createdAt: string;
}

export interface Employee {
  id: string;
  dealerId: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  aadhar: string;
  position: string;
  hireDate: string;
  status: 'active' | 'terminated';
  terminationDate?: string;
  terminationReason?: string;
}

export interface Customer {
  id: string;
  dealerId: string;
  type: 'private' | 'government';
  nameOrEntity: string;
  contactPerson?: string;
  phone: string;
  email: string;
  officialId: string;
  address: string;
  status: 'active' | 'inactive';
}

export interface AuditLog {
  id: string;
  whoUserId: string;
  whoUserName: string;
  dealerId?: string;
  actionType: AuditActionType;
  details: string;
  ipAddress: string;
  timestamp: string;
}

export interface GlobalSearchResult {
  entityType: 'employee' | 'customer';
  entityRefId: string;
  canonicalName: string;
  phoneNorm: string;
  identityNorm?: string;
  ownerDealerId: string;
  ownerDealerName: string;
  statusSummary: 'active' | 'terminated' | 'inactive';
  terminationReason?: string;
  terminationDate?: string;
  customerType?: 'private' | 'government';
}