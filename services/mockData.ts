import { User, UserRole, Dealer, Employee, Customer, AuditLog, AuditActionType } from '../types';

export let mockUsers: User[] = [
  { id: 'admin-1', email: 'admin@tradernet.com', username: 'admin', role: UserRole.ADMIN, name: 'Admin User', tempPassword: null },
  { id: 'dealer-1-user', email: 'john.smith@autoworld.com', username: 'jsmith', role: UserRole.DEALER, name: 'John Smith', dealerId: 'dealer-1', tempPassword: null },
  { id: 'dealer-2-user', email: 'jane.doe@carvana.com', username: 'jdoe', role: UserRole.DEALER, name: 'Jane Doe', dealerId: 'dealer-2', tempPassword: null },
  { id: 'dealer-3-user', email: 'temp-user@bestmotors.com', username: 'tempuser', role: UserRole.DEALER, name: 'Temp User', dealerId: 'dealer-3', tempPassword: 'temp-password-123', tempPasswordExpiry: new Date(Date.now() + 72 * 3600 * 1000).toISOString() },
];

export let mockDealers: Dealer[] = [
  { 
    id: 'dealer-1', 
    companyName: 'AutoWorld', 
    primaryContactName: 'John Smith', 
    primaryContactEmail: 'john.smith@autoworld.com', 
    primaryContactPhone: '555-0101', 
    address: '123 Main St, Anytown, USA', 
    status: 'active',
    createdAt: '2023-10-20T10:00:00Z',
  },
  { 
    id: 'dealer-2', 
    companyName: 'Carvana', 
    primaryContactName: 'Jane Doe', 
    primaryContactEmail: 'jane.doe@carvana.com', 
    primaryContactPhone: '555-0102', 
    address: '456 Oak Ave, Somecity, USA', 
    status: 'active',
    createdAt: '2023-10-22T11:30:00Z',
  },
  { 
    id: 'dealer-3', 
    companyName: 'Best Motors', 
    primaryContactName: 'Sam Wilson', 
    primaryContactEmail: 'sam.wilson@bestmotors.com', 
    primaryContactPhone: '555-0103', 
    address: '789 Pine Ln, Otherville, USA', 
    status: 'suspended',
    createdAt: '2023-09-15T14:00:00Z',
  },
];

export let mockEmployees: Employee[] = [
  { id: 'emp-1', dealerId: 'dealer-1', firstName: 'Mike', lastName: 'Ross', phone: '555-1111', email: 'mike@autoworld.com', aadhar: '123456789012', position: 'Sales Rep', hireDate: '2022-01-15', status: 'active' },
  { id: 'emp-2', dealerId: 'dealer-1', firstName: 'Rachel', lastName: 'Zane', phone: '555-2222', email: 'rachel@autoworld.com', aadhar: '234567890123', position: 'Finance Manager', hireDate: '2021-03-20', status: 'terminated', terminationDate: '2023-05-10', terminationReason: 'Company policy violation' },
  { id: 'emp-3', dealerId: 'dealer-2', firstName: 'Harvey', lastName: 'Specter', phone: '555-3333', email: 'harvey@carvana.com', aadhar: '345678901234', position: 'Senior Partner', hireDate: '2019-06-01', status: 'active' },
];

export let mockCustomers: Customer[] = [
  { id: 'cust-1', dealerId: 'dealer-1', type: 'private', nameOrEntity: 'Alice Johnson', phone: '555-8888', email: 'alice@email.com', officialId: 'DL-ALICE-1', address: '1 B St', status: 'active' },
  { id: 'cust-2', dealerId: 'dealer-2', type: 'government', nameOrEntity: 'City of Somecity', contactPerson: 'Bob Williams', phone: '555-9999', email: 'bob@somecity.gov', officialId: 'GOV-456', address: '1 City Hall', status: 'active' },
  { id: 'cust-3', dealerId: 'dealer-1', type: 'private', nameOrEntity: 'Charles Brown', phone: '555-7777', email: 'charles@email.com', officialId: 'DL-CHARLES-2', address: '22 Oak St', status: 'active' },
  { id: 'cust-4', dealerId: 'dealer-1', type: 'government', nameOrEntity: 'State Highway Department', contactPerson: 'Diana Smith', phone: '555-6666', email: 'diana@highway.gov', officialId: 'GOV-789', address: '100 Capitol Ave', status: 'active' },
];

export let mockAuditLogs: AuditLog[] = [
  { id: 'log-1', whoUserId: 'admin-1', whoUserName: 'Admin User (admin)', actionType: AuditActionType.RESET_PASSWORD, details: 'Reset password for user Temp User', ipAddress: '127.0.0.1', timestamp: '2023-10-27T10:00:00Z' },
  { id: 'log-2', whoUserId: 'dealer-1-user', whoUserName: 'John Smith (jsmith at AutoWorld)', dealerId: 'dealer-1', actionType: AuditActionType.TERMINATE_EMPLOYEE, details: 'Terminated employee: Rachel Zane', ipAddress: '192.168.1.10', timestamp: '2023-10-27T11:30:00Z' },
  { id: 'log-3', whoUserId: 'dealer-2-user', whoUserName: 'Jane Doe (jdoe at Carvana)', dealerId: 'dealer-2', actionType: AuditActionType.SEARCH, details: 'Searched for: "Rachel Zane"', ipAddress: '192.168.1.12', timestamp: '2023-10-27T14:05:00Z' },
];