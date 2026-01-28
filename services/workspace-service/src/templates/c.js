export default {
  id: 'c-lang',
  name: 'C',
  type: 'language',
  image: 'gcc:latest',
  language: 'c',
  compiler: 'gcc',
  buildTool: 'make',
  runtime: 'binary',
  entrypoint: ['sh'],
  cmd: ['-c', 'gcc main.c -o main && ./main'],
  port: null,
  files: {
    'main.c': '#include <stdio.h>\n\nint main() {\n    printf("Hello from C!\\n");\n    return 0;\n}'
  }
};
