package com.example.demo.controller;

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
