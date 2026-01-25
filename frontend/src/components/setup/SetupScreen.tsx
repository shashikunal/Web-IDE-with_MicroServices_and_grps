import { useState, useEffect, useRef } from 'react';
import type { Template } from '../../store/api/apiSlice';
import { useCreateContainerMutation } from '../../store/api/apiSlice';

interface SetupScreenProps {
  template: Template;
  onComplete: (userId: string, publicPort: number, workspaceId: string, containerId: string) => void;
  onError: (error: string) => void;
  onBack: () => void;
}

export default function SetupScreen({ template, onComplete, onError, onBack }: SetupScreenProps) {
  const [currentStep, setCurrentStep] = useState('request');
  const [stepProgress, setStepProgress] = useState(0);
  const [createContainer] = useCreateContainerMutation();
  const mounted = useRef(false);

  const steps = [
    { key: 'request', label: 'Adding your container request', desc: 'Processing your request...' },
    { key: 'container', label: 'Setting up environment & Installing dependencies', desc: 'This may take up to a minute...' },
    { key: 'connecting', label: 'Connecting to your container', desc: 'Establishing WebSocket connection...' },
    { key: 'editor', label: 'Setting up your editor', desc: 'Loading workspace files...' },
    { key: 'finalizing', label: 'Finalizing your playground', desc: 'Almost ready...' },
    { key: 'ready', label: 'Ready!', desc: 'Your playground is ready' },
  ];

  const currentIndex = steps.findIndex(s => s.key === currentStep);

  useEffect(() => {
    if (mounted.current) return;
    mounted.current = true;

    const startSetup = async () => {
      try {
        // Step 1: Request
        setStepProgress(10);

        // Call API to create container (which creates workspace & container)
        const result = await createContainer({
          language: template.language,
          templateId: template.id,
          templateName: template.name
        }).unwrap();

        setStepProgress(40);
        setCurrentStep('container');

        // Step 2: Container is created, simulate connection and setup
        await new Promise(r => setTimeout(r, 800));
        setStepProgress(60);
        setCurrentStep('connecting');

        await new Promise(r => setTimeout(r, 800));
        setStepProgress(80);
        setCurrentStep('editor');

        await new Promise(r => setTimeout(r, 600));
        setStepProgress(95);
        setCurrentStep('finalizing');

        await new Promise(r => setTimeout(r, 400));
        setStepProgress(100);
        setCurrentStep('ready');

        await new Promise(r => setTimeout(r, 400));
        onComplete(result.userId, result.publicPort, result.workspaceId, result.containerId);

      } catch (err: unknown) {
        console.error('Setup failed:', err);
        const errorMessage =
          (err as { data?: { message?: string } })?.data?.message ||
          (err as { message?: string })?.message ||
          'Failed to create container';
        onError(errorMessage);
      }
    };

    startSetup();
  }, [template, createContainer, onComplete, onError]);

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#1e1e1e', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: '100%', maxWidth: '400px', padding: '0 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{ width: '96px', height: '96px', margin: '0 auto 20px', borderRadius: '16px', background: 'linear-gradient(135deg, #007acc, #005a9e)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 32px rgba(0, 122, 204, 0.4)' }}>
            <span style={{ fontSize: '48px' }}>{template?.icon || '🚀'}</span>
          </div>
          <h2 style={{ fontSize: '22px', fontWeight: 600, color: 'white', marginBottom: '8px' }}>Setting Up Your Playground</h2>
          <p style={{ color: '#858585' }}>Creating {template?.name} environment...</p>
        </div>

        <div style={{ backgroundColor: '#252526', borderRadius: '12px', padding: '24px', border: '1px solid #3d3d3d', boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)' }}>
          <div style={{ marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#858585', marginBottom: '8px' }}>
              <span>Progress</span>
              <span style={{ color: '#007acc', fontWeight: 600 }}>{stepProgress}%</span>
            </div>
            <div style={{ height: '8px', backgroundColor: '#3d3d3d', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${stepProgress}%`, background: 'linear-gradient(90deg, #007acc, #00a8ff)', transition: 'width 0.5s ease-out', borderRadius: '4px' }} />
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {steps.map((step, index) => {
              const isPast = index < currentIndex;
              const isCurrent = step.key === currentStep;
              return (
                <div key={step.key} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '14px',
                    fontWeight: 600,
                    transition: 'all 0.3s',
                    backgroundColor: isPast || isCurrent ? '#007acc' : '#3d3d3d',
                    color: isPast || isCurrent ? 'white' : '#666',
                    boxShadow: isPast ? '0 4px 12px rgba(0, 122, 204, 0.4)' : 'none'
                  }}>
                    {isPast ? (
                      <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : index + 1}
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{
                      fontSize: '14px',
                      color: isCurrent ? 'white' : isPast ? '#4ec9b0' : '#858585',
                      fontWeight: isCurrent ? 500 : 400,
                      margin: 0
                    }}>{step.label}</p>
                    {isCurrent && <p style={{ fontSize: '12px', color: '#666', marginTop: '2px' }}>{step.desc}</p>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div style={{ marginTop: '32px', textAlign: 'center' }}>
          <button
            onClick={onBack}
            style={{
              background: 'none',
              border: 'none',
              color: '#858585',
              cursor: 'pointer',
              fontSize: '13px',
              marginBottom: '10px'
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = 'white'}
            onMouseLeave={(e) => e.currentTarget.style.color = '#858585'}
          >
            Cancel Setup
          </button>
          <p style={{ color: '#666', fontSize: '14px', margin: 0 }}>Powered by VS Code IDE</p>
        </div>
      </div>
    </div>
  );
}