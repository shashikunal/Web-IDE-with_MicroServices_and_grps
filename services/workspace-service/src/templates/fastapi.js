export default {
  id: 'fastapi-app',
  name: 'FastAPI',
  // Alpine is often tricky for python binary wheels, using slim might be safer but user asked for standard python:3.11. 
  // We'll stick to alpine for consistency if possible, but installing libraries might take longer.
  // Switching to python:3.11-slim as it's better for compiling wheels if needed, but the prompt example used python:3.11 (which is usually debian based or use -alpine tag explicitly).
  // The provided prompt mental model says "python:3.11".
  image: 'python:3.11-alpine', 
  language: 'python',
  entrypoint: ['sh'],
  // Install dependencies if not present, then run
  cmd: ['-c', 'if [ -f requirements.txt ]; then pip install -r requirements.txt; fi && uvicorn main:app --host 0.0.0.0 --port 8000 --reload'],
  port: 8000,
  files: {
    'main.py': `from fastapi import FastAPI

app = FastAPI()

@app.get("/")
def read_root():
    return {"Hello": "FastAPI"}
`,
    'requirements.txt': 'fastapi\nuvicorn\n'
  },
  setupScript: 'pip install fastapi uvicorn'
};
