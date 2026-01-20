import React, { useState } from 'react';
import { useLoginMutation, useRegisterMutation } from '../../store/api/apiSlice';
import type { User } from '../../store/api/apiSlice';
import toast from 'react-hot-toast';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: User, tokens: { accessToken: string; refreshToken: string }) => void;
}

export default function AuthModal({ isOpen, onClose, onSuccess }: AuthModalProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: ''
  });

  const [login, { isLoading: isLoggingIn }] = useLoginMutation();
  const [register, { isLoading: isRegistering }] = useRegisterMutation();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isLogin) {
      try {
        const result = await login({
          identifier: formData.email || formData.username,
          password: formData.password
        }).unwrap();

        toast.success('Login successful!');
        onSuccess(result.user, {
          accessToken: result.accessToken,
          refreshToken: result.refreshToken
        });
        onClose();
      } catch (error: any) {
        toast.error(error.data?.message || 'Login failed');
      }
    } else {
      // Registration validation
      if (formData.password !== formData.confirmPassword) {
        toast.error('Passwords do not match');
        return;
      }

      if (formData.password.length < 6) {
        toast.error('Password must be at least 6 characters');
        return;
      }

      try {
        const result = await register({
          username: formData.username,
          email: formData.email,
          password: formData.password,
          firstName: formData.firstName,
          lastName: formData.lastName
        }).unwrap();

        toast.success('Registration successful!');
        onSuccess(result.user, {
          accessToken: result.accessToken,
          refreshToken: result.refreshToken
        });
        onClose();
      } catch (error: any) {
        toast.error(error.data?.message || 'Registration failed');
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: '#1e1e1e',
        borderRadius: '8px',
        padding: '24px',
        width: '100%',
        maxWidth: '400px',
        border: '1px solid #3d3d3d'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '24px'
        }}>
          <h2 style={{ color: '#cccccc', margin: 0 }}>
            {isLogin ? 'Login' : 'Register'}
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#858585',
              cursor: 'pointer',
              fontSize: '20px',
              padding: '4px'
            }}
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'flex', gap: '16px', marginBottom: '20px' }}>
            <button
              type="button"
              onClick={() => setIsLogin(true)}
              style={{
                flex: 1,
                padding: '8px 16px',
                backgroundColor: isLogin ? '#007acc' : '#2d2d2d',
                color: '#cccccc',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Login
            </button>
            <button
              type="button"
              onClick={() => setIsLogin(false)}
              style={{
                flex: 1,
                padding: '8px 16px',
                backgroundColor: !isLogin ? '#007acc' : '#2d2d2d',
                color: '#cccccc',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Register
            </button>
          </div>

          {!isLogin && (
            <>
              <div style={{ marginBottom: '16px' }}>
                <input
                  type="text"
                  name="username"
                  placeholder="Username"
                  value={formData.username}
                  onChange={handleInputChange}
                  required
                  style={{
                    width: '100%',
                    padding: '10px',
                    backgroundColor: '#2d2d2d',
                    border: '1px solid #3d3d3d',
                    borderRadius: '4px',
                    color: '#cccccc',
                    fontSize: '14px'
                  }}
                />
              </div>
              <div style={{ marginBottom: '16px' }}>
                <input
                  type="text"
                  name="firstName"
                  placeholder="First Name (optional)"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  style={{
                    width: '100%',
                    padding: '10px',
                    backgroundColor: '#2d2d2d',
                    border: '1px solid #3d3d3d',
                    borderRadius: '4px',
                    color: '#cccccc',
                    fontSize: '14px'
                  }}
                />
              </div>
              <div style={{ marginBottom: '16px' }}>
                <input
                  type="text"
                  name="lastName"
                  placeholder="Last Name (optional)"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  style={{
                    width: '100%',
                    padding: '10px',
                    backgroundColor: '#2d2d2d',
                    border: '1px solid #3d3d3d',
                    borderRadius: '4px',
                    color: '#cccccc',
                    fontSize: '14px'
                  }}
                />
              </div>
            </>
          )}

          <div style={{ marginBottom: '16px' }}>
            <input
              type="email"
              name="email"
              placeholder="Email"
              value={formData.email}
              onChange={handleInputChange}
              required
              style={{
                width: '100%',
                padding: '10px',
                backgroundColor: '#2d2d2d',
                border: '1px solid #3d3d3d',
                borderRadius: '4px',
                color: '#cccccc',
                fontSize: '14px'
              }}
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <input
              type="password"
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleInputChange}
              required
              style={{
                width: '100%',
                padding: '10px',
                backgroundColor: '#2d2d2d',
                border: '1px solid #3d3d3d',
                borderRadius: '4px',
                color: '#cccccc',
                fontSize: '14px'
              }}
            />
          </div>

          {!isLogin && (
            <div style={{ marginBottom: '24px' }}>
              <input
                type="password"
                name="confirmPassword"
                placeholder="Confirm Password"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                required
                style={{
                  width: '100%',
                  padding: '10px',
                  backgroundColor: '#2d2d2d',
                  border: '1px solid #3d3d3d',
                  borderRadius: '4px',
                  color: '#cccccc',
                  fontSize: '14px'
                }}
              />
            </div>
          )}

          <button
            type="submit"
            disabled={isLoggingIn || isRegistering}
            style={{
              width: '100%',
              padding: '12px',
              backgroundColor: '#007acc',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: (isLoggingIn || isRegistering) ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              opacity: (isLoggingIn || isRegistering) ? 0.7 : 1
            }}
          >
            {isLogin ? (isLoggingIn ? 'Logging in...' : 'Login') : (isRegistering ? 'Registering...' : 'Register')}
          </button>
        </form>
      </div>
    </div>
  );
}