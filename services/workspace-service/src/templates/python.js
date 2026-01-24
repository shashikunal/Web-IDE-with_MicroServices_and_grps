export default {
  id: 'python-flask',
  name: 'Python',
  type: 'language', // Python is a language, although Flask is a framework. The template is "Flask App" but the user categorized Python under "Interpreted Languages" in their request. I'll stick to 'language' for standard python or 'framework' for flask. The ID says 'python-flask' but name is 'Python'. Let's strictly follow the user's mental model: Python is a Language. Flask would be a Framework. I'll keep this as a language example for now or split if needed. The user's prompt listed "Python" under Interpreted Languages.
  image: 'python:3.11-alpine',
  language: 'python',
  compiler: null, // Interpreted
  interpreter: 'python3',
  runtime: 'python',
  entrypoint: 'sh',
  cmd: ['-c', 'pip install flask && python app.py'],
  port: 5000,
  files: {
    'app.py': 'from flask import Flask\napp = Flask(__name__)\n@app.route("/")\ndef hello(): return "Hello from Python Flask!"\nif __name__ == "__main__": app.run(host="0.0.0.0", port=5000)'
  }
};
