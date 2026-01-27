import type { Template } from '../store/api/apiSlice';

export const LANGUAGES: Template[] = [
    { id: 'c-lang', name: 'C', language: 'c', description: 'GCC | Binary', icon: '🇨', color: 'from-blue-400/20 to-blue-500/10 border-blue-400/30', hasPreview: false },
    { id: 'cpp-hello', name: 'C++', language: 'cpp', description: 'G++ | Binary', icon: '⚙️', color: 'from-blue-600/20 to-blue-700/10 border-blue-600/30', hasPreview: false },
    { id: 'rust-lang', name: 'Rust', language: 'rust', description: 'Rustc | Cargo', icon: '🦀', color: 'from-orange-700/20 to-orange-800/10 border-orange-700/30', hasPreview: false },
    { id: 'go-api', name: 'Go', language: 'go', description: 'Go Build | Binary', icon: '🔵', color: 'from-cyan-500/20 to-cyan-600/10 border-cyan-500/30', hasPreview: true },
    { id: 'python-core', name: 'Python', language: 'python', description: 'Python 3.11', icon: '🐍', color: 'from-yellow-500/20 to-yellow-600/10 border-yellow-500/30', hasPreview: false },
    { id: 'node-hello', name: 'Node.js', language: 'javascript', description: 'Node V20', icon: '🟢', color: 'from-green-500/20 to-green-600/10 border-green-500/30', hasPreview: true },
    { id: 'ruby-lang', name: 'Ruby', language: 'ruby', description: 'Ruby MRI', icon: '💎', color: 'from-red-600/20 to-red-700/10 border-red-600/30', hasPreview: false },
    { id: 'php-lang', name: 'PHP', language: 'php', description: 'PHP 8.2', icon: '🐘', color: 'from-indigo-400/20 to-indigo-500/10 border-indigo-400/30', hasPreview: true },
    { id: 'java-maven', name: 'Java', language: 'java', description: 'JVM | WASM', icon: '☕', color: 'from-orange-500/20 to-orange-600/10 border-orange-500/30', hasPreview: false },
    { id: 'csharp-console', name: 'C#', language: 'csharp', description: '.NET Console', icon: 'C#', color: 'from-purple-600/20 to-purple-700/10 border-purple-600/30', hasPreview: false },
];

export const FRAMEWORKS: Template[] = [
    { id: 'react-app', name: 'React', language: 'typescript', description: 'Vite | Node', icon: '⚛️', color: 'from-cyan-400/20 to-cyan-500/10 border-cyan-400/30', hasPreview: true },
    { id: 'nextjs', name: 'Next.js', language: 'typescript', description: 'Next | Node', icon: '▲', color: 'from-gray-500/20 to-gray-600/10 border-gray-500/30', hasPreview: true },
    { id: 'angular', name: 'Angular', language: 'typescript', description: 'NG CLI | Node', icon: '🅰️', color: 'from-red-500/20 to-red-600/10 border-red-500/30', hasPreview: true },
    { id: 'vue-app', name: 'Vue.js', language: 'javascript', description: 'Vite | Node', icon: '💚', color: 'from-green-400/20 to-green-500/10 border-green-400/30', hasPreview: true },
    { id: 'fastapi-app', name: 'FastAPI', language: 'python', description: 'Uvicorn | Python', icon: '⚡', color: 'from-teal-500/20 to-teal-600/10 border-teal-500/30', hasPreview: true },
    { id: 'django', name: 'Django', language: 'python', description: 'Django | Python', icon: '🐍', color: 'from-green-700/20 to-green-800/10 border-green-700/30', hasPreview: true },
    { id: 'express-app', name: 'Express.js', language: 'javascript', description: 'Node | Express', icon: '🚂', color: 'from-gray-600/20 to-gray-700/10 border-gray-600/30', hasPreview: true },
    { id: 'spring-boot', name: 'Spring Boot', language: 'java', description: 'Spring | JVM', icon: '🍃', color: 'from-green-600/20 to-green-700/10 border-green-600/30', hasPreview: true },
    { id: 'dotnet', name: '.NET Core', language: 'csharp', description: 'ASP.NET | CLR', icon: '🟣', color: 'from-purple-500/20 to-purple-600/10 border-purple-500/30', hasPreview: true },
    { id: 'blazor-wasm', name: 'Blazor WASM', language: 'csharp', description: 'WebAssembly | .NET', icon: '🕸️', color: 'from-indigo-500/20 to-indigo-600/10 border-indigo-500/30', hasPreview: true },
];
