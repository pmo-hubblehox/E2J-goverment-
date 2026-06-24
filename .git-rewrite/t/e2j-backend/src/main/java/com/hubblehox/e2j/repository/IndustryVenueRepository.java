package com.hubblehox.e2j.repository;

import com.hubblehox.e2j.entity.IndustryPartner;
import com.hubblehox.e2j.entity.IndustryVenue;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface IndustryVenueRepository extends JpaRepository<IndustryVenue, Long> {
    List<IndustryVenue> findByIndustryPartnerOrderByCreatedAtDesc(IndustryPartner partner);
    List<IndustryVenue> findByActiveTrue();
    Optional<IndustryVenue> findByIdAndIndustryPartner(Long id, IndustryPartner partner);
}
