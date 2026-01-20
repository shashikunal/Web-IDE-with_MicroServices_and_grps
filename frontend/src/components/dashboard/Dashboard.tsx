import { useGetWorkspacesQuery, useDeleteWorkspaceMutation } from '../../store/api/apiSlice';
import type { Workspace } from '../../store/api/apiSlice';

interface DashboardProps {
  onSelectWorkspace: (ws: Workspace) => void;
  onBack: () => void;
}

export default function Dashboard({ onSelectWorkspace, onBack }: DashboardProps) {
  const { data: workspaces = [], isLoading, isError, error } = useGetWorkspacesQuery();
  const [deleteWorkspace, { isLoading: isDeleting }] = useDeleteWorkspaceMutation();

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const handleDelete = async (userId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('Delete requested for:', userId);

    if (!confirm('Are you sure you want to delete this workspace? This will also stop and remove the container.')) return;

    try {
      console.log('Sending delete mutation...');
      await deleteWorkspace(userId).unwrap();
      console.log('Delete successful');
    } catch (err: any) {
      console.error('Delete failed:', err);
      alert('Failed to delete workspace: ' + (err.data?.message || err.message || 'Unknown error'));
    }
  };

  if (isError) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#1e1e1e', color: '#cccccc', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '40px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
            <button
              onClick={onBack}
              style={{
                background: 'none',
                border: 'none',
                padding: '8px',
                cursor: 'pointer',
                color: '#858585',
                borderRadius: '4px'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.color = '#cccccc'; e.currentTarget.style.backgroundColor = '#3d3d3d'; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = '#858585'; e.currentTarget.style.backgroundColor = 'transparent'; }}
            >
              <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 style={{ fontSize: '24px', fontWeight: 600, color: '#cccccc', margin: 0 }}>My Workspaces</h1>
          </div>

          <div style={{ textAlign: 'center', padding: '60px 0', backgroundColor: '#252526', borderRadius: '12px', border: '1px solid #3d3d3d' }}>
            <div style={{ width: '64px', height: '64px', margin: '0 auto 16px', borderRadius: '50%', backgroundColor: '#f14c4c20', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="32" height="32" fill="none" stroke="#f14c4c" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 style={{ color: '#f14c4c', fontSize: '18px', marginBottom: '8px' }}>Failed to load workspaces</h3>
            <p style={{ color: '#858585', fontSize: '14px', maxWidth: '400px', margin: '0 auto 24px' }}>
              {(error as any)?.data?.message || 'There was an error connecting to the server. Please try again later.'}
            </p>
            <button
              onClick={() => window.location.reload()}
              style={{
                padding: '10px 24px',
                backgroundColor: '#3d3d3d',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 500,
                cursor: 'pointer'
              }}
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#1e1e1e', color: '#cccccc', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif' }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '40px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
          <button
            onClick={onBack}
            style={{
              background: 'none',
              border: 'none',
              padding: '8px',
              cursor: 'pointer',
              color: '#858585',
              borderRadius: '4px'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = '#cccccc'; e.currentTarget.style.backgroundColor = '#3d3d3d'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = '#858585'; e.currentTarget.style.backgroundColor = 'transparent'; }}
          >
            <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 600, color: '#cccccc', margin: 0 }}>My Workspaces</h1>
            <p style={{ color: '#858585', fontSize: '14px', marginTop: '4px' }}>Manage your saved code playgrounds</p>
          </div>
        </div>

        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <div style={{ display: 'inline-block', width: '40px', height: '40px', border: '3px solid #3d3d3d', borderTopColor: '#007acc', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
            <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
          </div>
        ) : (!workspaces || (Array.isArray(workspaces) && workspaces.length === 0)) ? (
          <div style={{ textAlign: 'center', padding: '60px 0', backgroundColor: '#252526', borderRadius: '12px', border: '1px solid #3d3d3d' }}>
            <svg width="64" height="64" fill="none" stroke="#3d3d3d" viewBox="0 0 24 24" style={{ margin: '0 auto 16px' }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
            </svg>
            <h3 style={{ color: '#858585', fontSize: '16px', marginBottom: '8px' }}>No workspaces yet</h3>
            <p style={{ color: '#666', fontSize: '14px' }}>Create a new playground to get started</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
            {Array.isArray(workspaces) && workspaces.map((ws) => (
              <div
                key={ws.userId}
                onClick={() => onSelectWorkspace(ws)}
                style={{
                  padding: '20px',
                  borderRadius: '12px',
                  backgroundColor: '#252526',
                  border: '1px solid #3d3d3d',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#007acc';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#3d3d3d';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '8px', backgroundColor: '#3d3d3d', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
                      {ws.templateName === 'React' ? '⚛️' : ws.templateName === 'Node.js' ? '🟢' : ws.templateName === 'Python' ? '🐍' : ws.templateName === 'Go' ? '🔵' : ws.templateName === 'C++' ? '🟣' : ws.templateName === 'HTML' ? '📄' : '📁'}
                    </div>
                    <div>
                      <h3 style={{ fontWeight: 600, color: 'white', fontSize: '15px', margin: 0 }}>{ws.templateName}</h3>
                      <p style={{ color: '#858585', fontSize: '12px', marginTop: '2px' }}>{ws.language}</p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: ws.status === 'running' ? '#4ec9b0' : '#f14c4c' }} />
                    <span style={{ fontSize: '11px', color: '#858585' }}>{ws.status}</span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ fontSize: '12px', color: '#666' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 0 0118 0z" />
                      </svg>
                      {formatDate(ws.lastAccessedAt)}
                    </span>
                  </div>
                  <button
                    onClick={(e) => handleDelete(ws.userId, e)}
                    disabled={isDeleting}
                    style={{
                      background: 'none',
                      border: 'none',
                      padding: '6px',
                      cursor: isDeleting ? 'wait' : 'pointer',
                      color: '#858585',
                      borderRadius: '4px',
                      opacity: isDeleting ? 0.5 : 1
                    }}
                    onMouseEnter={(e) => { if (!isDeleting) { e.currentTarget.style.color = '#f14c4c'; e.currentTarget.style.backgroundColor = 'rgba(241, 76, 76, 0.1)'; } }}
                    onMouseLeave={(e) => { e.currentTarget.style.color = '#858585'; e.currentTarget.style.backgroundColor = 'transparent'; }}
                  >
                    <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}