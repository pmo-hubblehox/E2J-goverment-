package com.hubblehox.e2j.repository;

import com.hubblehox.e2j.entity.Institute;
import com.hubblehox.e2j.entity.VenueBooking;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface VenueBookingRepository extends JpaRepository<VenueBooking, Long> {
    Page<VenueBooking> findByInstitute(Institute institute, Pageable pageable);
}
