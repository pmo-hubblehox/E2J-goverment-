package com.hubblehox.e2j.repository;

import com.hubblehox.e2j.entity.Institute;
import com.hubblehox.e2j.entity.IndustryVenueSlot;
import com.hubblehox.e2j.entity.LabBookingRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface LabBookingRequestRepository extends JpaRepository<LabBookingRequest, Long> {
    List<LabBookingRequest> findByInstituteOrderByRequestedAtDesc(Institute institute);
    List<LabBookingRequest> findBySlotOrderByRequestedAtDesc(IndustryVenueSlot slot);
    Optional<LabBookingRequest> findBySlotAndInstitute(IndustryVenueSlot slot, Institute institute);

    @Query("SELECT r FROM LabBookingRequest r WHERE r.slot.venue.industryPartner.id = :partnerId ORDER BY r.requestedAt DESC")
    List<LabBookingRequest> findByIndustryPartnerId(Long partnerId);
}
