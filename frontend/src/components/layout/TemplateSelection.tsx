import { useState } from 'react';
import UserProfile from '../auth/UserProfile';

interface Template {
  id: string;
  name: string;
  language: string;
  description: string;
  icon: string;
  color: string;
  hasPreview: boolean;
}

const LANGUAGES: Template[] = [
  { id: 'c-lang', name: 'C', language: 'c', description: 'GCC | Binary', icon: '🇨', color: 'from-blue-400/20 to-blue-500/10 border-blue-400/30', hasPreview: false },
  { id: 'cpp-hello', name: 'C++', language: 'cpp', description: 'G++ | Binary', icon: '⚙️', color: 'from-blue-600/20 to-blue-700/10 border-blue-600/30', hasPreview: false },
  { id: 'rust-lang', name: 'Rust', language: 'rust', description: 'Rustc | Cargo', icon: '🦀', color: 'from-orange-700/20 to-orange-800/10 border-orange-700/30', hasPreview: false },
  { id: 'go-api', name: 'Go', language: 'go', description: 'Go Build | Binary', icon: '🔵', color: 'from-cyan-500/20 to-cyan-600/10 border-cyan-500/30', hasPreview: true },
  { id: 'python-flask', name: 'Python', language: 'python', description: 'Python 3.11', icon: '🐍', color: 'from-yellow-500/20 to-yellow-600/10 border-yellow-500/30', hasPreview: true },
  { id: 'node-hello', name: 'Node.js', language: 'javascript', description: 'Node V20', icon: '🟢', color: 'from-green-500/20 to-green-600/10 border-green-500/30', hasPreview: true },
  { id: 'ruby-lang', name: 'Ruby', language: 'ruby', description: 'Ruby MRI', icon: '💎', color: 'from-red-600/20 to-red-700/10 border-red-600/30', hasPreview: false },
  { id: 'php-lang', name: 'PHP', language: 'php', description: 'PHP 8.2', icon: '🐘', color: 'from-indigo-400/20 to-indigo-500/10 border-indigo-400/30', hasPreview: true },
  { id: 'java-maven', name: 'Java', language: 'java', description: 'JVM | Maven', icon: '☕', color: 'from-orange-500/20 to-orange-600/10 border-orange-500/30', hasPreview: true },
];

const FRAMEWORKS: Template[] = [
  { id: 'react-app', name: 'React', language: 'typescript', description: 'Vite | Node', icon: '⚛️', color: 'from-cyan-400/20 to-cyan-500/10 border-cyan-400/30', hasPreview: true },
  { id: 'nextjs', name: 'Next.js', language: 'typescript', description: 'Next | Node', icon: '▲', color: 'from-gray-500/20 to-gray-600/10 border-gray-500/30', hasPreview: true },
  { id: 'angular', name: 'Angular', language: 'typescript', description: 'NG CLI | Node', icon: '🅰️', color: 'from-red-500/20 to-red-600/10 border-red-500/30', hasPreview: true },
  { id: 'vue-app', name: 'Vue.js', language: 'javascript', description: 'Vite | Node', icon: '💚', color: 'from-green-400/20 to-green-500/10 border-green-400/30', hasPreview: true },
  { id: 'fastapi-app', name: 'FastAPI', language: 'python', description: 'Uvicorn | Python', icon: '⚡', color: 'from-teal-500/20 to-teal-600/10 border-teal-500/30', hasPreview: true },
  { id: 'spring-boot', name: 'Spring Boot', language: 'java', description: 'Spring | JVM', icon: '🍃', color: 'from-green-600/20 to-green-700/10 border-green-600/30', hasPreview: true },
  { id: 'dotnet', name: '.NET Core', language: 'csharp', description: 'ASP.NET | CLR', icon: '🟣', color: 'from-purple-500/20 to-purple-600/10 border-purple-500/30', hasPreview: true },
];

interface TemplateSelectionProps {
  onSelect: (template: Template) => void;
  onShowDashboard: () => void;
  onLogin: () => void;
  onLogout: () => void;
  isAuthenticated: boolean;
}

