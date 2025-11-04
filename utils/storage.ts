// Local storage utility for persisting data
const STORAGE_KEYS = {
  USERS: 'union_users',
  DEALERS: 'union_dealers',
  EMPLOYEES: 'union_employees',
  CUSTOMERS: 'union_customers',
  AUDIT_LOGS: 'union_audit_logs',
  INITIALIZED: 'union_initialized'
};

export const storage = {
  // Check if data has been initialized
  isInitialized(): boolean {
    return localStorage.getItem(STORAGE_KEYS.INITIALIZED) === 'true';
  },

  // Mark as initialized
  setInitialized(): void {
    localStorage.setItem(STORAGE_KEYS.INITIALIZED, 'true');
  },

  // Generic get with type safety
  get<T>(key: string, defaultValue: T): T {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.error(`Error reading ${key} from localStorage:`, error);
      return defaultValue;
    }
  },

  // Generic set
  set<T>(key: string, value: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(`Error writing ${key} to localStorage:`, error);
    }
  },

  // Specific getters
  getUsers<T>(defaultValue: T): T {
    return this.get(STORAGE_KEYS.USERS, defaultValue);
  },

  getDealers<T>(defaultValue: T): T {
    return this.get(STORAGE_KEYS.DEALERS, defaultValue);
  },

  getEmployees<T>(defaultValue: T): T {
    return this.get(STORAGE_KEYS.EMPLOYEES, defaultValue);
  },

  getCustomers<T>(defaultValue: T): T {
    return this.get(STORAGE_KEYS.CUSTOMERS, defaultValue);
  },

  getAuditLogs<T>(defaultValue: T): T {
    return this.get(STORAGE_KEYS.AUDIT_LOGS, defaultValue);
  },

  // Specific setters
  setUsers<T>(value: T): void {
    this.set(STORAGE_KEYS.USERS, value);
  },

  setDealers<T>(value: T): void {
    this.set(STORAGE_KEYS.DEALERS, value);
  },

  setEmployees<T>(value: T): void {
    this.set(STORAGE_KEYS.EMPLOYEES, value);
  },

  setCustomers<T>(value: T): void {
    this.set(STORAGE_KEYS.CUSTOMERS, value);
  },

  setAuditLogs<T>(value: T): void {
    this.set(STORAGE_KEYS.AUDIT_LOGS, value);
  },

  // Clear all data (useful for reset)
  clearAll(): void {
    Object.values(STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
  }
};
