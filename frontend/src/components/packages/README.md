# Package Management System - LeetCode-Style UI

## 🎯 Overview

A clean, modular package management system integrated into the IDE with a LeetCode-style interface. Each language has its own dedicated package manager component.

## 📁 File Structure

```
frontend/src/components/
├── packages/
│   ├── PackageManagerHub.tsx          # Main hub with tabs
│   ├── PythonPackageManager.tsx       # Python packages (micropip)
│   ├── JavaScriptPackageManager.tsx   # JS packages (esm.sh)
│   └── README.md                      # This file
├── java/
│   └── JarManager.tsx                 # Java JARs (Maven Central)
└── editor/
    └── ConsoleRunner.tsx              # Integrated "Packages" button
```

## ✨ Features

### 1. **Unified Hub Interface**
- Tabbed interface for all languages
- Consistent design across all package managers
- Easy language switching
- Clean, minimal UI

### 2. **Language-Specific Managers**

#### Python Package Manager
- Install packages via micropip (Pyodide)
- Quick install presets (datascience, ml, web, testing)
- View installed packages
- Search and install any PyPI package
- Usage examples

#### JavaScript Package Manager
- Load packages from esm.sh CDN
- Version specification support
- Quick load presets (utils, ui, data)
- View loaded packages
- Usage examples

#### Java JAR Manager
- Load JARs from Maven Central
- 12 pre-configured common libraries
- Custom JAR loading from URL
- Classpath management
- Usage examples

### 3. **Integration**
- "Packages" button in ConsoleRunner header
- Only shows for WASM-supported languages
- Modal overlay design
- Keyboard shortcuts support

## 🚀 Usage

### For Users

#### Access Package Manager
1. Open a workspace with Python, JavaScript, or Java
2. Look for the "Packages" button next to "Run Code"
3. Click to open the package manager
4. Select your language tab
5. Install packages or JARs

#### Install Packages

**Python:**
1. Type package name (e.g., `numpy`)
2. Click "Install"
3. Or use quick presets (e.g., "datascience")

**JavaScript:**
1. Type package name (e.g., `lodash`)
2. Optionally specify version
3. Click "Load"
4. Or use quick presets (e.g., "utils")

**Java:**
1. Click a common library (e.g., "Guava")
2. Or enter custom JAR URL
3. JAR is automatically added to classpath

#### Use Installed Packages

**Python:**
```python
import numpy as np
arr = np.array([1, 2, 3, 4, 5])
print(arr.mean())
```

**JavaScript:**
```javascript
const _ = window.lodash_;
const result = _.map([1, 2, 3], n => n * 2);
console.log(result);
```

**Java:**
```java
import com.google.common.collect.ImmutableList;

public class Main {
    public static void main(String[] args) {
        var list = ImmutableList.of("Hello", "World");
        System.out.println(list);
    }
}
```

### For Developers

#### Import Package Manager Hub
```tsx
import PackageManagerHub from './components/packages/PackageManagerHub';

function MyComponent() {
  const [showPackages, setShowPackages] = useState(false);
  
  return (
    <>
      <button onClick={() => setShowPackages(true)}>
        Manage Packages
      </button>
      
      {showPackages && (
        <PackageManagerHub
          initialLanguage="python"
          onClose={() => setShowPackages(false)}
        />
      )}
    </>
  );
}
```

#### Import Individual Managers
```tsx
import PythonPackageManager from './components/packages/PythonPackageManager';
import JavaScriptPackageManager from './components/packages/JavaScriptPackageManager';
import JarManager from './components/java/JarManager';

// Use individually
<PythonPackageManager onClose={() => setShow(false)} />
```

#### Programmatic Package Installation
```typescript
import {
  installPythonPackage,
  loadJavaScriptPackage,
  loadJavaJar
} from './utils/wasm';

// Python
await installPythonPackage('numpy');

// JavaScript
await loadJavaScriptPackage('lodash', '4.17.21');

// Java
await loadJavaJar('https://repo1.maven.org/maven2/.../guava.jar', 'guava.jar');
```

## 🎨 Design Philosophy

