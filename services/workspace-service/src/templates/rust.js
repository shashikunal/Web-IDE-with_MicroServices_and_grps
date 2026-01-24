export default {
  id: 'rust-lang',
  name: 'Rust',
  type: 'language',
  image: 'rust:latest',
  language: 'rust',
  compiler: 'rustc',
  buildTool: 'cargo',
  runtime: 'binary',
  entrypoint: 'sh',
  cmd: ['-c', 'rustc main.rs && ./main'],
  port: null,
  files: {
    'main.rs': 'fn main() {\n    println!("Hello from Rust!");\n}'
  }
};
