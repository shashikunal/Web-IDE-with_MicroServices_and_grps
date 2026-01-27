export default {
  id: 'csharp-console',
  name: 'C#',
  type: 'language',
  image: 'mcr.microsoft.com/dotnet/sdk:8.0',
  language: 'csharp',
  compiler: 'dotnet',
  interpreter: 'dotnet',
  runtime: 'dotnet',
  entrypoint: 'sh',
  cmd: ['-c', 'tail -f /dev/null'],
  port: null,
  requiresContainer: true, // Enable container for code execution
  files: {
    'Program.cs': `// See https://aka.ms/new-console-template for more information
Console.WriteLine("Hello, World!");
`,
    'app.csproj': `<Project Sdk="Microsoft.NET.Sdk">
  <PropertyGroup>
    <OutputType>Exe</OutputType>
    <TargetFramework>net8.0</TargetFramework>
    <ImplicitUsings>enable</ImplicitUsings>
    <Nullable>enable</Nullable>
  </PropertyGroup>
</Project>
`
  },
  setupScript: 'echo "C# workspace ready"',
  startCommand: null
};
