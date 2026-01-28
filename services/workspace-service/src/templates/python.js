export default {
  id: 'python-core',
  name: 'Python',
  type: 'language',
  image: 'python:3.11-alpine',
  language: 'python',
  compiler: null, // Interpreted
  interpreter: 'python3',
  runtime: 'python',
  entrypoint: ['sh'],
  cmd: ['-c', 'tail -f /dev/null'], // Keep container alive for terminal access
  port: null, // No web server - core Python only
  files: {
    'main.py': `# Python 3.11 - Core Interpreter
# Write your Python code here

def greet(name):
    return f"Hello, {name}!"

def main():
    print("Welcome to Python!")
    print(greet("World"))
    
    # Example: Basic calculations
    numbers = [1, 2, 3, 4, 5]
    total = sum(numbers)
    print(f"Sum of {numbers} = {total}")
    
    # Example: List comprehension
    squares = [x**2 for x in numbers]
    print(f"Squares: {squares}")

if __name__ == "__main__":
    main()
`,
    'README.md': `# Python Workspace

This is a core Python 3.11 environment for running Python scripts.

## Running Your Code

### Option 1: WASM (Browser-based - Instant)
Click the "Run Code" button in the editor to execute your code instantly using Pyodide WASM.
- ✅ Instant execution
- ✅ No container startup time
- ✅ Full Python 3.11 support
- ✅ Package installation via micropip

### Option 2: Container (Backend)
Run commands in the terminal:
\`\`\`bash
python main.py
\`\`\`

## Installing Packages

### For WASM execution:
Use the "Packages" button to install Python packages via micropip.

### For Container execution:
\`\`\`bash
pip install package-name
\`\`\`

## Examples

### Hello World
\`\`\`python
print("Hello, World!")
\`\`\`

### Input/Output
\`\`\`python
name = input("Enter your name: ")
print(f"Hello, {name}!")
\`\`\`

### File Operations
\`\`\`python
# Write to file
with open('output.txt', 'w') as f:
    f.write("Hello from Python!")

# Read from file
with open('output.txt', 'r') as f:
    content = f.read()
    print(content)
\`\`\`
`
  }
};
