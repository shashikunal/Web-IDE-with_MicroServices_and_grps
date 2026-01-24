export default {
  id: 'ruby-lang',
  name: 'Ruby',
  image: 'ruby:latest',
  language: 'ruby',
  entrypoint: 'sh',
  cmd: ['-c', 'ruby main.rb'],
  port: null,
  files: {
    'main.rb': 'puts "Hello from Ruby!"'
  },
  setupScript: null
};
