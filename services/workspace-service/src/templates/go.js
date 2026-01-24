export default {
  id: 'go-api',
  name: 'Go',
  type: 'language',
  image: 'golang:1.21-alpine',
  language: 'go',
  compiler: 'go build',
  buildTool: 'go',
  runtime: 'binary',
  entrypoint: 'sh',
  cmd: ['-c', 'go mod init app && go run main.go'],
  port: 8080,
  files: {
    'main.go': 'package main\nimport ("fmt"\n"net/http")\nfunc main() {\n    http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {\n        fmt.Fprintf(w, "Hello from Go!")\n    })\n    http.ListenAndServe(":8080", nil)\n}'
  }
};
