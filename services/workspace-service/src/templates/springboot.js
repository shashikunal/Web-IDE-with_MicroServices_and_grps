export default {
  id: 'spring-boot',
  name: 'Spring Boot',
  type: 'framework',
  image: 'maven:3.9.6-eclipse-temurin-21-alpine',
  language: 'java',
  compiler: 'javac',
  buildTool: 'maven',
  runtime: 'jvm',
  entrypoint: 'sh',
  // Use mvn spring-boot:run
  cmd: ['-c', 'mvn spring-boot:run -Dspring-boot.run.jvmArguments="-Dserver.port=8080"'],
  port: 8080,
  setupScript: 'mvn clean install -DskipTests',
  files: {
    // 1. Industry Standard POM
    'pom.xml': `<project xmlns="http://maven.apache.org/POM/4.0.0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 http://maven.apache.org/xsd/maven-4.0.0.xsd">
  <modelVersion>4.0.0</modelVersion>
  <groupId>com.example</groupId>
  <artifactId>demo</artifactId>
  <version>1.0.0</version>
  <parent>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-parent</artifactId>
    <version>3.2.3</version>
  </parent>
  <dependencies>
    <dependency>
      <groupId>org.springframework.boot</groupId>
      <artifactId>spring-boot-starter-web</artifactId>
    </dependency>
    <dependency>
      <groupId>org.springframework.boot</groupId>
      <artifactId>spring-boot-starter-data-jpa</artifactId>
    </dependency>
    <dependency>
      <groupId>org.springframework.boot</groupId>
      <artifactId>spring-boot-starter-validation</artifactId>
    </dependency>
    <dependency>
      <groupId>org.projectlombok</groupId>
      <artifactId>lombok</artifactId>
      <optional>true</optional>
    </dependency>
    <dependency>
      <groupId>com.h2database</groupId>
      <artifactId>h2</artifactId>
      <scope>runtime</scope>
    </dependency>
    <dependency>
      <groupId>org.springdoc</groupId>
      <artifactId>springdoc-openapi-starter-webmvc-ui</artifactId>
      <version>2.3.0</version>
    </dependency>
    <dependency>
      <groupId>org.springframework.boot</groupId>
      <artifactId>spring-boot-starter-test</artifactId>
      <scope>test</scope>
    </dependency>
  </dependencies>
</project>`,

    // 2. Modern YAML Configuration
    'src/main/resources/application.yml': `spring:
  application:
    name: SpringBootDemo
  datasource:
    url: jdbc:h2:mem:testdb
    driverClassName: org.h2.Driver
    username: sa
    password: 
  h2:
    console:
      enabled: true
      path: /h2-console
  jpa:
    database-platform: org.hibernate.dialect.H2Dialect
    defer-datasource-initialization: true

springdoc:
  swagger-ui:
    path: /swagger
  api-docs:
    path: /api-docs`,

    // 3. Standard Main Class
    'src/main/java/com/example/demo/DemoApplication.java': `package com.example.demo;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class DemoApplication {
    public static void main(String[] args) {
        SpringApplication.run(DemoApplication.class, args);
    }
}
`,

    // 4. Sample Controller (Internal Package)
    'src/main/java/com/example/demo/controller/HelloController.java': `package com.example.demo.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import java.util.Map;

@RestController
@RequestMapping("/")
public class HelloController {

    @GetMapping
    public Map<String, Object> index() {
        return Map.of(
            "status", "Spring Boot Industry Standard Template",
            "message", "Ready for development!",
            "docs", "/swagger"
        );
    }
}
`,
    
    // 5. Documentation
    'README.md': `# Spring Boot Project

This is an industry-standard Spring Boot structure.

## Features
- **Web**: Spring MVC
- **Data**: Spring Data JPA + H2 Database
- **Validation**: Jakarta Validation
- **Utilities**: Lombok
- **Docs**: Swagger UI at \`/swagger\`

## Running
Dependencies are automatically installed.
Run \`mvn spring-boot:run\` to start.
`
  }
};
