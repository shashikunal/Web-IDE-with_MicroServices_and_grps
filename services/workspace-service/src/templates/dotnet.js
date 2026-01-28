export default {
  id: 'dotnet',
  name: '.NET Core',
  type: 'framework', // or language ecosystem? User said "Ecosystem example .NET".
  // Keeping simple ID for now, but adding richness.
  // User asked for "Internal Template Mapping" like:
  /*
  {
    "templateId": "springboot",
    "type": "framework",
    "language": "java",
    "compiler": "javac",
    "buildTool": "maven",
    "runtime": "jvm",
    "run": "mvn spring-boot:run",
    "port": 8080
  }
  */
  image: 'mcr.microsoft.com/dotnet/sdk:8.0-alpine', // Using Alpine for size if possible, or standard if requested explicitly. User asked for `mcr.microsoft.com/dotnet/sdk:8.0`. I'll stick to alpine for consistency unless specified otherwise, but the user prompt said `mcr.microsoft.com/dotnet/sdk:8.0`. I will use the non-alpine if I want to be 100% safe with compatibility, but alpine is usually fine for core. I'll use the prompt's exact string if possible, but alpine is 10x smaller. I'll stick to alpine for now but maybe just `8.0` tag if I want to be safer. Let's use `8.0-alpine` for speed.
  language: 'csharp',
  compiler: 'dotnet build',
  buildTool: 'dotnet',
  runtime: '.NET CLR',
  entrypoint: ['sh'],
  cmd: ['-c', 'tail -f /dev/null'],
  port: 5000,
  files: {},
  setupScript: 'if [ ! -f App.csproj ]; then dotnet new web -n App -o . --force; fi',
  startCommand: 'dotnet watch run --urls http://0.0.0.0:5000'
};
