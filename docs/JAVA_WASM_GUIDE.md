# Java WASM Execution - Complete Guide

## Overview

We provide **two Java WASM runtimes** to suit different needs:

### 1. **Doppio JVM** (Default - Lightweight)
- ✅ Java 8 compatible
- ✅ Fast initialization (~10s)
- ✅ Small download size (~3MB)
- ✅ Good for simple programs
- ⚠️ Limited to Java 8 features
- ⚠️ No external JAR support

### 2. **CheerpJ** (Enhanced - Full-Featured) ⭐ NEW
- ✅ **Java 11+ compatible**
- ✅ **External JAR support**
- ✅ **Maven repository integration**
- ✅ Full Java standard library
- ✅ Modern Java features (lambdas, streams, modules)
- ⚠️ Larger download (~15MB)
- ⚠️ Slower initialization (~20s first time)

## Using CheerpJ (Recommended)

### Basic Execution

```typescript
import { runJava } from './utils/wasm/javaRunnerEnhanced';

const javaCode = `
public class HelloWorld {
    public static void main(String[] args) {
        System.out.println("Hello from Java 11+!");
        
        // Use modern Java features
        var numbers = List.of(1, 2, 3, 4, 5);
        numbers.stream()
            .filter(n -> n % 2 == 0)
            .forEach(System.out::println);
    }
}
`;

const result = await runJava(javaCode);
console.log(result.output);
```

### Loading External JARs

#### Method 1: Load Common Libraries

```typescript
import { loadCommonJar, loadCommonJars } from './utils/wasm/javaRunnerEnhanced';

// Load single library
await loadCommonJar('guava');

// Load multiple libraries
await loadCommonJars(['guava', 'gson', 'commons-lang3']);

// Now use them in your code
const code = `
import com.google.common.collect.ImmutableList;

public class Main {
    public static void main(String[] args) {
        ImmutableList<String> list = 
            ImmutableList.of("Hello", "from", "Guava");
        System.out.println(list);
    }
}
`;

await runJava(code);
```

#### Method 2: Load Custom JAR from URL

```typescript
import { loadJavaJar } from './utils/wasm/javaRunnerEnhanced';

// Load from Maven Central or any URL
await loadJavaJar(
    'https://repo1.maven.org/maven2/org/apache/commons/commons-text/1.11.0/commons-text-1.11.0.jar',
    'commons-text.jar'
);

// Use in your code
const code = `
import org.apache.commons.text.StringEscapeUtils;

public class Main {
    public static void main(String[] args) {
        String html = StringEscapeUtils.escapeHtml4("<div>Hello</div>");
        System.out.println(html);
    }
}
`;

await runJava(code);
```

#### Method 3: Load Multiple JARs

```typescript
import { loadJavaJars } from './utils/wasm/javaRunnerEnhanced';

await loadJavaJars([
    { url: 'https://example.com/lib1.jar', name: 'lib1.jar' },
    { url: 'https://example.com/lib2.jar', name: 'lib2.jar' },
    { url: 'https://example.com/lib3.jar' } // name is optional
]);
```

### Managing Loaded JARs

```typescript
import { getLoadedJavaJars, clearJavaJars } from './utils/wasm/javaRunnerEnhanced';

// Get list of loaded JARs
const jars = getLoadedJavaJars();
console.log('Loaded JARs:', jars);

// Clear all JARs (useful for cleanup)
clearJavaJars();
```

## Available Common Libraries

The following libraries are pre-configured and can be loaded with `loadCommonJar()`:

### Apache Commons
- `commons-lang3` - String manipulation, utilities
- `commons-io` - I/O utilities
- `commons-collections4` - Enhanced collections

### Google Libraries
- `guava` - Google's core libraries (collections, caching, primitives)

### JSON Processing
- `gson` - Google's JSON library
- `jackson-core` - Jackson JSON core
- `jackson-databind` - Jackson data binding

### Logging
- `slf4j-api` - Logging facade
- `logback-classic` - Logging implementation

### Testing
- `junit` - JUnit 4
- `junit-jupiter` - JUnit 5

## UI Component - JAR Manager

Use the JAR Manager component for a visual interface:

```tsx
import JarManager from './components/java/JarManager';

function MyComponent() {
  const [showJarManager, setShowJarManager] = useState(false);
  
  return (
    <>
      <button onClick={() => setShowJarManager(true)}>
        Manage JARs
      </button>
      
      {showJarManager && (
        <JarManager onClose={() => setShowJarManager(false)} />
      )}
    </>
  );
}
```

**Features:**
- View loaded JARs
- Load common libraries with one click
- Load custom JARs from URL
- Clear all JARs
- Usage examples

## Complete Example

