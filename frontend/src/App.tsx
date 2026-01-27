import { useState, useMemo } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useSearchParams } from 'react-router-dom';
import TemplateSelection from './components/layout/TemplateSelection';
import { LANGUAGES, FRAMEWORKS } from './data/templates';
import SetupScreen from './components/setup/SetupScreen';
import Dashboard from './components/dashboard/Dashboard';
import VSCodeIDE from './components/editor/VSCodeIDE_NEW';
import ErrorScreen from './components/setup/ErrorScreen';
import AuthModal from './components/auth/AuthModal';
import type { Template, Workspace, User } from './store/api/apiSlice';

const ALL_TEMPLATES = [...LANGUAGES, ...FRAMEWORKS];

function getTemplateById(id: string): Template | undefined {
  return ALL_TEMPLATES.find(t => t.id === id);
}

// Fallback for unknown templates (e.g. from future updates or custom ones)
function createFallbackTemplate(id: string, description: string = ''): Template {
  return {
    id,
    name: id.replace(/-/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()),
    language: 'javascript', // Default fallback
    hasPreview: true, // Default to true for safety
    description,
    icon: '📁',
    color: '#007acc'
  };
}

interface WorkspaceInfo {
  userId: string;
  publicPort: number;
  workspaceId: string;
  containerId: string;
  template: Template;
  title?: string;
}

