import { 
    mockUsers, 
    mockDealers, 
    mockEmployees, 
    mockCustomers, 
    mockAuditLogs
} from './mockData';
import { UserRole, Dealer, Employee, Customer, AuditLog, GlobalSearchResult, AuditActionType, User } from '../types';
import { storage } from '../utils/storage';

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

let currentUser: User | null = null;

// Helper to persist data after mutations
const persistData = () => {
    storage.setUsers(mockUsers);
    storage.setDealers(mockDealers);
    storage.setEmployees(mockEmployees);
    storage.setCustomers(mockCustomers);
    storage.setAuditLogs(mockAuditLogs);
};

const addAuditLog = (actionType: AuditActionType, details: string) => {
    if (!currentUser) return;
    const dealer = mockDealers.find(d => d.id === currentUser?.dealerId);
    const whoUserName = currentUser.role === UserRole.ADMIN 
        ? `${currentUser.name} (${currentUser.username})`
        : `${currentUser.name} (${currentUser.username} at ${dealer?.companyName || 'Unknown'})`;

    mockAuditLogs.unshift({
        id: `log-${Date.now()}`,
        whoUserId: currentUser.id,
        whoUserName: whoUserName,
        dealerId: currentUser.dealerId,
        actionType,
        details,
        ipAddress: '127.0.0.1',
        timestamp: new Date().toISOString()
    });
    persistData(); // Save after adding audit log
};

const generateGlobalIndex = (): GlobalSearchResult[] => {
    const employeeResults: GlobalSearchResult[] = mockEmployees.map(emp => {
        const dealer = mockDealers.find(d => d.id === emp.dealerId);
        return {
            entityType: 'employee',
            entityRefId: emp.id,
            canonicalName: `${emp.firstName} ${emp.lastName}`,
            phoneNorm: emp.phone.replace(/\D/g, ''),
            identityNorm: emp.aadhar.replace(/\W/g, '').toUpperCase(),
            ownerDealerId: emp.dealerId,
            ownerDealerName: dealer?.companyName || 'Unknown Dealer',
            statusSummary: emp.status,
            terminationDate: emp.terminationDate,
            terminationReason: emp.terminationReason
        };
    });

    const customerResults: GlobalSearchResult[] = mockCustomers.map(cust => {
        const dealer = mockDealers.find(d => d.id === cust.dealerId);
        return {
            entityType: 'customer',
            entityRefId: cust.id,
            canonicalName: cust.nameOrEntity,
            phoneNorm: cust.phone.replace(/\D/g, ''),
            identityNorm: cust.officialId.replace(/\W/g, '').toUpperCase(),
            ownerDealerId: cust.dealerId,
            ownerDealerName: dealer?.companyName || 'Unknown Dealer',
            statusSummary: cust.status,
            customerType: cust.type,
        };
    });

    return [...employeeResults, ...customerResults];
};


