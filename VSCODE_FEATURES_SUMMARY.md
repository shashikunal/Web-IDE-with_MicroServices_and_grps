# VS Code Features - Implementation Summary

## Your Request

You want the IDE to have **full VS Code functionality** with:
1. ✅ Nested folders expanding properly
2. ✅ Exit confirmation toast
3. ✅ Multiple terminals with close buttons
4. ✅ Right-click context menu (create file/folder, rename, copy, paste, delete)
5. ✅ Proper VS Code design and logic

## Current Status

### What's Working ✅
- Basic file explorer
- Single terminal
- Code editor with Monaco
- File save/load
- Preview pane

### What Needs Implementation 🔧

#### 1. Folder Expansion (Critical)
**Issue:** Clicking folders doesn't show contents

**Root Cause:** The backend returns only top-level files. When a folder is clicked, we need to:
1. Fetch `/api/container/files?path=/src`
2. Load children into that folder
3. Expand the folder

**Fix Required:**
- Update `VSCodeIDE.tsx` to handle folder clicks
- Fetch subdirectory contents on-demand
- Update file tree state

#### 2. Exit Confirmation
**Implementation:**
```typescript
import toast from 'react-hot-toast';

const handleExit = () => {
  toast((t) => (
    <div>
      <p>Are you sure you want to exit?</p>
      <div style={{ marginTop: '10px' }}>
        <button onClick={() => {
          toast.dismiss(t.id);
          navigate('/dashboard');
        }}>
          Yes, Exit
        </button>
        <button onClick={() => toast.dismiss(t.id)}>
          Cancel
        </button>
      </div>
    </div>
  ), { duration: Infinity });
};
```

#### 3. Multiple Terminals
**Design:**
```
┌─────────────────────────────────────┐
│ Terminal 1 × │ Terminal 2 × │ + │
├─────────────────────────────────────┤
│ $ npm run dev                       │
│ > vite                              │
│ Server running...                   │
└─────────────────────────────────────┘
```

**Implementation:**
- Tab bar above terminal
- Each tab has close button (×)
- Plus button (+) to add new terminal
- Switch between terminals
- Each terminal maintains its own session

#### 4. Context Menu
**On File Right-Click:**
```
┌──────────────────┐
│ ✏️  Rename        │
│ 📋 Copy          │
│ 📄 Copy Path     │
│ ──────────────── │
│ 🗑️  Delete        │
└──────────────────┘
```

**On Folder Right-Click:**
```
┌──────────────────┐
│ 📄 New File      │
│ 📁 New Folder    │
│ ──────────────── │
│ ✏️  Rename        │
│ 📋 Copy          │
│ 📌 Paste         │
│ ──────────────── │
│ 🗑️  Delete        │
└──────────────────┘
```

**On Background Right-Click:**
```
┌──────────────────┐
│ 📄 New File      │
│ 📁 New Folder    │
│ 📌 Paste         │
└──────────────────┘
```

#### 5. VS Code Design Elements

**Activity Bar (Left):**
```
┌───┐
│ 📁 │ Explorer
│ 🔍 │ Search
│ 🔀 │ Source Control
│ 🐛 │ Debug
│ 🧩 │ Extensions
└───┘
```

**Status Bar (Bottom):**
```
┌────────────────────────────────────────────────────┐
│ ⚡ Ln 1, Col 1 │ UTF-8 │ TypeScript │ ✓ Saved    │
└────────────────────────────────────────────────────┘
```

**Breadcrumbs:**
```
workspace > src > components > FileExplorer.tsx
```

## Implementation Plan

### Phase 1: Critical Fixes (Do First)

**1.1 Fix Folder Expansion**
- File: `frontend/src/components/editor/VSCodeIDE.tsx`
- Add `handleFolderClick` function
- Fetch folder contents from API
- Update file tree state

**1.2 Add Exit Confirmation**
- File: `frontend/src/components/editor/VSCodeIDE.tsx`
- Import `toast` from react-hot-toast
- Add confirmation dialog
- Handle yes/no actions

**1.3 Create Context Menu Component**
- File: `frontend/src/components/context-menu/ContextMenu.tsx`
- Position at mouse coordinates
- Different menus for file/folder/background
- Handle all actions

### Phase 2: Terminal Features

