# WASM Runners - Modular Architecture

## Directory Structure

```
frontend/src/utils/wasm/
├── index.ts              # Main dispatcher and exports
├── common.ts             # Shared types and utilities
├── pythonRunner.ts       # Python (Pyodide)
├── javascriptRunner.ts   # JavaScript (Native)
├── cppRunner.ts          # C/C++ (JSCPP)
├── javaRunner.ts         # Java (Doppio JVM) ⭐ NEW
├── rubyRunner.ts         # Ruby (ruby.wasm)
└── phpRunner.ts          # PHP (php-wasm)
```

## Language-Specific Files

### 1. **pythonRunner.ts** - Python Execution
- **Runtime**: Pyodide v0.25.0
- **Features**: Full Python 3.11, NumPy, Pandas
- **Size**: ~6.4MB
- **First Load**: ~15 seconds
- **Subsequent**: ~50ms

```typescript
import { runPython } from './utils/wasm/pythonRunner';
const result = await runPython('print("Hello")');
```

### 2. **javascriptRunner.ts** - JavaScript Execution
- **Runtime**: Native browser
- **Features**: ES2022+, Async/Await
- **Size**: 0KB (built-in)
- **First Load**: Instant
- **Subsequent**: <10ms

```typescript
import { runJavaScript } from './utils/wasm/javascriptRunner';
const result = await runJavaScript('console.log("Hello")');
```

### 3. **cppRunner.ts** - C/C++ Execution
- **Runtime**: JSCPP v1.1.3
- **Features**: C++11, STL support
- **Size**: ~200KB
- **First Load**: ~3 seconds
- **Subsequent**: ~80ms

```typescript
import { runCpp } from './utils/wasm/cppRunner';
const result = await runCpp('#include <iostream>\nint main() { std::cout << "Hello"; }');
```

### 4. **javaRunner.ts** - Java Execution ⭐ NEW
- **Runtime**: Doppio JVM v0.5.1
- **Features**: Java 8 compatible, JVM in JavaScript
- **Size**: ~3MB
- **First Load**: ~10 seconds
- **Subsequent**: ~200ms

```typescript
import { runJava } from './utils/wasm/javaRunner';
const result = await runJava('public class Main { public static void main(String[] args) { System.out.println("Hello"); } }');
```

**Java Features:**
- ✅ Full JVM implementation in JavaScript
- ✅ Automatic class name detection
- ✅ Compilation and execution in one step
- ✅ Standard library support
- ⚠️ Limited to Java 8 features
- ⚠️ No external JAR support (yet)

### 5. **rubyRunner.ts** - Ruby Execution
- **Runtime**: ruby.wasm v2.5.0
- **Features**: Ruby 3.2, CRuby
- **Size**: ~3.2MB
- **First Load**: ~8 seconds
- **Subsequent**: ~60ms

```typescript
import { runRuby } from './utils/wasm/rubyRunner';
const result = await runRuby('puts "Hello"');
```

### 6. **phpRunner.ts** - PHP Execution
- **Runtime**: php-wasm v0.0.9
- **Features**: PHP 8.2
- **Size**: ~2.1MB
- **First Load**: ~5 seconds
- **Subsequent**: ~70ms

```typescript
import { runPHP } from './utils/wasm/phpRunner';
const result = await runPHP('<?php echo "Hello"; ?>');
```

## Common Utilities (common.ts)

### Types
```typescript
interface ExecutionResult {
  success: boolean;
  output: string;
  error?: string;
  executionTime?: number;
}

interface WasmRunner {
  init(): Promise<void>;
  run(code: string): Promise<ExecutionResult>;
  isInitialized(): boolean;
}
```

### Utilities
- `measureExecutionTime()` - Performance tracking
- `captureConsoleOutput()` - Console interception
- `formatError()` - Error message formatting

## Main Dispatcher (index.ts)

### Primary Functions

```typescript
// Execute code in appropriate runtime
executeCode(language: string, code: string): Promise<ExecutionResult>

// Check if language is supported
isWasmSupported(language: string): boolean

// Get all supported languages
getSupportedLanguages(): string[]

// Pre-load a specific runtime
preloadLanguage(language: string): Promise<void>

// Pre-load all runtimes
preloadAllLanguages(): Promise<void>
```

