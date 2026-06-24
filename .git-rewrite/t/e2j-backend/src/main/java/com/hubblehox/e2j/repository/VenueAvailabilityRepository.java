package com.hubblehox.e2j.repository;

import com.hubblehox.e2j.entity.Institute;
import com.hubblehox.e2j.entity.VenueAvailability;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface VenueAvailabilityRepository extends JpaRepository<VenueAvailability, Long> {
    Page<VenueAvailability> findByInstitute(Institute institute, Pageable pageable);
}
