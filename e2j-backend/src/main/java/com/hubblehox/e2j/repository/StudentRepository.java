package com.hubblehox.e2j.repository;

import com.hubblehox.e2j.entity.Student;
import com.hubblehox.e2j.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface StudentRepository extends JpaRepository<Student, Long> {
    Optional<Student> findByUser(User user);
    Optional<Student> findByUser_Email(String email);
}