export default function TemplateSelection({
  onSelect,
  onShowDashboard,
  onLogin,
  onLogout,
  isAuthenticated
}: TemplateSelectionProps) {
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'languages' | 'frameworks'>('languages');

  const filteredLanguages = LANGUAGES.filter(t =>
    t.name.toLowerCase().includes(search.toLowerCase()) || t.description.toLowerCase().includes(search.toLowerCase())
  );

  const filteredFrameworks = FRAMEWORKS.filter(t =>
    t.name.toLowerCase().includes(search.toLowerCase()) || t.description.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ backgroundColor: '#1e1e1e', color: '#cccccc', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px 24px 60px' }}>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '20px' }}>
          <UserProfile onLogout={onLogout} onLogin={onLogin} />
        </div>

        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px', marginBottom: '16px' }}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L2 7v10l10 5 10-5V7L12 2z" fill="#007acc" />
              <path d="M12 2v10l10 5V7L12 2z" fill="#005a9e" />
            </svg>
            <h1 style={{ fontSize: '32px', fontWeight: 600, color: '#cccccc' }}>Code Playground</h1>
          </div>
          <p style={{ color: '#858585', fontSize: '18px' }}>Multi-Language IDE with Docker Containers</p>
        </div>

        <div style={{ marginBottom: '40px' }}>
          <div style={{ position: 'relative', maxWidth: '500px', margin: '0 auto', marginBottom: '24px' }}>
            <svg style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', width: '20px', height: '20px', color: '#858585' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="8" strokeWidth={2} />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35" />
            </svg>
            <input
              type="text"
              placeholder="Search templates..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: '100%',
                padding: '14px 16px 14px 48px',
                backgroundColor: '#2d2d2d',
                border: '1px solid #3d3d3d',
                borderRadius: '8px',
                color: 'white',
                fontSize: '15px',
                outline: 'none',
                transition: 'border-color 0.2s'
              }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
            <button
              onClick={() => setActiveTab('languages')}
              style={{
                padding: '10px 24px',
                borderRadius: '8px',
                backgroundColor: activeTab === 'languages' ? '#007acc' : 'transparent',
                color: activeTab === 'languages' ? 'white' : '#858585',
                border: activeTab === 'languages' ? 'none' : '1px solid #3d3d3d',
                cursor: 'pointer',
                fontWeight: 500,
                transition: 'all 0.2s'
              }}
            >
              Languages
            </button>
            <button
              onClick={() => setActiveTab('frameworks')}
              style={{
                padding: '10px 24px',
                borderRadius: '8px',
                backgroundColor: activeTab === 'frameworks' ? '#007acc' : 'transparent',
                color: activeTab === 'frameworks' ? 'white' : '#858585',
                border: activeTab === 'frameworks' ? 'none' : '1px solid #3d3d3d',
                cursor: 'pointer',
                fontWeight: 500,
                transition: 'all 0.2s'
              }}
            >
              Frameworks
            </button>
          </div>
        </div>

        {!isAuthenticated && (
          <div style={{
            textAlign: 'center',
            padding: '40px',
            backgroundColor: '#252526',
            borderRadius: '12px',
            border: '1px solid #3d3d3d',
            marginBottom: '32px'
          }}>
            <h3 style={{ color: '#cccccc', marginBottom: '16px' }}>Authentication Required</h3>
            <p style={{ color: '#858585', marginBottom: '24px' }}>
              Please log in or register to create and manage your coding workspaces.
            </p>
            <button
              onClick={onLogin}
              style={{
                padding: '12px 24px',
                backgroundColor: '#007acc',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500'
              }}
            >
              Login / Register
            </button>
          </div>
        )}

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '16px',
          opacity: isAuthenticated ? 1 : 0.5,
          pointerEvents: isAuthenticated ? 'auto' : 'none'
        }}>
          {(activeTab === 'languages' ? filteredLanguages : filteredFrameworks).map((template) => (
            <button
              key={template.id}
              onClick={() => onSelect(template)}
              style={{
                padding: '24px',
                borderRadius: '12px',
                background: `linear-gradient(135deg, ${template.color.split(' ')[0].replace('/20', '.2')}, ${template.color.split(' ')[1].replace('/10', '.15')})`,
                border: '1px solid transparent',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.25s ease',
                transform: 'scale(1)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.02)';
                e.currentTarget.style.borderColor = '#007acc';
                e.currentTarget.style.boxShadow = '0 8px 30px rgba(0, 122, 204, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.borderColor = 'transparent';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <span style={{ fontSize: '36px' }}>{template.icon}</span>
                <div>
                  <h3 style={{ fontWeight: 600, color: 'white', fontSize: '18px', margin: 0 }}>{template.name}</h3>
                  <p style={{ color: '#a0a0a0', fontSize: '14px', marginTop: '4px' }}>{template.description}</p>
                </div>
              </div>
            </button>
          ))}
        </div>

        <div style={{ marginTop: '32px', textAlign: 'center' }}>
          <button
            onClick={onShowDashboard}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 24px',
              backgroundColor: 'transparent',
              border: '1px solid #3d3d3d',
              borderRadius: '8px',
              color: '#858585',
              fontSize: '14px',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#007acc'; e.currentTarget.style.color = '#cccccc'; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#3d3d3d'; e.currentTarget.style.color = '#858585'; }}
          >
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
            </svg>
            My Workspaces
          </button>
        </div>

        <div style={{ marginTop: '64px', textAlign: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '32px', color: '#666', fontSize: '14px' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              Docker Containers
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
              </svg>
              Monaco Editor
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Live Preview
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}