function AppContent() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isAuthenticated, setIsAuthenticated] = useState(() => !!localStorage.getItem('accessToken'));
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Derived state from URL parameters
  const selectedTemplate = useMemo(() => {
    const templateId = searchParams.get('template');
    const userId = searchParams.get('userId');

    // Only return a selected template if we are NOT in a full workspace view (no userId)
    if (templateId && !userId) {
      return getTemplateById(templateId) || createFallbackTemplate(templateId);
    }
    return null;
  }, [searchParams]);

  const workspaceInfo = useMemo<WorkspaceInfo | null>(() => {
    const userId = searchParams.get('userId');
    const portStr = searchParams.get('port');
    const templateId = searchParams.get('template');
    const workspaceId = searchParams.get('workspaceId');
    const containerId = searchParams.get('containerId');
    const title = searchParams.get('title');

    if (userId && portStr && templateId && workspaceId && containerId) {
      const template = getTemplateById(templateId) || createFallbackTemplate(templateId, 'Restored workspace');
      return {
        userId,
        publicPort: parseInt(portStr, 10),
        workspaceId,
        containerId,
        template,
        title: title || undefined
      };
    }
    return null;
  }, [searchParams]);


  const handleTemplateSelect = (template: Template, config?: any) => {
    if (!isAuthenticated) {
      setShowAuthModal(true);
      return;
    }
    // Just navigate, let derived state handle the rest
    navigate(`/setup?template=${template.id}`, { state: { config } });
  };

  const handleSetupComplete = (userId: string, publicPort: number, workspaceId: string, containerId: string) => {
    // Just navigate, let derived state handle the rest
    // Note: We need to know the current template ID.
    // Since this is called from SetupScreen, selectedTemplate should be active.
    if (selectedTemplate) {
      // Need config to determine title? It's not in args.
      // SetupScreen has the config. We might need to pass title back from SetupScreen if we want it here.
      // Actually SetupScreen navigates? No, App.tsx handles navigation via onComplete.
      // But wait, SetupScreen just calls onComplete.
      // The BACKEND returns the workspace object which has the title.
      // We should ideally fetch the workspace details or pass the title through.
      // For now, let's just navigate. If title is missing in URL, we can fetch it or just not show it yet.
      // BETTER: Update onComplete to accept workspace object or title.
      navigate(`/workspace?userId=${userId}&port=${publicPort}&workspaceId=${workspaceId}&containerId=${containerId}&template=${selectedTemplate.id}`);
    }
  };

  const handleSetupError = (error: string) => {
    setErrorMessage(error);
    navigate('/error');
  };

  const handleWorkspaceSelect = async (workspace: Workspace) => {
    const templateId = workspace.templateId;
    const title = workspace.title;

    try {
      // Ensure container is running before opening workspace
      const response = await fetch(`/api/workspaces/${workspace.workspaceId}/ensure-running`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });

      const data = await response.json();

      const targetUrl = `/workspace?userId=${workspace.userId}&port=${data.success ? (data.publicPort || workspace.publicPort) : workspace.publicPort}&workspaceId=${workspace.workspaceId}&containerId=${data.success ? (data.containerId || workspace.containerId) : workspace.containerId}&template=${templateId}${title ? `&title=${encodeURIComponent(title)}` : ''}`;

      if (!data.success) {
        console.error('Failed to ensure container is running:', data.message);
      }
      navigate(targetUrl);

    } catch (error) {
      console.error('Error ensuring container is running:', error);
      const targetUrl = `/workspace?userId=${workspace.userId}&port=${workspace.publicPort}&workspaceId=${workspace.workspaceId}&containerId=${workspace.containerId}&template=${templateId}${title ? `&title=${encodeURIComponent(title)}` : ''}`;
      navigate(targetUrl);
    }
  };

  const handleBackToTemplates = () => {
    navigate('/');
  };

  const handleShowDashboard = () => {
    if (!isAuthenticated) {
      setShowAuthModal(true);
      return;
    }
    navigate('/dashboard');
  };

  const handleErrorRetry = () => {
    navigate('/');
    setErrorMessage('');
  };

  const handleAuthSuccess = (user: User, tokens: { accessToken: string; refreshToken: string }) => {
    localStorage.setItem('accessToken', tokens.accessToken);
    localStorage.setItem('refreshToken', tokens.refreshToken);
    localStorage.setItem('user', JSON.stringify(user));
    setIsAuthenticated(true);
    setShowAuthModal(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    setIsAuthenticated(false);
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#1e1e1e' }}>
      <Routes>
        <Route path="/" element={
          <TemplateSelection
            onSelect={handleTemplateSelect}
            onShowDashboard={handleShowDashboard}
            onLogin={() => setShowAuthModal(true)}
            onLogout={handleLogout}
            isAuthenticated={isAuthenticated}
          />
        } />

        <Route path="/dashboard" element={
          <Dashboard
            onSelectWorkspace={handleWorkspaceSelect}
            onBack={handleBackToTemplates}
          />
        } />

        <Route path="/setup" element={
          selectedTemplate ? (
            <SetupScreen
              template={selectedTemplate}
              onComplete={(userId, publicPort, workspaceId, containerId) => {
                // We don't have the title here easily unless we change the signature. 
                // But wait, SetupScreen saves it to DB. 
                // When we navigate to /workspace, we derived workspaceInfo from URL.
                // If the URL doesn't have title, it won't show.
                // We should probably fetch the workspace in VSCodeIDE if title is missing, or
                // just accept that new workspaces might default to template name until next load.
                // OR we can pass it via location state.
                // Let's pass it via URL if possible, or fetch it.
                // For now, keep it simple.
                // Actually, let's update SetupScreen to return title too? 
                // No, let's rely on dashboard selection which has title.
                // For *brand new* workspaces, users just typed it, so they know it. But showing it is nice.
                navigate(`/workspace?userId=${userId}&port=${publicPort}&workspaceId=${workspaceId}&containerId=${containerId}&template=${selectedTemplate.id}`);
              }}
              onError={handleSetupError}
              onBack={handleBackToTemplates}
            />
          ) : (
            <div>Loading...</div>
          )
        } />

        <Route path="/workspace" element={
          workspaceInfo ? (
            <VSCodeIDE
              template={workspaceInfo.template}
              userId={workspaceInfo.userId}
              workspaceId={workspaceInfo.workspaceId}
              containerId={workspaceInfo.containerId}
              publicPort={workspaceInfo.publicPort}
              title={workspaceInfo.title}
              setAppState={(state) => {
                if (state === 'templates') navigate('/');
                else if (state === 'dashboard') navigate('/dashboard');
              }}
            />
          ) : (
            <div>Loading workspace...</div>
          )
        } />

        <Route path="/error" element={
          <ErrorScreen
            message={errorMessage}
            onRetry={handleErrorRetry}
            onBack={handleBackToTemplates}
          />
        } />
      </Routes>

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={handleAuthSuccess}
      />
    </div>
  );
}

import { Toaster } from 'react-hot-toast';

export default function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-center" />
      <AppContent />
    </BrowserRouter>
  );
}