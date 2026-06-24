package com.hubblehox.e2j.repository;

import com.hubblehox.e2j.entity.Institute;
import com.hubblehox.e2j.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface InstituteRepository extends JpaRepository<Institute, Long> {
    Optional<Institute> findByUser(User user);
    boolean existsByUser(User user);
}
