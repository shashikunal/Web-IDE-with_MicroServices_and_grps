import { useRef, useEffect, useCallback } from 'react';
import Editor from '@monaco-editor/react';
import type { editor } from 'monaco-editor';
import { emmetHTML, emmetCSS, emmetJSX } from 'emmet-monaco-es';
import { configureMonaco, COMMON_EDITOR_OPTIONS } from './editorConfig';

interface Tab {
  id: string;
  name: string;
  path: string;
  content: string;
  language: string;
  modified: boolean;
}

interface EditorProps {
  tabs: Tab[];
  activeTab: string;
  onContentChange: (tabId: string, content: string) => void;
  onSave: (tabId: string) => void;
}

export default function CodeEditor({
  tabs,
  activeTab,
  onContentChange,
  onSave
}: EditorProps) {
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);

  const activeTabData = tabs.find(t => t.id === activeTab);

  // Keep a ref to activeTab for the command execution context
  const activeTabRef = useRef(activeTab);
  useEffect(() => {
    activeTabRef.current = activeTab;
  }, [activeTab]);

  const handleEditorWillMount = useCallback((monaco: any) => {
    // 2. Configure Compiler Options (Linting, Targets)
    // This must happen BEFORE the editor is mounted for defaults to apply correctly
    configureMonaco(monaco);

    // 1. Enable Emmet for fast coding
    emmetHTML(monaco);
    emmetCSS(monaco);
    emmetJSX(monaco);
  }, []);

  const handleEditorDidMount = useCallback((editor: editor.IStandaloneCodeEditor, monaco: any) => {
    editorRef.current = editor;

    // Force update options to ensure validation is off
    editor.updateOptions({
      renderValidationDecorations: 'off'
    });



    // 3. Clean up default Monaco UI (Tabs, Breadcrumbs) if they interfere with our custom UI
    // Note: In some versions of Monaco, these aren't present by default in IStandaloneEditor,
    // but this safety check ensures a clean look.
    try {
      const node = editor.getDomNode();
      if (node) {
        node.querySelector('.monaco-editor-tabs')?.remove();
        node.parentElement?.querySelector('.monaco-breadcrumbs')?.remove();
        node.parentElement?.querySelector('.monaco-editor-title')?.remove();
      }
} catch {
      // Ignore DOM errors
    }

    // 4. Register Custom Commands
    // Save + Auto-Format
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, async () => {
      // Trigger built-in Document Formatting
      await editor.getAction('editor.action.formatDocument')?.run();

      // Save current file
      if (activeTabRef.current) {
        onSave(activeTabRef.current);
      }
    });
  }, [onSave]);

  const handleChange = (value: string | undefined) => {
    if (activeTab && value !== undefined) {
      onContentChange(activeTab, value);
    }
  };

  if (!activeTabData) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        backgroundColor: '#1e1e1e',
        color: '#cccccc',
        fontSize: '14px'
      }}>
        Select a file to start editing
      </div>
    );
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <style>{`
        .monaco-editor .monaco-editor-title,
        .monaco-editor .monaco-editor-tabs,
        .monaco-editor .monaco-breadcrumbs,
        .monaco-editor .monaco-editor-header {
          display: none !important;
        }
      `}</style>

      <div style={{ flex: 1, position: 'relative' }}>
        <Editor
          height="100%"
          language={activeTabData.language}
          value={activeTabData.content}
          path={activeTabData.path}
          onChange={handleChange}
          onMount={handleEditorDidMount}
          beforeMount={handleEditorWillMount}
          theme="vs-dark"
          options={{
            ...COMMON_EDITOR_OPTIONS,
            // Override or add specific instance options here
            readOnly: false,
          }}
        />
      </div>
    </div>
  );
}