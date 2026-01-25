import { useState, useEffect } from 'react';
import {
  useGetAllUsersQuery,
  useUpdateUserRolesMutation,
  useDeactivateUserMutation,
  useActivateUserMutation,
  useGetSystemStatsQuery,
  useGetProfileQuery,
} from '../../store/api/apiSlice';
import type { User, RecentUser, RecentWorkspace } from '../../store/api/apiSlice';
import toast from 'react-hot-toast';

interface AdminPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const ROLES = ['student', 'publisher', 'admin'] as const;
type Role = typeof ROLES[number];

export default function AdminPanel({ isOpen, onClose }: AdminPanelProps) {
  const [activeTab, setActiveTab] = useState<'users' | 'stats'>('users');
  const [filters, setFilters] = useState({
    page: 1,
    limit: 20,
    role: '',
    isActive: undefined as boolean | undefined,
    search: ''
  });

  const token = localStorage.getItem('accessToken');
  const { data: profileData } = useGetProfileQuery(undefined, { skip: !token });
  const user = profileData?.user;
  const isAdmin = user?.roles?.includes('admin');

  useEffect(() => {
    if (isOpen && !isAdmin) {
      toast.error('You do not have permission to access the admin panel');
      onClose();
    }
  }, [isOpen, isAdmin, onClose]);

  const { data: usersData, isLoading: usersLoading, error: usersError } = useGetAllUsersQuery(filters, {
    skip: activeTab !== 'users' || !isAdmin
  });
const { data: statsData, isLoading: statsLoading } = useGetSystemStatsQuery(undefined, {
    skip: activeTab !== 'stats' || !isAdmin
  });

  const [updateRoles] = useUpdateUserRolesMutation();
  const [deactivateUser] = useDeactivateUserMutation();
  const [activateUser] = useActivateUserMutation();

  const handleRoleChange = async (userId: string, role: Role, checked: boolean) => {
    try {
      const user = usersData?.users.find(u => u._id === userId);
      if (!user) return;

      let newRoles = [...user.roles];
      if (checked) {
        if (!newRoles.includes(role)) {
          newRoles.push(role);
        }
      } else {
        newRoles = newRoles.filter(r => r !== role);
      }

      // Ensure at least one role remains
      if (newRoles.length === 0) {
        newRoles = ['student'];
      }

      await updateRoles({ userId, roles: newRoles }).unwrap();
      toast.success('User roles updated successfully');
      } catch (error: any) {
        toast.error(error.data?.message || 'Failed to update user roles');
      }
  };

  const handleToggleUserStatus = async (userId: string, isActive: boolean) => {
    try {
      if (isActive) {
        await deactivateUser(userId).unwrap();
        toast.success('User deactivated successfully');
      } else {
        await activateUser(userId).unwrap();
        toast.success('User activated successfully');
      }
      } catch (error: any) {
        toast.error(error.data?.message || 'Failed to update user status');
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
        width: '90%',
        maxWidth: '1200px',
        height: '80vh',
        display: 'flex',
        flexDirection: 'column',
        border: '1px solid #3d3d3d',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{
          padding: '16px 24px',
          borderBottom: '1px solid #3d3d3d',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h2 style={{ color: '#cccccc', margin: 0 }}>Admin Panel</h2>
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

        {/* Tabs */}
        <div style={{
          padding: '0 24px',
          borderBottom: '1px solid #3d3d3d',
          display: 'flex',
          gap: '16px'
        }}>
          <button
            onClick={() => setActiveTab('users')}
            style={{
              padding: '12px 16px',
              background: activeTab === 'users' ? '#007acc' : 'transparent',
              color: '#cccccc',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            User Management
          </button>
          <button
            onClick={() => setActiveTab('stats')}
            style={{
              padding: '12px 16px',
              background: activeTab === 'stats' ? '#007acc' : 'transparent',
              color: '#cccccc',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            System Statistics
          </button>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflow: 'auto', padding: '24px' }}>
          {activeTab === 'users' && (
            <div>
              {/* Filters */}
              <div style={{
                display: 'flex',
                gap: '16px',
                marginBottom: '24px',
                flexWrap: 'wrap'
              }}>
                <input
                  type="text"
                  placeholder="Search users..."
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value, page: 1 }))}
                  style={{
                    padding: '8px 12px',
                    backgroundColor: '#2d2d2d',
                    border: '1px solid #3d3d3d',
                    borderRadius: '4px',
                    color: '#cccccc',
                    minWidth: '200px'
                  }}
                />
                <select
                  value={filters.role}
                  onChange={(e) => setFilters(prev => ({ ...prev, role: e.target.value, page: 1 }))}
                  style={{
                    padding: '8px 12px',
                    backgroundColor: '#2d2d2d',
                    border: '1px solid #3d3d3d',
                    borderRadius: '4px',
                    color: '#cccccc'
                  }}
                >
                  <option value="">All Roles</option>
                  {ROLES.map(role => (
                    <option key={role} value={role}>{role.charAt(0).toUpperCase() + role.slice(1)}</option>
                  ))}
                </select>
                 <select
                   value={filters.isActive === undefined ? '' : filters.isActive.toString()}
                   onChange={(e) => setFilters(prev => ({
                     ...prev,
                     isActive: e.target.value === '' ? undefined : e.target.value === 'true',
                     page: 1
                   }))}
                   style={{
                     padding: '8px 12px',
                     backgroundColor: '#2d2d2d',
                     border: '1px solid #3d3d3d',
                     borderRadius: '4px',
                     color: '#cccccc'
                   }}
                 >
                  <option value="">All Status</option>
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </select>
              </div>

              {/* Users Table */}
              {usersLoading ? (
                <div style={{ textAlign: 'center', padding: '40px' }}>
                  <div style={{
                    display: 'inline-block',
                    width: '40px',
                    height: '40px',
                    border: '3px solid #3d3d3d',
                    borderTopColor: '#007acc',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                  }} />
                </div>
              ) : usersError ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#f14c4c' }}>
                  {(usersError as any)?.data?.message || 'Failed to load users. Make sure you have admin permissions.'}
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{
                    width: '100%',
                    borderCollapse: 'collapse',
                    color: '#cccccc'
                  }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid #3d3d3d' }}>
                        <th style={{ padding: '12px', textAlign: 'left' }}>User</th>
                        <th style={{ padding: '12px', textAlign: 'left' }}>Email</th>
                        <th style={{ padding: '12px', textAlign: 'left' }}>Roles</th>
                        <th style={{ padding: '12px', textAlign: 'left' }}>Status</th>
                        <th style={{ padding: '12px', textAlign: 'left' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {usersData?.users.map((user: User) => (
                        <tr key={user._id} style={{ borderBottom: '1px solid #2d2d2d' }}>
                          <td style={{ padding: '12px' }}>
                            <div>
                              <div style={{ fontWeight: '500' }}>
                                {user.profile?.firstName && user.profile?.lastName
                                  ? `${user.profile.firstName} ${user.profile.lastName}`
                                  : user.username}
                              </div>
                              <div style={{ fontSize: '12px', color: '#858585' }}>
                                @{user.username}
                              </div>
                            </div>
                          </td>
                          <td style={{ padding: '12px' }}>{user.email}</td>
                          <td style={{ padding: '12px' }}>
                            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                              {ROLES.map(role => (
                                <label key={role} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                  <input
                                    type="checkbox"
                                    checked={user.roles.includes(role)}
                                    onChange={(e) => handleRoleChange(user._id, role, e.target.checked)}
                                    style={{ margin: 0 }}
                                  />
                                  <span style={{ fontSize: '12px' }}>{role}</span>
                                </label>
                              ))}
                            </div>
                          </td>
                          <td style={{ padding: '12px' }}>
                            <span style={{
                              padding: '4px 8px',
                              borderRadius: '4px',
                              fontSize: '12px',
                              backgroundColor: user.isActive ? '#4ec9b0' : '#f14c4c',
                              color: 'white'
                            }}>
                              {user.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td style={{ padding: '12px' }}>
                            <button
                              onClick={() => handleToggleUserStatus(user._id, user.isActive)}
                              style={{
                                padding: '6px 12px',
                                backgroundColor: user.isActive ? '#f14c4c' : '#4ec9b0',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '12px'
                              }}
                            >
                              {user.isActive ? 'Deactivate' : 'Activate'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Pagination */}
              {usersData?.pagination && (
                <div style={{
                  display: 'flex',
                  justifyContent: 'center',
                  gap: '8px',
                  marginTop: '24px'
                }}>
                  <button
                    onClick={() => setFilters(prev => ({ ...prev, page: prev.page - 1 }))}
                    disabled={filters.page <= 1}
                    style={{
                      padding: '8px 12px',
                      backgroundColor: '#2d2d2d',
                      color: '#cccccc',
                      border: '1px solid #3d3d3d',
                      borderRadius: '4px',
                      cursor: filters.page <= 1 ? 'not-allowed' : 'pointer',
                      opacity: filters.page <= 1 ? 0.5 : 1
                    }}
                  >
                    Previous
                  </button>
                   <span style={{ padding: '8px 12px', color: '#cccccc' }}>
                     Page {filters.page} of {usersData.pagination.totalPages}
                   </span>
                  <button
                    onClick={() => setFilters(prev => ({ ...prev, page: prev.page + 1 }))}
                    disabled={filters.page >= usersData.pagination.totalPages}
                    style={{
                      padding: '8px 12px',
                      backgroundColor: '#2d2d2d',
                      color: '#cccccc',
                      border: '1px solid #3d3d3d',
                      borderRadius: '4px',
                      cursor: filters.page >= usersData.pagination.totalPages ? 'not-allowed' : 'pointer',
                      opacity: filters.page >= usersData.pagination.totalPages ? 0.5 : 1
                    }}
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'stats' && (
            <div>
              {statsLoading ? (
                <div style={{ textAlign: 'center', padding: '40px' }}>
                  <div style={{
                    display: 'inline-block',
                    width: '40px',
                    height: '40px',
                    border: '3px solid #3d3d3d',
                    borderTopColor: '#007acc',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                  }} />
                </div>
              ) : statsData && (
                <div>
                  {/* Stats Cards */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '16px',
                    marginBottom: '32px'
                  }}>
                    <div style={{
                      backgroundColor: '#252526',
                      padding: '20px',
                      borderRadius: '8px',
                      border: '1px solid #3d3d3d'
                    }}>
                      <h3 style={{ color: '#cccccc', margin: '0 0 8px 0' }}>Total Users</h3>
                      <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#007acc' }}>
                        {statsData.stats.users.total}
                      </div>
                      <div style={{ fontSize: '12px', color: '#858585' }}>
                        {statsData.stats.users.active} active
                      </div>
                    </div>

                    <div style={{
                      backgroundColor: '#252526',
                      padding: '20px',
                      borderRadius: '8px',
                      border: '1px solid #3d3d3d'
                    }}>
                      <h3 style={{ color: '#cccccc', margin: '0 0 8px 0' }}>Workspaces</h3>
                      <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#4ec9b0' }}>
                        {statsData.stats.workspaces.total}
                      </div>
                      <div style={{ fontSize: '12px', color: '#858585' }}>
                        {statsData.stats.workspaces.active} running
                      </div>
                    </div>

                    <div style={{
                      backgroundColor: '#252526',
                      padding: '20px',
                      borderRadius: '8px',
                      border: '1px solid #3d3d3d'
                    }}>
                      <h3 style={{ color: '#cccccc', margin: '0 0 8px 0' }}>Role Distribution</h3>
                      <div style={{ display: 'flex', gap: '16px' }}>
                        <div>
                          <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#007acc' }}>
                            {statsData.stats.users.students}
                          </div>
                          <div style={{ fontSize: '12px', color: '#858585' }}>Students</div>
                        </div>
                        <div>
                          <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#4ec9b0' }}>
                            {statsData.stats.users.publishers}
                          </div>
                          <div style={{ fontSize: '12px', color: '#858585' }}>Publishers</div>
                        </div>
                        <div>
                          <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#f39c12' }}>
                            {statsData.stats.users.admins}
                          </div>
                          <div style={{ fontSize: '12px', color: '#858585' }}>Admins</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Recent Activity */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                    <div>
                      <h3 style={{ color: '#cccccc', marginBottom: '16px' }}>Recent Users</h3>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {statsData.recent.users.slice(0, 5).map((user: RecentUser) => (
                          <div key={user._id} style={{
                            padding: '12px',
                            backgroundColor: '#252526',
                            borderRadius: '4px',
                            border: '1px solid #3d3d3d'
                          }}>
                            <div style={{ fontWeight: '500', color: '#cccccc' }}>{user.username}</div>
                            <div style={{ fontSize: '12px', color: '#858585' }}>{user.email}</div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h3 style={{ color: '#cccccc', marginBottom: '16px' }}>Recent Workspaces</h3>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {statsData.recent.workspaces.slice(0, 5).map((workspace: RecentWorkspace) => (
                          <div key={workspace._id} style={{
                            padding: '12px',
                            backgroundColor: '#252526',
                            borderRadius: '4px',
                            border: '1px solid #3d3d3d'
                          }}>
                            <div style={{ fontWeight: '500', color: '#cccccc' }}>
                              {workspace.templateName} ({workspace.language})
                            </div>
                            <div style={{ fontSize: '12px', color: '#858585' }}>
                              {workspace.status} • {new Date(workspace.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}