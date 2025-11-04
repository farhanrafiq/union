
import React from 'react';
import Button from '../common/Button';
import Card from '../common/Card';

interface HomePageProps {
    onAdminLogin: () => void;
    onDealerLogin: () => void;
}

const HomePage: React.FC<HomePageProps> = ({ onAdminLogin, onDealerLogin }) => {
  return (
    <div className="flex flex-grow items-center justify-center bg-background">
      <div className="w-full max-w-md px-4">
        <h1 className="text-3xl font-bold text-center text-gray-800 mb-2">Union Registry</h1>
        <p className="text-center text-gray-600 mb-8">Kashmir Petroleum Dealers Association</p>
        <Card>
            <div className="flex flex-col gap-4">
                <Button onClick={onDealerLogin} className="w-full py-3 text-base">
                Dealer Login
                </Button>
                <Button onClick={onAdminLogin} variant="secondary" className="w-full py-3 text-base">
                Admin Login
                </Button>
            </div>
        </Card>
      </div>
    </div>
  );
};

export default HomePage;