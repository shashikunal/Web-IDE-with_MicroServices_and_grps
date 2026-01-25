import React, { useState } from 'react';
import { RefreshCw, ExternalLink, Terminal, Globe, Zap } from 'lucide-react';
import ApiTestPanel from '../api-test/ApiTestPanel';

interface PreviewProps {
  url: string;
  visible: boolean;
}

export default function Preview({ url, visible }: PreviewProps) {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [retryCount, setRetryCount] = useState(0);
  const [connected, setConnected] = useState(false);

  const [cacheBuster, setCacheBuster] = useState(() => Date.now());
  const [activeTab, setActiveTab] = useState<'preview' | 'api-test' | 'console'>('preview');

  const [displayUrl, setDisplayUrl] = useState('');
  const [randomDomain, setRandomDomain] = useState('');
  const [logs, setLogs] = useState<Array<{ type: 'info' | 'error' | 'success', message: string, timestamp: string }>>([]);

  const addLog = (type: 'info' | 'error' | 'success', message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, { type, message, timestamp }]);
  };

  // Generate a deterministic domain based on the URL/Port
  React.useEffect(() => {
    const adjectives = ['shiny', 'fast', 'dark', 'epic', 'code', 'hyper', 'mega', 'ultra'];
    const nouns = ['app', 'site', 'web', 'dev', 'space', 'craft', 'view', 'port'];

    // Extract port from URL or use a hash
    let seed = 0;
    try {
      const u = new URL(url);
      seed = parseInt(u.port) || 0;
    } catch {
      seed = url.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    }

    // Ensure positive integers
    seed = Math.abs(seed);

    const adj = adjectives[seed % adjectives.length];
    const noun = nouns[(seed * 13) % nouns.length]; // *13 for variety
    const id = seed;

    setRandomDomain(`https://${adj}-${noun}-${id}.code-platform.app`);

    addLog('info', 'Preview environment initialized');
  }, [url]);

  React.useEffect(() => {
    setDisplayUrl(randomDomain);
  }, [randomDomain]);

  // Health check / Logger (Non-blocking)
  React.useEffect(() => {
    if (!visible) return;

    let mounted = true;

    const ping = async () => {
      try {
        await fetch(url, { method: 'GET', mode: 'no-cors' });
        if (mounted) {
          addLog('success', `Health check passed for ${url}`);
          setConnected(true);
        }
      } catch (err: any) {
        if (mounted) {
          addLog('info', `Health check (fetch) failed, but iframe may still work. (CORS/Network) - ${err.message}`);
          // Do NOT set error state here, let the iframe try to load.
        }
      }
    };

    setLoading(true);
    setConnected(false);
    setError(null);
    addLog('info', `Connecting to ${url}...`);

    // Attempt one ping, but don't block
    ping();

    return () => { mounted = false; };
  }, [url, retryCount, visible]);

  const handleRetry = () => {
    setLoading(true);
    setError(null);
    setRetryCount(prev => prev + 1);
    setCacheBuster(Date.now());
    addLog('info', 'Reloading preview...');
  };

  const handleOpenExternal = () => {
    window.open(url, '_blank');
    addLog('info', 'Opened in external browser');
  };

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDisplayUrl(e.target.value);
  };

  const handleUrlSubmit = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      // In a real app, this would update the preview URL. 
      // For now, we just acknowledge the user action.
      // We could try to parse the path and append it to the actual localhost URL.
      handleRetry();
    }
  };

  if (!visible) return null;

  if (!url) {
    return (
      <div className="flex flex-col h-full bg-[#1e1e1e] border-l border-[#2b2b2b] items-center justify-center text-[#858585] text-sm font-mono">
        <div className="flex flex-col items-center gap-2">
          <RefreshCw size={20} className="animate-spin text-[#007acc]" />
          <span>Waiting for application to start...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[#1e1e1e] border-l border-[#2b2b2b]">
      {/* Top Address Bar (Browser Chrome) - Only show for Preview Tab */}
      {activeTab === 'preview' && (
        <div className="flex items-center gap-2 p-1.5 bg-[#252526] border-b border-[#2b2b2b]">
          <div className="flex items-center gap-1">
            <button onClick={handleRetry} className="p-1 hover:bg-[#333] rounded text-[#858585] hover:text-white transition-colors" title="Reload">
              <RefreshCw size={12} />
            </button>
          </div>

          <div className="flex-1 relative group">
            <div className="absolute inset-y-0 left-2 flex items-center pointer-events-none">
              {url.includes('https') ? <span className="text-green-500 text-[10px]">🔒</span> : <Globe size={10} className="text-[#858585]" />}
            </div>
            <input
              type="text"
              value={displayUrl}
              onChange={handleUrlChange}
              onKeyDown={handleUrlSubmit}
              className="w-full bg-[#1e1e1e] text-[#cccccc] text-[11px] py-1 pl-6 pr-2 rounded border border-[#3c3c3c] focus:border-[#007acc] focus:outline-none font-mono transition-colors"
            />
          </div>

          <button onClick={handleOpenExternal} className="p-1 hover:bg-[#333] rounded text-[#858585] hover:text-white transition-colors" title="Open in New Tab">
            <ExternalLink size={12} />
          </button>
        </div>
      )}

      {/* Content Area */}
      <div className="flex-1 relative overflow-hidden bg-white">
        {activeTab === 'preview' ? (
          <>
            {/* <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#1e1e1e] text-[#858585] z-10 pointer-events-none" style={{ opacity: loading ? 1 : 0, transition: 'opacity 0.3s' }}>
                <RefreshCw size={24} className="animate-spin mb-3 text-[#007acc]" />
                <span className="text-xs">Connecting...</span>
            </div> */}

            {error ? (
              <div className="flex flex-col items-center justify-center h-full bg-[#1e1e1e] text-[#cccccc] p-6 text-center absolute inset-0 z-20">
                <div className="text-4xl mb-4">⚠️</div>
                <div className="text-sm font-medium text-[#f48771] mb-2">Connection Issue</div>
                <div className="text-xs text-[#858585] max-w-xs mb-4 leading-relaxed">{error}</div>
                <div className="flex gap-2">
                  <button
                    onClick={handleRetry}
                    className="flex items-center gap-2 px-3 py-1.5 bg-[#007acc] text-white rounded-sm text-xs hover:bg-[#0062a3] transition-colors"
                  >
                    <RefreshCw size={12} />
                    Retry
                  </button>
                  <button
                    onClick={() => { setError(null); setLoading(false); }}
                    className="px-3 py-1.5 bg-[#333] text-white rounded-sm text-xs hover:bg-[#444] transition-colors"
                  >
                    Show Anyway
                  </button>
                </div>
              </div>
            ) : null}

            <iframe
              key={`${url}-${retryCount}`}
              src={`${url}?t=${cacheBuster}`}
              className="w-full h-full border-none bg-white"
              title="Live Preview"
              sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-modals allow-presentation allow-downloads"
              onLoad={() => {
                setLoading(false);
                setError(null);
                addLog('success', 'Preview loaded (iframe onLoad)');
              }}
            />
          </>
        ) : activeTab === 'api-test' ? (
          <ApiTestPanel />
        ) : (
          <div className="h-full bg-[#1e1e1e] flex flex-col font-mono text-xs">
            <div className="flex items-center gap-2 text-[#cccccc] p-2 border-b border-[#333333] bg-[#252526]">
              <Terminal size={14} />
              <span>Console Output</span>
              <span className="flex-1"></span>
              <button onClick={() => setLogs([])} className="hover:text-white text-[#858585]">Clear</button>
            </div>
            <div className="flex-1 overflow-auto p-2 space-y-1">
              {logs.length === 0 && (
                <div className="text-[#666666] italic p-2">No logs yet...</div>
              )}
              {logs.map((log, i) => (
                <div key={i} className="flex gap-2 text-[#cccccc] font-mono border-b border-[#2b2b2b] pb-1 last:border-0">
                  <span className="text-[#666666] shrink-0">[{log.timestamp}]</span>
                  <span className={`break-all ${log.type === 'error' ? 'text-[#f48771]' :
                    log.type === 'success' ? 'text-[#89d185]' :
                      'text-[#cccccc]'
                    }`}>
                    {log.type === 'error' ? '✖' : log.type === 'success' ? '✔' : 'ℹ'} {log.message}
                  </span>
                </div>
              ))}
              <div className="mt-4 pt-4 border-t border-[#333] text-[#858585] italic">
                Note: This console tracks connection events. For JavaScript console logs from your app,
                please use <button onClick={handleOpenExternal} className="text-[#007acc] hover:underline">Open in New Tab</button> and press F12.
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Toolbar */}
      <div className="flex items-center justify-between h-7 bg-[#007acc] text-white px-2 select-none text-[10px]">
        <div className="flex items-center gap-2">
          <span>Target: {url}</span>
          <span className="opacity-50">|</span>
          <span>Status: {loading ? 'Loading...' : error ? 'Error' : 'Running'}</span>
        </div>

        <div className="flex items-center h-full gap-2">
          <button
            onClick={() => setActiveTab('preview')}
            className={`flex items-center gap-1 hover:text-white/80 transition-colors ${activeTab === 'preview' ? 'font-bold' : 'opacity-70'}`}
          >
            Preview
          </button>
          <span className="opacity-50">|</span>
          <button
            onClick={() => setActiveTab('api-test')}
            className={`flex items-center gap-1 hover:text-white/80 transition-colors ${activeTab === 'api-test' ? 'font-bold' : 'opacity-70'}`}
          >
            <Zap size={10} />
            API Tester
          </button>
          <span className="opacity-50">|</span>
          <button
            onClick={() => setActiveTab('console')}
            className={`flex items-center gap-1 hover:text-white/80 transition-colors ${activeTab === 'console' ? 'font-bold' : 'opacity-70'}`}
          >
            Console
            {logs.filter(l => l.type === 'error').length > 0 && (
              <span className="bg-[#f48771] text-black px-1 rounded-full text-[8px] font-bold">
                {logs.filter(l => l.type === 'error').length}
              </span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
