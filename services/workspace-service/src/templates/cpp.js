export default {
  id: 'cpp-hello',
  name: 'C++',
  type: 'language',
  image: 'gcc:latest',
  language: 'cpp',
  compiler: 'g++',
  buildTool: 'make',
  runtime: 'binary',
  entrypoint: ['sh'],
  cmd: ['-c', 'g++ -o main main.cpp && ./main'],
  port: null,
  files: {
    'main.cpp': '#include <iostream>\nint main() { std::cout << "Hello from C++!" << std::endl; return 0; }',
    'Makefile': 'all:\n\tg++ -o main main.cpp\nclean:\n\trm -f main'
  }
};
