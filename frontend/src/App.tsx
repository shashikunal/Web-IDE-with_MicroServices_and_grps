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

    if (userId && portStr && templateId && workspaceId && containerId) {
      const template = getTemplateById(templateId) || createFallbackTemplate(templateId, 'Restored workspace');
      return {
        userId,
        publicPort: parseInt(portStr, 10),
        workspaceId,
        containerId,
        template
      };
    }
    return null;
  }, [searchParams]);


  const handleTemplateSelect = (template: Template) => {
    if (!isAuthenticated) {
      setShowAuthModal(true);
      return;
    }
    // Just navigate, let derived state handle the rest
    navigate(`/setup?template=${template.id}`);
  };

  const handleSetupComplete = (userId: string, publicPort: number, workspaceId: string, containerId: string) => {
    // Just navigate, let derived state handle the rest
    // Note: We need to know the current template ID.
    // Since this is called from SetupScreen, selectedTemplate should be active.
    if (selectedTemplate) {
      navigate(`/workspace?userId=${userId}&port=${publicPort}&workspaceId=${workspaceId}&containerId=${containerId}&template=${selectedTemplate.id}`);
    }
  };

  const handleSetupError = (error: string) => {
    setErrorMessage(error);
    navigate('/error');
  };

  const handleWorkspaceSelect = async (workspace: Workspace) => {
    // We navigate first to the workspace URL. 
    // The ensure-running logic should ideally happen before navigation or as a check.
    // However, if we want to preserve the "ensure running" logic:
    // We can do it here, then navigate.

    const templateId = workspace.templateId;

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

      if (data.success) {
        navigate(`/workspace?userId=${workspace.userId}&port=${data.publicPort || workspace.publicPort}&workspaceId=${workspace.workspaceId}&containerId=${data.containerId || workspace.containerId}&template=${templateId}`);
      } else {
        console.error('Failed to ensure container is running:', data.message);
        navigate(`/workspace?userId=${workspace.userId}&port=${workspace.publicPort}&workspaceId=${workspace.workspaceId}&containerId=${workspace.containerId}&template=${templateId}`);
      }
    } catch (error) {
      console.error('Error ensuring container is running:', error);
      navigate(`/workspace?userId=${workspace.userId}&port=${workspace.publicPort}&workspaceId=${workspace.workspaceId}&containerId=${workspace.containerId}&template=${templateId}`);
    }
  };

  const handleBackToTemplates = () => {
    navigate('/');
    // No need to clear state, navigation clears params which clears derived state
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
              onComplete={handleSetupComplete}
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