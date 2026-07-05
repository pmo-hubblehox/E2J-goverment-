package com.hubblehox.e2j.repository;

import com.hubblehox.e2j.entity.JobApplication;
import com.hubblehox.e2j.entity.OfferLetter;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface OfferLetterRepository extends JpaRepository<OfferLetter, Long> {
    Optional<OfferLetter> findByJobApplication(JobApplication jobApplication);
}