### LeetCode-Style Principles

1. **Clean & Minimal**
   - No unnecessary elements
   - Focus on functionality
   - Clear visual hierarchy

2. **Consistent**
   - Same layout across all managers
   - Unified color scheme
   - Predictable interactions

3. **Efficient**
   - Quick access to common packages
   - Preset bundles for common use cases
   - Minimal clicks to install

4. **Informative**
   - Clear status messages
   - Usage examples included
   - Package counts displayed

### Color Scheme

```css
/* Background */
--bg-primary: #1e1e1e;
--bg-secondary: #252526;
--bg-tertiary: #1e1e1e;

/* Borders */
--border-primary: #3e3e42;
--border-hover: #007acc;

/* Text */
--text-primary: #ffffff;
--text-secondary: #cccccc;
--text-muted: #858585;

/* Status */
--success: #4ec9b0;
--error: #f48771;
--warning: #dcdcaa;

/* Language Colors */
--python: #3776ab;
--javascript: #f7df1e;
--java: #f59e0b;
```

## 📊 Component Architecture

```
PackageManagerHub
├── Tab Navigation
│   ├── Python Tab
│   ├── JavaScript Tab
│   └── Java Tab
└── Content Area
    ├── PythonPackageManager
    │   ├── Install Form
    │   ├── Preset Buttons
    │   ├── Installed List
    │   └── Usage Example
    ├── JavaScriptPackageManager
    │   ├── Load Form
    │   ├── Preset Buttons
    │   ├── Loaded List
    │   └── Usage Example
    └── JarManager
        ├── Common Libraries
        ├── Custom JAR Form
        ├── Loaded JARs List
        └── Usage Example
```

## 🔧 Customization

### Add New Preset

**Python:**
```typescript
// In packageManager.ts
export const PACKAGE_PRESETS = {
  python: {
    // ... existing presets
    mypreset: ['package1', 'package2', 'package3']
  }
};
```

**JavaScript:**
```typescript
export const PACKAGE_PRESETS = {
  javascript: {
    // ... existing presets
    mypreset: ['package1', 'package2']
  }
};
```

### Add New Common JAR

```typescript
// In javaRunnerEnhanced.ts
export const COMMON_JAVA_JARS = {
  // ... existing JARs
  'my-library': 'https://repo1.maven.org/maven2/.../my-library.jar'
};
```

### Customize Styling

Each component uses Tailwind CSS classes. Modify the `className` props to customize:

```tsx
// Example: Change button color
<button className="bg-[#your-color] hover:bg-[#your-hover-color]">
  Install
</button>
```

## 📈 Performance

### Load Times
- **Python packages**: ~1-3s per package
- **JavaScript packages**: ~500ms-2s per package
- **Java JARs**: ~1-5s depending on size

### Caching
- Browser caches all downloaded packages/JARs
- Subsequent loads are instant
- No re-download needed

### Optimization Tips
1. **Preload common packages** on app startup
2. **Use presets** instead of individual installs
3. **Load JARs once**, reuse across executions
4. **Batch install** multiple packages together

## 🐛 Troubleshooting

### Package Installation Fails
- **Cause**: Package not available in Pyodide/esm.sh
- **Solution**: Check package compatibility, try alternative

### JAR Load Fails
- **Cause**: CORS issue or invalid URL
- **Solution**: Ensure JAR is publicly accessible

### Package Not Found After Install
- **Cause**: Runtime not initialized
- **Solution**: Run code once to initialize runtime first

## 🔮 Future Enhancements

- [ ] Package search with autocomplete
- [ ] Version selection dropdown
- [ ] Dependency visualization
- [ ] Package size indicators
- [ ] Installation history
- [ ] Export/import package lists
- [ ] Offline package caching
- [ ] Package documentation links

## 📝 Summary

The package management system provides:
- ✅ Clean, LeetCode-style UI
- ✅ Modular, maintainable code structure
- ✅ Language-specific managers
- ✅ Unified hub interface
- ✅ Integrated into IDE
- ✅ Production-ready
- ✅ Fully documented

Perfect for a professional, user-friendly development experience!
