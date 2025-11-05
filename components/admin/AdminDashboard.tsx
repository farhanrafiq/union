import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Dealer, AuditLog } from '../../types';
import Card from '../common/Card';
import Button from '../common/Button';
import Table from '../common/Table';
import Badge from '../common/Badge';
import { formatDateTime, downloadCSV } from '../../utils/helpers';
import DealerForm from './DealerForm';
import Modal from '../common/Modal';
import UniversalEmployeeSearchPage from '../dealer/UniversalEmployeeSearchPage';
import DealerSuspensionModal from './DealerSuspensionModal';
import DealerDeletionModal from './DealerDeletionModal';

const UsersIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M15 21v-1a6 6 0 00-5.176-5.973" />
    </svg>
);

const SearchIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
);

const TerminationIcon = () => (
     <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
    </svg>
);

interface AdminDashboardProps {
  currentPage?: string;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ currentPage = 'Dashboard' }) => {
  const [dealers, setDealers] = useState<Dealer[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [isDealerModalOpen, setIsDealerModalOpen] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [selectedDealer, setSelectedDealer] = useState<Dealer | null>(null);
  const [dealerToReset, setDealerToReset] = useState<Dealer | null>(null);
  const [passwordInfo, setPasswordInfo] = useState<{ dealerName: string, tempPass: string } | null>(null);
  const [error, setError] = useState('');
  
  const [isSuspensionModalOpen, setIsSuspensionModalOpen] = useState(false);
  const [isDeletionModalOpen, setIsDeletionModalOpen] = useState(false);
  const [dealerToSuspend, setDealerToSuspend] = useState<Dealer | null>(null);
  const [dealerToDelete, setDealerToDelete] = useState<Dealer | null>(null);

  const fetchData = async () => {
      const dealersData = await api.getDealers();
      const auditLogsData = await api.getAuditLogs();
      setDealers(dealersData);
      setAuditLogs(auditLogsData);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateDealer = () => {
    setSelectedDealer(null);
    setError('');
    setIsDealerModalOpen(true);
  };
  
  const handleEditDealer = (dealer: Dealer) => {
    setSelectedDealer(dealer);
    setError('');
    setIsDealerModalOpen(true);
  };

  const handleSaveDealer = async (formData: Omit<Dealer, 'id' | 'status' | 'createdAt'>, username: string) => {
    setError('');
    try {
        if (selectedDealer) { // Editing existing dealer
            await api.updateDealer(selectedDealer.id, formData);
        } else { // Creating new dealer
            const { dealer, tempPassword } = await api.createDealer(formData, username);
            setPasswordInfo({ dealerName: dealer.primaryContactName, tempPass: tempPassword });
        }
        setIsDealerModalOpen(false);
        setSelectedDealer(null);
        fetchData();
    } catch (err) {
        setError((err as Error).message);
    }
  };

  const handleOpenResetModal = (dealer: Dealer) => {
    setDealerToReset(dealer);
    setIsResetModalOpen(true);
  };

  const handleConfirmReset = async () => {
    if (dealerToReset) {
      const newPassword = await api.resetDealerPassword(dealerToReset.id);
      setPasswordInfo({ dealerName: dealerToReset.primaryContactName, tempPass: newPassword });
      setIsResetModalOpen(false);
      setDealerToReset(null);
      fetchData();
    }
  };

  const handleExportDealers = () => downloadCSV(dealers, 'dealers_export');
  const handleExportLogs = () => downloadCSV(auditLogs, 'auditlog_export');

  const handleSuspendDealer = (dealer: Dealer) => {
    setDealerToSuspend(dealer);
    setIsSuspensionModalOpen(true);
  };

  const handleConfirmSuspend = async (reason: string) => {
    if (dealerToSuspend) {
      await api.suspendDealer(dealerToSuspend.id, reason);
      setIsSuspensionModalOpen(false);
      setDealerToSuspend(null);
      fetchData();
    }
  };

  const handleActivateDealer = async (dealer: Dealer) => {
    if (confirm(`Are you sure you want to activate ${dealer.companyName}?`)) {
      await api.activateDealer(dealer.id);
      fetchData();
    }
  };

  const handleDeleteDealer = (dealer: Dealer) => {
    setDealerToDelete(dealer);
    setIsDeletionModalOpen(true);
  };

  const handleConfirmDelete = async (reason: string) => {
    if (dealerToDelete) {
      await api.deleteDealer(dealerToDelete.id, reason);
      setIsDeletionModalOpen(false);
      setDealerToDelete(null);
      fetchData();
    }
  };

  const recentSearches = auditLogs.filter(log => log.actionType === 'search').length;
  const recentTerminations = auditLogs.filter(log => log.actionType === 'terminate_employee').length;
  const activeDealersCount = dealers.filter(d => d.status !== 'deleted').length;

  const renderStats = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
      <Card>
        <div className="flex items-center">
          <UsersIcon />
          <div className="ml-4">
            <p className="text-lg font-semibold text-gray-700">{activeDealersCount}</p>
            <p className="text-sm text-gray-500">Active Dealers</p>
          </div>
        </div>
      </Card>
      <Card>
        <div className="flex items-center">
          <SearchIcon />
          <div className="ml-4">
            <p className="text-lg font-semibold text-gray-700">{recentSearches}</p>
            <p className="text-sm text-gray-500">Recent Searches</p>
          </div>
        </div>
      </Card>
      <Card>
        <div className="flex items-center">
          <TerminationIcon />
          <div className="ml-4">
            <p className="text-lg font-semibold text-gray-700">{recentTerminations}</p>
            <p className="text-sm text-gray-500">Recent Terminations</p>
          </div>
        </div>
      </Card>
    </div>
  );

  const renderDealersList = (dealerList: Dealer[], title: string, showActions: boolean) => (
    <Card title={title} actions={showActions &&
      <div className="flex items-center gap-2">
          <Button onClick={handleExportDealers} variant="secondary">Export CSV</Button>
          <Button onClick={handleCreateDealer}>Create Dealer</Button>
      </div>
    }>
      <Table headers={['Company Name', 'Contact', 'Status', 'Actions']}>
        {dealerList.map(dealer => (
          <tr key={dealer.id} className="text-gray-700">
            <td className="px-4 py-3">
              <p className="font-semibold">{dealer.companyName}</p>
              <p className="text-xs text-gray-600">{dealer.address}</p>
            </td>
            <td className="px-4 py-3">
              <p>{dealer.primaryContactName}</p>
              <p className="text-xs text-gray-600">{dealer.primaryContactEmail}</p>
            </td>
            <td className="px-4 py-3">
              <Badge color={dealer.status === 'active' ? 'green' : dealer.status === 'suspended' ? 'yellow' : 'red'}>
                {dealer.status}
              </Badge>
              {dealer.suspensionReason && (
                <p className="text-xs text-gray-600 mt-1">Reason: {dealer.suspensionReason}</p>
              )}
              {dealer.deletionReason && (
                <p className="text-xs text-gray-600 mt-1">Reason: {dealer.deletionReason}</p>
              )}
            </td>
            <td className="px-4 py-3 text-right align-middle min-w-[280px]">
              <div className="inline-flex items-center gap-2 flex-wrap">
                {dealer.status !== 'deleted' && (
                  <>
                    <Button size="sm" variant="secondary" className="whitespace-nowrap" onClick={() => handleEditDealer(dealer)}>Edit</Button>
                    <Button size="sm" variant="secondary" className="whitespace-nowrap" onClick={() => handleOpenResetModal(dealer)}>Reset PW</Button>
                  </>
                )}
                {dealer.status === 'active' && (
                  <Button size="sm" variant="danger" className="whitespace-nowrap" onClick={() => handleSuspendDealer(dealer)}>Suspend</Button>
                )}
                {dealer.status === 'suspended' && (
                  <Button size="sm" variant="primary" className="whitespace-nowrap" onClick={() => handleActivateDealer(dealer)}>Activate</Button>
                )}
                {dealer.status !== 'deleted' && (
                  <Button size="sm" variant="danger" className="whitespace-nowrap" onClick={() => handleDeleteDealer(dealer)}>Delete</Button>
                )}
              </div>
            </td>
          </tr>
        ))}
      </Table>
       {dealerList.length === 0 && <p className="text-center text-gray-500 py-4">No dealers found.</p>}
    </Card>
  );

  const renderAuditLogsList = (logList: AuditLog[], title: string, showActions: boolean) => (
    <Card title={title} actions={showActions && <Button onClick={handleExportLogs} variant="secondary">Export CSV</Button>}>
        <Table headers={["Timestamp", "User", "Action", "Details"]}>
        {logList.map(log => (
            <tr key={log.id} className="text-gray-700">
                <td className="px-4 py-3 text-sm">{formatDateTime(log.timestamp)}</td>
                <td className="px-4 py-3 text-sm">{log.whoUserName}</td>
                <td className="px-4 py-3 text-sm capitalize">{log.actionType.replace(/_/g, ' ')}</td>
                <td className="px-4 py-3 text-sm">{log.details}</td>
            </tr>
        ))}
        </Table>
        {logList.length === 0 && <p className="text-center text-gray-500 py-4">No audit logs found.</p>}
    </Card>
  );

  const renderDashboardView = () => {
    const activeDealers = dealers.filter(d => d.status !== 'deleted');
    return (
      <>
          {renderStats()}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
              {renderDealersList(activeDealers.slice(0, 5), "Recently Added Dealers", false)}
              {renderAuditLogsList(auditLogs.slice(0, 5), "Recent Activity", false)}
          </div>
      </>
    );
  };

  return (
    <>
      <h1 className="text-3xl font-semibold text-gray-800 mb-6">
        {currentPage === 'Dashboard' ? 'Admin Dashboard' : currentPage}
      </h1>

      {currentPage === 'Dashboard' && renderDashboardView()}
      
      {currentPage === 'Dealers' && (
        <div className="mb-8">{renderDealersList(dealers, "Manage Dealers", true)}</div>
      )}

      {currentPage === 'Audit Logs' && (
        <div className="mb-8">{renderAuditLogsList(auditLogs, "Global Audit Log", true)}</div>
      )}

      {currentPage === 'Universal Search' && (
        <div className="mb-8"><UniversalEmployeeSearchPage /></div>
      )}

      <Modal isOpen={isDealerModalOpen} onClose={() => setIsDealerModalOpen(false)} title={selectedDealer ? 'Edit Dealer' : 'Create New Dealer'}>
        <DealerForm dealer={selectedDealer} onSave={handleSaveDealer} onCancel={() => setIsDealerModalOpen(false)} formError={error} />
      </Modal>

      <Modal isOpen={isResetModalOpen} onClose={() => setIsResetModalOpen(false)} title="Confirm Password Reset">
        <p>Are you sure you want to reset the password for <strong>{dealerToReset?.companyName}</strong>? A new temporary password will be generated and the user will be forced to change it on next login.</p>
        <div className="flex justify-end gap-4 mt-6">
            <Button variant="secondary" onClick={() => setIsResetModalOpen(false)}>Cancel</Button>
            <Button variant="danger" onClick={handleConfirmReset}>Confirm Reset</Button>
        </div>
      </Modal>

      <Modal isOpen={!!passwordInfo} onClose={() => setPasswordInfo(null)} title="Temporary Password">
        <p>Please provide the following temporary password to <strong>{passwordInfo?.dealerName}</strong>:</p>
        <div className="my-4 p-3 bg-gray-100 rounded-md text-center">
            <code className="text-lg font-mono tracking-wider">{passwordInfo?.tempPass}</code>
        </div>
        <p className="text-sm text-gray-500">They will be required to change this password upon their next login.</p>
        <div className="flex justify-end mt-6">
            <Button onClick={() => setPasswordInfo(null)}>Close</Button>
        </div>
      </Modal>

      <DealerSuspensionModal
        isOpen={isSuspensionModalOpen}
        onClose={() => {
          setIsSuspensionModalOpen(false);
          setDealerToSuspend(null);
        }}
        dealerName={dealerToSuspend?.companyName || ''}
        onConfirm={handleConfirmSuspend}
      />

      <DealerDeletionModal
        isOpen={isDeletionModalOpen}
        onClose={() => {
          setIsDeletionModalOpen(false);
          setDealerToDelete(null);
        }}
        dealerName={dealerToDelete?.companyName || ''}
        onConfirm={handleConfirmDelete}
      />
    </>
  );
};

export default AdminDashboard;