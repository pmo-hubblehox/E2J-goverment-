package com.hubblehox.e2j;

import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

public class HashGenTest {
    @Test
    void printHash() {
        System.out.println("HASH=" + new BCryptPasswordEncoder().encode("Test@1234"));
    }
}
