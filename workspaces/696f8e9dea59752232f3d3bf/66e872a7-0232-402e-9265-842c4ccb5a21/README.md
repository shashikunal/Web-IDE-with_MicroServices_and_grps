# Python Workspace

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
```bash
python main.py
```

## Installing Packages

### For WASM execution:
Use the "Packages" button to install Python packages via micropip.

### For Container execution:
```bash
pip install package-name
```

## Examples

### Hello World
```python
print("Hello, World!")
```

### Input/Output
```python
name = input("Enter your name: ")
print(f"Hello, {name}!")
```

### File Operations
```python
# Write to file
with open('output.txt', 'w') as f:
    f.write("Hello from Python!")

# Read from file
with open('output.txt', 'r') as f:
    content = f.read()
    print(content)
```
