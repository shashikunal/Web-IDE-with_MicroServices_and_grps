export default {
  id: 'java-maven',
  name: 'Java',
  type: 'language',
  image: 'maven:3.9.6-eclipse-temurin-21-alpine',
  language: 'java',
  compiler: 'javac',
  buildTool: 'maven',
  runtime: 'jvm',
  entrypoint: 'sh',
  cmd: ['-c', 'tail -f /dev/null'],
  // port: 8080, // Console app doesn't need a port mapping
  files: {
    'pom.xml': `<project xmlns="http://maven.apache.org/POM/4.0.0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 http://maven.apache.org/xsd/maven-4.0.0.xsd">
  <modelVersion>4.0.0</modelVersion>
  <groupId>com.example</groupId>
  <artifactId>demo</artifactId>
  <version>1.0-SNAPSHOT</version>
  <properties>
    <maven.compiler.source>21</maven.compiler.source>
    <maven.compiler.target>21</maven.compiler.target>
  </properties>
</project>`,
    'src/main/java/com/example/App.java': `package com.example;

public class App {
    public static void main(String[] args) {
        System.out.println("Hello from Java!");
    }
}`
  }
};
