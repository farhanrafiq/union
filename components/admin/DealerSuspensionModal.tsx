import React, { useState } from 'react';
import Modal from '../common/Modal';
import Input from '../common/Input';
import Button from '../common/Button';

interface DealerSuspensionModalProps {
  isOpen: boolean;
  onClose: () => void;
  dealerName: string;
  onConfirm: (reason: string) => Promise<void>;
}

const DealerSuspensionModal: React.FC<DealerSuspensionModalProps> = ({
  isOpen,
  onClose,
  dealerName,
  onConfirm,
}) => {
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!reason.trim()) {
      alert('Please provide a reason for suspension');
      return;
    }

    setLoading(true);
    try {
      await onConfirm(reason);
      setReason('');
      onClose();
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to suspend dealer');
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
    <Modal isOpen={isOpen} onClose={handleClose} title={`Suspend Dealer - ${dealerName}`}>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Reason for Suspension *
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Enter the reason for suspending this dealer..."
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={loading}
          />
        </div>

        <div className="flex justify-end space-x-2">
          <Button variant="secondary" onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleSubmit} disabled={loading}>
            {loading ? 'Suspending...' : 'Suspend Dealer'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default DealerSuspensionModal;
