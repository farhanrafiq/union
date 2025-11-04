import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import Button from '../common/Button';
import Input from '../common/Input';
import Card from '../common/Card';

const ForcePasswordChange: React.FC = () => {
  const { user, updatePassword } = useAuth();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (newPassword.length < 10) {
      setError('Password must be at least 10 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
        await updatePassword(newPassword);
        setSuccess('Password updated successfully. You will be redirected shortly.');
    } catch(err) {
        setError((err as Error).message);
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="flex flex-grow items-center justify-center bg-background">
       <div className="w-full max-w-md px-4">
        <h1 className="text-3xl font-bold text-center text-gray-800 mb-2">Set Your New Password</h1>
        <p className="text-center text-gray-600 mb-8">For security, you must change your temporary password.</p>
        <Card>
          <form onSubmit={handleSubmit} className="space-y-6">
            <Input
              id="new-password"
              label="New Password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              disabled={loading}
            />
            <Input
              id="confirm-password"
              label="Confirm New Password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              disabled={loading}
            />
            {error && <p className="text-sm text-red-600">{error}</p>}
            {success && <p className="text-sm text-green-600">{success}</p>}
            <Button type="submit" className="w-full" disabled={!!success || loading}>
              {loading ? 'Updating...' : (success ? 'Success!' : 'Update Password')}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default ForcePasswordChange;