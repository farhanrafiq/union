import React, { useState } from 'react';
import Modal from '../common/Modal';
import Input from '../common/Input';
import Button from '../common/Button';

interface DealerDeletionModalProps {
  isOpen: boolean;
  onClose: () => void;
  dealerName: string;
  onConfirm: (reason: string) => Promise<void>;
}

const DealerDeletionModal: React.FC<DealerDeletionModalProps> = ({
  isOpen,
  onClose,
  dealerName,
  onConfirm,
}) => {
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!reason.trim()) {
      alert('Please provide a reason for deletion');
      return;
    }

    setLoading(true);
    try {
      await onConfirm(reason);
      setReason('');
      onClose();
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to delete dealer');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setReason('');
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={`Delete Dealer - ${dealerName}`}>
      <div className="space-y-4">
        <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-4">
          <p className="text-red-800 text-sm">
            <strong>Warning:</strong> This action will permanently mark the dealer as deleted. 
            All associated data will be retained for audit purposes.
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Reason for Deletion *
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Enter the reason for deleting this dealer..."
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
            disabled={loading}
          />
        </div>

        <div className="flex justify-end space-x-2">
          <Button variant="secondary" onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleSubmit} disabled={loading}>
            {loading ? 'Deleting...' : 'Delete Dealer'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default DealerDeletionModal;
