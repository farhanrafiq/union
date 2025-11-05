import { 
    mockUsers, 
    mockDealers, 
    mockEmployees, 
    mockCustomers, 
    mockAuditLogs
} from './mockData';
import { UserRole, Dealer, Employee, Customer, AuditLog, GlobalSearchResult, AuditActionType, User } from '../types';
import { storage } from '../utils/storage';
import { apiGet, apiPost, apiPatch, getApiBase } from './http';

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
            terminationDate: cust.terminationDate,
            terminationReason: cust.terminationReason
        };
    });

    return [...employeeResults, ...customerResults];
};


export const api = {
  setCurrentUser: (user: User | null) => {
    currentUser = user;
  },

  loginAsAdmin: async (password: string) => {
    // Try server API if configured
    if (getApiBase()) {
      try {
        const data = await apiPost<{ token: string; admin: { id: string; username: string; role: string } }>(
          '/api/auth/admin/login',
          { username: 'admin', password }
        );
        localStorage.setItem('ur:auth:token', data.token);
        const user: User = {
          id: data.admin.id,
          email: 'admin@union.local',
          username: data.admin.username,
          name: 'Administrator',
          role: UserRole.ADMIN,
        };
        currentUser = user;
        addAuditLog(AuditActionType.LOGIN, "Admin logged in (server)");
        return { user, temporaryPassword: false };
      } catch (e) {
        const msg = (e as Error).message || '';
        if (!msg.includes('NO_API')) throw e;
      }
    }

    // Local fallback
    await delay(500);
    if (password !== 'Union@2025') throw new Error('Invalid admin password.');
    const adminUser = mockUsers.find(u => u.role === UserRole.ADMIN);
    if (!adminUser) throw new Error('Admin user could not be found.');
    currentUser = adminUser;
    addAuditLog(AuditActionType.LOGIN, "Admin logged in");
    return { user: adminUser, temporaryPassword: !!adminUser.tempPassword };
  },

    loginAsDealer: async (emailOrUsername: string, password: string) => {
        // Try server API if configured
        if (getApiBase()) {
            try {
                const data = await apiPost<{ token: string; dealer: { id: string; username: string; email: string; forcePasswordChange: boolean } }>(
                    '/api/auth/login',
                    { username: emailOrUsername, password }
                );
                localStorage.setItem('ur:auth:token', data.token);
                const user: User = {
                    id: data.dealer.id,
                    email: data.dealer.email,
                    username: data.dealer.username,
                    name: data.dealer.username,
                    role: UserRole.DEALER,
                    dealerId: data.dealer.id,
                    tempPassword: data.dealer.forcePasswordChange ? 'TEMP' : null,
                    tempPasswordExpiry: null,
                };
                currentUser = user;
                addAuditLog(AuditActionType.LOGIN, `User ${user.name} logged in (server).`);
                return { user, temporaryPassword: data.dealer.forcePasswordChange };
            } catch (e) {
                // fall back to local if server login fails due to NO_API
                const msg = (e as Error).message || '';
                if (!msg.includes('NO_API')) throw e;
            }
        }

        // Local fallback
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
    // Try server API first
    if (getApiBase() && localStorage.getItem('ur:auth:token')) {
        try {
            await apiPost('/api/auth/change-password', { newPassword });
            // User's forcePasswordChange flag now cleared on server
            return;
        } catch (e) {
            const msg = (e as Error).message || '';
            if (!msg.includes('NO_API')) throw e;
        }
    }
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

  getDealers: async (): Promise<Dealer[]> => {
    // Try server API first
    if (getApiBase() && localStorage.getItem('ur:auth:token')) {
      try {
        const remote = await apiGet<any[]>('/api/admin/dealers');
        return remote.map(d => ({
          ...d,
          status: (d.status || 'ACTIVE').toLowerCase(),
        })) as Dealer[];
      } catch (e) {
        const msg = (e as Error).message || '';
        if (!msg.includes('NO_API')) throw e;
      }
    }
    await delay(300);
    return [...mockDealers].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  getAuditLogs: async (): Promise<AuditLog[]> => {
    // Try server API first
    if (getApiBase() && localStorage.getItem('ur:auth:token')) {
      try {
        return await apiGet<AuditLog[]>('/api/audit');
      } catch (e) {
        const msg = (e as Error).message || '';
        if (!msg.includes('NO_API')) throw e;
      }
    }
    await delay(400);
    return [...mockAuditLogs];
  },
  getDealerAuditLogs: async(dealerId: string): Promise<AuditLog[]> => {
      await delay(400);
      return [...mockAuditLogs].filter(log => log.dealerId === dealerId);
  },

  createDealer: async (dealerData: Omit<Dealer, 'id' | 'status' | 'createdAt' | 'suspensionReason' | 'deletionReason' | 'deletionDate'>, username: string) => {
    // Try server API first
    if (getApiBase() && localStorage.getItem('ur:auth:token')) {
      try {
        const payload = { ...dealerData, username };
        const response = await apiPost<{ dealer: any; tempPassword: string }>('/api/admin/dealers', payload);
        return { dealer: { ...response.dealer, status: response.dealer.status.toLowerCase() } as Dealer, tempPassword: response.tempPassword };
      } catch (e) {
        const msg = (e as Error).message || '';
        if (!msg.includes('NO_API')) throw e;
      }
    }

    // Local fallback
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

  updateDealer: async (dealerId: string, data: Partial<Omit<Dealer, 'id' | 'status' | 'createdAt' | 'suspensionReason' | 'deletionReason' | 'deletionDate'>>) => {
      // Try server API first
      if (getApiBase() && localStorage.getItem('ur:auth:token')) {
          try {
              const updated = await apiPatch<any>(`/api/admin/dealers/${dealerId}`, data);
              return { ...updated, status: updated.status.toLowerCase() } as Dealer;
          } catch (e) {
              const msg = (e as Error).message || '';
              if (!msg.includes('NO_API')) throw e;
          }
      }

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
      // Try server API first
      if (getApiBase() && localStorage.getItem('ur:auth:token')) {
          try {
              const response = await apiPost<{ tempPassword: string }>(`/api/admin/dealers/${dealerId}/reset-password`, {});
              return response.tempPassword;
          } catch (e) {
              const msg = (e as Error).message || '';
              if (!msg.includes('NO_API')) throw e;
          }
      }

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

  suspendDealer: async (dealerId: string, reason: string): Promise<Dealer> => {
      // Try server API first
      if (getApiBase() && localStorage.getItem('ur:auth:token')) {
          try {
              const updated = await apiPost<any>(`/api/admin/dealers/${dealerId}/suspend`, { reason });
              return { ...updated, status: updated.status.toLowerCase() } as Dealer;
          } catch (e) {
              const msg = (e as Error).message || '';
              if (!msg.includes('NO_API')) throw e;
          }
      }

      await delay(500);
      const dealerIndex = mockDealers.findIndex(d => d.id === dealerId);
      if (dealerIndex !== -1) {
          if (mockDealers[dealerIndex].status === 'deleted') {
              throw new Error("Cannot suspend a deleted dealer");
          }
          mockDealers[dealerIndex].status = 'suspended';
          mockDealers[dealerIndex].suspensionReason = reason;
          addAuditLog(AuditActionType.UPDATE_DEALER, `Suspended dealer ${mockDealers[dealerIndex].companyName}: ${reason}`);
          persistData();
          return mockDealers[dealerIndex];
      }
      throw new Error("Dealer not found");
  },

  activateDealer: async (dealerId: string): Promise<Dealer> => {
      // Try server API first
      if (getApiBase() && localStorage.getItem('ur:auth:token')) {
          try {
              const updated = await apiPost<any>(`/api/admin/dealers/${dealerId}/activate`, {});
              return { ...updated, status: updated.status.toLowerCase() } as Dealer;
          } catch (e) {
              const msg = (e as Error).message || '';
              if (!msg.includes('NO_API')) throw e;
          }
      }

      await delay(500);
      const dealerIndex = mockDealers.findIndex(d => d.id === dealerId);
      if (dealerIndex !== -1) {
          if (mockDealers[dealerIndex].status === 'deleted') {
              throw new Error("Cannot activate a deleted dealer");
          }
          mockDealers[dealerIndex].status = 'active';
          mockDealers[dealerIndex].suspensionReason = undefined;
          addAuditLog(AuditActionType.UPDATE_DEALER, `Activated dealer ${mockDealers[dealerIndex].companyName}`);
          persistData();
          return mockDealers[dealerIndex];
      }
      throw new Error("Dealer not found");
  },

  deleteDealer: async (dealerId: string, reason: string): Promise<Dealer> => {
      // Try server API first
      if (getApiBase() && localStorage.getItem('ur:auth:token')) {
          try {
              const updated = await apiPost<any>(`/api/admin/dealers/${dealerId}/delete`, { reason });
              return { ...updated, status: updated.status.toLowerCase() } as Dealer;
          } catch (e) {
              const msg = (e as Error).message || '';
              if (!msg.includes('NO_API')) throw e;
          }
      }

      await delay(500);
      const dealerIndex = mockDealers.findIndex(d => d.id === dealerId);
      if (dealerIndex !== -1) {
          if (mockDealers[dealerIndex].status === 'deleted') {
              throw new Error("Dealer is already deleted");
          }
          mockDealers[dealerIndex].status = 'deleted';
          mockDealers[dealerIndex].deletionReason = reason;
          mockDealers[dealerIndex].deletionDate = new Date().toISOString();
          addAuditLog(AuditActionType.UPDATE_DEALER, `Deleted dealer ${mockDealers[dealerIndex].companyName}: ${reason}`);
          persistData();
          return mockDealers[dealerIndex];
      }
      throw new Error("Dealer not found");
  },

  getEmployees: async (dealerId: string): Promise<Employee[]> => {
      // Try server API first
      if (getApiBase() && localStorage.getItem('ur:auth:token')) {
          try {
              const remote = await apiGet<any[]>('/api/employees');
              return remote.map(e => ({
                  ...e,
                  status: (e.status || 'ACTIVE').toLowerCase(),
                  hireDate: e.hireDate || new Date().toISOString().split('T')[0],
              })) as Employee[];
          } catch (e) {
              const msg = (e as Error).message || '';
              if (!msg.includes('NO_API')) throw e;
          }
      }
      await delay(300);
      return mockEmployees.filter(e => e.dealerId === dealerId);
  },
  getCustomers: async (dealerId: string): Promise<Customer[]> => {
      // Try server API first (dealerId comes from currentUser on server)
      if (getApiBase() && localStorage.getItem('ur:auth:token')) {
          try {
              const remote = await apiGet<any[]>('/api/customers');
              // Remote schema matches frontend Customer, except status enums casing
              return remote.map(c => ({
                  ...c,
                  status: (c.status || 'ACTIVE').toLowerCase(),
                  type: (c.type || 'PRIVATE').toLowerCase(),
              })) as Customer[];
          } catch (e) {
              const msg = (e as Error).message || '';
              if (!msg.includes('NO_API')) throw e;
          }
      }
      await delay(300);
      return mockCustomers.filter(c => c.dealerId === dealerId);
  },
  
  createEmployee: async (dealerId: string, employeeData: Omit<Employee, 'id' | 'dealerId' | 'status'>): Promise<Employee> => {
      // Try server API first
      if (getApiBase() && localStorage.getItem('ur:auth:token')) {
          try {
              const payload = { ...employeeData, hireDate: employeeData.hireDate };
              const created = await apiPost<any>('/api/employees', payload);
              return { ...created, status: created.status.toLowerCase() } as Employee;
          } catch (e) {
              const msg = (e as Error).message || '';
              if (!msg.includes('NO_API')) throw e;
          }
      }
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
      // Try server API first
      if (getApiBase() && localStorage.getItem('ur:auth:token')) {
          try {
              const updated = await apiPatch<any>(`/api/employees/${employeeId}`, data);
              return { ...updated, status: updated.status.toLowerCase() } as Employee;
          } catch (e) {
              const msg = (e as Error).message || '';
              if (!msg.includes('NO_API')) throw e;
          }
      }
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
      // Try server API first
      if (getApiBase() && localStorage.getItem('ur:auth:token')) {
          try {
              const updated = await apiPost<any>(`/api/employees/${employeeId}/terminate`, { reason, date });
              return { ...updated, status: updated.status.toLowerCase() } as Employee;
          } catch (e) {
              const msg = (e as Error).message || '';
              if (!msg.includes('NO_API')) throw e;
          }
      }
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
      // Try server API first
      if (getApiBase() && localStorage.getItem('ur:auth:token')) {
          try {
              const payload = { ...customerData, type: customerData.type.toUpperCase() };
              const created = await apiPost<any>('/api/customers', payload);
              return { ...created, status: created.status.toLowerCase(), type: created.type.toLowerCase() } as Customer;
          } catch (e) {
              const msg = (e as Error).message || '';
              if (!msg.includes('NO_API')) throw e;
          }
      }
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

  terminateCustomer: async (customerId: string, reason: string, date: string): Promise<Customer> => {
      await delay(500);
      const index = mockCustomers.findIndex(c => c.id === customerId);
      if (index > -1) {
          mockCustomers[index].status = 'inactive';
          mockCustomers[index].terminationReason = reason;
          mockCustomers[index].terminationDate = date;
          addAuditLog(AuditActionType.UPDATE_CUSTOMER, `Terminated customer ${mockCustomers[index].nameOrEntity}`);
          persistData();
          return mockCustomers[index];
      }
      throw new Error("Customer not found");
  },
  
  universalSearch: async (query: string): Promise<GlobalSearchResult[]> => {
    // Try server API first
    if (getApiBase() && localStorage.getItem('ur:auth:token')) {
        try {
            const results = await apiGet<any[]>(`/api/search?q=${encodeURIComponent(query)}`);
            // Normalize status fields to lowercase
            return results.map(r => ({
                ...r,
                dealerStatus: r.dealerStatus ? r.dealerStatus.toLowerCase() : 'active',
            }));
        } catch (e) {
            const msg = (e as Error).message || '';
            if (!msg.includes('NO_API')) throw e;
        }
    }

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