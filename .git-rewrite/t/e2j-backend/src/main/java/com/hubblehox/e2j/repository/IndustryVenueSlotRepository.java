package com.hubblehox.e2j.repository;

import com.hubblehox.e2j.entity.IndustryVenue;
import com.hubblehox.e2j.entity.IndustryVenueSlot;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface IndustryVenueSlotRepository extends JpaRepository<IndustryVenueSlot, Long> {
    List<IndustryVenueSlot> findByVenueOrderByDateAscStartTimeAsc(IndustryVenue venue);
    List<IndustryVenueSlot> findByVenueInOrderByDateAscStartTimeAsc(List<IndustryVenue> venues);
    Optional<IndustryVenueSlot> findByIdAndVenue(Long id, IndustryVenue venue);

    @Query("SELECT s FROM IndustryVenueSlot s WHERE s.venue.active = true AND s.status = 'AVAILABLE' AND s.date >= :from ORDER BY s.date ASC, s.startTime ASC")
    List<IndustryVenueSlot> findAvailableFrom(LocalDate from);
}