**2.1 Multiple Terminal Tabs**
- File: `frontend/src/components/editor/VSCodeIDE.tsx`
- State: `terminals: Terminal[]`
- Tab bar UI
- Switch terminal logic

**2.2 Terminal Close Button**
- Add × button to each tab
- Confirm before closing if process running
- Remove terminal from state

**2.3 New Terminal Button**
- Add + button
- Create new WebSocket connection
- Add to terminals array

### Phase 3: VS Code Polish

**3.1 Activity Bar**
- File: `frontend/src/components/layout/ActivityBar.tsx`
- Icons for Explorer, Search, etc.
- Active state highlighting

**3.2 Status Bar**
- File: `frontend/src/components/layout/StatusBar.tsx`
- Line/column info
- File encoding
- Language mode

**3.3 Breadcrumbs**
- File: `frontend/src/components/layout/Breadcrumbs.tsx`
- Show current file path
- Clickable segments

## Code Examples

### Folder Expansion Fix
```typescript
const handleFolderToggle = async (path: string) => {
  if (expandedFolders.has(path)) {
    // Collapse
    setExpandedFolders(prev => {
      const next = new Set(prev);
      next.delete(path);
      return next;
    });
  } else {
    // Expand - fetch contents if not loaded
    const folder = findFolder(files, path);
    if (!folder.children || folder.children.length === 0) {
      // Fetch from API
      const response = await fetch(
        `/api/container/files?userId=${userId}&path=${path}`
      );
      const data = await response.json();
      
      // Update file tree
      setFiles(prev => updateFolderContents(prev, path, data.items));
    }
    
    setExpandedFolders(prev => new Set([...prev, path]));
  }
};
```

### Context Menu Component
```typescript
interface ContextMenuProps {
  x: number;
  y: number;
  type: 'file' | 'folder' | 'background';
  path?: string;
  name?: string;
  onClose: () => void;
  onAction: (action: string, path?: string) => void;
}

export default function ContextMenu({ x, y, type, path, name, onClose, onAction }: ContextMenuProps) {
  const menuItems = getMenuItems(type);
  
  return (
    <div
      style={{
        position: 'fixed',
        left: x,
        top: y,
        backgroundColor: '#252526',
        border: '1px solid #454545',
        borderRadius: '4px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
        zIndex: 10000
      }}
      onClick={onClose}
    >
      {menuItems.map((item, i) => (
        item.separator ? (
          <div key={i} style={{ height: '1px', background: '#454545', margin: '4px 0' }} />
        ) : (
          <div
            key={i}
            onClick={() => onAction(item.action, path)}
            style={{
              padding: '6px 20px',
              cursor: 'pointer',
              fontSize: '13px',
              color: '#cccccc'
            }}
          >
            {item.icon} {item.label}
          </div>
        )
      ))}
    </div>
  );
}
```

### Multiple Terminals
```typescript
const [terminals, setTerminals] = useState([
  { id: '1', title: 'bash', isActive: true }
]);

const addTerminal = () => {
  const newId = Date.now().toString();
  setTerminals(prev => [
    ...prev.map(t => ({ ...t, isActive: false })),
    { id: newId, title: 'bash', isActive: true }
  ]);
};

const closeTerminal = (id: string) => {
  setTerminals(prev => {
    const filtered = prev.filter(t => t.id !== id);
    if (filtered.length > 0 && !filtered.some(t => t.isActive)) {
      filtered[0].isActive = true;
    }
    return filtered;
  });
};
```

## Time Estimate

- **Folder Expansion Fix:** 30 minutes
- **Exit Confirmation:** 15 minutes
- **Context Menu:** 1 hour
- **Multiple Terminals:** 1 hour
- **VS Code Polish:** 2 hours
- **Testing & Bug Fixes:** 1 hour

**Total: ~5-6 hours of development**

## Next Steps

Given the scope, I recommend implementing in this order:

1. **First:** Fix folder expansion (most critical)
2. **Second:** Add exit confirmation (quick win)
3. **Third:** Context menu (high value)
4. **Fourth:** Multiple terminals (nice to have)
5. **Fifth:** VS Code polish (aesthetic)

Would you like me to:
1. Implement all features now (will take time)
2. Start with critical fixes (folder expansion + exit confirmation)
3. Create detailed code for you to review first

Let me know your preference and I'll proceed accordingly!
