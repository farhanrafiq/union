import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import { User } from '../../types';
import Button from './Button';
import Input from './Input';
import { useAuth } from '../../hooks/useAuth';
import { api } from '../../services/api';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
}

const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose, user }) => {
  const { updateUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(user.name);
  const [username, setUsername] = useState(user.username);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
        setName(user.name);
        setUsername(user.username);
        setIsEditing(false);
    }
  }, [isOpen, user.name, user.username]);

  const handleSave = async () => {
    setLoading(true);
    try {
        const updatedData = { name, username };
        await api.updateUserProfile(user.id, updatedData);
        updateUser(updatedData);
        setIsEditing(false);
    } catch (error) {
        console.error("Failed to update profile", error);
    } finally {
        setLoading(false);
    }
  };

  const renderViewMode = () => (
    <>
        <div className="space-y-4">
            <div>
            <p className="text-sm font-medium text-gray-500">Name</p>
            <p className="text-lg text-gray-900">{user.name}</p>
            </div>
            <div>
            <p className="text-sm font-medium text-gray-500">Username</p>
            <p className="text-lg text-gray-900">{user.username}</p>
            </div>
            <div>
            <p className="text-sm font-medium text-gray-500">Email</p>
            <p className="text-lg text-gray-900">{user.email}</p>
            </div>
            <div>
            <p className="text-sm font-medium text-gray-500">Role</p>
            <p className="text-lg text-gray-900 capitalize">{user.role}</p>
            </div>
        </div>
        <div className="flex justify-end pt-6 gap-4">
            <Button variant="secondary" onClick={onClose}>Close</Button>
            <Button onClick={() => setIsEditing(true)}>Edit Profile</Button>
        </div>
    </>
  );

  const renderEditMode = () => (
      <>
        <div className="space-y-4">
            <Input
                label="Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={loading}
            />
            <Input
                label="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={loading}
            />
            <div>
                <p className="text-sm font-medium text-gray-500">Email</p>
                <p className="text-lg text-gray-900">{user.email}</p>
            </div>
        </div>
        <div className="flex justify-end pt-6 gap-4">
            <Button variant="secondary" onClick={() => setIsEditing(false)} disabled={loading}>Cancel</Button>
            <Button onClick={handleSave} disabled={loading || (name === user.name && username === user.username)}>
                {loading ? 'Saving...' : 'Save Changes'}
            </Button>
        </div>
      </>
  );


  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEditing ? "Edit Profile" : "User Profile"}>
        {isEditing ? renderEditMode() : renderViewMode()}
    </Modal>
  );
};

export default ProfileModal;