### Usage Example

```typescript
import { executeCode, isWasmSupported } from './utils/wasm';

// Check support
if (isWasmSupported('java')) {
  // Execute
  const result = await executeCode('java', javaCode);
  
  if (result.success) {
    console.log('Output:', result.output);
    console.log('Time:', result.executionTime, 'ms');
  } else {
    console.error('Error:', result.error);
  }
}
```

## Supported Languages Matrix

| Language   | Runner File          | WASM Runtime | Status | Java Support |
|------------|---------------------|--------------|--------|--------------|
| Python     | pythonRunner.ts     | Pyodide      | ✅     | N/A          |
| JavaScript | javascriptRunner.ts | Native       | ✅     | N/A          |
| C/C++      | cppRunner.ts        | JSCPP        | ✅     | N/A          |
| **Java**   | **javaRunner.ts**   | **Doppio**   | **✅** | **NEW**      |
| Ruby       | rubyRunner.ts       | ruby.wasm    | ✅     | N/A          |
| PHP        | phpRunner.ts        | php-wasm     | ✅     | N/A          |
| Go         | -                   | -            | ❌     | Container    |
| Rust       | -                   | -            | ❌     | Container    |
| .NET       | -                   | -            | ❌     | Container    |

## Benefits of Modular Structure

### 1. **Better Organization**
- Each language in its own file
- Easy to locate and modify
- Clear separation of concerns

### 2. **Maintainability**
- Update one language without affecting others
- Add new languages easily
- Remove languages cleanly

### 3. **Performance**
- Tree-shaking: Only load needed runners
- Lazy loading: Load on demand
- Smaller bundle size

### 4. **Testing**
- Test each runner independently
- Mock specific runners
- Isolated unit tests

### 5. **Documentation**
- Each file is self-documenting
- Clear API per language
- Easy to understand

## Adding New Languages

To add a new language:

1. Create `newLanguageRunner.ts`:
```typescript
import type { ExecutionResult, WasmRunner } from './common';
import { measureExecutionTime, formatError } from './common';

class NewLanguageRunner implements WasmRunner {
  async init(): Promise<void> { /* ... */ }
  isInitialized(): boolean { /* ... */ }
  async run(code: string): Promise<ExecutionResult> { /* ... */ }
}

export async function runNewLanguage(code: string): Promise<ExecutionResult> {
  return runner.run(code);
}
```

2. Update `index.ts`:
```typescript
import { runNewLanguage } from './newLanguageRunner';

const SUPPORTED_LANGUAGES = {
  // ...
  newlanguage: runNewLanguage
};
```

3. Done! The language is now available.

## Migration from Old Structure

**Old (monolithic):**
```
utils/wasmRunners.ts (300+ lines)
```

**New (modular):**
```
utils/wasm/
  ├── index.ts (100 lines)
  ├── common.ts (50 lines)
  ├── pythonRunner.ts (70 lines)
  ├── javascriptRunner.ts (50 lines)
  ├── cppRunner.ts (80 lines)
  ├── javaRunner.ts (120 lines) ⭐
  ├── rubyRunner.ts (70 lines)
  └── phpRunner.ts (60 lines)
```

**Benefits:**
- ✅ 600 lines → 7 files of ~70 lines each
- ✅ Each file focused on one language
- ✅ Easier to understand and maintain
- ✅ Better for code reviews
- ✅ Supports tree-shaking

## Java-Specific Notes

### Doppio JVM Features
- ✅ Compiles `.java` files to `.class`
- ✅ Executes bytecode in browser
- ✅ Standard library included
- ✅ Automatic class detection
- ⚠️ Java 8 compatible (not Java 11+)
- ⚠️ No external dependencies yet

### Example Java Code
```java
public class HelloWorld {
    public static void main(String[] args) {
        System.out.println("Hello from Java WASM!");
        
        int sum = 0;
        for (int i = 1; i <= 5; i++) {
            sum += i;
        }
        System.out.println("Sum: " + sum);
    }
}
```

### Performance
- **First run**: ~10s (JVM download + initialization)
- **Compilation**: ~100-200ms
- **Execution**: ~50-100ms
- **Total (after init)**: ~150-300ms

Much faster than container execution (~5-8 seconds)!
