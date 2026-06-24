package com.hubblehox.e2j.init;

import com.hubblehox.e2j.entity.User;
import com.hubblehox.e2j.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@Order(1)
@RequiredArgsConstructor
public class TestDataInitializer implements ApplicationRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(ApplicationArguments args) {
        seedUser("institute@hubblehox.com",        "Institute123@",   "HubbleHox Institute",    User.Role.INSTITUTE);
        seedUser("student@hubblehox.com",          "Student123@",     "Test Student",           User.Role.STUDENT);
        seedUser("verifier@hubblehox.com",         "Verifier123@",    "HubbleHox Verifier",     User.Role.VERIFIER);
        seedUser("headcounsellor@hubblehox.com",   "HeadCounsellor123@", "Head Counsellor",     User.Role.HEAD_COUNSELLOR);
    }

    private void seedUser(String email, String rawPassword, String name, User.Role role) {
        User user = userRepository.findByEmail(email).orElseGet(() ->
                User.builder().email(email).name(name).role(role).build()
        );
        user.setPassword(passwordEncoder.encode(rawPassword));
        user.setEnabled(true);
        userRepository.save(user);
        log.info("Seeded test user: {} ({})", email, role);
    }
}
