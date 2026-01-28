export default {
  id: 'blazor-wasm',
  name: 'Blazor WASM',
  type: 'framework',
  image: 'mcr.microsoft.com/dotnet/sdk:8.0-alpine',
  language: 'csharp',
  compiler: 'dotnet build',
  buildTool: 'dotnet',
  runtime: 'WebAssembly',
  entrypoint: ['sh'],
  cmd: ['-c', 'tail -f /dev/null'],
  port: 5000,
  files: {},
  setupScript: 'if [ ! -f Program.cs ] && [ ! -f App.razor ]; then dotnet new blazorwasm -o . --force; fi',
  startCommand: 'dotnet watch run --urls http://0.0.0.0:5000'
};
