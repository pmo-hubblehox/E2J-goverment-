package com.hubblehox.e2j.repository;

import com.hubblehox.e2j.entity.User;
import com.hubblehox.e2j.entity.WorkshopTrainer;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface WorkshopTrainerRepository extends JpaRepository<WorkshopTrainer, Long> {
    Optional<WorkshopTrainer> findByUser(User user);
    Optional<WorkshopTrainer> findByIndustrySmeId(Long industrySmeId);
    Optional<WorkshopTrainer> findByFacultyId(Long facultyId);
}
