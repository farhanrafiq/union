import React, { useState, useEffect } from 'react';
import { getApiBase } from '../../services/http';

interface ApiCheckProps {
  children: React.ReactNode;
}

const ApiCheck: React.FC<ApiCheckProps> = ({ children }) => {
  const [checking, setChecking] = useState(true);
  const [apiConfigured, setApiConfigured] = useState(false);

  useEffect(() => {
    const checkApi = async () => {
      const apiBase = getApiBase();
      
      if (!apiBase) {
        setApiConfigured(false);
        setChecking(false);
        return;
      }

      try {
        // Try to reach the health endpoint
        const response = await fetch(`${apiBase}/health`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        });
        
        if (response.ok) {
          setApiConfigured(true);
        } else {
          setApiConfigured(false);
        }
      } catch (error) {
        console.error('API health check failed:', error);
        setApiConfigured(false);
      } finally {
        setChecking(false);
      }
    };

    checkApi();
  }, []);

  if (checking) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Connecting to Server...</h2>
          <p className="text-gray-600">Please wait while we establish connection</p>
        </div>
      </div>
    );
  }

  if (!apiConfigured) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-2xl w-full">
          <div className="flex items-center mb-6">
            <div className="bg-red-100 rounded-full p-3 mr-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">API Not Configured</h1>
          </div>

          <div className="mb-6">
            <p className="text-gray-700 mb-4">
              This application requires a backend API connection to Neon PostgreSQL database. 
              The API URL is not configured or the server is not responding.
            </p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h2 className="text-lg font-semibold text-blue-900 mb-3">Setup Instructions:</h2>
            <ol className="list-decimal list-inside space-y-2 text-gray-700">
              <li>Create a <code className="bg-gray-200 px-2 py-1 rounded text-sm">.env</code> file in the root directory</li>
              <li>Add your API URL: <code className="bg-gray-200 px-2 py-1 rounded text-sm">VITE_API_URL=your_api_url</code></li>
              <li>Ensure your backend server is running and accessible</li>
              <li>Refresh this page</li>
            </ol>
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-gray-900 mb-2">Backend Server Setup:</h3>
            <p className="text-sm text-gray-700 mb-2">Navigate to the server directory and run:</p>
            <code className="block bg-gray-800 text-green-400 p-3 rounded text-sm">
              cd server<br />
              npm install<br />
              npx prisma generate<br />
              npx prisma migrate deploy<br />
              npm start
            </code>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-yellow-800">
              <strong>Note:</strong> Make sure your Neon PostgreSQL database is created and the 
              <code className="bg-yellow-100 px-1 mx-1">DATABASE_URL</code> is configured in your server's <code className="bg-yellow-100 px-1">.env</code> file.
            </p>
          </div>

          <button
            onClick={() => window.location.reload()}
            className="mt-6 w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default ApiCheck;
