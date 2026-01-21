import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useSearchParams } from 'react-router-dom';
import TemplateSelection from './components/layout/TemplateSelection';
import SetupScreen from './components/setup/SetupScreen';
import Dashboard from './components/dashboard/Dashboard';
import VSCodeIDE from './components/editor/VSCodeIDE_NEW';
import ErrorScreen from './components/setup/ErrorScreen';
import AuthModal from './components/auth/AuthModal';
import type { Template, Workspace, User } from './store/api/apiSlice';

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
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [workspaceInfo, setWorkspaceInfo] = useState<WorkspaceInfo | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('accessToken'));
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [initialWorkspaceLoaded, setInitialWorkspaceLoaded] = useState(false);

  useEffect(() => {
    // Check auth on mount
    const token = localStorage.getItem('accessToken');
    setIsAuthenticated(!!token);
  }, []);

  function getTemplateLanguage(templateId: string): string {
    const languageMap: Record<string, string> = {
      'react-app': 'typescript',
      'node-hello': 'javascript',
      'python-flask': 'python',
      'go-api': 'go',
      'html-site': 'html'
    };
    return languageMap[templateId] || 'javascript';
  }

  // Restore template from URL params on refresh
  useEffect(() => {
    const urlTemplateId = searchParams.get('template');
    if (urlTemplateId && !selectedTemplate && !workspaceInfo) {
      const template: Template = {
        id: urlTemplateId,
        name: urlTemplateId.replace(/-/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()),
        language: getTemplateLanguage(urlTemplateId),
        hasPreview: ['react-app', 'html-site', 'node-hello', 'python-flask', 'go-api'].includes(urlTemplateId),
        description: '',
        icon: '📁',
        color: '#007acc'
      };
      setSelectedTemplate(template);
    }
  }, [searchParams, selectedTemplate, workspaceInfo]);

  // Restore workspace from URL params on refresh
  useEffect(() => {
    const urlUserId = searchParams.get('userId');
    const urlPort = searchParams.get('port');
    const urlTemplate = searchParams.get('template');
    const urlWorkspaceId = searchParams.get('workspaceId');
    const urlContainerId = searchParams.get('containerId');

    if (urlUserId && urlPort && urlTemplate && urlWorkspaceId && urlContainerId && !workspaceInfo && !initialWorkspaceLoaded) {
      const template: Template = {
        id: urlTemplate,
        name: urlTemplate.replace(/-/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()),
        language: getTemplateLanguage(urlTemplate),
        hasPreview: ['react-app', 'html-site', 'node-hello', 'python-flask', 'go-api'].includes(urlTemplate),
        description: 'Restored workspace',
        icon: '📁',
        color: '#007acc'
      };

      setWorkspaceInfo({
        userId: urlUserId,
        publicPort: parseInt(urlPort, 10),
        workspaceId: urlWorkspaceId,
        containerId: urlContainerId,
        template
      });
      setInitialWorkspaceLoaded(true);
    }
  }, [searchParams, workspaceInfo, initialWorkspaceLoaded]);

  const handleTemplateSelect = (template: Template) => {
    if (!isAuthenticated) {
      setShowAuthModal(true);
      return;
    }
    setSelectedTemplate(template);
    navigate(`/setup?template=${template.id}`);
  };

  const handleSetupComplete = (userId: string, publicPort: number, workspaceId: string, containerId: string) => {
    if (selectedTemplate) {
      setWorkspaceInfo({
        userId,
        publicPort,
        workspaceId,
        containerId,
        template: selectedTemplate
      });
      navigate(`/workspace?userId=${userId}&port=${publicPort}&workspaceId=${workspaceId}&containerId=${containerId}&template=${selectedTemplate.id}`);
    }
  };

  const handleSetupError = (error: string) => {
    setErrorMessage(error);
    navigate('/error');
  };

  const handleWorkspaceSelect = async (workspace: Workspace) => {
    // Convert workspace to template format
    const template: Template = {
      id: workspace.templateId,
      name: workspace.templateName,
      language: workspace.language,
      hasPreview: ['react-app', 'html-site', 'node-hello', 'python-flask', 'go-api'].includes(workspace.templateId),
      description: 'Resumed workspace',
      icon: '📁',
      color: '#007acc'
    };

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
        // Use the updated container info from the response
        setWorkspaceInfo({
          userId: workspace.userId,
          publicPort: data.publicPort || workspace.publicPort,
          workspaceId: workspace.workspaceId,
          containerId: data.containerId || workspace.containerId,
          template
        });
        navigate(`/workspace?userId=${workspace.userId}&port=${data.publicPort || workspace.publicPort}&workspaceId=${workspace.workspaceId}&containerId=${data.containerId || workspace.containerId}&template=${workspace.templateId}`);
      } else {
        console.error('Failed to ensure container is running:', data.message);
        // Fall back to original behavior
        setWorkspaceInfo({
          userId: workspace.userId,
          publicPort: workspace.publicPort,
          workspaceId: workspace.workspaceId,
          containerId: workspace.containerId,
          template
        });
        navigate(`/workspace?userId=${workspace.userId}&port=${workspace.publicPort}&workspaceId=${workspace.workspaceId}&containerId=${workspace.containerId}&template=${workspace.templateId}`);
      }
    } catch (error) {
      console.error('Error ensuring container is running:', error);
      // Fall back to original behavior
      setWorkspaceInfo({
        userId: workspace.userId,
        publicPort: workspace.publicPort,
        workspaceId: workspace.workspaceId,
        containerId: workspace.containerId,
        template
      });
      navigate(`/workspace?userId=${workspace.userId}&port=${workspace.publicPort}&workspaceId=${workspace.workspaceId}&containerId=${workspace.containerId}&template=${workspace.templateId}`);
    }
  };

  const handleBackToTemplates = () => {
    navigate('/');
    setSelectedTemplate(null);
    setWorkspaceInfo(null);
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

export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}