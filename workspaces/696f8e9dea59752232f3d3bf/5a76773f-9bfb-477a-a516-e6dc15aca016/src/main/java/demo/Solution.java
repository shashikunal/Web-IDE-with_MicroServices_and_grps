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
     * Minimal Boilerplate. 
     * Add your Entities, Repositories, and Services here.
     */
    @GetMapping("/")
    public Map<String, Object> index() {
        Map<String, Object> response = new HashMap<>();
        response.put("status", "Spring Boot Boilerplate Running");
        response.put("message", "Start coding your API!");
        response.put("documentation", "/swagger");
        return response;
    }
}
