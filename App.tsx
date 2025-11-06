import React, { useState, useEffect } from 'react';
import HomePage from './components/auth/HomePage';
import AdminLoginPage from './components/auth/AdminLoginPage';
import DealerLoginPage from './components/auth/DealerLoginPage';
import ForcePasswordChange from './components/auth/ForcePasswordChange';
import Layout from './components/layout/Layout';
import AdminDashboard from './components/admin/AdminDashboard';
import DealerDashboard from './components/dealer/DealerDashboard';
import { useAuth } from './hooks/useAuth';
import Footer from './components/common/Footer';

type View = 'home' | 'adminLogin' | 'dealerLogin';

const API_BASE = import.meta.env.VITE_API_URL;

const ApiCheck: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [checking, setChecking] = useState(true);
  const [apiAvailable, setApiAvailable] = useState(false);

  useEffect(() => {
    if (!API_BASE) {
      setChecking(false);
      return;
    }

    fetch(`${API_BASE}/health`)
      .then((r) => r.json())
      .then(() => {
        setApiAvailable(true);
        setChecking(false);
      })
      .catch(() => {
        setChecking(false);
      });
  }, []);

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Connecting to server...</p>
        </div>
      </div>
    );
  }

  if (!API_BASE || !apiAvailable) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-red-50 p-4">
        <div className="max-w-md p-8 bg-white rounded-lg shadow-lg">
          <div className="text-red-600 text-5xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-slate-900 mb-4">API Not Configured</h1>
          <p className="text-slate-600 mb-4">
            This application requires a backend API to function. Please deploy the backend and set the environment variable.
          </p>
          <div className="bg-slate-50 p-4 rounded border border-slate-200 mb-4">
            <p className="text-sm font-mono text-slate-700">
              VITE_API_URL=https://your-api.onrender.com
            </p>
          </div>
          <p className="text-sm text-slate-500 mb-4">
            <strong>Quick Setup:</strong>
          </p>
          <ol className="text-sm text-slate-600 list-decimal list-inside space-y-2">
            <li>Create free database at <a href="https://neon.tech" className="text-indigo-600 underline" target="_blank" rel="noopener noreferrer">neon.tech</a></li>
            <li>Deploy backend to <a href="https://render.com" className="text-indigo-600 underline" target="_blank" rel="noopener noreferrer">Render</a></li>
            <li>Set VITE_API_URL environment variable</li>
            <li>Redeploy frontend</li>
          </ol>
          <p className="text-sm text-slate-500 mt-4">
            See <a href="https://github.com/farhanrafiq/union/blob/main/DEPLOYMENT.md" className="text-indigo-600 underline" target="_blank" rel="noopener noreferrer">DEPLOYMENT.md</a> for detailed instructions.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

const App: React.FC = () => {
  const { user, loading, needsPasswordChange } = useAuth();
  const [view, setView] = useState<View>('home');

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <p className="text-xl text-gray-600">Loading...</p>
      </div>
    );
  }

  const renderContent = () => {
    if (user) {
        if (needsPasswordChange) {
            return <ForcePasswordChange />;
        }
        return (
            <Layout>
                {user.role === 'admin' ? <AdminDashboard /> : <DealerDashboard />}
            </Layout>
        );
    }
    
    switch (view) {
        case 'adminLogin':
            return <AdminLoginPage onBack={() => setView('home')} />;
        case 'dealerLogin':
            return <DealerLoginPage onBack={() => setView('dealerLogin')} />;
        case 'home':
        default:
            return <HomePage onAdminLogin={() => setView('adminLogin')} onDealerLogin={() => setView('dealerLogin')} />;
    }
  };

  return (
    <ApiCheck>
      <div className="flex flex-col min-h-screen bg-background font-sans text-gray-800">
        <main className="flex-grow flex flex-col">
          {renderContent()}
        </main>
        <Footer />
      </div>
    </ApiCheck>
  );
};

export default App;