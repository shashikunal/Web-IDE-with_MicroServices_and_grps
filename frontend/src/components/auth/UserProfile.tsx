import { useState } from 'react';
import { useGetProfileQuery, useLogoutMutation } from '../../store/api/apiSlice';
import AdminPanel from '../admin/AdminPanel';
import toast from 'react-hot-toast';

interface UserProfileProps {
  onLogout: () => void;
  onLogin: () => void;
}

export default function UserProfile({ onLogout, onLogin }: UserProfileProps) {
  const [showDropdown, setShowDropdown] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);

  const token = localStorage.getItem('accessToken');
  const { data: profileData } = useGetProfileQuery(undefined, { skip: !token });
  const [logout] = useLogoutMutation();

  const handleLogout = async () => {
    try {
      await logout().unwrap();
      onLogout();
      toast.success('Logged out successfully');
      window.location.reload();
    } catch {
      // Even if the API call fails, we should clear local state
      onLogout();
      window.location.reload();
    }
  };

  const user = profileData?.user;

  if (!user) {
    return (
      <button
        onClick={onLogin}
        style={{
          padding: '8px 16px',
          backgroundColor: '#007acc',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: '14px'
        }}
      >
        Login
      </button>
    );
  }

  return (
    <>
      <div style={{ position: 'relative' }}>
        <button
          onClick={() => setShowDropdown(!showDropdown)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '6px 12px',
            backgroundColor: '#2d2d2d',
            border: '1px solid #3d3d3d',
            borderRadius: '4px',
            color: '#cccccc',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          <div style={{
            width: '24px',
            height: '24px',
            borderRadius: '50%',
            backgroundColor: '#007acc',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '12px',
            fontWeight: 'bold'
          }}>
            {user.username?.charAt(0).toUpperCase()}
          </div>
          <span>{user.username || 'User'}</span>
          <svg
            width="12"
            height="12"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            style={{
              transform: showDropdown ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.2s'
            }}
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {showDropdown && (
          <div style={{
            position: 'absolute',
            top: '100%',
            right: 0,
            marginTop: '8px',
            backgroundColor: '#1e1e1e',
            border: '1px solid #3d3d3d',
            borderRadius: '4px',
            minWidth: '200px',
            zIndex: 1000,
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)'
          }}>
            <div style={{ padding: '16px', borderBottom: '1px solid #3d3d3d' }}>
              <div style={{ fontWeight: '500', color: '#cccccc', marginBottom: '4px' }}>
                {user.profile?.firstName && user.profile?.lastName
                  ? `${user.profile.firstName} ${user.profile.lastName}`
                  : user.username || 'User'}
              </div>
              <div style={{ fontSize: '12px', color: '#858585', marginBottom: '8px' }}>
                @{user.username || 'User'}
              </div>
              <div style={{ fontSize: '12px', color: '#666' }}>
                {user.email}
              </div>
              <div style={{ display: 'flex', gap: '4px', marginTop: '8px' }}>
                {user.roles.map((role: string) => (
                  <span
                    key={role}
                    style={{
                      padding: '2px 6px',
                      backgroundColor: role === 'admin' ? '#f39c12' : role === 'publisher' ? '#4ec9b0' : '#007acc',
                      color: 'white',
                      borderRadius: '10px',
                      fontSize: '10px',
                      fontWeight: '500'
                    }}
                  >
                    {role}
                  </span>
                ))}
              </div>
            </div>

            <div style={{ padding: '8px 0' }}>
              {user.permissions?.canAccessAdminPanel && (
                <button
                  onClick={() => {
                    setShowAdminPanel(true);
                    setShowDropdown(false);
                  }}
                  style={{
                    width: '100%',
                    padding: '8px 16px',
                    background: 'none',
                    border: 'none',
                    color: '#cccccc',
                    textAlign: 'left',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#2d2d2d';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  Admin Panel
                </button>
              )}

              <button
                onClick={handleLogout}
                style={{
                  width: '100%',
                  padding: '8px 16px',
                  background: 'none',
                  border: 'none',
                  color: '#f14c4c',
                  textAlign: 'left',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#2d2d2d';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                Logout
              </button>
            </div>
          </div>
        )}
      </div>

      <AdminPanel
        isOpen={showAdminPanel}
        onClose={() => setShowAdminPanel(false)}
      />
    </>
  );
}