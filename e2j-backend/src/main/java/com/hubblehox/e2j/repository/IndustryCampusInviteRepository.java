package com.hubblehox.e2j.repository;

import com.hubblehox.e2j.entity.IndustryCampusInvite;
import com.hubblehox.e2j.entity.IndustryPartner;
import com.hubblehox.e2j.entity.Institute;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface IndustryCampusInviteRepository extends JpaRepository<IndustryCampusInvite, Long> {
    List<IndustryCampusInvite> findByPartnerOrderByCreatedAtDesc(IndustryPartner partner);
    List<IndustryCampusInvite> findByPartnerAndStatusOrderByCreatedAtDesc(IndustryPartner partner, IndustryCampusInvite.Status status);
    Optional<IndustryCampusInvite> findByIdAndPartner(Long id, IndustryPartner partner);
    long countByPartner(IndustryPartner partner);
    List<IndustryCampusInvite> findByInstituteOrderByCreatedAtDesc(Institute institute);
    List<IndustryCampusInvite> findByInstituteAndStatusOrderByCreatedAtDesc(Institute institute, IndustryCampusInvite.Status status);
}
