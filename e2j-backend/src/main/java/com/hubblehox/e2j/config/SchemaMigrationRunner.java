package com.hubblehox.e2j.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class SchemaMigrationRunner implements ApplicationRunner {

    private final JdbcTemplate jdbc;

    @Override
    public void run(ApplicationArguments args) {
        try {
            jdbc.execute("ALTER TABLE job_applications DROP CONSTRAINT IF EXISTS job_applications_stage_check");
            log.info("Dropped stale stage check constraint (if existed)");
        } catch (Exception e) {
            log.warn("Could not drop job_applications_stage_check: {}", e.getMessage());
        }
    }
}
