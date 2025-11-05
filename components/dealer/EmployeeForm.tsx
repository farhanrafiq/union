import React, { useState, useEffect } from 'react';
import { Employee } from '../../types';
import Input from '../common/Input';
import Button from '../common/Button';
import { api } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';

interface EmployeeFormProps {
  employee: Employee | null;
  onSave: () => void;
}

const EmployeeForm: React.FC<EmployeeFormProps> = ({ employee, onSave }) => {
    const { user } = useAuth();
    const [error, setError] = useState('');
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        position: '',
        hireDate: new Date().toISOString().split('T')[0],
        aadhar: '',
    });

    useEffect(() => {
        if (employee) {
            setFormData({
                firstName: employee.firstName,
                lastName: employee.lastName,
                email: employee.email,
                phone: employee.phone,
                position: employee.position,
                hireDate: employee.hireDate,
                aadhar: employee.aadhar,
            });
        }
    }, [employee]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        
        // Restrict phone to 10 digits only
        if (name === 'phone') {
            const digitsOnly = value.replace(/\D/g, '');
            if (digitsOnly.length <= 10) {
                setFormData(prev => ({ ...prev, [name]: digitsOnly }));
            }
            return;
        }
        
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user?.dealerId) return;
        
        setError('');
        
        // Validate phone is exactly 10 digits
        if (formData.phone.length !== 10) {
            setError('Phone number must be exactly 10 digits');
            return;
        }
        
        try {
            const submissionData = { ...formData };

            if (employee) {
                await api.updateEmployee(employee.id, submissionData);
            } else {
                await api.createEmployee(user.dealerId, submissionData);
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input label="First Name" name="firstName" value={formData.firstName} onChange={handleChange} required />
                <Input label="Last Name" name="lastName" value={formData.lastName} onChange={handleChange} required />
            </div>
            <Input label="Email" name="email" type="email" value={formData.email} onChange={handleChange} required />
            <Input label="Phone" name="phone" value={formData.phone} onChange={handleChange} required />
            <Input label="Position" name="position" value={formData.position} onChange={handleChange} required />
            <Input label="Hire Date" name="hireDate" type="date" value={formData.hireDate} onChange={handleChange} required />
            <Input label="Aadhar Number" name="aadhar" value={formData.aadhar} onChange={handleChange} required />
            <div className="flex justify-end pt-4">
                <Button type="submit">
                {employee ? 'Save Changes' : 'Create Employee'}
                </Button>
            </div>
        </form>
    );
};

export default EmployeeForm;