```typescript
import { 
  runJava, 
  loadCommonJars,
  getLoadedJavaJars 
} from './utils/wasm/javaRunnerEnhanced';

async function runJavaWithLibraries() {
  // 1. Load required libraries
  console.log('Loading libraries...');
  await loadCommonJars(['guava', 'gson']);
  
  // 2. Verify loaded
  const jars = getLoadedJavaJars();
  console.log('Loaded:', jars.map(j => j.name));
  
  // 3. Run code using the libraries
  const code = `
import com.google.common.collect.ImmutableList;
import com.google.gson.Gson;

public class Main {
    static class Person {
        String name;
        int age;
        
        Person(String name, int age) {
            this.name = name;
            this.age = age;
        }
    }
    
    public static void main(String[] args) {
        // Use Guava
        ImmutableList<Person> people = ImmutableList.of(
            new Person("Alice", 30),
            new Person("Bob", 25)
        );
        
        // Use Gson
        Gson gson = new Gson();
        people.forEach(p -> {
            String json = gson.toJson(p);
            System.out.println(json);
        });
    }
}
  `;
  
  const result = await runJava(code);
  
  if (result.success) {
    console.log('Output:', result.output);
    console.log('Time:', result.executionTime, 'ms');
  } else {
    console.error('Error:', result.error);
  }
}
```

## Finding JARs

### Maven Central Repository

Most Java libraries are available on Maven Central:
1. Go to https://mvnrepository.com/
2. Search for your library
3. Click on the version you want
4. Copy the JAR download URL from "Files" section

Example URL format:
```
https://repo1.maven.org/maven2/{group}/{artifact}/{version}/{artifact}-{version}.jar
```

### Direct JAR URLs

You can load any JAR from any accessible URL:
- GitHub releases
- Your own CDN
- Corporate artifact repository
- Local development server

## Performance

### CheerpJ Performance
- **First Load**: ~20 seconds (runtime download)
- **Compilation**: ~200-500ms per class
- **Execution**: ~100-300ms
- **With JARs**: +50-100ms per JAR loaded

### Optimization Tips
1. **Preload Runtime**: Initialize CheerpJ on app startup
2. **Load JARs Once**: Load common JARs at startup, reuse across executions
3. **Cache JARs**: Browser caches JAR files after first download
4. **Use Common JARs**: Pre-configured JARs load faster

## Limitations

### CheerpJ Limitations
- ✅ Java 11 features supported
- ✅ Most standard library works
- ⚠️ No native code (JNI)
- ⚠️ No file system access (virtual FS only)
- ⚠️ No network access from Java code
- ⚠️ Some reflection features limited

### JAR Compatibility
- ✅ Pure Java JARs work great
- ✅ Most Apache/Google libraries supported
- ⚠️ JARs with native dependencies won't work
- ⚠️ JARs requiring file I/O may have issues

## Troubleshooting

### "Failed to load JAR"
- **Cause**: JAR URL inaccessible, CORS issue
- **Solution**: Ensure JAR is publicly accessible and CORS-enabled

### "Class not found"
- **Cause**: JAR not loaded or wrong classpath
- **Solution**: Load JAR before running code, check JAR contains the class

### "Compilation failed"
- **Cause**: Syntax error or missing dependency
- **Solution**: Check Java syntax, ensure all required JARs are loaded

### Slow execution
- **Cause**: First-time runtime initialization
- **Solution**: Use preloader to initialize in background

## Comparison: Doppio vs CheerpJ

| Feature | Doppio | CheerpJ |
|---------|--------|---------|
| Java Version | 8 | 11+ |
| External JARs | ❌ | ✅ |
| Download Size | ~3MB | ~15MB |
| Init Time | ~10s | ~20s |
| Execution Speed | Fast | Medium |
| Standard Library | Basic | Full |
| Modern Features | ❌ | ✅ (lambdas, streams, var) |
| Maven Integration | ❌ | ✅ |
| Best For | Simple programs | Real applications |

## Recommendation

- **Use Doppio** for:
  - Simple Hello World programs
  - Learning basic Java
  - Quick prototypes
  - When size/speed matters

- **Use CheerpJ** for:
  - Real applications
  - Using external libraries
  - Modern Java features
  - Production-like code

## Switching Between Runtimes

```typescript
// Use Doppio (default)
import { runJava } from './utils/wasm/javaRunner';

// Use CheerpJ (enhanced)
import { runJava } from './utils/wasm/javaRunnerEnhanced';
```

The API is the same, just import from different files!

## Future Enhancements

- [ ] Automatic dependency resolution
- [ ] Maven POM file support
- [ ] Gradle integration
- [ ] JAR caching in IndexedDB
- [ ] Multi-file Java projects
- [ ] Package explorer
- [ ] Javadoc integration
- [ ] Code completion from JARs
