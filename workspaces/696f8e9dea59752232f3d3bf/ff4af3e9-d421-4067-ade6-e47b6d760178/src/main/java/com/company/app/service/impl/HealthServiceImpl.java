package com.company.app.service.impl;

import com.company.app.dto.HealthResponse;
import com.company.app.model.Health;
import com.company.app.repository.HealthRepository;
import com.company.app.service.HealthService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class HealthServiceImpl implements HealthService {

    private final HealthRepository healthRepository;

    @Override
    public HealthResponse checkHealth() {
        // Example logic: save a health check record
        healthRepository.save(new Health(null, "UP", LocalDateTime.now()));
        
        return new HealthResponse("System is UP", "1.0.0");
    }
}