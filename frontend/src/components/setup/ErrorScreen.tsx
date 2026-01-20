interface ErrorScreenProps {
  message: string;
  onRetry: () => void;
  onBack: () => void;
}

export default function ErrorScreen({ message, onRetry, onBack }: ErrorScreenProps) {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#1e1e1e', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center', maxWidth: '400px', padding: '0 24px' }}>
        <div style={{ width: '80px', height: '80px', margin: '0 auto 20px', borderRadius: '50%', backgroundColor: '#f14c4c20', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="40" height="40" fill="none" stroke="#f14c4c" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        <h2 style={{ fontSize: '20px', fontWeight: 600, color: '#f14c4c', marginBottom: '8px' }}>Failed to Create Container</h2>
        <p style={{ color: '#858585', fontSize: '14px', marginBottom: '24px' }}>{message}</p>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
          <button
            onClick={onBack}
            style={{
              padding: '10px 24px',
              backgroundColor: '#3d3d3d',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'background-color 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#4d4d4d'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#3d3d3d'}
          >
            Back
          </button>
          <button
            onClick={onRetry}
            style={{
              padding: '10px 24px',
              backgroundColor: '#007acc',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'background-color 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#0066b8'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#007acc'}
          >
            Try Again
          </button>
        </div>
        <p style={{ marginTop: '24px', color: '#666', fontSize: '14px' }}>Powered by VS Code IDE</p>
      </div>
    </div>
  );
}