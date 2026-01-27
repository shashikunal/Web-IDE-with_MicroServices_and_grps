import {
  useGetWorkspacesQuery,
  useDeleteWorkspaceMutation,
  useStopWorkspaceMutation,
  useStartWorkspaceMutation
} from '../../store/api/apiSlice';
import type { Workspace } from '../../store/api/apiSlice';
import toast from 'react-hot-toast';
import { useState } from 'react';

interface DashboardProps {
  onSelectWorkspace: (ws: Workspace) => void;
  onBack: () => void;
}

export default function Dashboard({ onSelectWorkspace, onBack }: DashboardProps) {
  const { data: workspaces = [], isLoading, isError, error } = useGetWorkspacesQuery();
  const [deleteWorkspace, { isLoading: isDeleting }] = useDeleteWorkspaceMutation();
  const [stopWorkspace] = useStopWorkspaceMutation();
  const [startWorkspace] = useStartWorkspaceMutation();
  const [workspaceToDelete, setWorkspaceToDelete] = useState<{ userId: string, workspaceId: string } | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>(() => {
    return (localStorage.getItem('dashboardViewMode') as 'grid' | 'list') || 'grid';
  });

  const handleViewModeChange = (mode: 'grid' | 'list') => {
    setViewMode(mode);
    localStorage.setItem('dashboardViewMode', mode);
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'Unknown';
    return new Date(dateStr).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleStop = async (e: React.MouseEvent, workspaceId: string) => {
    e.stopPropagation();
    try {
      await stopWorkspace({ workspaceId }).unwrap();
      toast.success('Workspace stopped successfully');
    } catch (err) {
      console.error('Failed to stop workspace:', err);
      toast.error('Failed to stop workspace');
    }
  };

  const handleStart = async (e: React.MouseEvent, workspaceId: string) => {
    e.stopPropagation();
    try {
      await startWorkspace({ workspaceId }).unwrap();
      toast.success('Workspace started successfully');
    } catch (err) {
      console.error('Failed to start workspace:', err);
      toast.error('Failed to start workspace');
    }
  };

  const handleDelete = (userId: string, workspaceId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setWorkspaceToDelete({ userId, workspaceId });
  };

  const cancelDelete = () => {
    setWorkspaceToDelete(null);
  };

  const confirmDelete = async () => {
    if (!workspaceToDelete) return;

    try {
      await deleteWorkspace(workspaceToDelete).unwrap();
      toast.success('Workspace deleted successfully');
      setWorkspaceToDelete(null);
    } catch (err) {
      console.error('Failed to delete workspace:', err);
      toast.error('Failed to delete workspace');
    }
  };

  if (isError) {
    return (
      <div className="min-h-screen bg-[var(--color-vs-bg)] text-[var(--color-vs-text)] font-sans flex items-center justify-center">
        <div className="text-center p-8 bg-[var(--color-vs-sidebar)] rounded-xl border border-[var(--color-vs-border)] shadow-2xl max-w-md w-full">
          <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-[var(--color-vs-error)]/10 flex items-center justify-center text-[var(--color-vs-error)]">
            <svg width="32" height="32" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h3 className="text-xl font-bold mb-2">Error Loading Workspaces</h3>
          <p className="text-[var(--color-vs-text-muted)] mb-8">
            {(error as any)?.data?.message || 'Unable to connect to the server. Please check your connection and try again.'}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="w-full px-4 py-2.5 bg-[var(--color-vs-activity)] hover:bg-[var(--color-vs-activity)]/90 text-white rounded-lg font-medium transition-all"
          >
            Retry Connection
          </button>
          <button
            onClick={onBack}
            className="w-full mt-3 px-4 py-2.5 text-[var(--color-vs-text-muted)] hover:text-[var(--color-vs-text)] transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--color-vs-bg)] text-[var(--color-vs-text)] font-sans">
      <div className="w-full max-w-7xl mx-auto px-6 py-10">
        {/* Header */}
        <div className="flex items-center gap-4 mb-10">
          <button
            onClick={onBack}
            className="p-2.5 text-[var(--color-vs-text-muted)] hover:text-[var(--color-vs-text)] hover:bg-[var(--color-vs-sidebar)] rounded-lg transition-all"
          >
            <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-[var(--color-vs-text)] tracking-tight">My Workspaces</h1>
            <p className="text-[var(--color-vs-text-muted)] text-base mt-2">Manage and organize your development environments</p>
          </div>

          {/* View Toggle */}
          <div className="flex items-center p-1 bg-[var(--color-vs-sidebar)] rounded-lg border border-[var(--color-vs-border)]">
            <button
              onClick={() => handleViewModeChange('grid')}
              className={`p-2 rounded-md transition-all duration-200 relative ${viewMode === 'grid' ? 'text-[var(--color-vs-text)]' : 'text-[var(--color-vs-text-muted)] hover:text-[var(--color-vs-text)]'
                }`}
              title="Grid View"
            >
              {viewMode === 'grid' && (
                <div className="absolute inset-0 bg-[var(--color-vs-activity)] rounded-md opacity-20 animate-in fade-in duration-200" />
              )}
              <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            </button>
            <button
              onClick={() => handleViewModeChange('list')}
              className={`p-2 rounded-md transition-all duration-200 relative ${viewMode === 'list' ? 'text-[var(--color-vs-text)]' : 'text-[var(--color-vs-text-muted)] hover:text-[var(--color-vs-text)]'
                }`}
              title="List View"
            >
              {viewMode === 'list' && (
                <div className="absolute inset-0 bg-[var(--color-vs-activity)] rounded-md opacity-20 animate-in fade-in duration-200" />
              )}
              <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="flex items-center justify-center py-32">
            <div className="text-center">
              <div className="loading-spinner mx-auto mb-4" />
              <p className="text-[var(--color-vs-text-muted)] animate-pulse">Loading your workspaces...</p>
            </div>
          </div>
        ) : (!workspaces || (Array.isArray(workspaces) && workspaces.length === 0)) ? (
          <div className="text-center py-24 bg-[var(--color-vs-sidebar)] rounded-2xl border border-[var(--color-vs-border)] border-dashed">
            {/* ... empty state content ... */}
            <div className="w-24 h-24 mx-auto mb-6 rounded-2xl bg-[var(--color-vs-activity)] flex items-center justify-center">
              <svg width="48" height="48" fill="none" stroke="var(--color-vs-text-muted)" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
              </svg>
            </div>
            <h3 className="text-white text-2xl font-semibold mb-3">No workspaces yet</h3>
            <p className="text-[var(--color-vs-text-muted)] text-base mb-10 max-w-md mx-auto leading-relaxed">
              Start your coding journey by creating a new playground from our templates.
            </p>
            <button
              onClick={onBack}
              className="px-8 py-3 bg-[var(--color-vs-status)] hover:bg-[var(--color-vs-status)]/80 text-white rounded-lg font-medium transition-all shadow-soft hover:shadow-medium transform hover:scale-105"
            >
              Create New Workspace
            </button>
          </div>
        ) : (
          <div className={viewMode === 'grid'
            ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
            : "flex flex-col gap-3"
          }>
            {Array.isArray(workspaces) && workspaces.map((ws) => (
              <div
                key={ws.workspaceId}
                onClick={() => onSelectWorkspace(ws)}
                className={`group relative p-4 rounded-xl bg-[var(--color-vs-sidebar)] border border-[var(--color-vs-border)] hover:border-[var(--color-vs-status)] transition-all duration-300 cursor-pointer shadow-soft hover:shadow-medium 
                  ${viewMode === 'grid' ? 'hover:-translate-y-1' : 'flex items-center gap-6 hover:translate-x-1'}`}
              >
                {/* Icon & Info */}
                <div className={`flex items-center gap-4 ${viewMode === 'grid' ? 'mb-4' : 'flex-1 min-w-0'}`}>
                  <div className={`${viewMode === 'grid' ? 'w-12 h-12 text-2xl' : 'w-10 h-10 text-xl'} rounded-lg bg-[var(--color-vs-activity)] flex items-center justify-center flex-shrink-0 shadow-soft`}>
                    {ws.templateName === 'react-app' ? '⚛️' :
                      ws.templateName === 'node-hello' ? '🟢' :
                        ws.templateName === 'python-core' ? '🐍' :
                          ws.templateName === 'go-api' ? '🔵' :
                            ws.templateName === 'cpp-hello' ? '⚙️' :
                              ws.templateName === 'html-site' ? '📄' :
                                ws.templateName === 'nextjs' ? '▲' :
                                  ws.templateName === 'angular' ? '🅰️' :
                                    ws.templateName === 'vue-app' ? '💚' :
                                      ws.templateName === 'fastapi-app' ? '⚡' :
                                        ws.templateName === 'java-maven' ? '☕' :
                                          ws.templateName === 'spring-boot' ? '🍃' :
                                            ws.templateName === 'dotnet' ? '🟣' :
                                              ws.templateName === 'c-lang' ? '🇨' :
                                                ws.templateName === 'rust-lang' ? '🦀' :
                                                  ws.templateName === 'ruby-lang' ? '💎' :
                                                    ws.templateName === 'php-lang' ? '🐘' : '📁'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-white text-base truncate group-hover:text-[var(--color-vs-status)] transition-colors">
                      {ws.title || ws.templateName}
                    </h3>
                    <p className="text-[var(--color-vs-text-muted)] text-sm mt-0.5 capitalize truncate">
                      {ws.description || ws.language}
                    </p>
                  </div>
                </div>

                {/* Status Badge (Moved for List view) */}
                <div className={`${viewMode === 'grid' ? 'mb-4' : ''}`}>
                  <div className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-semibold border ${ws.status === 'running'
                    ? 'bg-[var(--color-vs-success)]/10 text-[var(--color-vs-success)] border-[var(--color-vs-success)]/20'
                    : 'bg-[var(--color-vs-error)]/10 text-[var(--color-vs-error)] border-[var(--color-vs-error)]/20'
                    }`}>
                    <div className={`w-1.5 h-1.5 rounded-full ${ws.status === 'running' ? 'bg-[var(--color-vs-success)] animate-pulse' : 'bg-[var(--color-vs-error)]'}`} />
                    <span className="uppercase tracking-wider">{ws.status}</span>
                  </div>
                </div>

                {/* Metadata & Actions */}
                <div className={`flex items-center justify-between ${viewMode === 'grid' ? 'pt-4 border-t border-[var(--color-vs-border)]' : 'gap-6 pl-6 border-l border-[var(--color-vs-border)]'}`}>
                  <div className="text-xs text-[var(--color-vs-text-muted)] flex items-center gap-1.5 min-w-[120px]">
                    <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 1 1 -18 0 9 9 0 0 1 18 0z" />
                    </svg>
                    <span className="truncate">{formatDate(ws.lastAccessedAt || ws.createdAt)}</span>
                  </div>

                  <div className={`flex items-center gap-1 ${viewMode === 'grid' ? 'opacity-0 group-hover:opacity-100' : 'opacity-100'} transition-opacity duration-200`}>
                    {ws.status === 'running' ? (
                      <button
                        onClick={(e) => handleStop(e, ws.workspaceId)}
                        title="Pause Workspace"
                        className="p-2 rounded-lg text-[var(--color-vs-text-muted)] hover:text-[var(--color-vs-warning)] hover:bg-[var(--color-vs-warning)]/10 transition-all"
                      >
                        <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
                          <rect x="6" y="4" width="4" height="16" />
                          <rect x="14" y="4" width="4" height="16" />
                        </svg>
                      </button>
                    ) : (
                      <button
                        onClick={(e) => handleStart(e, ws.workspaceId)}
                        title="Resume Workspace"
                        className="p-2 rounded-lg text-[var(--color-vs-text-muted)] hover:text-[var(--color-vs-success)] hover:bg-[var(--color-vs-success)]/10 transition-all"
                      >
                        <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      </button>
                    )}

                    <button
                      onClick={(e) => handleDelete(ws.userId, ws.workspaceId, e)}
                      disabled={isDeleting}
                      title="Delete Workspace"
                      className="p-2 rounded-lg text-[var(--color-vs-text-muted)] hover:text-[var(--color-vs-error)] hover:bg-[var(--color-vs-error)]/10 transition-all disabled:opacity-50 disabled:cursor-wait"
                    >
                      <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}


        {/* Delete Confirmation Modal */}
        {
          workspaceToDelete && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
              <div
                className="w-full max-w-md bg-[var(--color-vs-sidebar)] border border-[var(--color-vs-border)] rounded-xl shadow-2xl overflow-hidden scale-100 animate-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-6">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 rounded-full bg-[var(--color-vs-error)]/10 flex items-center justify-center text-[var(--color-vs-error)]">
                      <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-[var(--color-vs-text)]">Delete Workspace?</h3>
                      <p className="text-[var(--color-vs-text-muted)] text-sm">This action cannot be undone.</p>
                    </div>
                  </div>

                  <p className="text-[var(--color-vs-text-muted)] mb-6">
                    Are you sure you want to delete this workspace? This will permanently remove the container and all associated files.
                  </p>

                  <div className="flex items-center justify-end gap-3">
                    <button
                      onClick={cancelDelete}
                      className="px-4 py-2 rounded-lg text-sm font-medium text-[var(--color-vs-text-muted)] hover:text-[var(--color-vs-text)] hover:bg-[var(--color-vs-hover)] transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={confirmDelete}
                      disabled={isDeleting}
                      className="px-4 py-2 rounded-lg text-sm font-medium bg-[var(--color-vs-error)] text-white hover:bg-[var(--color-vs-error)]/90 disabled:opacity-50 disabled:cursor-wait transition-colors shadow-lg shadow-[var(--color-vs-error)]/20"
                    >
                      {isDeleting ? 'Deleting...' : 'Delete Workspace'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )
        }
      </div>
    </div>
  );
}