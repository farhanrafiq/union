import { apiGet, apiPost, apiPatch } from './http';
import type { Dealer, Employee, Customer, AuditLog } from '../types';

// ============================================
// AUTHENTICATION
// ============================================

export const loginAsAdmin = async (password: string) => {
  const result = await apiPost<{ admin: any }>('/api/auth/admin/login', { password });
  return result.admin;
};

export const loginAsDealer = async (username: string, password: string) => {
  const result = await apiPost<{ dealer: any }>('/api/auth/login', { username, password });
  return result.dealer;
};

export const getCurrentUser = async () => {
  const result = await apiGet<{ user: any }>('/api/auth/me');
  return result.user || null;
};

export const logout = async () => {
  return apiPost('/api/auth/logout', {});
};

export const forgotDealerPassword = async (username: string) => {
  return apiPost<{ success: boolean; message: string }>('/api/auth/forgot', { username });
};

export const changePassword = async (currentPassword: string, newPassword: string) => {
  return apiPost('/api/auth/change-password', { currentPassword, newPassword });
};

// ============================================
// EMPLOYEES
// ============================================

export const getEmployees = async (): Promise<Employee[]> => {
  return apiGet<Employee[]>('/api/employees');
};

export const createEmployee = async (dealerId: string, payload: any): Promise<Employee> => {
  return apiPost<Employee>('/api/employees', payload);
};

export const updateEmployee = async (id: string, payload: any): Promise<Employee> => {
  return apiPatch<Employee>(`/api/employees/${id}`, payload);
};

export const terminateEmployee = async (
  id: string,
  reason: string,
  terminationDate: string
): Promise<Employee> => {
  return apiPost<Employee>(`/api/employees/${id}/terminate`, { reason, date: terminationDate });
};

// ============================================
// CUSTOMERS
// ============================================

export const getCustomers = async (): Promise<Customer[]> => {
  return apiGet<Customer[]>('/api/customers');
};

export const createCustomer = async (dealerId: string, payload: any): Promise<Customer> => {
  return apiPost<Customer>('/api/customers', payload);
};

export const updateCustomer = async (id: string, payload: any): Promise<Customer> => {
  return apiPatch<Customer>(`/api/customers/${id}`, payload);
};

export const terminateCustomer = async (
  id: string,
  reason: string,
  terminationDate: string
): Promise<Customer> => {
  return apiPost<Customer>(`/api/customers/${id}/terminate`, { reason, date: terminationDate });
};

// ============================================
// ADMIN - DEALERS
// ============================================

export const getDealers = async (): Promise<Dealer[]> => {
  const dealers = await apiGet<any[]>('/api/admin/dealers');
  return dealers.map(d => ({ ...d, status: d.status.toLowerCase() }));
};

export const getAuditLogs = async (): Promise<AuditLog[]> => {
  return apiGet<AuditLog[]>('/api/audit');
};

export const createDealer = async (username: string, email: string, companyName: string): Promise<Dealer> => {
  const result = await apiPost<any>('/api/admin/dealers', { username, email, companyName });
  return { ...result, status: result.status.toLowerCase() };
};

export const updateDealer = async (dealerId: string, updates: Partial<Dealer>): Promise<Dealer> => {
  const updated = await apiPatch<any>(`/api/admin/dealers/${dealerId}`, updates);
  return { ...updated, status: updated.status.toLowerCase() };
};

export const resetDealerPassword = async (dealerId: string): Promise<{ tempPassword: string }> => {
  return apiPost<{ tempPassword: string }>(`/api/admin/dealers/${dealerId}/reset-password`, {});
};

export const suspendDealer = async (dealerId: string, reason: string): Promise<Dealer> => {
  const updated = await apiPost<any>(`/api/admin/dealers/${dealerId}/suspend`, { reason });
  return { ...updated, status: updated.status.toLowerCase() };
};

export const activateDealer = async (dealerId: string): Promise<Dealer> => {
  const updated = await apiPost<any>(`/api/admin/dealers/${dealerId}/activate`, {});
  return { ...updated, status: updated.status.toLowerCase() };
};

export const deleteDealer = async (dealerId: string, reason: string): Promise<Dealer> => {
  const updated = await apiPost<any>(`/api/admin/dealers/${dealerId}/delete`, { reason });
  return { ...updated, status: updated.status.toLowerCase() };
};

// ============================================
// UNIVERSAL SEARCH
// ============================================

export const universalSearch = async (query: string): Promise<any[]> => {
  const results = await apiGet<any[]>(`/api/search?q=${encodeURIComponent(query)}`);
  return results.map(r => ({
    ...r,
    dealerStatus: r.dealerStatus ? r.dealerStatus.toLowerCase() : 'active',
  }));
};

export const api = {
  loginAsAdmin,
  loginAsDealer,
  getCurrentUser,
  logout,
  forgotDealerPassword,
  changePassword,
  getEmployees,
  createEmployee,
  updateEmployee,
  terminateEmployee,
  getCustomers,
  createCustomer,
  updateCustomer,
  terminateCustomer,
  getDealers,
  getAuditLogs,
  createDealer,
  updateDealer,
  resetDealerPassword,
  suspendDealer,
  activateDealer,
  deleteDealer,
  universalSearch,
};
