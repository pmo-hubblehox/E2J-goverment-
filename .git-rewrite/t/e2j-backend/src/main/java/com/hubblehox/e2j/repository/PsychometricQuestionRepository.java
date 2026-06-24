package com.hubblehox.e2j.repository;

import com.hubblehox.e2j.entity.PsychometricQuestion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface PsychometricQuestionRepository extends JpaRepository<PsychometricQuestion, Long> {

    List<PsychometricQuestion> findByActiveTrue();

    @Query("SELECT q FROM PsychometricQuestion q WHERE q.active = true AND (q.profileType = :profileType OR q.profileType = 'GENERAL') ORDER BY q.orderIndex ASC NULLS LAST, q.id ASC")
    List<PsychometricQuestion> findByProfileType(String profileType);
}
