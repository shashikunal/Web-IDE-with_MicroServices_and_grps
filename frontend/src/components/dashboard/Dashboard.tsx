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

  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'Never';
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return 'Never';

      const now = new Date();
      const diff = now.getTime() - date.getTime();
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));

      if (days === 0) {
        return 'Today at ' + date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
      } else if (days === 1) {
        return 'Yesterday at ' + date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
      } else {
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      }
    } catch {
      return 'Never';
    }
  };

  const handleStop = async (e: React.MouseEvent, workspaceId: string) => {
    e.stopPropagation();
    try {
      await stopWorkspace({ workspaceId }).unwrap();
      toast.success('Workspace stopped');
    } catch {
      toast.error('Failed to stop workspace');
    }
  };

  const handleStart = async (e: React.MouseEvent, workspaceId: string) => {
    e.stopPropagation();
    try {
      await startWorkspace({ workspaceId }).unwrap();
      toast.success('Workspace started');
    } catch {
      toast.error('Failed to start workspace');
    }
  };

  const handleDelete = async (userId: string, workspaceId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setWorkspaceToDelete({ userId, workspaceId });
  };

  const confirmDelete = async () => {
    if (!workspaceToDelete) return;

    try {
      console.log('Calling deleteWorkspace mutation for:', workspaceToDelete.workspaceId);
      await deleteWorkspace(workspaceToDelete).unwrap();
      console.log('Delete successful');
      toast.success('Workspace deleted');
      setWorkspaceToDelete(null);
    } catch (err: unknown) {
      console.error('Delete failed:', err);
      const errorMessage = (err as { data?: { message?: string }, message?: string })?.data?.message || (err as Error)?.message || 'Unknown error';
      toast.error('Failed to delete workspace: ' + errorMessage);
      // Keep modal open on error? Or close it? Usually keep it if we want to retry, but for now let's close or user can try again.
      // Better to close it to avoid stuck state if error is permanent.
      setWorkspaceToDelete(null);
    }
  };

  const cancelDelete = () => {
    setWorkspaceToDelete(null);
  };

  if (isError) {
    return (
      <div className="min-h-screen bg-[var(--color-vs-bg)] text-[var(--color-vs-text)] font-sans flex items-center justify-center p-6">
        <div className="w-full max-w-2xl">
          <div className="flex items-center gap-4 mb-8">
            <button
              onClick={onBack}
              className="p-2 text-[var(--color-vs-text-muted)] hover:text-[var(--color-vs-text)] hover:bg-[var(--color-vs-sidebar)] rounded-lg transition-all"
            >
              <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className="text-3xl font-semibold text-[var(--color-vs-text)]">My Workspaces</h1>
          </div>

          <div className="text-center py-20 bg-[var(--color-vs-sidebar)] rounded-2xl border border-[var(--color-vs-border)] shadow-medium">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-[var(--color-vs-error)]/10 flex items-center justify-center border-2 border-[var(--color-vs-error)]/20">
              <svg width="40" height="40" fill="none" stroke="var(--color-vs-error)" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="text-[var(--color-vs-error)] text-xl font-semibold mb-3">Failed to load workspaces</h3>
            <p className="text-[var(--color-vs-text-muted)] text-base max-w-md mx-auto mb-8 leading-relaxed">
              {(error as { data?: { message?: string } })?.data?.message || 'There was an error connecting to the server. Please try again later.'}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-8 py-3 bg-[var(--color-vs-status)] hover:bg-[var(--color-vs-status)]/80 text-white rounded-lg text-sm font-medium transition-all shadow-soft hover:shadow-medium"
            >
              Retry
            </button>
          </div>
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.isArray(workspaces) && workspaces.map((ws) => (
              <div
                key={ws.workspaceId}
                onClick={() => onSelectWorkspace(ws)}
                className="group relative p-6 rounded-2xl bg-[var(--color-vs-sidebar)] border border-[var(--color-vs-border)] hover:border-[var(--color-vs-status)] transition-all duration-300 cursor-pointer shadow-soft hover:shadow-medium hover:-translate-y-1"
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-12 h-12 rounded-xl bg-[var(--color-vs-activity)] flex items-center justify-center text-2xl flex-shrink-0 shadow-soft">
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
                      <h3 className="font-semibold text-white text-base truncate group-hover:text-[var(--color-vs-status)] transition-colors">{ws.templateName}</h3>
                      <p className="text-[var(--color-vs-text-muted)] text-sm mt-0.5 capitalize truncate">{ws.language}</p>
                    </div>
                  </div>
                </div>

                {/* Status Badge */}
                <div className="mb-4">
                  <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border ${ws.status === 'running'
                    ? 'bg-[var(--color-vs-success)]/10 text-[var(--color-vs-success)] border-[var(--color-vs-success)]/20'
                    : 'bg-[var(--color-vs-error)]/10 text-[var(--color-vs-error)] border-[var(--color-vs-error)]/20'
                    }`}>
                    <div className={`w-2 h-2 rounded-full ${ws.status === 'running' ? 'bg-[var(--color-vs-success)] animate-pulse' : 'bg-[var(--color-vs-error)]'}`} />
                    <span className="uppercase tracking-wider">{ws.status}</span>
                  </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between pt-4 border-t border-[var(--color-vs-border)]">
                  <div className="text-xs text-[var(--color-vs-text-muted)] flex items-center gap-1.5">
                    <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 0 0118 0z" />
                    </svg>
                    <span className="truncate">{formatDate(ws.lastAccessedAt || ws.createdAt)}</span>
                  </div>

                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
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
      </div>

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
    </div >
  );
}