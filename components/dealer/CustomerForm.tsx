
import React, { useState, useEffect } from 'react';
import { Customer } from '../../types';
import Input from '../common/Input';
import Button from '../common/Button';
import { api } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';

interface CustomerFormProps {
  customer: Customer | null;
  onSave: () => void;
}

const CustomerForm: React.FC<CustomerFormProps> = ({ customer, onSave }) => {
    const { user } = useAuth();
    const [error, setError] = useState('');
    const [formData, setFormData] = useState({
        type: 'private' as 'private' | 'government',
        nameOrEntity: '',
        contactPerson: '',
        phone: '',
        email: '',
        officialId: '',
        address: ''
    });

    useEffect(() => {
        if (customer) {
            setFormData({
                type: customer.type,
                nameOrEntity: customer.nameOrEntity,
                contactPerson: customer.contactPerson || '',
                phone: customer.phone,
                email: customer.email,
                officialId: customer.officialId,
                address: customer.address,
            });
        }
    }, [customer]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user?.dealerId) return;

        setError('');
        try {
            const submissionData = {
                ...formData,
                contactPerson: formData.type === 'government' ? formData.contactPerson : undefined,
            };

            if (customer) {
                await api.updateCustomer(customer.id, submissionData);
            } else {
                await api.createCustomer(user.dealerId, submissionData);
            }
            onSave();
        } catch (err) {
            setError((err as Error).message);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
                    {error}
                </div>
            )}
            <div>
                <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">Customer Type</label>
                <select id="type" name="type" value={formData.type} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-gray-900 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm">
                    <option value="private">Private</option>
                    <option value="government">Government</option>
                </select>
            </div>
            <Input label={formData.type === 'private' ? 'Full Name' : 'Entity Name'} name="nameOrEntity" value={formData.nameOrEntity} onChange={handleChange} required />
            {formData.type === 'government' && (
                <Input label="Contact Person" name="contactPerson" value={formData.contactPerson} onChange={handleChange} />
            )}
            <Input label="Email" name="email" type="email" value={formData.email} onChange={handleChange} required />
            <Input label="Phone" name="phone" value={formData.phone} onChange={handleChange} required />
            <Input label={formData.type === 'private' ? 'Official ID (e.g., Driver License)' : 'Official ID (e.g., Tax ID)'} name="officialId" value={formData.officialId} onChange={handleChange} required />
            <Input label="Address" name="address" value={formData.address} onChange={handleChange} required />
            <div className="flex justify-end pt-4">
                <Button type="submit">
                {customer ? 'Save Changes' : 'Create Customer'}
                </Button>
            </div>
        </form>
    );
};

export default CustomerForm;