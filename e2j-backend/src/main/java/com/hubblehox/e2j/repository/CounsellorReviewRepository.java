package com.hubblehox.e2j.repository;

import com.hubblehox.e2j.entity.Counsellor;
import com.hubblehox.e2j.entity.CounsellorReview;
import com.hubblehox.e2j.entity.StudentBooking;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface CounsellorReviewRepository extends JpaRepository<CounsellorReview, Long> {
    Optional<CounsellorReview> findByBooking(StudentBooking booking);
    List<CounsellorReview> findByCounsellor(Counsellor counsellor);

    @Query("SELECT AVG((r.q1 + r.q2 + r.q3 + r.q4) / 4.0) FROM CounsellorReview r WHERE r.counsellor = :counsellor")
    Double computeAverageRating(Counsellor counsellor);
}
