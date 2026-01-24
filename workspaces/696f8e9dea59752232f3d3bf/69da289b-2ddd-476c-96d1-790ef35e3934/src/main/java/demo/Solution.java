package demo;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.web.bind.annotation.*;
import java.util.*;

@SpringBootApplication
@RestController
public class Solution {

    public static void main(String[] args) {
        SpringApplication.run(Solution.class, args);
    }

    /**
     * Your Sandbox for testing.
     * Try hitting the preview window!
     */
    @GetMapping("/")
    public Map<String, Object> run() {
        Map<String, Object> response = new HashMap<>();
        response.put("message", "Hello from Spring Boot CoderPad!");
        response.put("timestamp", new Date());
        response.put("status", "Ready to code");
        return response;
    }
    
    // Add your algorithms or logic below
    @GetMapping("/fib/{n}")
    public int fibonacci(@PathVariable int n) {
        if (n <= 1) return n;
        return fibonacci(n - 1) + fibonacci(n - 2);
    }
}