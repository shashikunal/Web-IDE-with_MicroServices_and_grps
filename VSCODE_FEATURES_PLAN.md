# VS Code Features Implementation Plan

## Issues to Fix & Features to Add

### 1. ✅ Fix Nested Folder Expansion
**Problem:** Folders don't expand to show contents
**Solution:** 
- Fetch folder contents on-demand when clicked
- Update FileExplorer to handle lazy loading
- Cache expanded folder contents

### 2. ✅ Exit Workspace Confirmation
**Feature:** Show toast confirmation before exiting
**Implementation:**
- Use react-hot-toast for beautiful toasts
- Add confirmation dialog
- "Are you sure you want to exit? Unsaved changes will be lost"

### 3. ✅ Multiple Terminals
**Features:**
- Multiple terminal tabs
- Close button on each tab
- Create new terminal button (+)
- Beautiful tab design like VS Code
- Switch between terminals

### 4. ✅ Context Menu (Right-Click)
**Features:**
- **On Files:**
  - Rename
  - Delete
  - Copy Path
  - Copy
  - Paste (if copied)
  
- **On Folders:**
  - New File
  - New Folder
  - Rename
  - Delete
  - Copy
  - Paste
  
- **On Background:**
  - New File
  - New Folder
  - Paste (if copied)

### 5. ✅ Proper VS Code Design
**UI Improvements:**
- Activity bar (left sidebar icons)
- Status bar (bottom)
- Breadcrumbs
- Tab close buttons
- Split editor support
- Command palette (Ctrl+Shift+P)
- File icons
- Syntax highlighting themes

## Implementation Order

### Phase 1: Core Fixes (Priority 1)
1. Fix folder expansion
2. Add exit confirmation
3. Context menu system

### Phase 2: Terminal Features (Priority 2)
4. Multiple terminals
5. Terminal tabs UI
6. Close terminal functionality

### Phase 3: VS Code Polish (Priority 3)
7. Activity bar
8. Status bar
9. Breadcrumbs
10. Command palette

## Technical Approach

### Folder Expansion Fix
```typescript
// When folder is clicked:
1. Check if contents are already loaded
2. If not, fetch from API: /api/container/files?path=/src
3. Update file tree with children
4. Expand folder
```

### Context Menu
```typescript
// Create ContextMenu component
interface ContextMenuItem {
  label: string;
  icon: string;
  action: () => void;
  separator?: boolean;
  disabled?: boolean;
}

// Position menu at mouse coordinates
// Handle different contexts (file/folder/background)
```

### Multiple Terminals
```typescript
interface Terminal {
  id: string;
  title: string;
  isActive: boolean;
}

// State management
const [terminals, setTerminals] = useState<Terminal[]>([
  { id: '1', title: 'Terminal 1', isActive: true }
]);

// Add terminal
const addTerminal = () => {
  const newId = Date.now().toString();
  setTerminals([...terminals, {
    id: newId,
    title: `Terminal ${terminals.length + 1}`,
    isActive: false
  }]);
};
```

## Files to Modify

1. **FileExplorer.tsx** - Folder expansion, context menu
2. **VSCodeIDE.tsx** - Multiple terminals, exit confirmation
3. **Terminal.tsx** - Terminal tabs UI
4. **New: ContextMenu.tsx** - Right-click menu component
5. **New: ActivityBar.tsx** - Left sidebar
6. **New: StatusBar.tsx** - Bottom bar
7. **apiSlice.ts** - Add file operations (create, rename, delete, copy)

## Dependencies Needed

```bash
npm install react-hot-toast  # For beautiful toasts
```

## Estimated Implementation Time

- Phase 1: ~2 hours
- Phase 2: ~1 hour
- Phase 3: ~2 hours
- **Total: ~5 hours**

## Next Steps

1. Start with folder expansion fix (most critical)
2. Add context menu system
3. Implement file operations
4. Add multiple terminals
5. Polish UI to match VS Code

Let's begin implementation!
