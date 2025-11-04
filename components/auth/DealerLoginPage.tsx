import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import Button from '../common/Button';
import Input from '../common/Input';
import Card from '../common/Card';

interface DealerLoginPageProps {
    onBack: () => void;
}

const DealerLoginPage: React.FC<DealerLoginPageProps> = ({ onBack }) => {
  const { dealerLogin } = useAuth();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await dealerLogin(identifier, password, rememberMe);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-grow items-center justify-center bg-background">
      <div className="w-full max-w-md px-4">
        <h1 className="text-3xl font-bold text-center text-gray-800 mb-2">Dealer Login</h1>
        <p className="text-center text-gray-600 mb-8">Use the credentials provided by your administrator.</p>
        <Card>
          <form onSubmit={handleLogin} className="space-y-6">
            <Input
              id="identifier"
              label="Username or Email"
              type="text"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="jsmith or you@company.com"
              disabled={loading}
              autoFocus
            />
            <Input
              id="password"
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••"
              disabled={loading}
            />
            
            <div className="flex items-center">
                <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                    Remember me
                </label>
            </div>
            
            {error && <p className="text-sm text-red-600 text-center">{error}</p>}
            
            <div className="flex flex-col gap-4">
                <Button type="submit" className="w-full" disabled={loading || !identifier || !password}>
                    {loading ? 'Logging in...' : 'Login'}
                </Button>
                <Button variant="secondary" type="button" onClick={onBack} className="w-full" disabled={loading}>
                    Back
                </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default DealerLoginPage;