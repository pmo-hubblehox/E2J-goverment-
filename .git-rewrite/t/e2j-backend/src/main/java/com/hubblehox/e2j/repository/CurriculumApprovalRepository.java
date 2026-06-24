package com.hubblehox.e2j.repository;

import com.hubblehox.e2j.entity.Curriculum;
import com.hubblehox.e2j.entity.CurriculumApproval;
import com.hubblehox.e2j.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CurriculumApprovalRepository extends JpaRepository<CurriculumApproval, Long> {

    List<CurriculumApproval> findByCurriculum(Curriculum curriculum);

    List<CurriculumApproval> findByBosUser(User bosUser);

    Optional<CurriculumApproval> findByCurriculumAndBosUser(Curriculum curriculum, User bosUser);

    boolean existsByCurriculumAndBosUser(Curriculum curriculum, User bosUser);

    long countByCurriculumAndDecision(Curriculum curriculum, CurriculumApproval.Decision decision);

    long countByCurriculum(Curriculum curriculum);
}
