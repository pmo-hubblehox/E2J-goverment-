package com.hubblehox.e2j.repository;

import com.hubblehox.e2j.entity.IndustrySme;
import com.hubblehox.e2j.entity.IndustryPartner;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface IndustrySmeRepository extends JpaRepository<IndustrySme, Long> {
    List<IndustrySme> findByPartnerOrderByCreatedAtDesc(IndustryPartner partner);
    Optional<IndustrySme> findByIdAndPartner(Long id, IndustryPartner partner);
    long countByPartner(IndustryPartner partner);
}
