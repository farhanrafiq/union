import React, { useState, useEffect } from 'react';
import { Dealer, User } from '../../types';
import Input from '../common/Input';
import Button from '../common/Button';

interface DealerFormProps {
  dealer: Dealer | null;
  onSave: (data: Omit<Dealer, 'id' | 'status' | 'createdAt'>, username: string) => void;
  onCancel: () => void;
  formError?: string;
}

const DealerForm: React.FC<DealerFormProps> = ({ dealer, onSave, onCancel, formError }) => {
  const [formData, setFormData] = useState({
    companyName: '',
    primaryContactName: '',
    primaryContactEmail: '',
    primaryContactPhone: '',
    address: '',
  });
  const [username, setUsername] = useState('');

  useEffect(() => {
    if (dealer) {
        setFormData({
            companyName: dealer.companyName,
            primaryContactName: dealer.primaryContactName,
            primaryContactEmail: dealer.primaryContactEmail,
            primaryContactPhone: dealer.primaryContactPhone,
            address: dealer.address,
        });
        // In a real app, you'd fetch the user to get the username.
        // For this mock, we'll leave it blank on edit as we don't have a simple way to get it.
        setUsername(''); 
    } else {
        setFormData({
            companyName: '',
            primaryContactName: '',
            primaryContactEmail: '',
            primaryContactPhone: '',
            address: '',
        });
        setUsername('');
    }
  }, [dealer]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData, username);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Company Name"
        name="companyName"
        value={formData.companyName}
        onChange={handleChange}
        required
      />
      <Input
        label="Contact Name"
        name="primaryContactName"
        value={formData.primaryContactName}
        onChange={handleChange}
        required
      />
       {!dealer && (
            <Input
                label="Username"
                name="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
            />
        )}
      <Input
        label="Contact Email"
        name="primaryContactEmail"
        type="email"
        value={formData.primaryContactEmail}
        onChange={handleChange}
        required
      />
      <Input
        label="Contact Phone"
        name="primaryContactPhone"
        value={formData.primaryContactPhone}
        onChange={handleChange}
        required
      />
      <Input
        label="Address"
        name="address"
        value={formData.address}
        onChange={handleChange}
        required
      />

      {formError && <p className="text-sm text-red-600">{formError}</p>}
      
      <div className="flex justify-end pt-4 gap-4">
        <Button type="button" variant="secondary" onClick={onCancel}>
            Cancel
        </Button>
        <Button type="submit">
          {dealer ? 'Save Changes' : 'Create Dealer'}
        </Button>
      </div>
    </form>
  );
};

export default DealerForm;