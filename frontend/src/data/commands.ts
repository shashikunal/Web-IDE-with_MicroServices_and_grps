export const COMMANDS: Record<string, string> = {
    // JavaScript/TypeScript Frameworks
    'react-app': './start.sh',
    'node-hello': 'node index.js', // Changed to run directly for script experience if needed, or npm start
    'nextjs': './start.sh',
    'angular': './start.sh',
    'vue-app': 'npm run dev -- --host 0.0.0.0',

    // Python Frameworks
    'python-core': 'python main.py',
    'django': 'python manage.py runserver 0.0.0.0:8000',
    'fastapi-app': 'uvicorn main:app --host 0.0.0.0 --port 8000 --reload',

    // Go
    'go-api': 'go run main.go',

    // Static Sites
    'html-site': 'npx serve -y -p 3000 .',

    // Compiled Languages (The ones needing ConsoleRunner)
    'cpp-hello': 'g++ -o app main.cpp && ./app',
    'c-lang': 'gcc -o app main.c && ./app',
    'rust-lang': 'cargo run',

    // Scripts
    'ruby-lang': 'ruby main.rb',
    'php-lang': 'php -S 0.0.0.0:8000',
    'dotnet': 'dotnet run',
    'java-maven': 'mvn compile exec:java -Dexec.mainClass="com.example.App"',
    'spring-boot': 'mvn spring-boot:run',
    // New additions
    'csharp-console': 'dotnet run',
    'blazor-wasm': 'dotnet watch run --urls http://0.0.0.0:5000',
};