export const api = {
  setCurrentUser: (user: User | null) => {
    currentUser = user;
  },

  loginAsAdmin: async (password: string) => {
    await delay(500);
    if (password !== 'Union@2025') throw new Error('Invalid admin password.');
    const adminUser = mockUsers.find(u => u.role === UserRole.ADMIN);
    if (!adminUser) throw new Error('Admin user could not be found.');
    currentUser = adminUser;
    addAuditLog(AuditActionType.LOGIN, "Admin logged in");
    return { user: adminUser, temporaryPassword: !!adminUser.tempPassword };
  },

  loginAsDealer: async (emailOrUsername: string, password: string) => {
    await delay(500);
    const loginIdentifier = emailOrUsername.toLowerCase();
    const user = mockUsers.find(u => 
        (u.email.toLowerCase() === loginIdentifier || u.username.toLowerCase() === loginIdentifier) 
        && u.role === UserRole.DEALER
    );

    if (!user) throw new Error('User not found or invalid credentials.');
    
    const hasTempPassword = !!user.tempPassword;
    if (hasTempPassword && password !== user.tempPassword) throw new Error('Invalid temporary password.');
    if (!hasTempPassword && password !== 'password123') throw new Error('Invalid password.');

    currentUser = user;
    addAuditLog(AuditActionType.LOGIN, `User ${user.name} logged in.`);
    return { user, temporaryPassword: hasTempPassword };
  },
  
  changePassword: async (userId: string, newPassword: string) => {
    await delay(500);
    const user = mockUsers.find(u => u.id === userId);
    if (user) {
        user.tempPassword = null;
        user.tempPasswordExpiry = null;
        addAuditLog(AuditActionType.CHANGE_PASSWORD, "User changed their temporary password.");
        persistData();
        console.log(`Password for ${user.email} changed to ${newPassword}`);
    }
  },

  updateUserProfile: async (userId: string, data: Partial<User>): Promise<User> => {
      await delay(400);
      const userIndex = mockUsers.findIndex(u => u.id === userId);
      if (userIndex !== -1) {
          mockUsers[userIndex] = { ...mockUsers[userIndex], ...data };
          addAuditLog(AuditActionType.UPDATE_DEALER, `User profile for ${mockUsers[userIndex].name} updated.`);
          persistData();
          return mockUsers[userIndex];
      }
      throw new Error("User not found");
  },

  getDealers: async (): Promise<Dealer[]> => { await delay(300); return [...mockDealers].sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()); },
  getAuditLogs: async (): Promise<AuditLog[]> => { await delay(400); return [...mockAuditLogs]; },
  getDealerAuditLogs: async(dealerId: string): Promise<AuditLog[]> => {
      await delay(400);
      return [...mockAuditLogs].filter(log => log.dealerId === dealerId);
  },

  createDealer: async (dealerData: Omit<Dealer, 'id' | 'status' | 'createdAt'>, username: string) => {
    await delay(500);
    if (mockUsers.some(u => u.username.toLowerCase() === username.toLowerCase())) {
        throw new Error(`Username "${username}" is already taken.`);
    }
    const newDealer: Dealer = { 
        id: `dealer-${Date.now()}`, 
        status: 'active', 
        createdAt: new Date().toISOString(),
        ...dealerData 
    };
    mockDealers.push(newDealer);
    
    const tempPassword = `temp_${Math.random().toString(36).slice(-8)}`;
    const newUser: User = {
        id: `user-${Date.now()}`,
        email: newDealer.primaryContactEmail,
        username: username,
        name: newDealer.primaryContactName,
        role: UserRole.DEALER,
        dealerId: newDealer.id,
        tempPassword: tempPassword,
        tempPasswordExpiry: new Date(Date.now() + 72 * 3600 * 1000).toISOString()
    }
    mockUsers.push(newUser);
    addAuditLog(AuditActionType.CREATE_DEALER, `Created dealer ${newDealer.companyName}`);
    persistData();
    return { dealer: newDealer, tempPassword };
  },

  updateDealer: async (dealerId: string, data: Partial<Omit<Dealer, 'id' | 'status' | 'createdAt'>>) => {
      await delay(500);
      const dealerIndex = mockDealers.findIndex(d => d.id === dealerId);
      if (dealerIndex !== -1) {
          mockDealers[dealerIndex] = { ...mockDealers[dealerIndex], ...data };
          addAuditLog(AuditActionType.UPDATE_DEALER, `Updated dealer ${mockDealers[dealerIndex].companyName}`);
          persistData();
          return mockDealers[dealerIndex];
      }
      throw new Error("Dealer not found");
  },

  resetDealerPassword: async (dealerId: string): Promise<string> => {
      await delay(500);
      const user = mockUsers.find(u => u.dealerId === dealerId);
      if (user) {
          const tempPassword = `temp_${Math.random().toString(36).slice(-8)}`;
          user.tempPassword = tempPassword;
          user.tempPasswordExpiry = new Date(Date.now() + 72 * 3600 * 1000).toISOString();
          addAuditLog(AuditActionType.RESET_PASSWORD, `Reset password for user ${user.name}`);
          persistData();
          return tempPassword;
      }
      throw new Error("User for dealer not found");
  },

  getEmployees: async (dealerId: string): Promise<Employee[]> => { await delay(300); return mockEmployees.filter(e => e.dealerId === dealerId); },
  getCustomers: async (dealerId: string): Promise<Customer[]> => { await delay(300); return mockCustomers.filter(c => c.dealerId === dealerId); },
  
  createEmployee: async (dealerId: string, employeeData: Omit<Employee, 'id' | 'dealerId' | 'status'>): Promise<Employee> => {
      await delay(500);
      // Check for duplicate Aadhar number
      const duplicateAadhar = mockEmployees.find(e => e.aadhar === employeeData.aadhar);
      if (duplicateAadhar) {
          throw new Error(`An employee with Aadhar number ${employeeData.aadhar} already exists.`);
      }
      const newEmployee: Employee = { id: `emp-${Date.now()}`, dealerId, status: 'active', ...employeeData};
      mockEmployees.push(newEmployee);
      addAuditLog(AuditActionType.CREATE_EMPLOYEE, `Created employee ${newEmployee.firstName} ${newEmployee.lastName}`);
      persistData();
      return newEmployee;
  },

  updateEmployee: async(employeeId: string, data: Partial<Employee>): Promise<Employee> => {
      await delay(500);
      const index = mockEmployees.findIndex(e => e.id === employeeId);
      if (index > -1) {
          // Check for duplicate Aadhar if it's being updated
          if (data.aadhar) {
              const duplicateAadhar = mockEmployees.find(e => e.aadhar === data.aadhar && e.id !== employeeId);
              if (duplicateAadhar) {
                  throw new Error(`An employee with Aadhar number ${data.aadhar} already exists.`);
              }
          }
          mockEmployees[index] = { ...mockEmployees[index], ...data };
          addAuditLog(AuditActionType.UPDATE_EMPLOYEE, `Updated employee ${mockEmployees[index].firstName} ${mockEmployees[index].lastName}`);
          persistData();
          return mockEmployees[index];
      }
      throw new Error("Employee not found");
  },

  terminateEmployee: async (employeeId: string, reason: string, date: string): Promise<Employee> => {
      await delay(500);
      const index = mockEmployees.findIndex(e => e.id === employeeId);
      if (index > -1) {
          mockEmployees[index].status = 'terminated';
          mockEmployees[index].terminationReason = reason;
          mockEmployees[index].terminationDate = date;
          addAuditLog(AuditActionType.TERMINATE_EMPLOYEE, `Terminated employee ${mockEmployees[index].firstName} ${mockEmployees[index].lastName}`);
          persistData();
          return mockEmployees[index];
      }
      throw new Error("Employee not found");
  },

  createCustomer: async (dealerId: string, customerData: Omit<Customer, 'id' | 'dealerId' | 'status'>): Promise<Customer> => {
      await delay(500);
      // Check for duplicate official ID
      const duplicateOfficialId = mockCustomers.find(c => c.officialId === customerData.officialId);
      if (duplicateOfficialId) {
          throw new Error(`A customer with official ID ${customerData.officialId} already exists.`);
      }
      const newCustomer: Customer = { id: `cust-${Date.now()}`, dealerId, status: 'active', ...customerData };
      mockCustomers.push(newCustomer);
      addAuditLog(AuditActionType.CREATE_CUSTOMER, `Created customer ${newCustomer.nameOrEntity}`);
      persistData();
      return newCustomer;
  },

  updateCustomer: async(customerId: string, data: Partial<Customer>): Promise<Customer> => {
      await delay(500);
      const index = mockCustomers.findIndex(c => c.id === customerId);
      if (index > -1) {
          // Check for duplicate official ID if it's being updated
          if (data.officialId) {
              const duplicateOfficialId = mockCustomers.find(c => c.officialId === data.officialId && c.id !== customerId);
              if (duplicateOfficialId) {
                  throw new Error(`A customer with official ID ${data.officialId} already exists.`);
              }
          }
          mockCustomers[index] = { ...mockCustomers[index], ...data };
          addAuditLog(AuditActionType.UPDATE_CUSTOMER, `Updated customer ${mockCustomers[index].nameOrEntity}`);
          persistData();
          return mockCustomers[index];
      }
      throw new Error("Customer not found");
  },

  terminateCustomer: async (customerId: string): Promise<Customer> => {
      await delay(500);
      const index = mockCustomers.findIndex(c => c.id === customerId);
      if (index > -1) {
          mockCustomers[index].status = 'inactive';
          addAuditLog(AuditActionType.UPDATE_CUSTOMER, `Deactivated customer ${mockCustomers[index].nameOrEntity}`);
          persistData();
          return mockCustomers[index];
      }
      throw new Error("Customer not found");
  },
  
  universalSearch: async (query: string): Promise<GlobalSearchResult[]> => {
    await delay(700);
    const lowerQuery = query.toLowerCase().trim();
    if (!lowerQuery) return [];
    
    addAuditLog(AuditActionType.SEARCH, `Searched for: "${query}"`);
    const mockGlobalIndex = generateGlobalIndex();

    return mockGlobalIndex.filter(item => 
      item.canonicalName.toLowerCase().includes(lowerQuery) ||
      item.phoneNorm.includes(lowerQuery.replace(/\D/g, '')) ||
      (item.identityNorm && item.identityNorm.toLowerCase().includes(lowerQuery.replace(/\W/g, '')))
    );
  },
};